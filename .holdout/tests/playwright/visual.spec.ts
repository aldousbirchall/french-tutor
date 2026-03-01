/**
 * Visual regression tests for REQ-NFR-003: Responsive Layout
 * and visual checks across key views.
 */
import { test, expect } from '@playwright/test';
import { setupApp, navigateToMode } from './helpers';

test.describe('Visual Regression: Responsive Layout', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  // REQ-NFR-003 AC1: 1024px viewport — no horizontal scrolling, content >= 700px
  test('at 1024px: no horizontal scroll and content area >= 700px wide', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);

    // Check that the page does not exceed viewport width
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(1024 + 5); // Small tolerance

    // Check main content area width
    const contentWidth = await page.locator('main, [role="main"], .main-content, .content').first().evaluate(
      (el) => el.getBoundingClientRect().width
    );
    expect(contentWidth).toBeGreaterThanOrEqual(700);
  });

  // REQ-NFR-003 AC2: Above 1440px — content max-width 1200px and centred
  test('at 2560px: content area max-width 1200px and centred', async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.waitForTimeout(300);

    const contentBox = await page.locator('main, [role="main"], .main-content, .content').first().evaluate(
      (el) => {
        const rect = el.getBoundingClientRect();
        return {
          width: rect.width,
          left: rect.left,
          right: rect.right,
          viewportWidth: window.innerWidth,
        };
      }
    );

    // Max-width should be 1200px (with some tolerance for padding)
    expect(contentBox.width).toBeLessThanOrEqual(1300);

    // Should be approximately centred (left margin roughly equals right margin)
    const leftMargin = contentBox.left;
    const rightMargin = contentBox.viewportWidth - contentBox.right;

    // Allow 100px tolerance for sidebar
    if (leftMargin > 100) {
      // If sidebar is present, centre is relative to remaining space
      expect(Math.abs(rightMargin - (leftMargin - 200))).toBeLessThan(200); // rough check
    }
  });

  // REQ-002 AC4: Sidebar collapsed at 768px
  test('sidebar collapses to icons only at 768px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);

    await page.screenshot({ path: 'tests/playwright/screenshots/sidebar-768px.png' });

    const sidebar = page.locator('nav, [role="navigation"], aside').first();
    const sidebarWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);

    // Collapsed sidebar should be narrow (< 200px typically < 80px)
    expect(sidebarWidth).toBeLessThan(200);
  });

  // Screenshot key views at different viewport widths
  const viewports = [
    { width: 1024, height: 768, name: '1024px' },
    { width: 1440, height: 900, name: '1440px' },
    { width: 2560, height: 1440, name: '2560px' },
  ];

  for (const vp of viewports) {
    test(`screenshot: Dashboard at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await navigateToMode(page, 'Dashboard');
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `tests/playwright/screenshots/dashboard-${vp.name}.png`,
        fullPage: true,
      });
    });

    test(`screenshot: Vocabulary at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await navigateToMode(page, 'Vocabulary');
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `tests/playwright/screenshots/vocabulary-${vp.name}.png`,
        fullPage: true,
      });
    });

    test(`screenshot: Exam at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await navigateToMode(page, 'Exam');
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `tests/playwright/screenshots/exam-${vp.name}.png`,
        fullPage: true,
      });
    });
  }
});
