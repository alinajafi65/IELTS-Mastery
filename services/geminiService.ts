import { Question } from "../types";

export class GeminiService {
  private apiKey: string;
  
  // Trying the most stable models first
  private models = [
    "gemini-1.0-pro",     // Very stable, no JSON mode needed
    "gemini-1.5-flash",
    "gemini-pro"
  ];

  constructor() {
    this.apiKey = import.meta.env.VITE_API_KEY || "";
  }

  private async callGemini(prompt: string, schema?: any) {
    if (!this.apiKey) return null;

    // BASIC BODY: No fancy "generationConfig" that breaks old models
    const body: any = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    for (const model of this.models) {
      try {
        const versions = ["v1beta", "v1"];
        
        for (const version of versions) {
          const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${this.apiKey}`;
          
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });

          // 404 = Model missing. 400 = Bad Config (Should be fixed now).
          if (response.status === 404 || response.status === 400) continue;
          if (response.status === 429) continue; 
          
          if (!response.ok) continue;

          // SUCCESS
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          console.log(`Success with ${model}:`, text?.substring(0, 50));
          
          // CLEANUP: Extract JSON from the text manually
          if (text) {
            // Remove markdown ```json ... ``` wrappers
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            // Sometimes older models add extra text, find the first '[' or '{'
            const firstBracket = cleanText.indexOf('[');
            const firstBrace = cleanText.indexOf('{');
            const start = (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) 
              ? firstBracket 
              : firstBrace;
            
            return start !== -1 ? cleanText.substring(start) : cleanText;
          }
          return null;
        }
      } catch (e) { continue; }
    }
    return null;
  }

  // --- MAIN FUNCTIONS ---

  async getPracticeModules(skill: string, band: number, type: string) {
    // Explicitly ask for JSON in the text prompt since we removed the config
    const prompt = `Generate 4 specific IELTS practice modules for ${skill} (${type} track) at Band ${band} level. 
    Output ONLY valid JSON array with keys: id, title, description, type. Do not add explanations.`;
    
    const text = await this.callGemini(prompt);
    
    if (!text) {
      // Keep fallback just in case network fails completely
      return [
        { id: "read1", title: `The Future of ${type === 'academic' ? 'Astrophysics' : 'Remote Work'}`, description: "Matching Headings", type: `${type} Reading` },
        { id: "read2", title: "History of the Silk Road", description: "Multiple Choice", type: `${type} Reading` }
      ];
    }
    try { return JSON.parse(text); } catch { return []; }
  }

  async getChatResponse(history: {role: string, text: string}[], message: string, systemContext: string) {
    let fullPrompt = `System: ${systemContext}\n\n`;
    history.forEach(h => fullPrompt += `${h.role}: ${h.text}\n`);
    fullPrompt += `User: ${message}`;
    
    const text = await this.callGemini(fullPrompt);
    if (!text) return "I am currently unable to connect to the AI server.";
    return text;
  }

  // Helpers
  private getModuleSchema() { return {}; }
  async generateScaffoldHint(skill: string, context: string, targetBand: number) { 
    return (await this.callGemini(`Hint for ${skill}: ${context}`)) || "Hint unavailable."; 
  }
  async generatePlacementTest() { 
    const text = await this.callGemini("Generate 10 IELTS placement questions as JSON array. Keys: id, text, options, correctAnswer.");
    try { return JSON.parse(text || "[]"); } catch { return []; }
  }
  async getLevelAssessment(score: number, total: number) { return { level: "Unknown", band: 0 }; }
  async generateEndSessionQuiz(topic: string, level: number) { return []; }
  async generateListeningAudio(script: string) { return null; }
  async generateWritingTaskImage(type: string, band: number) { return null; }
}

export const gemini = new GeminiService();
export async function decodeAudio(base64: string, ctx: AudioContext): Promise<AudioBuffer> {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
}