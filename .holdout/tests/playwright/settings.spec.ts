/**
 * Tests for REQ-001: Settings and API Key Management
 */
import { test, expect } from '@playwright/test';
import { clearApiKey, clearIndexedDB, mockWebSpeechAPI } from './helpers';

test.describe('REQ-001: Settings and API Key Management', () => {
  test.beforeEach(async ({ page }) => {
    await clearIndexedDB(page);
    await mockWebSpeechAPI(page);
  });

  // REQ-001 AC1: No API key -> settings page displayed
  test('shows settings page when no API key is stored', async ({ page }) => {
    await clearApiKey(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Settings page should be visible with an input for the API key
    const keyInput = page.locator('input[type="password"], input[type="text"]').filter({ hasText: /key/i }).or(
      page.getByPlaceholder(/key|api/i)
    ).or(
      page.locator('input').first()
    );

    // The page should contain some reference to API key or settings
    const pageContent = await page.textContent('body');
    expect(pageContent?.toLowerCase()).toMatch(/api\s*key|settings|anthropic/i);
  });

  // REQ-001 AC2: Enter valid API key -> stored and navigates to main view
  test('stores API key and navigates to main view on submit', async ({ page }) => {
    await clearApiKey(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find the key input field
    const keyInput = page.getByPlaceholder(/key|api/i).or(
      page.locator('input[type="password"]').first()
    ).or(
      page.locator('input').first()
    );

    await keyInput.fill('sk-ant-test-valid-key-abcdef1234567890');

    // Find and click the submit/save button
    const submitButton = page.getByRole('button', { name: /^save$|submit|continue|confirm/i }).first();
    await submitButton.click();
    await page.waitForTimeout(500);

    // Verify the key is stored in localStorage
    const storedKey = await page.evaluate(() => localStorage.getItem('french-tutor-api-key'));
    expect(storedKey).toBe('sk-ant-test-valid-key-abcdef1234567890');

    // Should no longer be on settings page — sidebar with modes should be visible
    const pageContent = await page.textContent('body');
    expect(pageContent?.toLowerCase()).toMatch(/vocabulary|conversation|exam|dashboard/i);
  });

  // REQ-001 AC3: Settings accessible from any page, key is masked
  test('settings page accessible from sidebar with masked key', async ({ page }) => {
    // Set up API key
    await page.addInitScript(() => {
      localStorage.setItem('french-tutor-api-key', 'sk-ant-test-key-1234567890abcdef');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find and click the settings icon in the sidebar
    const settingsButton = page.getByRole('button', { name: /settings/i }).or(
      page.locator('[aria-label*="settings" i], [title*="settings" i]')
    ).or(
      page.locator('nav a, aside a, nav button, aside button').filter({ hasText: /settings/i })
    ).first();
    await settingsButton.click();
    await page.waitForTimeout(300);

    // The key should be masked, showing only last 4 characters
    const pageContent = await page.textContent('body');
    // The full key should NOT be visible
    expect(pageContent).not.toContain('sk-ant-test-key-1234567890abcdef');
    // Last 4 characters should be visible
    expect(pageContent).toContain('cdef');
  });

  // REQ-001 AC4: Clear key -> key removed from localStorage
  test('clearing the API key removes it from localStorage', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('french-tutor-api-key', 'sk-ant-test-key-1234567890abcdef');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to settings
    const settingsButton = page.getByRole('button', { name: /settings/i }).or(
      page.locator('[aria-label*="settings" i], [title*="settings" i]')
    ).or(
      page.locator('nav a, aside a, nav button, aside button').filter({ hasText: /settings/i })
    ).first();
    await settingsButton.click();
    await page.waitForTimeout(300);

    // Clear the key — implementation may show a "Clear" button or an input to empty
    const clearButton = page.getByRole('button', { name: /^clear$|remove|delete/i }).first();
    const hasClearButton = await clearButton.isVisible().catch(() => false);

    if (hasClearButton) {
      await clearButton.click();
    } else {
      // Fallback: find input, clear it, and submit
      const keyInput = page.getByPlaceholder(/key|api/i).or(
        page.locator('input[type="password"]').first()
      ).or(
        page.locator('input').first()
      );
      await keyInput.clear();
      const submitButton = page.getByRole('button', { name: /^save$|submit|confirm/i }).first();
      await submitButton.click();
    }
    await page.waitForTimeout(300);

    // Verify key is removed
    const storedKey = await page.evaluate(() => localStorage.getItem('french-tutor-api-key'));
    expect(storedKey).toBeFalsy();
  });
});
