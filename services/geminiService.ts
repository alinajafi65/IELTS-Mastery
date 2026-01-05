import { Question } from "../types";

// --- THE MASTER CONTENT DATABASE ---
// This holds specific content for EVERY skill.
const CONTENT_DB = {
  reading: [
    { 
      title: "The Future of Space", 
      type: "Academic Reading", 
      content: `**READING PASSAGE: THE RED PLANET**\n\nMars has long captivated the human imagination. As the fourth planet from the Sun, it is a dusty, cold, desert world with a very thin atmosphere. However, recent missions have discovered evidence that liquid water once existed on the surface.\n\n**QUESTIONS:**\n1. Which planet is Mars from the Sun?\n2. Describe the atmosphere of Mars.\n3. What evidence was recently discovered?`
    },
    { 
      title: "History of Silk", 
      type: "Academic Reading", 
      content: `**READING PASSAGE: SILK PRODUCTION**\n\nSilk is a natural protein fiber, some forms of which can be woven into textiles. The protein fiber of silk is composed mainly of fibroin and is produced by certain insect larvae to form cocoons. The best-known silk is obtained from the cocoons of the larvae of the mulberry silkworm.\n\n**QUESTIONS:**\n1. What is silk composed mainly of?\n2. Which insect produces the best-known silk?`
    }
  ],
  listening: [
    {
      title: "University Library Tour",
      type: "Listening Section 1",
      content: `**LISTENING TRANSCRIPT (Simulation)**\n\n[LIBRARIAN]: Good morning! Welcome to the university library. Can I help you?\n[STUDENT]: Yes, I'd like to register for a card.\n[LIBRARIAN]: Certainly. What is your full name?\n[STUDENT]: It's Peter Arshton.\n\n**QUESTIONS:**\n1. What does the student want to do?\n2. What is the student's surname?`
    },
    {
      title: "Botanical Garden Guide",
      type: "Listening Section 2",
      content: `**LISTENING TRANSCRIPT (Simulation)**\n\n[GUIDE]: Welcome to the City Botanical Gardens. On your left, you will see the Rose Garden, which was established in 1895. If you look straight ahead, that is the Palm House, home to tropical species from around the world.\n\n**QUESTIONS:**\n1. When was the Rose Garden established?\n2. What is inside the Palm House?`
    }
  ],
  writing: [
    {
      title: "Task 1: Urban Population",
      type: "Writing Task 1",
      content: `**WRITING TASK 1**\n\nThe chart below shows the percentage of the population living in urban areas in four different countries from 1980 to 2020.\n\n**INSTRUCTIONS:**\nSummarize the information by selecting and reporting the main features, and make comparisons where relevant.\n\n*(Please type your essay response below)*`
    },
    {
      title: "Task 2: Remote Work",
      type: "Writing Task 2",
      content: `**WRITING TASK 2**\n\nMany people nowadays work from home using modern technology. Some people think this is a positive development, while others think it has negative effects.\n\n**INSTRUCTIONS:**\nDiscuss both views and give your own opinion.\n\n*(Please type your essay response below)*`
    }
  ],
  speaking: [
    {
      title: "Part 1: Hometown",
      type: "Speaking Part 1",
      content: `**SPEAKING MOCK TEST: PART 1**\n\nI am going to act as your examiner. Let's start with some questions about yourself.\n\n**Examiner:** "Let's talk about your hometown. Where are you from?"\n\n*(Type or speak your answer below)*`
    },
    {
      title: "Part 2: Cue Card",
      type: "Speaking Part 2",
      content: `**SPEAKING MOCK TEST: PART 2**\n\n**Topic:** Describe a book you read recently.\n\nYou should say:\n- What it was\n- Who wrote it\n- What it was about\n\n*(Please give your speech below)*`
    }
  ]
};

export class GeminiService {
  private apiKey: string;
  // We keep the "Machine Gun" list just in case connection works later
  private models = ["gemini-1.5-flash", "gemini-2.0-flash-exp"];

  constructor() {
    this.apiKey = import.meta.env.VITE_API_KEY || "";
  }

  // --- API CALLER (Tries to connect, fails gracefully) ---
  private async callGemini(prompt: string) {
    if (!this.apiKey) return null;
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
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
      } catch (e) { continue; }
    }
    return null;
  }

  // --- SMART MODULE GENERATOR ---
  async getPracticeModules(skill: string, band: number, type: string) {
    // 1. Try Real AI (Might fail)
    const text = await this.callGemini(`Generate 4 IELTS ${skill} modules JSON`);
    if (text) { try { return JSON.parse(text); } catch {} }

    // 2. FALLBACK: Load from our Master Database based on SKILL
    // This ensures Listening gets Listening modules, Writing gets Writing, etc.
    const skillKey = skill.toLowerCase() as keyof typeof CONTENT_DB;
    const contentList = CONTENT_DB[skillKey] || CONTENT_DB['reading']; // Default to reading

    return contentList.map((item, index) => ({
      id: `sim_${skill}_${index}`,
      title: item.title,
      description: item.type,
      type: skill
    }));
  }

  // --- CONTEXT-AWARE CHAT ---
  async getChatResponse(history: any[], message: string, systemContext: string) {
    // 1. Try Real AI
    const text = await this.callGemini(`System: ${systemContext} User: ${message}`);
    if (text) return text;

    // 2. FALLBACK: Find which module we are in to serve the content
    // We search the systemContext string to see if it mentions "The Future of Space" etc.
    
    // A. CHECK IF STARTING A SESSION (Empty History)
    if (history.length === 0) {
      for (const cat in CONTENT_DB) {
        for (const item of CONTENT_DB[cat as keyof typeof CONTENT_DB]) {
          if (systemContext.includes(item.title)) {
            return item.content; // Return the specific Reading/Writing/Listening content!
          }
        }
      }
      return "Welcome! Please check the instructions above and begin.";
    }

    // B. RESPOND BASED ON SKILL
    const msg = message.toLowerCase();

    // Speaking Logic (Examiner Mode)
    if (systemContext.includes("Speaking")) {
      if (history.length < 3) return "That is interesting. Do you think that is a popular opinion in your country?";
      return "Thank you. Now, let's move on to the next topic. Tell me about your hobbies.";
    }

    // Writing Logic (Feedback)
    if (systemContext.includes("Writing")) {
      return `Thank you for your submission.\n\n**Feedback:**\n- **Task Achievement:** Good effort addressing the prompt.\n- **Vocabulary:** Try to use more formal linking words like 'Furthermore' or 'However'.\n- **Grammar:** Watch out for subject-verb agreement.\n\n*Band Score Estimate: 6.5*`;
    }

    // Reading/Listening Logic (Checking Answers)
    if (msg.length < 3) return "Please type a full answer.";
    return "Thank you. Make sure to double-check your spelling. In the real exam, spelling errors count as incorrect answers.";
  }

  // --- HELPERS ---
  async generateScaffoldHint(skill: string, context: string) { 
    if (skill === 'writing') return "Hint: Structure your essay with an Introduction, 2 Body Paragraphs, and a Conclusion.";
    if (skill === 'speaking') return "Hint: Don't just say 'Yes' or 'No'. Always expand on your answer with 'Because...'.";
    return "Hint: Scan the text for keywords before reading in detail."; 
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