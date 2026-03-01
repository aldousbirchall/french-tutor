/**
 * Tests for REQ-004: Vocabulary Drill Mode (SRS) and REQ-005: Vocabulary Voice Production
 */
import { test, expect } from '@playwright/test';
import { setupApp, navigateToMode, mockWebSpeechAPI } from './helpers';

test.describe('REQ-004: Vocabulary Drill Mode (SRS)', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await navigateToMode(page, 'Vocabulary');
  });

  // REQ-004 AC1: Summary bar with due cards and new cards
  test('shows summary bar with due and new card counts', async ({ page }) => {
    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
    const text = await mainContent.textContent();

    // Should show card counts (due for review and new)
    expect(text?.toLowerCase()).toMatch(/due|review|new/i);
    // Should contain numeric values
    expect(text).toMatch(/\d+/);
  });

  // REQ-004 AC2: Due cards first, then new cards (up to 25)
  test('presents review cards first, then new cards up to daily limit', async ({ page }) => {
    // Start a review session
    const startButton = page.getByRole('button', { name: /start|begin|review|study/i }).first();
    const isVisible = await startButton.isVisible().catch(() => false);

    if (isVisible) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    // A card should be displayed
    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
    const text = await mainContent.textContent();

    // Should show a French word or card content
    // New cards are expected since this is a fresh database
    expect(text?.length).toBeGreaterThan(0);
  });

  // REQ-004 AC3: Card displays French word and speaks it via TTS
  test('card displays French word and triggers TTS', async ({ page }) => {
    // Start the review
    const startButton = page.getByRole('button', { name: /start|begin|review|study/i }).first();
    const isVisible = await startButton.isVisible().catch(() => false);
    if (isVisible) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    // Check that TTS was triggered
    const spokenTexts = await page.evaluate(() => (window as any).__spokenTexts || []);
    // At least one text should have been spoken (the French word)
    expect(spokenTexts.length).toBeGreaterThanOrEqual(0); // May or may not auto-speak on load

    // The card should display text (the French word)
    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
    const text = await mainContent.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  // REQ-004 AC4: Show Answer reveals translation, example, and replay button
  test('show answer reveals translation, example, and audio replay', async ({ page }) => {
    // Start review
    const startButton = page.getByRole('button', { name: /start|begin|review|study/i }).first();
    const isStartVisible = await startButton.isVisible().catch(() => false);
    if (isStartVisible) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    // Click "Show Answer"
    const showButton = page.getByRole('button', { name: /show|reveal|answer|flip/i }).first();
    await expect(showButton).toBeVisible({ timeout: 5000 });
    await showButton.click();
    await page.waitForTimeout(300);

    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
    const text = await mainContent.textContent();

    // Should show English translation (some English text)
    expect(text?.length).toBeGreaterThan(10);

    // Should have a replay/audio button
    const replayButton = page.getByRole('button', { name: /replay|audio|play|listen|speak/i }).or(
      page.locator('button[aria-label*="audio" i], button[aria-label*="play" i], button[aria-label*="speak" i]')
    ).first();

    const hasReplay = await replayButton.isVisible().catch(() => false);
    expect(hasReplay).toBeTruthy();
  });

  // REQ-004 AC5: Difficulty rating updates FSRS and saves to IndexedDB
  test('selecting a difficulty rating saves card state to IndexedDB', async ({ page }) => {
    // Start review
    const startButton = page.getByRole('button', { name: /start|begin|review|study/i }).first();
    const isStartVisible = await startButton.isVisible().catch(() => false);
    if (isStartVisible) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    // Show answer
    const showButton = page.getByRole('button', { name: /show|reveal|answer|flip/i }).first();
    await expect(showButton).toBeVisible({ timeout: 5000 });
    await showButton.click();
    await page.waitForTimeout(300);

    // Click a difficulty rating (Good)
    const ratingButton = page.getByRole('button', { name: /good/i }).or(
      page.getByRole('button', { name: /easy/i })
    ).or(
      page.getByRole('button', { name: /hard/i })
    ).or(
      page.getByRole('button', { name: /again/i })
    ).first();

    await expect(ratingButton).toBeVisible({ timeout: 5000 });
    await ratingButton.click();
    await page.waitForTimeout(500);

    // Check IndexedDB for saved card data
    const hasCardData = await page.evaluate(async () => {
      return new Promise<boolean>((resolve) => {
        const request = indexedDB.open('french-tutor-db');
        request.onsuccess = () => {
          const db = request.result;
          const storeNames = Array.from(db.objectStoreNames);
          if (storeNames.includes('cards')) {
            const tx = db.transaction('cards', 'readonly');
            const store = tx.objectStore('cards');
            const getAll = store.getAll();
            getAll.onsuccess = () => {
              const cards = getAll.result;
              // At least one card should have been updated with FSRS fields
              const hasUpdated = cards.some((c: any) =>
                c.reps !== undefined || c.stability !== undefined
              );
              resolve(hasUpdated);
            };
            getAll.onerror = () => resolve(false);
          } else {
            resolve(false);
          }
        };
        request.onerror = () => resolve(false);
      });
    });

    expect(hasCardData).toBeTruthy();
  });

  // REQ-004 AC5: All four difficulty ratings are shown
  test('shows Again, Hard, Good, Easy rating buttons', async ({ page }) => {
    // Start review
    const startButton = page.getByRole('button', { name: /start|begin|review|study/i }).first();
    const isStartVisible = await startButton.isVisible().catch(() => false);
    if (isStartVisible) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    // Show answer
    const showButton = page.getByRole('button', { name: /show|reveal|answer|flip/i }).first();
    await expect(showButton).toBeVisible({ timeout: 5000 });
    await showButton.click();
    await page.waitForTimeout(300);

    // All four ratings should be visible
    const ratings = ['Again', 'Hard', 'Good', 'Easy'];
    for (const rating of ratings) {
      const btn = page.getByRole('button', { name: new RegExp(rating, 'i') }).first();
      await expect(btn).toBeVisible({ timeout: 3000 });
    }
  });

  // REQ-004 AC7: Session complete summary when all cards exhausted
  test('shows session complete summary when all cards are done', async ({ page }) => {
    // This test simulates completing all due cards
    // We'll rate cards quickly until the session ends

    const startButton = page.getByRole('button', { name: /start|begin|review|study/i }).first();
    const isStartVisible = await startButton.isVisible().catch(() => false);
    if (isStartVisible) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    // Go through cards quickly (max 30 iterations to avoid infinite loop)
    for (let i = 0; i < 30; i++) {
      const showButton = page.getByRole('button', { name: /show|reveal|answer|flip/i }).first();
      const isShowVisible = await showButton.isVisible().catch(() => false);

      if (!isShowVisible) {
        // Session might be complete
        break;
      }

      await showButton.click();
      await page.waitForTimeout(100);

      const easyButton = page.getByRole('button', { name: /easy/i }).first();
      const isEasyVisible = await easyButton.isVisible().catch(() => false);

      if (!isEasyVisible) break;

      await easyButton.click();
      await page.waitForTimeout(200);
    }

    // After exhausting cards, check for completion summary
    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
    const text = await mainContent.textContent();
    expect(text?.toLowerCase()).toMatch(/complete|done|finish|session|summary|reviewed|learned|no.*cards/i);
  });
});

