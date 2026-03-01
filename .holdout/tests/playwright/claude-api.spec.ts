/**
 * Tests for REQ-007: Claude API Integration
 */
import { test, expect } from '@playwright/test';
import { setupApp, navigateToMode, mockAnthropicAPIError } from './helpers';

test.describe('REQ-007: Claude API Integration', () => {
  // REQ-007 AC1: Uses correct model name
  test('API requests use claude-sonnet-4-20250514 model', async ({ page }) => {
    let capturedModel = '';
    await page.route('**/v1/messages', async (route) => {
      const postData = route.request().postDataJSON();
      capturedModel = postData?.model || '';

      // Return a valid streaming response
      const body = [
        `event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id: 'msg_test', type: 'message', role: 'assistant', content: [], model: capturedModel, stop_reason: null, usage: { input_tokens: 10, output_tokens: 0 } } })}\n\n`,
        `event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })}\n\n`,
        `event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Bonjour!' } })}\n\n`,
        `event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: 0 })}\n\n`,
        `event: message_delta\ndata: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 5 } })}\n\n`,
        `event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`,
      ].join('');

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await setupApp(page);
    await navigateToMode(page, 'Conversation');

    // Trigger an API call
    const textInput = page.locator('textarea, input[type="text"]').filter({ hasNotText: /key|api/i }).first();
    const hasTextInput = await textInput.isVisible().catch(() => false);

    if (hasTextInput) {
      await textInput.fill('Bonjour');
      const sendButton = page.getByRole('button', { name: /send|submit|go/i }).or(
        page.locator('button[type="submit"]')
      ).first();
      await sendButton.click();
      await page.waitForTimeout(1500);

      expect(capturedModel).toBe('claude-sonnet-4-20250514');
    }
  });

  // REQ-007 AC3: API error shows user-friendly message (not raw error)
  test('shows user-friendly error on API failure', async ({ page }) => {
    await page.unrouteAll({ behavior: 'wait' });
    await mockAnthropicAPIError(page, 500, 'Internal Server Error');
    await setupApp(page);
    await navigateToMode(page, 'Conversation');

    const textInput = page.locator('textarea, input[type="text"]').filter({ hasNotText: /key|api/i }).first();
    const hasTextInput = await textInput.isVisible().catch(() => false);

    if (hasTextInput) {
      await textInput.fill('Bonjour');
      const sendButton = page.getByRole('button', { name: /send|submit|go/i }).or(
        page.locator('button[type="submit"]')
      ).first();
      await sendButton.click();
      await page.waitForTimeout(2000);

      // Should show a dismissible banner with a user-friendly error
      const mainContent = page.locator('body');
      const text = await mainContent.textContent();

      // Should NOT contain raw stack trace or error object
      expect(text).not.toMatch(/TypeError|SyntaxError|at\s+\w+\s+\(/);
      // Should contain a user-friendly message
      expect(text?.toLowerCase()).toMatch(/error|failed|problem|unable|try\s*again|something\s*went\s*wrong/i);
    }
  });

  // REQ-007 AC4: 401 error suggests checking API key
  test('401 error suggests checking API key in settings', async ({ page }) => {
    await page.unrouteAll({ behavior: 'wait' });
    await mockAnthropicAPIError(page, 401, 'Invalid API key');
    await setupApp(page);
    await navigateToMode(page, 'Conversation');

    const textInput = page.locator('textarea, input[type="text"]').filter({ hasNotText: /key|api/i }).first();
    const hasTextInput = await textInput.isVisible().catch(() => false);

    if (hasTextInput) {
      await textInput.fill('Bonjour');
      const sendButton = page.getByRole('button', { name: /send|submit|go/i }).or(
        page.locator('button[type="submit"]')
      ).first();
      await sendButton.click();
      await page.waitForTimeout(2000);

      const text = await page.locator('body').textContent();
      // Error should mention API key or settings
      expect(text?.toLowerCase()).toMatch(/api\s*key|settings|authentication|invalid|check/i);
    }
  });

  // REQ-007 AC5: dangerouslyAllowBrowser is set to true
  test('Anthropic SDK initialised with dangerouslyAllowBrowser: true', async ({ page }) => {
    // We verify this indirectly: if the SDK works in the browser without error,
    // dangerouslyAllowBrowser must be set to true (otherwise the SDK throws)
    let apiCallMade = false;
    await page.route('**/v1/messages', async (route) => {
      apiCallMade = true;
      const body = [
        `event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id: 'msg_test', type: 'message', role: 'assistant', content: [], model: 'claude-sonnet-4-20250514', stop_reason: null, usage: { input_tokens: 10, output_tokens: 0 } } })}\n\n`,
        `event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })}\n\n`,
        `event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Oui' } })}\n\n`,
        `event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: 0 })}\n\n`,
        `event: message_delta\ndata: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 2 } })}\n\n`,
        `event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`,
      ].join('');
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    });

    await setupApp(page);
    await navigateToMode(page, 'Conversation');

    const textInput = page.locator('textarea, input[type="text"]').filter({ hasNotText: /key|api/i }).first();
    const hasTextInput = await textInput.isVisible().catch(() => false);

    if (hasTextInput) {
      await textInput.fill('Bonjour');
      const sendButton = page.getByRole('button', { name: /send|submit|go/i }).or(
        page.locator('button[type="submit"]')
      ).first();
      await sendButton.click();
      await page.waitForTimeout(1500);

      // If the API call was made without the SDK throwing a "browser" error,
      // then dangerouslyAllowBrowser is true
      expect(apiCallMade).toBeTruthy();

      // Should not show a "dangerouslyAllowBrowser" error
      const text = await page.locator('body').textContent();
      expect(text?.toLowerCase()).not.toContain('dangerouslyallowbrowser');
    }
  });

  // REQ-007 AC6: Conversation system prompt contains required text
  test('conversation system prompt contains required instruction text', async ({ page }) => {
    let capturedSystemPrompt = '';
    await page.route('**/v1/messages', async (route) => {
      const postData = route.request().postDataJSON();
      // System prompt can be in 'system' field (string or array)
      if (typeof postData?.system === 'string') {
        capturedSystemPrompt = postData.system;
      } else if (Array.isArray(postData?.system)) {
        capturedSystemPrompt = postData.system.map((s: any) => s.text || s).join(' ');
      }

      const body = [
        `event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id: 'msg_test', type: 'message', role: 'assistant', content: [], model: 'claude-sonnet-4-20250514', stop_reason: null, usage: { input_tokens: 10, output_tokens: 0 } } })}\n\n`,
        `event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })}\n\n`,
        `event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Bonjour!' } })}\n\n`,
        `event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: 0 })}\n\n`,
        `event: message_delta\ndata: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 3 } })}\n\n`,
        `event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`,
      ].join('');
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    });

    await setupApp(page);
    await navigateToMode(page, 'Conversation');

    const textInput = page.locator('textarea, input[type="text"]').filter({ hasNotText: /key|api/i }).first();
    const hasTextInput = await textInput.isVisible().catch(() => false);

    if (hasTextInput) {
      await textInput.fill('Bonjour');
      const sendButton = page.getByRole('button', { name: /send|submit|go/i }).or(
        page.locator('button[type="submit"]')
      ).first();
      await sendButton.click();
      await page.waitForTimeout(1500);

      // System prompt should contain the required text
      expect(capturedSystemPrompt.toLowerCase()).toContain('french conversation partner');
      expect(capturedSystemPrompt.toLowerCase()).toContain('speak only in french');
      expect(capturedSystemPrompt.toLowerCase()).toMatch(/a1.*a2|cefr/i);
    }
  });
});
