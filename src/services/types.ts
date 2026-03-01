export interface AppError {
  code: 'NO_API_KEY' | 'AUTH_ERROR' | 'RATE_LIMIT' | 'NETWORK_ERROR' | 'SERVER_ERROR';
  message: string;
}

export interface CardState {
  wordId: string;
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number; // 0=New, 1=Learning, 2=Review, 3=Relearning
  last_review: Date | null;
  topic: string;
}

export interface ConversationSession {
  id?: number;
  topic: string;
  duration: number;
  userWordCount: number;
  assessment: string;
  timestamp: Date;
}

export interface ConversationStats {
  totalSessions: number;
  averageDuration: number;
  recentSessions: ConversationSession[];
}

export interface ExamResult {
  id?: number;
  scenarioId: string;
  taskType: string;
  scores: Record<string, number>;
  totalPercent: number;
  timestamp: Date;
}

export interface ScheduleProgress {
  day: number;
  activityIndex: number;
  completed: boolean;
  completedAt: Date | null;
}

export interface ExportData {
  cards: CardState[];
  conversations: ConversationSession[];
  examResults: ExamResult[];
  scheduleProgress: ScheduleProgress[];
  exportedAt: string;
}
