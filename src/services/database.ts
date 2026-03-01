import type {
  CardState,
  ConversationSession,
  ConversationStats,
  ExamResult,
  ScheduleProgress,
  ExportData,
} from './types';

const DB_NAME = 'french-tutor-db';
const DB_VERSION = 1;

export class DatabaseService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        if (oldVersion < 1) {
          const cards = db.createObjectStore('cards', { keyPath: 'wordId' });
          cards.createIndex('topic', 'topic');
          cards.createIndex('due', 'due');
          cards.createIndex('state', 'state');

          const convos = db.createObjectStore('conversations', {
            keyPath: 'id',
            autoIncrement: true,
          });
          convos.createIndex('timestamp', 'timestamp');

          const exams = db.createObjectStore('examResults', {
            keyPath: 'id',
            autoIncrement: true,
          });
          exams.createIndex('taskType', 'taskType');
          exams.createIndex('timestamp', 'timestamp');
          exams.createIndex('scenarioId', 'scenarioId');

          const progress = db.createObjectStore('scheduleProgress', {
            keyPath: ['day', 'activityIndex'],
          });
          progress.createIndex('day', 'day');
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
    });
  }

  private getDb(): IDBDatabase {
    if (!this.db) throw new Error('Database not initialized. Call init() first.');
    return this.db;
  }

  private tx(store: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    return this.getDb().transaction(store, mode).objectStore(store);
  }

  // Cards
  async getCard(wordId: string): Promise<CardState | undefined> {
    return new Promise((resolve, reject) => {
      const request = this.tx('cards').get(wordId);
      request.onsuccess = () => resolve(request.result as CardState | undefined);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCards(): Promise<CardState[]> {
    return new Promise((resolve, reject) => {
      const request = this.tx('cards').getAll();
      request.onsuccess = () => resolve(request.result as CardState[]);
      request.onerror = () => reject(request.error);
    });
  }

  async getCardsDueForReview(now: Date): Promise<CardState[]> {
    return new Promise((resolve, reject) => {
      const index = this.tx('cards').index('due');
      const range = IDBKeyRange.upperBound(now);
      const request = index.getAll(range);
      request.onsuccess = () => {
        const cards = request.result as CardState[];
        // Only return cards that have been reviewed at least once (not new)
        resolve(cards.filter((c) => c.state !== 0));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getNewCards(topic?: string): Promise<CardState[]> {
    if (topic) {
      return new Promise((resolve, reject) => {
        const index = this.tx('cards').index('topic');
        const request = index.getAll(topic);
        request.onsuccess = () => {
          const cards = request.result as CardState[];
          resolve(cards.filter((c) => c.state === 0));
        };
        request.onerror = () => reject(request.error);
      });
    }
    return new Promise((resolve, reject) => {
      const index = this.tx('cards').index('state');
      const request = index.getAll(0);
      request.onsuccess = () => resolve(request.result as CardState[]);
      request.onerror = () => reject(request.error);
    });
  }

  async saveCard(card: CardState): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = this.tx('cards', 'readwrite').put(card);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Conversations
  async saveConversation(session: ConversationSession): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = this.tx('conversations', 'readwrite').add(session);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getConversations(limit?: number): Promise<ConversationSession[]> {
    return new Promise((resolve, reject) => {
      const index = this.tx('conversations').index('timestamp');
      const request = index.openCursor(null, 'prev');
      const results: ConversationSession[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && (!limit || results.length < limit)) {
          results.push(cursor.value as ConversationSession);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getConversationStats(): Promise<ConversationStats> {
    const all = await this.getConversations();
    const totalSessions = all.length;
    const averageDuration = totalSessions > 0
      ? all.reduce((sum, c) => sum + c.duration, 0) / totalSessions
      : 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 14);
    const recentSessions = all.filter((c) => new Date(c.timestamp) > sevenDaysAgo);
    return { totalSessions, averageDuration, recentSessions };
  }

  // Exam Results
  async saveExamResult(result: ExamResult): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = this.tx('examResults', 'readwrite').add(result);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getExamResults(taskType?: string, limit?: number): Promise<ExamResult[]> {
    return new Promise((resolve, reject) => {
      const store = this.tx('examResults');
      let request: IDBRequest;

      if (taskType) {
        const index = store.index('taskType');
        request = index.getAll(taskType);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let results = request.result as ExamResult[];
        results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        if (limit) {
          results = results.slice(0, limit);
        }
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Schedule Progress
  async markActivityComplete(day: number, activityIndex: number): Promise<void> {
    const progress: ScheduleProgress = {
      day,
      activityIndex,
      completed: true,
      completedAt: new Date(),
    };
    return new Promise((resolve, reject) => {
      const request = this.tx('scheduleProgress', 'readwrite').put(progress);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getScheduleProgress(): Promise<ScheduleProgress[]> {
    return new Promise((resolve, reject) => {
      const request = this.tx('scheduleProgress').getAll();
      request.onsuccess = () => resolve(request.result as ScheduleProgress[]);
      request.onerror = () => reject(request.error);
    });
  }

  async isActivityComplete(day: number, activityIndex: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const request = this.tx('scheduleProgress').get([day, activityIndex]);
      request.onsuccess = () => {
        const result = request.result as ScheduleProgress | undefined;
        resolve(result?.completed ?? false);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Export
  async exportAll(): Promise<ExportData> {
    const [cards, conversations, examResults, scheduleProgress] = await Promise.all([
      this.getAllCards(),
      this.getConversations(),
      this.getExamResults(),
      this.getScheduleProgress(),
    ]);

    return {
      cards,
      conversations,
      examResults,
      scheduleProgress,
      exportedAt: new Date().toISOString(),
    };
  }
}
