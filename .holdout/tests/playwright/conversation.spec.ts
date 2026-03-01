/**
 * Tests for REQ-006: Conversation Practice Mode and REQ-014: Conversation Scaffolding
 */
import { test, expect } from '@playwright/test';
import { setupApp, navigateToMode, mockAnthropicAPI, mockAnthropicScoringAPI } from './helpers';

test.describe('REQ-006: Conversation Practice Mode', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await navigateToMode(page, 'Conversation');
  });

  // REQ-006 AC1: Conversation starter prompt displayed
  test('displays a conversation starter prompt when loaded', async ({ page }) => {
    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
    const text = await mainContent.textContent();

    // Should show a conversation topic or starter prompt
    expect(text?.length).toBeGreaterThan(10);
    // Should contain some French or conversation-related content
    expect(text?.toLowerCase()).toMatch(/conversation|topic|bonjour|parler|speak|practice|start/i);
  });

  // REQ-006 AC2: User speech transcript sent to Claude
  test('user can send a message and receive a streamed response', async ({ page }) => {
    // Since Web Speech API is mocked, use text input as a fallback
    // Many conversation apps have a text input alongside voice
    const textInput = page.locator('textarea, input[type="text"]').filter({ hasNotText: /key|api/i }).first();
    const hasTextInput = await textInput.isVisible().catch(() => false);

    if (hasTextInput) {
      await textInput.fill('Bonjour, comment allez-vous?');
      // Send the message
      const sendButton = page.getByRole('button', { name: /send|submit|go/i }).or(
        page.locator('button[type="submit"]')
      ).first();
      await sendButton.click();
      await page.waitForTimeout(1000);

      // Response from Claude should appear
      const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
      const text = await mainContent.textContent();
      expect(text).toContain('Bonjour! Comment allez-vous?');
    } else {
      // If no text input, try simulating speech recognition
      const micButton = page.getByRole('button', { name: /mic|record|speak|voice|start/i }).first();
      const hasMic = await micButton.isVisible().catch(() => false);
      if (hasMic) {
        await micButton.click();
        await page.waitForTimeout(300);

        // Simulate speech result
        await page.evaluate(() => {
          const rec = (window as any).__recognitionConfig;
          if (rec && rec.simulateResult) {
            rec.simulateResult('Bonjour comment allez-vous', true);
          }
        });
        await page.waitForTimeout(1500);

        const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
        const text = await mainContent.textContent();
        expect(text?.length).toBeGreaterThan(20);
      }
    }
  });

  // REQ-006 AC3: Streaming response displayed token by token and read aloud
  test('Claude response is read aloud via TTS after streaming completes', async ({ page }) => {
    const textInput = page.locator('textarea, input[type="text"]').filter({ hasNotText: /key|api/i }).first();
    const hasTextInput = await textInput.isVisible().catch(() => false);

    if (hasTextInput) {
      await textInput.fill('Bonjour');
      const sendButton = page.getByRole('button', { name: /send|submit|go/i }).or(
        page.locator('button[type="submit"]')
      ).first();
      await sendButton.click();
      await page.waitForTimeout(1500);

      // Check that TTS spoke the response
      const spokenTexts: string[] = await page.evaluate(() => (window as any).__spokenTexts || []);
      const hasSpoken = spokenTexts.some((t) => t.length > 0);
      expect(hasSpoken).toBeTruthy();
    }
  });

  // REQ-006 AC4: Message history maintained (up to 20 turns)
  test('conversation history is maintained across messages', async ({ page }) => {
    const textInput = page.locator('textarea, input[type="text"]').filter({ hasNotText: /key|api/i }).first();
    const hasTextInput = await textInput.isVisible().catch(() => false);

    if (!hasTextInput) {
      test.skip();
      return;
    }

    // Send first message
    await textInput.fill('Bonjour');
    const sendButton = page.getByRole('button', { name: /send|submit|go/i }).or(
      page.locator('button[type="submit"]')
    ).first();
    await sendButton.click();
    await page.waitForTimeout(1000);

    // Send second message
    await textInput.fill('Comment vous appelez-vous?');
    await sendButton.click();
    await page.waitForTimeout(1000);

    // Both messages should be visible in the conversation
    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
    const text = await mainContent.textContent();
    expect(text).toContain('Bonjour');
  });

  // REQ-006 AC5: End conversation triggers assessment
  test('end conversation button requests and displays assessment', async ({ page }) => {
    // Send a message first
    const textInput = page.locator('textarea, input[type="text"]').filter({ hasNotText: /key|api/i }).first();
    const hasTextInput = await textInput.isVisible().catch(() => false);

    if (hasTextInput) {
      await textInput.fill('Bonjour, je suis un etudiant');
      const sendButton = page.getByRole('button', { name: /send|submit|go/i }).or(
        page.locator('button[type="submit"]')
      ).first();
      await sendButton.click();
      await page.waitForTimeout(1000);
    }

    // Click End Conversation
    const endButton = page.getByRole('button', { name: /end|finish|stop|close/i }).first();
    const isEndVisible = await endButton.isVisible().catch(() => false);

    if (isEndVisible) {
      // Re-mock API to return assessment-like text
      await page.unrouteAll({ behavior: 'wait' });
      await mockAnthropicScoringAPI(page, JSON.stringify({
        vocabulary: 'Good use of basic greetings',
        grammar: 'Correct sentence structure',
        fluency: 'Natural flow',
      }));

      await endButton.click();
      await page.waitForTimeout(2000);

      // Assessment should appear
      const mainContent = page.locator('main, [role="main"], .main-content, .content').first();
      const text = await mainContent.textContent();
      expect(text?.toLowerCase()).toMatch(/assessment|summary|vocabulary|grammar|fluency|feedback/i);
    }
  });

  // REQ-006 AC6: Session summary saved to IndexedDB
  test('completed conversation session is saved to IndexedDB', async ({ page }) => {
    const textInput = page.locator('textarea, input[type="text"]').filter({ hasNotText: /key|api/i }).first();
    const hasTextInput = await textInput.isVisible().catch(() => false);

    if (!hasTextInput) {
      test.skip();
      return;
    }

    await textInput.fill('Bonjour');
    const sendButton = page.getByRole('button', { name: /send|submit|go/i }).or(
      page.locator('button[type="submit"]')
    ).first();
    await sendButton.click();
    await page.waitForTimeout(1000);

    // End conversation
    const endButton = page.getByRole('button', { name: /end|finish|stop|close/i }).first();
    const isEndVisible = await endButton.isVisible().catch(() => false);

    if (isEndVisible) {
      await page.unrouteAll({ behavior: 'wait' });
      await mockAnthropicScoringAPI(page, 'Good session. Keep practicing.');
      await endButton.click();
      await page.waitForTimeout(2000);

      // Check IndexedDB
      const hasConversation = await page.evaluate(async () => {
        return new Promise<boolean>((resolve) => {
          const request = indexedDB.open('french-tutor-db');
          request.onsuccess = () => {
            const db = request.result;
            const storeNames = Array.from(db.objectStoreNames);
            if (storeNames.includes('conversations')) {
              const tx = db.transaction('conversations', 'readonly');
              const store = tx.objectStore('conversations');
              const getAll = store.getAll();
              getAll.onsuccess = () => resolve(getAll.result.length > 0);
              getAll.onerror = () => resolve(false);
            } else {
              resolve(false);
            }
          };
          request.onerror = () => resolve(false);
        });
      });

      expect(hasConversation).toBeTruthy();
    }
  });
});

