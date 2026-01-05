import { Question } from "../types";

export class GeminiService {
  private apiKey: string;
  
  // PRIORITY LIST:
  // 1. gemini-2.0-flash-exp (We KNOW this connects for you, just need to handle speed limits)
  // 2. gemini-1.5-flash (Standard)
  // 3. gemini-1.5-flash-8b (Smaller, often works when others don't)
  // 4. gemini-1.0-pro (Old reliable)
  private models = [
    "gemini-2.0-flash-exp", 
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.0-pro"
  ];

  constructor() {
    this.apiKey = import.meta.env.VITE_API_KEY || "";
  }

  private async wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async callGemini(prompt: string) {
    if (!this.apiKey) {
      console.error("No API Key.");
      return null;
    }

    const body = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    // We will try EVERY model on EVERY version until one works
    const versions = ["v1beta", "v1"];

    for (const model of this.models) {
      for (const version of versions) {
        
        // Retry loop for Speed Limits (429)
        let attempts = 0;
        const maxAttempts = 2; // Try twice per model

        while (attempts < maxAttempts) {
          try {
            const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${this.apiKey}`;
            
            const response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body)
            });

            // 404 = Wrong Address/Model. Stop retrying this specific combo.
            if (response.status === 404) {
              console.warn(`[${model}][${version}] -> 404 Not Found. Skipping.`);
              break; 
            }

            // 429 = Found it! But busy. WAIT and RETRY.
            if (response.status === 429 || response.status === 503) {
              console.warn(`[${model}] is busy (429). Waiting 5s...`);
              await this.wait(5000); // Wait 5 seconds
              attempts++;
              continue;
            }

            if (!response.ok) {
              console.error(`[${model}] Error ${response.status}`);
              break;
            }

            // SUCCESS!
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log(`%c SUCCESS with ${model} (${version})`, "color: lime; font-weight:bold;");
            
            return text ? text.replace(/```json/g, '').replace(/```/g, '').trim() : null;

          } catch (e) {
            break;
          }
        }
      }
    }
    return null;
  }

  // --- MAIN FUNCTIONS ---

  async getPracticeModules(skill: string, band: number, type: string) {
    const prompt = `Generate 4 specific IELTS practice modules for ${skill} (${type} track) at Band ${band} level. 
    Output ONLY a raw JSON array. Format: [{"id":"1","title":"...","description":"...","type":"..."}]`;
    
    const text = await this.callGemini(prompt);
    
    if (!text) {
      return [{ 
        id: "error", 
        title: "Connection Failed", 
        description: "Google returned 404/429 on all models. Check API Key.", 
        type: "Error" 
      }];
    }
    
    try { 
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']') + 1;
        if (start === -1) return [];
        return JSON.parse(text.substring(start, end)); 
    } catch { return []; }
  }

  async getChatResponse(history: any[], message: string, systemContext: string) {
    let fullPrompt = `System: ${systemContext}\n`;
    history.forEach(h => fullPrompt += `${h.role}: ${h.text}\n`);
    fullPrompt += `User: ${message}`;
    
    const text = await this.callGemini(fullPrompt);
    return text || "Error: Unable to connect to Google API.";
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