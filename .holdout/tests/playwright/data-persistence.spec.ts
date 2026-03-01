/**
 * Tests for REQ-012: Data Persistence
 */
import { test, expect } from '@playwright/test';
import { setupApp } from './helpers';

test.describe('REQ-012: Data Persistence (IndexedDB)', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  // REQ-012 AC1-5: IndexedDB database structure
  test('IndexedDB database has correct object stores', async ({ page }) => {
    const stores = await page.evaluate(async () => {
      return new Promise<string[]>((resolve) => {
        const request = indexedDB.open('french-tutor-db');
        request.onsuccess = () => {
          const db = request.result;
          resolve(Array.from(db.objectStoreNames));
        };
        request.onerror = () => resolve([]);
      });
    });

    // Should have the four required stores
    expect(stores).toContain('cards');
    expect(stores).toContain('conversations');
    expect(stores).toContain('examResults');
    expect(stores).toContain('scheduleProgress');
  });

  // REQ-012 AC1: Cards store has correct indexes
  test('cards object store has topic, due, and state indexes', async ({ page }) => {
    const indexes = await page.evaluate(async () => {
      return new Promise<string[]>((resolve) => {
        const request = indexedDB.open('french-tutor-db');
        request.onsuccess = () => {
          const db = request.result;
          if (db.objectStoreNames.contains('cards')) {
            const tx = db.transaction('cards', 'readonly');
            const store = tx.objectStore('cards');
            resolve(Array.from(store.indexNames));
          } else {
            resolve([]);
          }
        };
        request.onerror = () => resolve([]);
      });
    });

    expect(indexes).toContain('topic');
    expect(indexes).toContain('due');
    expect(indexes).toContain('state');
  });

  // REQ-012 AC2: Conversations store has timestamp index
  test('conversations object store has timestamp index', async ({ page }) => {
    const indexes = await page.evaluate(async () => {
      return new Promise<string[]>((resolve) => {
        const request = indexedDB.open('french-tutor-db');
        request.onsuccess = () => {
          const db = request.result;
          if (db.objectStoreNames.contains('conversations')) {
            const tx = db.transaction('conversations', 'readonly');
            const store = tx.objectStore('conversations');
            resolve(Array.from(store.indexNames));
          } else {
            resolve([]);
          }
        };
        request.onerror = () => resolve([]);
      });
    });

    expect(indexes).toContain('timestamp');
  });

  // REQ-012 AC3: ExamResults store has correct indexes
  test('examResults object store has taskType, timestamp, scenarioId indexes', async ({ page }) => {
    const indexes = await page.evaluate(async () => {
      return new Promise<string[]>((resolve) => {
        const request = indexedDB.open('french-tutor-db');
        request.onsuccess = () => {
          const db = request.result;
          if (db.objectStoreNames.contains('examResults')) {
            const tx = db.transaction('examResults', 'readonly');
            const store = tx.objectStore('examResults');
            resolve(Array.from(store.indexNames));
          } else {
            resolve([]);
          }
        };
        request.onerror = () => resolve([]);
      });
    });

    expect(indexes).toContain('taskType');
    expect(indexes).toContain('timestamp');
    expect(indexes).toContain('scenarioId');
  });

  // REQ-012 AC4: ScheduleProgress store has day index
  test('scheduleProgress object store has day index', async ({ page }) => {
    const indexes = await page.evaluate(async () => {
      return new Promise<string[]>((resolve) => {
        const request = indexedDB.open('french-tutor-db');
        request.onsuccess = () => {
          const db = request.result;
          if (db.objectStoreNames.contains('scheduleProgress')) {
            const tx = db.transaction('scheduleProgress', 'readonly');
            const store = tx.objectStore('scheduleProgress');
            resolve(Array.from(store.indexNames));
          } else {
            resolve([]);
          }
        };
        request.onerror = () => resolve([]);
      });
    });

    expect(indexes).toContain('day');
  });

  // REQ-012 AC5: Database version is set
  test('IndexedDB database has a version number', async ({ page }) => {
    const version = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        const request = indexedDB.open('french-tutor-db');
        request.onsuccess = () => {
          resolve(request.result.version);
        };
        request.onerror = () => resolve(0);
      });
    });

    expect(version).toBeGreaterThanOrEqual(1);
  });

  // Data survives page reload
  test('data persists across page reloads', async ({ page }) => {
    // Write data to IndexedDB
    await page.evaluate(async () => {
      return new Promise<void>((resolve) => {
        const request = indexedDB.open('french-tutor-db');
        request.onsuccess = () => {
          const db = request.result;
          if (db.objectStoreNames.contains('cards')) {
            const tx = db.transaction('cards', 'readwrite');
            const store = tx.objectStore('cards');
            store.put({
              wordId: 'test-persist',
              due: new Date(),
              stability: 1.0,
              difficulty: 5.0,
              elapsed_days: 0,
              scheduled_days: 1,
              reps: 1,
              lapses: 0,
              state: 2,
              last_review: new Date(),
              topic: 'test',
            });
            tx.oncomplete = () => resolve();
          } else {
            resolve();
          }
        };
      });
    });

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Read data back
    const data = await page.evaluate(async () => {
      return new Promise<any>((resolve) => {
        const request = indexedDB.open('french-tutor-db');
        request.onsuccess = () => {
          const db = request.result;
          if (db.objectStoreNames.contains('cards')) {
            const tx = db.transaction('cards', 'readonly');
            const store = tx.objectStore('cards');
            const get = store.get('test-persist');
            get.onsuccess = () => resolve(get.result);
            get.onerror = () => resolve(null);
          } else {
            resolve(null);
          }
        };
      });
    });

    expect(data).toBeTruthy();
    expect(data?.wordId).toBe('test-persist');
  });
});