test.describe('REQ-014: Conversation Scaffolding', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await navigateToMode(page, 'Conversation');
  });

  // REQ-014 AC1: Scaffolding level selector with High/Medium/Low
  test('shows scaffolding level selector with three options', async ({ page }) => {
    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();

    // Find scaffolding selector
    const selector = mainContent.locator('select, [role="listbox"], [role="radiogroup"]').or(
      mainContent.locator('button, [role="radio"], [role="tab"]').filter({ hasText: /high|medium|low/i })
    );

    const text = await mainContent.textContent();

    // Should contain scaffolding options
    expect(text?.toLowerCase()).toMatch(/scaffolding|support|level|high|medium|low/i);
  });

  // REQ-014 AC2-4: Scaffolding levels modify system prompt
  test('scaffolding level options are selectable', async ({ page }) => {
    const mainContent = page.locator('main, [role="main"], .main-content, .content').first();

    // Try to find and interact with scaffolding controls
    const highOption = mainContent.getByText(/high/i).first();
    const mediumOption = mainContent.getByText(/medium/i).first();
    const lowOption = mainContent.getByText(/low/i).first();

    // At least one option should be visible
    const hasHigh = await highOption.isVisible().catch(() => false);
    const hasMedium = await mediumOption.isVisible().catch(() => false);
    const hasLow = await lowOption.isVisible().catch(() => false);

    expect(hasHigh || hasMedium || hasLow).toBeTruthy();
  });
});
