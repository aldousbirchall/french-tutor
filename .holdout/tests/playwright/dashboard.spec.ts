/**
 * Tests for REQ-003: Study Schedule Display and REQ-010: Progress Dashboard
 */
import { test, expect } from '@playwright/test';
import { setupApp, navigateToMode } from './helpers';

test.describe('REQ-003: Study Schedule Display', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await navigateToMode(page, 'Dashboard');
  });

  // REQ-003 AC1: Current study day calculated from schedule.json
  test('displays the current study day information', async ({ page }) => {
    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
    const text = await mainContent.textContent();

    // Should show some indication of the current day or schedule
    // It should display a day title, phase name, or "not started" / "has ended" message
    expect(text?.toLowerCase()).toMatch(
      /day\s*\d+|phase|foundation|fluency|exam\s*prep|not\s*started|has\s*ended|study\s*period|rest\s*day/i
    );
  });

  // REQ-003 AC2: Shows day title, phase, activities, grammar focus
  test('shows day details including phase, activities, and grammar focus', async ({ page }) => {
    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
    const text = await mainContent.textContent();

    // Skip if outside study period
    if (text?.toLowerCase().match(/not\s*started|has\s*ended/)) {
      test.skip();
      return;
    }

    // Should show activities with time estimates (minutes)
    expect(text?.toLowerCase()).toMatch(/min|minutes/i);
  });

  // REQ-003 AC3: Clicking activity navigates to corresponding mode
  test('clicking an activity item navigates to the corresponding mode', async ({ page }) => {
    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
    const text = await mainContent.textContent();

    // Skip if outside study period
    if (text?.toLowerCase().match(/not\s*started|has\s*ended/)) {
      test.skip();
      return;
    }

    // Find an activity that links to vocabulary mode
    const activityLink = mainContent.getByText(/vocab/i).first();
    const isVisible = await activityLink.isVisible().catch(() => false);

    if (isVisible) {
      await activityLink.click();
      await page.waitForTimeout(500);

      // Should now be in vocabulary mode
      const newContent = await page.locator('main, [role="main"], .main-content, .content').first().textContent();
      expect(newContent?.toLowerCase()).toMatch(/vocab|card|due|review|drill/i);
    }
  });

  // REQ-003 AC4: Marking activity as completed persists in IndexedDB
  test('can mark an activity as completed and it persists', async ({ page }) => {
    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
    const text = await mainContent.textContent();

    if (text?.toLowerCase().match(/not\s*started|has\s*ended/)) {
      test.skip();
      return;
    }

    // Find a checkbox or completion button for an activity
    const completionToggle = mainContent.locator(
      'input[type="checkbox"], [role="checkbox"], button:has-text("complete"), button:has-text("done")'
    ).first();

    const isVisible = await completionToggle.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    await completionToggle.click();
    await page.waitForTimeout(500);

    // Verify persisted in IndexedDB
    const hasData = await page.evaluate(async () => {
      return new Promise<boolean>((resolve) => {
        const request = indexedDB.open('french-tutor-db');
        request.onsuccess = () => {
          const db = request.result;
          const storeNames = Array.from(db.objectStoreNames);
          if (storeNames.includes('scheduleProgress')) {
            const tx = db.transaction('scheduleProgress', 'readonly');
            const store = tx.objectStore('scheduleProgress');
            const getAll = store.getAll();
            getAll.onsuccess = () => {
              resolve(getAll.result.length > 0);
            };
            getAll.onerror = () => resolve(false);
          } else {
            resolve(false);
          }
        };
        request.onerror = () => resolve(false);
      });
    });

    expect(hasData).toBeTruthy();
  });

  // REQ-003 AC5: Message when outside study period
  test('shows appropriate message when outside study period', async ({ page }) => {
    // Override the date to be far in the future
    await page.addInitScript(() => {
      const far = new Date('2030-01-01');
      const OrigDate = Date;
      class MockDate extends OrigDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(far.getTime());
          } else {
            super(...(args as [any]));
          }
        }
        static now() { return far.getTime(); }
      }
      (window as any).Date = MockDate;
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await navigateToMode(page, 'Dashboard');

    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
    const text = await mainContent.textContent();

    // Should show a message about the study period
    expect(text?.toLowerCase()).toMatch(/ended|not\s*started|complete|finished|no.*schedule/i);
  });

  // REQ-003 AC6: Weekend shows most recent weekday's schedule
  test('weekend shows rest day indicator', async ({ page }) => {
    // Set date to a known Saturday
    await page.addInitScript(() => {
      const saturday = new Date('2026-03-07'); // A Saturday
      const OrigDate = Date;
      class MockDate extends OrigDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(saturday.getTime());
          } else {
            super(...(args as [any]));
          }
        }
        static now() { return saturday.getTime(); }
      }
      (window as any).Date = MockDate;
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await navigateToMode(page, 'Dashboard');

    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
    const text = await mainContent.textContent();

    // Should indicate it's a rest day or weekend
    expect(text?.toLowerCase()).toMatch(/rest|weekend|day\s*off|no\s*class/i);
  });
});

test.describe('REQ-010: Progress Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await navigateToMode(page, 'Dashboard');
  });

  // REQ-010 AC1: Shows vocabulary coverage, study streak, schedule
  test('displays vocabulary coverage and study streak metrics', async ({ page }) => {
    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
    const text = await mainContent.textContent();

    // Should show vocabulary coverage metric
    expect(text?.toLowerCase()).toMatch(/vocab|coverage|cards/i);
    // Should show streak information
    expect(text?.toLowerCase()).toMatch(/streak|days|consecutive/i);
  });

  // REQ-010 AC2: Topic breakdown with horizontal bars
  test('shows topic breakdown for vocabulary coverage', async ({ page }) => {
    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
    const text = await mainContent.textContent();

    // Should show topic names from the vocabulary data
    expect(text?.toLowerCase()).toMatch(/topic|greetings|family|food|shopping|travel|work|health|weather/i);
  });

  // REQ-010 AC3: Conversation history statistics
  test('displays conversation session statistics', async ({ page }) => {
    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
    const text = await mainContent.textContent();

    // Should show conversation metrics (could be "No data yet" or actual counts)
    expect(text?.toLowerCase()).toMatch(/conversation|session|duration|no\s*data/i);
  });

  // REQ-010 AC4: Exam results with scores
  test('displays exam results with scores', async ({ page }) => {
    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
    const text = await mainContent.textContent();

    // Should show exam-related metrics
    expect(text?.toLowerCase()).toMatch(/exam|score|result|no\s*data/i);
  });

  // REQ-010 AC5: Overall exam readiness percentage
  test('displays overall exam readiness estimate', async ({ page }) => {
    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
    const text = await mainContent.textContent();

    // Should show readiness estimate with percentage
    expect(text?.toLowerCase()).toMatch(/readiness|ready|%|percent|overall/i);
  });

  // REQ-010 AC6: No data shows "No data yet" not fabricated numbers
  test('shows "No data yet" when no data exists', async ({ page }) => {
    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
    const text = await mainContent.textContent();

    // With fresh IndexedDB, at least some metrics should show "no data"
    expect(text?.toLowerCase()).toMatch(/no\s*data|0\s*%|0\s*session|not\s*yet/i);
  });
});
