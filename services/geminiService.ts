import { Question } from "../types";

export class GeminiService {
  private apiKey: string;
  
  // We will try the most standard model first
  private models = ["gemini-1.5-flash", "gemini-pro"];

  constructor() {
    this.apiKey = import.meta.env.VITE_API_KEY || "";
    // Debug log to see if Key exists (Do not share this screenshot if possible)
    console.log("API Key detected:", this.apiKey ? "YES (Length: " + this.apiKey.length + ")" : "NO");
  }

  private async callGemini(prompt: string) {
    if (!this.apiKey) {
      console.error("No API Key found.");
      return null;
    }

    const body = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    for (const model of this.models) {
      try {
        // FIX: Changed 'v1beta' to 'v1' (More stable for standard keys)
        const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${this.apiKey}`;
        
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });

        if (response.status === 404) {
          console.warn(`Model ${model} returned 404 (Not Found). Checking next...`);
          continue;
        }

        if (!response.ok) {
          console.error(`API Error ${response.status}:`, await response.text());
          continue;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        return text ? text.replace(/```json/g, '').replace(/```/g, '').trim() : null;
      } catch (e) {
        console.error("Connection error:", e);
      }
    }
    return null;
  }

  // --- MAIN FUNCTIONS ---

  async getPracticeModules(skill: string, band: number, type: string) {
    const prompt = `Generate 4 specific IELTS practice modules for ${skill} (${type} track) at Band ${band} level. 
    Output ONLY a raw JSON array. Format: [{"id":"1","title":"...","description":"...","type":"..."}]`;
    
    const text = await this.callGemini(prompt);
    
    // ERROR HANDLING:
    // If text is null (API failed), return a visible ERROR CARD instead of a white screen.
    if (!text) {
      return [
        { 
          id: "error", 
          title: "Connection Failed", 
          description: "Google returned 404. Check API Key or VPN.", 
          type: "System Error" 
        }
      ];
    }
    
    try { 
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']') + 1;
        if (start === -1) throw new Error("No JSON found");
        return JSON.parse(text.substring(start, end)); 
    } catch (e) { 
        return [{ id: "json-error", title: "Data Error", description: "AI response was invalid.", type: "Error" }]; 
    }
  }

  async getChatResponse(history: any[], message: string, systemContext: string) {
    let fullPrompt = `System: ${systemContext}\n`;
    history.forEach(h => fullPrompt += `${h.role}: ${h.text}\n`);
    fullPrompt += `User: ${message}`;
    
    const text = await this.callGemini(fullPrompt);
    return text || "Error: Unable to connect to Google API (404/Connection Failed).";
  }

  // --- HELPERS ---
  async generateScaffoldHint(skill: string, context: string) { 
    return (await this.callGemini(`Hint for ${skill}: ${context}`)) || "Hint unavailable."; 
  }
  
  async generatePlacementTest() { 
    const text = await this.callGemini("Generate 10 IELTS placement questions as JSON array.");
    try { return JSON.parse(text || "[]"); } catch { return []; }
  }

  async getLevelAssessment(score: number, total: number) { return { level: "Unknown", band: 0 }; }
  async generateEndSessionQuiz() { return []; }
  async generateListeningAudio() { return null; }
  async generateWritingTaskImage() { return null; }
}

export const gemini = new GeminiService();
export async function decodeAudio(base64: string, ctx: AudioContext) { 
  if (!ctx) return null;
  return ctx.createBuffer(1, 1, 22050); 
}