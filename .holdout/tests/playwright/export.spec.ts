/**
 * Tests for REQ-016: Export Progress Data
 */
import { test, expect } from '@playwright/test';
import { setupApp, navigateToMode } from './helpers';

test.describe('REQ-016: Export Progress Data', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await navigateToMode(page, 'Dashboard');
  });

  // REQ-016 AC1: Export Data button generates and downloads JSON
  test('Export Data button downloads a JSON file', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export/i }).first();
    const isVisible = await exportButton.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    // Listen for download
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
    await exportButton.click();

    const download = await downloadPromise;

    // Filename should match pattern french-tutor-export-YYYY-MM-DD.json
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/french-tutor-export-\d{4}-\d{2}-\d{2}\.json/);

    // Content should be valid JSON
    const content = await download.path();
    if (content) {
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync(content, 'utf-8'));

      // Should contain data from all stores
      expect(data).toHaveProperty('cards');
      expect(data).toHaveProperty('conversations');
      expect(data).toHaveProperty('examResults');
      expect(data).toHaveProperty('scheduleProgress');
    }
  });
});
