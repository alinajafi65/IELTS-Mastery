import { Question } from "../types";

export class GeminiService {
  private apiKey: string;
  // List of models to try in order. If one fails, we try the next.
  private models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash-exp" 
  ];

  constructor() {
    this.apiKey = import.meta.env.VITE_API_KEY || "";
    if (!this.apiKey) {
      console.error("API Key is missing! Check Cloudflare Environment Variables.");
    }
  }

  // --- THE MACHINE GUN FETCHER ---
  private async callGemini(prompt: string, schema?: any) {
    if (!this.apiKey) return null;

    const body: any = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    if (schema) {
      body.generationConfig = {
        response_mime_type: "application/json",
        response_schema: schema
      };
    }

    // Try each model in the list until one works
    for (const model of this.models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });

        // If it's a 404 (Not Found) or 503 (Overloaded), loop to the next model
        if (response.status === 404 || response.status === 503) {
          console.warn(`Model ${model} failed (${response.status}). Trying next...`);
          continue; 
        }

        // If it's a real error (like 429 quota), we might still want to try next, 
        // but usually 429 means "stop". However, let's keep trying to be safe.
        if (!response.ok) {
           console.warn(`Model ${model} error: ${response.statusText}`);
           continue;
        }

        // IF WE GET HERE, IT WORKED!
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return text ? text.replace(/```json/g, '').replace(/```/g, '').trim() : null;

      } catch (e) {
        console.error(`Model ${model} crashed.`, e);
      }
    }
    
    console.error("ALL MODELS FAILED. Check API Key or Google Service Status.");
    return null;
  }

  // --- AUDIO (Disabled to prevent crashes) ---
  async generateListeningAudio(script: string) {
    return null; 
  }

  async generateWritingTaskImage(type: string, band: number) {
    return null;
  }

  // --- MAIN FUNCTIONS ---

  async getPracticeModules(skill: string, band: number, type: string) {
    const prompt = `Generate 4 specific IELTS practice modules for ${skill} (${type} track) at Band ${band} level. Provide in JSON.`;
    const schema = {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          title: { type: "STRING" },
          description: { type: "STRING" },
          type: { type: "STRING" }
        },
        required: ["id", "title", "description", "type"]
      }
    };
    
    const text = await this.callGemini(prompt, schema);
    if (!text) return [];
    try { return JSON.parse(text); } catch { return []; }
  }

  async generateScaffoldHint(skill: string, context: string, targetBand: number): Promise<string> {
    const prompt = `Context: ${context}. Skill: ${skill}. Target Band: ${targetBand}. 
    Provide a short (1-2 sentences) linguistic scaffolding hint.`;
    const text = await this.callGemini(prompt);
    return text || "Try to use more complex sentence structures.";
  }

  async generatePlacementTest(): Promise<Question[]> {
    const prompt = "Generate 10 multiple-choice IELTS placement test questions (JSON).";
    const schema = {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          text: { type: "STRING" },
          options: { type: "ARRAY", items: { type: "STRING" } },
          correctAnswer: { type: "STRING" }
        },
        required: ["id", "text", "options", "correctAnswer"]
      }
    };
    const text = await this.callGemini(prompt, schema);
    if (!text) return [];
    try { return JSON.parse(text); } catch { return []; }
  }

  async getLevelAssessment(score: number, total: number): Promise<{ level: string; band: number }> {
    const prompt = `Score is ${score}/${total}. Assess IELTS band and level (JSON).`;
    const schema = {
      type: "OBJECT",
      properties: {
        level: { type: "STRING" },
        band: { type: "NUMBER" }
      },
      required: ["level", "band"]
    };
    const text = await this.callGemini(prompt, schema);
    if (!text) return { level: "Intermediate", band: 5.5 };
    try { return JSON.parse(text); } catch { return { level: "Intermediate", band: 5.5 }; }
  }

  async getChatResponse(history: {role: string, text: string}[], message: string, systemContext: string) {
    let fullPrompt = `System: ${systemContext}\n\n`;
    history.forEach(h => fullPrompt += `${h.role}: ${h.text}\n`);
    fullPrompt += `User: ${message}`;
    const text = await this.callGemini(fullPrompt);
    return text || "Connection issue. Please try again.";
  }

  async generateEndSessionQuiz(topic: string, level: number) {
    const prompt = `3-question quiz for ${topic} at Band ${level} (JSON).`;
    const schema = {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          question: { type: "STRING" },
          options: { type: "ARRAY", items: { type: "STRING" } },
          correctAnswer: { type: "STRING" }
        }
      }
    };
    const text = await this.callGemini(prompt, schema);
    if (!text) return [];
    try { return JSON.parse(text); } catch { return []; }
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