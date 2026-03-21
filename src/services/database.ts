import type {
  CardState,
  ConversationSession,
  ConversationStats,
  ExamResult,
  ScheduleProgress,
  ExportData,
} from './types';

interface DbData {
  cards: CardState[];
  conversations: ConversationSession[];
  examResults: ExamResult[];
  scheduleProgress: ScheduleProgress[];
}

export class DatabaseService {
  private cache: DbData | null = null;

  async init(): Promise<void> {
    const res = await fetch('/api/db');
    this.cache = await res.json();
  }

  private data(): DbData {
    if (!this.cache) throw new Error('Database not initialized. Call init() first.');
    return this.cache;
  }

  // Cards
  async getCard(wordId: string): Promise<CardState | undefined> {
    return this.data().cards.find((c) => c.wordId === wordId);
  }

  async getAllCards(): Promise<CardState[]> {
    return [...this.data().cards];
  }

  async getCardsDueForReview(now: Date): Promise<CardState[]> {
    const nowTime = now.getTime();
    return this.data().cards.filter(
      (c) => c.state !== 0 && new Date(c.due).getTime() <= nowTime
    );
  }

  async getNewCards(topic?: string): Promise<CardState[]> {
    return this.data().cards.filter(
      (c) => c.state === 0 && (!topic || c.topic === topic)
    );
  }

  async saveCard(card: CardState): Promise<void> {
    const db = this.data();
    const idx = db.cards.findIndex((c) => c.wordId === card.wordId);
    if (idx >= 0) db.cards[idx] = card; else db.cards.push(card);
    await fetch('/api/db/cards', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });
  }

  // Conversations
  async saveConversation(session: ConversationSession): Promise<void> {
    this.data().conversations.push(session);
    await fetch('/api/db/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
  }

  async getConversations(limit?: number): Promise<ConversationSession[]> {
    const sorted = [...this.data().conversations].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }

  async getConversationStats(): Promise<ConversationStats> {
    const all = await this.getConversations();
    const totalSessions = all.length;
    const averageDuration = totalSessions > 0
      ? all.reduce((sum, c) => sum + c.duration, 0) / totalSessions
      : 0;
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const recentSessions = all.filter((c) => new Date(c.timestamp) > twoWeeksAgo);
    return { totalSessions, averageDuration, recentSessions };
  }

  // Exam Results
  async saveExamResult(result: ExamResult): Promise<void> {
    this.data().examResults.push(result);
    await fetch('/api/db/examResults', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });
  }

  async getExamResults(taskType?: string, limit?: number): Promise<ExamResult[]> {
    let results = taskType
      ? this.data().examResults.filter((r) => r.taskType === taskType)
      : [...this.data().examResults];
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return limit ? results.slice(0, limit) : results;
  }

  // Schedule Progress
  async markActivityComplete(day: number, activityIndex: number): Promise<void> {
    const progress: ScheduleProgress = {
      day,
      activityIndex,
      completed: true,
      completedAt: new Date(),
    };
    const db = this.data();
    const idx = db.scheduleProgress.findIndex(
      (p) => p.day === day && p.activityIndex === activityIndex
    );
    if (idx >= 0) db.scheduleProgress[idx] = progress; else db.scheduleProgress.push(progress);
    await fetch('/api/db/scheduleProgress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress),
    });
  }

  async getScheduleProgress(): Promise<ScheduleProgress[]> {
    return [...this.data().scheduleProgress];
  }

  async isActivityComplete(day: number, activityIndex: number): Promise<boolean> {
    return this.data().scheduleProgress.some(
      (p) => p.day === day && p.activityIndex === activityIndex && p.completed
    );
  }

  // Export
  async exportAll(): Promise<ExportData> {
    const db = this.data();
    return {
      cards: db.cards,
      conversations: db.conversations,
      examResults: db.examResults,
      scheduleProgress: db.scheduleProgress,
      exportedAt: new Date().toISOString(),
    };
  }
}
