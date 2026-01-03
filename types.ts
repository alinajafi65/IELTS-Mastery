
export enum ProficiencyLevel {
  BEGINNER = 'A1/A2',
  INTERMEDIATE = 'B1/B2',
  ADVANCED = 'C1/C2',
}

export type IELTSType = 'academic' | 'general';
export type IELTSSkill = 'reading' | 'listening' | 'writing' | 'speaking';

export interface Activity {
  id: string;
  date: string;
  skill: IELTSSkill;
  title: string;
  score?: number;
}

export interface SkillProgress {
  skill: IELTSSkill;
  sessionsCompleted: number;
  lastFeedback: string;
  learnedVocab: string[];
  learnedGrammar: string[];
}

export interface UserProfile {
  name: string;
  type: IELTSType;
  targetBand: number;
  currentLevel: string | null;
  estimatedBand: number | null;
  completedOnboarding: boolean;
  progress: SkillProgress[];
  activityLog: Activity[];
}

export interface PracticeModule {
  id: string;
  title: string;
  description: string;
  type: 'tutorial' | 'practice' | 'mock';
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

// Added Question interface for Placement Tests
export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}