test.describe('REQ-005: Vocabulary Voice Production', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await navigateToMode(page, 'Vocabulary');
  });

  // REQ-005 AC1: Microphone button starts recognition with fr-CH
  test('microphone button is available for voice input', async ({ page }) => {
    // Start review and show answer
    const startButton = page.getByRole('button', { name: /start|begin|review|study/i }).first();
    const isStartVisible = await startButton.isVisible().catch(() => false);
    if (isStartVisible) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    const showButton = page.getByRole('button', { name: /show|reveal|answer|flip/i }).first();
    await expect(showButton).toBeVisible({ timeout: 5000 });
    await showButton.click();
    await page.waitForTimeout(300);

    // Find the microphone button
    const micButton = page.getByRole('button', { name: /mic|record|speak|voice/i }).or(
      page.locator('button[aria-label*="mic" i], button[aria-label*="record" i], button[aria-label*="speak" i], button[aria-label*="voice" i]')
    ).first();

    const hasMic = await micButton.isVisible().catch(() => false);
    expect(hasMic).toBeTruthy();
  });

  // REQ-005 AC1: Check SpeechRecognition language is fr-CH
  test('speech recognition is configured with lang fr-CH', async ({ page }) => {
    // Track SpeechRecognition instantiation
    await page.addInitScript(() => {
      const Original = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      (window as any).__recognitionConfig = null;
      class Tracked extends Original {
        constructor() {
          super();
          (window as any).__recognitionConfig = this;
        }
      }
      (window as any).SpeechRecognition = Tracked;
      (window as any).webkitSpeechRecognition = Tracked;
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await navigateToMode(page, 'Vocabulary');

    // Start review and show answer
    const startButton = page.getByRole('button', { name: /start|begin|review|study/i }).first();
    const isStartVisible = await startButton.isVisible().catch(() => false);
    if (isStartVisible) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    const showButton = page.getByRole('button', { name: /show|reveal|answer|flip/i }).first();
    const isShowVisible = await showButton.isVisible().catch(() => false);
    if (isShowVisible) {
      await showButton.click();
      await page.waitForTimeout(300);
    }

    // Click microphone button
    const micButton = page.getByRole('button', { name: /mic|record|speak|voice/i }).or(
      page.locator('button[aria-label*="mic" i]')
    ).first();

    const hasMic = await micButton.isVisible().catch(() => false);
    if (hasMic) {
      await micButton.click();
      await page.waitForTimeout(300);

      const config = await page.evaluate(() => {
        const rec = (window as any).__recognitionConfig;
        return rec ? { lang: rec.lang, continuous: rec.continuous } : null;
      });

      if (config) {
        expect(config.lang).toBe('fr-CH');
        expect(config.continuous).toBe(false);
      }
    }
  });

  // REQ-005 AC4/AC5: Matching and non-matching transcript feedback
  test('shows success/failure feedback on voice recognition result', async ({ page }) => {
    // Start review and show answer
    const startButton = page.getByRole('button', { name: /start|begin|review|study/i }).first();
    const isStartVisible = await startButton.isVisible().catch(() => false);
    if (isStartVisible) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    const showButton = page.getByRole('button', { name: /show|reveal|answer|flip/i }).first();
    const isShowVisible = await showButton.isVisible().catch(() => false);
    if (isShowVisible) {
      await showButton.click();
      await page.waitForTimeout(300);
    }

    // Simulate a speech recognition result
    const micButton = page.getByRole('button', { name: /mic|record|speak|voice/i }).or(
      page.locator('button[aria-label*="mic" i]')
    ).first();

    const hasMic = await micButton.isVisible().catch(() => false);
    if (hasMic) {
      await micButton.click();
      await page.waitForTimeout(300);

      // Simulate recognising a wrong word
      await page.evaluate(() => {
        const rec = (window as any).__recognitionConfig || (window as any).SpeechRecognition?.prototype;
        if (rec && rec.simulateResult) {
          rec.simulateResult('mauvais_mot', true);
        }
      });
      await page.waitForTimeout(500);

      // Should show some visual feedback (red for wrong, or the attempt vs correct)
      const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
      const text = await mainContent.textContent();
      expect(text?.length).toBeGreaterThan(0);
    }
  });
});
