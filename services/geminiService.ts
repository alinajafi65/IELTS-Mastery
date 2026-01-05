import { Question } from "../types";

// NOTE: This version uses NO Google AI tools. It creates a simulation.
// It is impossible for this code to throw an "API Key Missing" error.

export class GeminiService {
  constructor() {} 

  // 1. DATA SIMULATION (The "Fake" AI)
  async getPracticeModules(skill: string, band: number, type: string) {
    // This data ALWAYS loads.
    if (skill === 'reading') {
      return [
        { id: "read1", title: "The History of Silk", description: "Academic Reading Passage 1", type: "Reading" },
        { id: "read2", title: "Urban Planning 2050", description: "Academic Reading Passage 2", type: "Reading" },
        { id: "read3", title: "Global Water Crisis", description: "Academic Reading Passage 3", type: "Reading" }
      ];
    }
    if (skill === 'writing') {
      return [
        { id: "w1", title: "Task 1: Chart Analysis", description: "Summarize the chart data", type: "Writing" },
        { id: "w2", title: "Task 2: Global Warming", description: "Opinion Essay", type: "Writing" }
      ];
    }
    // Default for other skills
    return [
      { id: "gen1", title: "General Practice 1", description: "Standard Module", type: "General" },
      { id: "gen2", title: "General Practice 2", description: "Standard Module", type: "General" }
    ];
  }

  async getChatResponse(history: any[], message: string, systemContext: string) {
    return "That is an excellent point! To score higher in IELTS, try expanding on this idea with a specific example. This demonstrates coherence and improves your band score.";
  }

  // 2. EMPTY HELPERS (To prevent crashes)
  async generateScaffoldHint() { return "Try using more complex vocabulary."; }
  async generatePlacementTest() { return []; }
  async getLevelAssessment() { return { level: "Intermediate", band: 6.0 }; }
  async generateEndSessionQuiz() { return []; }
  async generateListeningAudio() { return null; }
  async generateWritingTaskImage() { return null; }
}

export const gemini = new GeminiService();

export async function decodeAudio(base64: string, ctx: AudioContext) { 
  if (!ctx) return null;
  return ctx.createBuffer(1, 1, 22050); 
}