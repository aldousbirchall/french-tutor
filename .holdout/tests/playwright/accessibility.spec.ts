/**
 * Accessibility tests (WCAG 2.1 AA) for all major views.
 * Uses @axe-core/playwright.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { setupApp, navigateToMode, clearApiKey, clearIndexedDB, mockWebSpeechAPI } from './helpers';

test.describe('Accessibility: WCAG 2.1 AA Compliance', () => {
  test('Settings page passes WCAG 2.1 AA', async ({ page }) => {
    await clearIndexedDB(page);
    await clearApiKey(page);
    await mockWebSpeechAPI(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Dashboard view passes WCAG 2.1 AA', async ({ page }) => {
    await setupApp(page);
    await navigateToMode(page, 'Dashboard');
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Vocabulary view passes WCAG 2.1 AA', async ({ page }) => {
    await setupApp(page);
    await navigateToMode(page, 'Vocabulary');
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Conversation view passes WCAG 2.1 AA', async ({ page }) => {
    await setupApp(page);
    await navigateToMode(page, 'Conversation');
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Exam view passes WCAG 2.1 AA', async ({ page }) => {
    await setupApp(page);
    await navigateToMode(page, 'Exam');
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
