import { Question } from "../types";

// We don't need the library anymore for the main logic!
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export class GeminiService {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_API_KEY || "";
    if (!this.apiKey) {
      console.error("API Key is missing! Check Netlify Environment Variables.");
    }
  }

  // --- NEW: DIRECT API CALLER (Bypasses Library Errors) ---
  private async callGemini(prompt: string, schema?: any) {
    if (!this.apiKey) return null;

    try {
      const body: any = {
        contents: [{ parts: [{ text: prompt }] }]
      };

      // Add schema if requested (JSON mode)
      if (schema) {
        body.generationConfig = {
          response_mime_type: "application/json",
          response_schema: schema
        };
      }

      const response = await fetch(`${API_URL}?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Gemini API Error:", err);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      // Clean up markdown just in case
      return text ? text.replace(/```json/g, '').replace(/```/g, '').trim() : null;

    } catch (e) {
      console.error("Direct API Call Failed:", e);
      return null;
    }
  }

  // --- AUDIO (We still use the library URL logic manually here for TTS if needed, 
  // but for now let's keep it simple or return null to prevent crashes) ---
  async generateListeningAudio(script: string) {
    // Audio is complex via REST. For now, let's skip it to get the app working,
    // or you can try to re-enable the library just for this later.
    // Returning null means it will just skip the audio, not crash.
    console.warn("Audio temporarily disabled to ensure stability.");
    return null; 
  }

  async generateWritingTaskImage(type: string, band: number) {
    // Image generation via REST is also complex. Disabling to prevent 404s.
    return null;
  }

  // --- MAIN FUNCTIONS (Now using Direct Fetch) ---

  async getPracticeModules(skill: string, band: number, type: string) {
    const prompt = `Generate 4 specific IELTS practice modules for ${skill} (${type} track) at Band ${band} level. Provide in JSON.`;
    
    // We construct the schema manually for REST
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
    Provide a short (1-2 sentences) linguistic scaffolding hint. 
    Do NOT give the answer. Instead, suggest a grammatical structure, a synonym, or a cohesive device.`;
    
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
    // Construct history for REST
    let fullPrompt = `System: ${systemContext}\n\n`;
    history.forEach(h => fullPrompt += `${h.role}: ${h.text}\n`);
    fullPrompt += `User: ${message}`;

    const text = await this.callGemini(fullPrompt);
    return text || "I am having trouble connecting.";
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

// Keep this helper for legacy support, even if unused
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