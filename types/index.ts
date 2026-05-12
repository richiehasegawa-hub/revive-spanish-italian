// ============================================================
// Revive Spanish & Italian — 型定義
// ============================================================

export type Language = 'spanish' | 'italian';

export type CharacterId = 'carlos' | 'elena' | 'marco' | 'sofia';

export interface Character {
  id: CharacterId;
  name: string;
  language: Language;
  location: string;
  occupation: string;
  dialect: string;
  personality: string;
  voiceId: string; // ElevenLabs voice ID
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  targetLanguages: Language[];
  weaknessList: string[];
  interests: string[];
  streakDays: number;
  totalSessions: number;
  createdAt: string;
}

export interface LearningSession {
  id: string;
  userId: string;
  language: Language;
  characterId: CharacterId;
  scenarioType: string;
  status: 'active' | 'completed' | 'paused';
  startedAt: string;
  endedAt?: string;
  summaryJa?: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  grammarScore?: number;
  fluencyScore?: number;
  naturalScore?: number;
  createdAt: string;
}

export interface EvaluationResult {
  grammarScore: number;
  grammarIssues: GrammarIssue[];
  fluencyScore: number;
  naturalnessScore: number;
  nextFocus: string[];
  encouragement: string;
}

export interface GrammarIssue {
  error: string;
  correction: string;
  rule: string;
}

export interface WeakPoint {
  id: string;
  userId: string;
  language: Language;
  category: string;
  description: string;
  frequency: number;
  lastSeen: string;
}
