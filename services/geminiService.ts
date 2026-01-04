import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Question } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // FIX: Changed 'process.env.API_KEY' to 'import.meta.env.VITE_API_KEY'
    // This allows the browser to actually see the key.
    const apiKey = import.meta.env.VITE_API_KEY;
    
    if (!apiKey) {
      console.error("CRITICAL ERROR: API Key is missing! Check Netlify Environment Variables.");
    }

    this.ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_KEY" });
  }

  async generateListeningAudio(script: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash-exp", // Updated to a stable model name if preview fails
        contents: [{ parts: [{ text: `Read this IELTS passage clearly and naturally: ${script}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (e) {
      console.error("TTS Error:", e);
      return null;
    }
  }

  async generateWritingTaskImage(type: string, band: number) {
    const prompt = `A professional ${type} for an IELTS Academic Writing Task 1. Clear title, labels, and data trends. Band ${band} difficulty. No extra text. White background.`;
    try {
        const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: { parts: [{ text: prompt }] },
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return part.inlineData.data;
        }
        return null;
    } catch (e) {
        console.error("Image Gen Error", e);
        return null;
    }
  }

  async getPracticeModules(skill: string, band: number, type: string) {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Generate 4 specific IELTS practice modules for ${skill} (${type} track) at Band ${band} level. Provide in JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING }
            },
            required: ["id", "title", "description", "type"]
          }
        }
      }
    });
    return JSON.parse(response.text());
  }

  async generateScaffoldHint(skill: string, context: string, targetBand: number): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Context: ${context}. Skill: ${skill}. Target Band: ${targetBand}. 
      Provide a short (1-2 sentences) linguistic scaffolding hint. 
      Do NOT give the answer. Instead, suggest a grammatical structure, a synonym, or a cohesive device the student could use.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text() || "Try to use more complex sentence structures to show range.";
  }

  async generatePlacementTest(): Promise<Question[]> {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: "Generate 10 multiple-choice IELTS placement test questions (JSON).",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING }
            },
            required: ["id", "text", "options", "correctAnswer"]
          }
        }
      }
    });
    return JSON.parse(response.text());
  }

  async getLevelAssessment(score: number, total: number): Promise<{ level: string; band: number }> {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Score is ${score}/${total}. Assess IELTS band and level (JSON).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.STRING },
            band: { type: Type.NUMBER }
          },
          required: ["level", "band"]
        }
      }
    });
    return JSON.parse(response.text());
  }

  async getChatResponse(history: {role: string, text: string}[], message: string, systemContext: string, audioData?: string) {
    const contents: any[] = [];
    history.forEach((msg) => {
      contents.push({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      });
    });

    const currentParts: any[] = [{ text: message }];
    if (audioData) {
      currentParts.push({
        inlineData: {
          data: audioData,
          mimeType: 'audio/webm;codecs=opus'
        }
      });
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    const response = await this.ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents,
      config: {
        systemInstruction: systemContext
      }
    });
    return response.text();
  }

  async generateEndSessionQuiz(topic: string, level: number) {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `3-question quiz for ${topic} at Band ${level} (JSON).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text());
  }
}

export const gemini = new GeminiService();

export async function decodeAudio(base64: string, ctx: AudioContext): Promise<AudioBuffer> {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}