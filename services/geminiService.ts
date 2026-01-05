import { Question } from "../types";

export class GeminiService {
  private apiKey: string;
  
  // We use 1.5-flash (Fast) and 1.0-pro (Stable)
  private models = [
    "gemini-1.5-flash",
    "gemini-1.0-pro",
    "gemini-pro"
  ];

  constructor() {
    this.apiKey = import.meta.env.VITE_API_KEY || "";
  }

  private async callGemini(prompt: string) {
    if (!this.apiKey) return null;

    // FIX: We removed 'generationConfig' to stop the 400 Error.
    // We just send the text simple and clean.
    const body = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    for (const model of this.models) {
      try {
        // Try standard API version
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });

        // If this model fails, try the next one
        if (!response.ok) continue;

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
          // Clean up the text (remove ```json markers)
          return text.replace(/```json/g, '').replace(/```/g, '').trim();
        }
      } catch (e) { continue; }
    }
    return null;
  }

  // --- REAL FUNCTIONS ---

  async getPracticeModules(skill: string, band: number, type: string) {
    // We explicitly ask for JSON in the text now
    const prompt = `Generate 4 specific IELTS practice modules for ${skill} (${type} track) at Band ${band} level. 
    Output ONLY a raw JSON array. Format: [{"id":"1","title":"...","description":"...","type":"..."}]`;
    
    const text = await this.callGemini(prompt);
    
    if (!text) return []; // If connection fails, show empty list (not fake data)
    
    try { 
        // Find the start of the JSON array
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']') + 1;
        if (start === -1 || end === 0) return [];
        return JSON.parse(text.substring(start, end)); 
    } catch { return []; }
  }

  async getChatResponse(history: any[], message: string, systemContext: string) {
    // Build the chat history for the AI
    let fullPrompt = `System: ${systemContext}\n`;
    history.forEach(h => fullPrompt += `${h.role}: ${h.text}\n`);
    fullPrompt += `User: ${message}`;
    
    const text = await this.callGemini(fullPrompt);
    
    // If AI fails, give a clear error message so you know
    return text || "Error: I cannot connect to Google. Please check your VPN or API Key.";
  }

  // --- HELPERS ---
  async generateScaffoldHint(skill: string, context: string) { 
    return (await this.callGemini(`Hint for ${skill}: ${context}`)) || "Hint unavailable."; 
  }
  
  async generatePlacementTest() { 
    const text = await this.callGemini("Generate 10 IELTS placement questions as JSON array. Keys: id, text, options, correctAnswer.");
    try { return JSON.parse(text || "[]"); } catch { return []; }
  }

  async getLevelAssessment(score: number, total: number) { 
      return { level: "Assessment Pending", band: 0 }; 
  }
  
  async generateEndSessionQuiz() { return []; }
  async generateListeningAudio() { return null; }
  async generateWritingTaskImage() { return null; }
}

export const gemini = new GeminiService();
export async function decodeAudio(base64: string, ctx: AudioContext) { 
  if (!ctx) return null;
  return ctx.createBuffer(1, 1, 22050); 
}