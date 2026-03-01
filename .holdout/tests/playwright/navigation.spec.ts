/**
 * Tests for REQ-002: Navigation and Layout
 */
import { test, expect } from '@playwright/test';
import { setupApp, navigateToMode } from './helpers';

test.describe('REQ-002: Navigation and Layout', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
  });

  // REQ-002 AC1: Sidebar has four modes
  test('sidebar displays four mode entries: Vocabulary, Conversation, Exam, Dashboard', async ({ page }) => {
    const sidebar = page.locator('nav, [role="navigation"], aside').first();
    await expect(sidebar).toBeVisible();

    const sidebarText = await sidebar.textContent();
    expect(sidebarText?.toLowerCase()).toContain('vocabulary');
    expect(sidebarText?.toLowerCase()).toContain('conversation');
    expect(sidebarText?.toLowerCase()).toContain('exam');
    expect(sidebarText?.toLowerCase()).toContain('dashboard');
  });

  // REQ-002 AC2: Clicking a mode switches the main content
  test('clicking a sidebar mode switches the main content view', async ({ page }) => {
    // Navigate to Vocabulary
    await navigateToMode(page, 'Vocabulary');
    let mainContent = await page.locator('main, [role="main"], .main-content, .content').first().textContent();
    // Vocabulary mode should have card-related content or a "due" indicator
    expect(mainContent?.toLowerCase()).toMatch(/vocab|card|due|new|review|drill/i);

    // Navigate to Conversation
    await navigateToMode(page, 'Conversation');
    mainContent = await page.locator('main, [role="main"], .main-content, .content').first().textContent();
    expect(mainContent?.toLowerCase()).toMatch(/conversation|speak|chat|message/i);

    // Navigate to Exam
    await navigateToMode(page, 'Exam');
    mainContent = await page.locator('main, [role="main"], .main-content, .content').first().textContent();
    expect(mainContent?.toLowerCase()).toMatch(/exam|oral|written|task|simulation/i);

    // Navigate to Dashboard
    await navigateToMode(page, 'Dashboard');
    mainContent = await page.locator('main, [role="main"], .main-content, .content').first().textContent();
    expect(mainContent?.toLowerCase()).toMatch(/dashboard|progress|schedule|streak|readiness/i);
  });

  // REQ-002 AC3: Active mode has visual highlight
  test('active sidebar entry has a visually distinct highlight', async ({ page }) => {
    await navigateToMode(page, 'Vocabulary');

    const sidebar = page.locator('nav, [role="navigation"], aside').first();
    const vocabEntry = sidebar.getByText('Vocabulary', { exact: false }).first();
    const examEntry = sidebar.getByText('Exam', { exact: false }).first();

    // Active entry should have different styling (background colour, aria-current, or active class)
    const vocabClasses = await vocabEntry.evaluate((el) => {
      const link = el.closest('a, button, [role="tab"], li') || el;
      return {
        classList: Array.from(link.classList),
        bgColor: getComputedStyle(link).backgroundColor,
        ariaCurrent: link.getAttribute('aria-current'),
      };
    });

    const examClasses = await examEntry.evaluate((el) => {
      const link = el.closest('a, button, [role="tab"], li') || el;
      return {
        classList: Array.from(link.classList),
        bgColor: getComputedStyle(link).backgroundColor,
        ariaCurrent: link.getAttribute('aria-current'),
      };
    });

    // At least one of: different background colour, aria-current, or active class
    const isHighlighted =
      vocabClasses.bgColor !== examClasses.bgColor ||
      vocabClasses.ariaCurrent === 'page' ||
      vocabClasses.ariaCurrent === 'true' ||
      vocabClasses.classList.some((c) => /active|selected|current/i.test(c));

    expect(isHighlighted).toBeTruthy();
  });

  // REQ-002 AC4: Sidebar collapses to icons only below 768px
  test('sidebar shows icons only at viewport width below 768px', async ({ page }) => {
    await page.setViewportSize({ width: 767, height: 800 });
    await page.waitForTimeout(300);

    const sidebar = page.locator('nav, [role="navigation"], aside').first();

    // Labels should not be visible (either hidden or sidebar collapsed)
    // Check that text labels are not displayed
    const vocabLabel = sidebar.getByText('Vocabulary', { exact: false }).first();

    // Either the label is hidden or the sidebar is narrow enough that labels aren't shown
    const isLabelHidden = await vocabLabel.isHidden().catch(() => true);
    const sidebarWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);

    // Sidebar should be narrow (icons only) or labels should be hidden
    expect(isLabelHidden || sidebarWidth < 200).toBeTruthy();
  });

  // REQ-002 AC5: Settings icon at bottom of sidebar
  test('settings icon is positioned at the bottom of the sidebar', async ({ page }) => {
    const sidebar = page.locator('nav, [role="navigation"], aside').first();

    // Find settings element
    const settingsEl = sidebar.locator('[aria-label*="settings" i], [title*="settings" i]').or(
      sidebar.getByText('Settings', { exact: false })
    ).first();

    await expect(settingsEl).toBeVisible();

    // Find the first mode entry (Vocabulary)
    const firstMode = sidebar.getByText('Vocabulary', { exact: false }).first();

    // Settings should be below the mode entries
    const settingsBox = await settingsEl.boundingBox();
    const modeBox = await firstMode.boundingBox();

    expect(settingsBox).toBeTruthy();
    expect(modeBox).toBeTruthy();
    if (settingsBox && modeBox) {
      expect(settingsBox.y).toBeGreaterThan(modeBox.y);
    }
  });
});
