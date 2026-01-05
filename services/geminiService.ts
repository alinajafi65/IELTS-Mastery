import { Question } from "../types";

// --- THE HARDCODED CONTENT DATABASE ---
// This ensures that if the AI fails, we have REAL reading passages to show.
const CONTENT_DB: Record<string, string> = {
  "Space Exploration": `**READING PASSAGE: THE RED PLANET**\n\nMars has long captivated the human imagination. As the fourth planet from the Sun, it is a dusty, cold, desert world with a very thin atmosphere. However, recent missions have discovered evidence that liquid water once existed on the surface, raising the possibility of past microbial life.\n\n**QUESTIONS:**\n1. Which planet is Mars from the Sun?\n2. What is the atmosphere like?\n3. What significant discovery was made regarding water?`,
  
  "Marine Biology": `**READING PASSAGE: CORAL REEFS**\n\nCoral reefs are diverse underwater ecosystems held together by calcium carbonate structures secreted by corals. Coral reefs are built by colonies of tiny animals found in marine water that contain few nutrients. Most coral reefs are built from stony corals, which in turn consist of polyps that cluster in groups.\n\n**QUESTIONS:**\n1. What holds coral reefs together?\n2. Are the waters rich or poor in nutrients?\n3. What are the individual animals called?`,
  
  "Urban Planning": `**READING PASSAGE: CITIES OF THE FUTURE**\n\nUrban planning in the 21st century focuses heavily on sustainability. Concepts such as the '15-minute city', where all essential services are within a short walk or bike ride, are gaining popularity. This reduces reliance on cars and lowers carbon emissions.\n\n**QUESTIONS:**\n1. What is the main focus of modern urban planning?\n2. Define the '15-minute city'.\n3. How does this impact carbon emissions?`,
  
  "The History of Tea": `**READING PASSAGE: ORIGINS OF TEA**\n\nThe history of tea is long and complex, spreading across multiple cultures over the span of thousands of years. Tea likely originated in the Yunnan region during the Shang dynasty as a medicinal drink. An early credible record of tea drinking dates to the 3rd century AD, in a medical text written by Hua Tuo.\n\n**QUESTIONS:**\n1. Where did tea likely originate?\n2. It was originally consumed as what kind of drink?\n3. Who wrote the early medical text mentioning tea?`
};

export class GeminiService {
  private apiKey: string;
  private models = ["gemini-1.5-flash", "gemini-2.0-flash-exp"];

  constructor() {
    this.apiKey = import.meta.env.VITE_API_KEY || "";
  }

  // --- API CALLER ---
  private async callGemini(prompt: string) {
    if (!this.apiKey) return null;
    
    // Attempt to call AI
    for (const model of this.models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        if (!response.ok) continue;
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return text ? text.replace(/```json/g, '').replace(/```/g, '').trim() : null;
      } catch (e) { continue; }
    }
    return null;
  }

  // --- SMART RANDOMIZER (Menu) ---
  async getPracticeModules(skill: string, band: number, type: string) {
    // 1. Try Real AI first
    const text = await this.callGemini(`Generate 4 specific IELTS ${skill} modules JSON`);
    if (text) { try { return JSON.parse(text); } catch {} }

    // 2. FALLBACK: Use titles that match our CONTENT_DB
    const topics = Object.keys(CONTENT_DB); // ["Space Exploration", "Marine Biology"...]
    
    const modules = [];
    // Generate 4 modules using our known topics
    for(let i=0; i<4; i++) {
      // Loop through topics safely
      const topic = topics[i % topics.length];
      modules.push({
        id: `sim_${i}`,
        title: topic,
        description: `${type === 'academic' ? 'Academic' : 'General'} Reading Task`,
        type: skill
      });
    }
    return modules;
  }

  // --- SMART RESPONDER (The Chat) ---
  async getChatResponse(history: any[], message: string, systemContext: string) {
    // 1. Try Real AI
    const text = await this.callGemini(`System: ${systemContext} User: ${message}`);
    if (text) return text;

    // 2. FALLBACK: Check context to provide the RIGHT content
    // We look at the systemContext to see which Module title is active
    
    for (const [title, content] of Object.entries(CONTENT_DB)) {
      if (systemContext.includes(title)) {
        // If this is the START of the chat (history is empty), show the passage!
        if (history.length === 0) {
          return `Welcome! Here is your practice material:\n\n${content}\n\n**Please type your answers below.**`;
        }
        // If the user typed an answer, give generic but relevant feedback
        return "Thank you for your answer. \n\n**Feedback:**\n- Ensure you reference specific details from the text.\n- Check your spelling for key terms.\n- Try the next question!";
      }
    }

    // Default if no title matches
    return "Welcome to IELTS Mastery. Please read the passage provided on your screen (Simulation Mode).";
  }

  // --- HELPERS ---
  async generateScaffoldHint(skill: string, context: string) { 
    return "Hint: Look for synonyms in the text that match the keywords in the question."; 
  }
  
  async generatePlacementTest() { 
    return [
      { id: "q1", text: "I ___ to the cinema last night.", options: ["go", "went", "gone"], correctAnswer: "went" },
      { id: "q2", text: "The chart ___ the population.", options: ["show", "shows", "showing"], correctAnswer: "shows" },
      { id: "q3", text: "She is interested ___ art.", options: ["on", "in", "at"], correctAnswer: "in" }
    ];
  }

  async getLevelAssessment(score: number, total: number) { return { level: "Intermediate", band: 6.0 }; }
  async generateEndSessionQuiz() { return []; }
  async generateListeningAudio() { return null; }
  async generateWritingTaskImage() { return null; }
}

export const gemini = new GeminiService();
export async function decodeAudio(base64: string, ctx: AudioContext) { 
  if (!ctx) return null;
  return ctx.createBuffer(1, 1, 22050); 
}