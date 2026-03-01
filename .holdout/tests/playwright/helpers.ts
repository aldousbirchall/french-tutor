import { Page, Route } from '@playwright/test';

/**
 * Set up a valid API key in localStorage so the app skips the settings page.
 */
export async function setApiKey(page: Page, key = 'sk-ant-test-key-1234567890abcdef'): Promise<void> {
  await page.addInitScript((apiKey) => {
    localStorage.setItem('anthropic-api-key', apiKey);
  }, key);
}

/**
 * Clear the API key from localStorage so the app shows the settings page.
 */
export async function clearApiKey(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.removeItem('anthropic-api-key');
  });
}

/**
 * Clear all IndexedDB data for the app.
 */
export async function clearIndexedDB(page: Page): Promise<void> {
  await page.addInitScript(() => {
    indexedDB.deleteDatabase('french-tutor-db');
  });
}

/**
 * Mock the Anthropic Messages API with a streaming response.
 * Intercepts POST requests to the Anthropic API and returns a streamed SSE response.
 */
export async function mockAnthropicAPI(
  page: Page,
  responseText: string = 'Bonjour! Comment allez-vous?'
): Promise<void> {
  await page.route('**/v1/messages', async (route: Route) => {
    const contentBlockStart = JSON.stringify({
      type: 'content_block_start',
      index: 0,
      content_block: { type: 'text', text: '' },
    });
    const contentBlockDelta = JSON.stringify({
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'text_delta', text: responseText },
    });
    const contentBlockStop = JSON.stringify({
      type: 'content_block_stop',
      index: 0,
    });
    const messageDelta = JSON.stringify({
      type: 'message_delta',
      delta: { stop_reason: 'end_turn' },
      usage: { output_tokens: 10 },
    });
    const messageStop = JSON.stringify({ type: 'message_stop' });

    const body = [
      `event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id: 'msg_test', type: 'message', role: 'assistant', content: [], model: 'claude-sonnet-4-20250514', stop_reason: null, usage: { input_tokens: 10, output_tokens: 0 } } })}\n\n`,
      `event: content_block_start\ndata: ${contentBlockStart}\n\n`,
      `event: content_block_delta\ndata: ${contentBlockDelta}\n\n`,
      `event: content_block_stop\ndata: ${contentBlockStop}\n\n`,
      `event: message_delta\ndata: ${messageDelta}\n\n`,
      `event: message_stop\ndata: ${messageStop}\n\n`,
    ].join('');

    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body,
    });
  });
}

/**
 * Mock the Anthropic API to return an error response.
 */
export async function mockAnthropicAPIError(
  page: Page,
  status: number = 500,
  errorMessage: string = 'Internal Server Error'
): Promise<void> {
  await page.route('**/v1/messages', async (route: Route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({
        type: 'error',
        error: { type: 'api_error', message: errorMessage },
      }),
    });
  });
}

/**
 * Mock the Anthropic API to return a scoring/assessment response (non-streaming).
 */
export async function mockAnthropicScoringAPI(
  page: Page,
  assessmentText: string
): Promise<void> {
  await page.route('**/v1/messages', async (route: Route) => {
    const body = [
      `event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id: 'msg_score', type: 'message', role: 'assistant', content: [], model: 'claude-sonnet-4-20250514', stop_reason: null, usage: { input_tokens: 10, output_tokens: 0 } } })}\n\n`,
      `event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })}\n\n`,
      `event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: assessmentText } })}\n\n`,
      `event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: 0 })}\n\n`,
      `event: message_delta\ndata: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 50 } })}\n\n`,
      `event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`,
    ].join('');

    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body,
    });
  });
}

/**
 * Mock Web Speech API (SpeechRecognition and SpeechSynthesis) in the page context.
 */
export async function mockWebSpeechAPI(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Mock SpeechRecognition
    class MockSpeechRecognition extends EventTarget {
      lang = '';
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      grammars: any = null;

      onstart: ((ev: Event) => void) | null = null;
      onend: ((ev: Event) => void) | null = null;
      onresult: ((ev: any) => void) | null = null;
      onerror: ((ev: any) => void) | null = null;
      onspeechend: ((ev: Event) => void) | null = null;

      start() {
        setTimeout(() => {
          const event = new Event('start');
          this.dispatchEvent(event);
          if (this.onstart) this.onstart(event);
        }, 50);
      }

      stop() {
        const event = new Event('end');
        this.dispatchEvent(event);
        if (this.onend) this.onend(event);
      }

      abort() {
        this.stop();
      }

      // Simulate a speech result from outside
      simulateResult(transcript: string, isFinal: boolean = true) {
        const resultEvent = {
          type: 'result',
          resultIndex: 0,
          results: [
            [{ transcript, confidence: 0.95 }],
          ],
        };
        (resultEvent.results as any)[0].isFinal = isFinal;
        resultEvent.results.length = 1;
        if (this.onresult) this.onresult(resultEvent);

        if (isFinal) {
          setTimeout(() => this.stop(), 100);
        }
      }
    }

    (window as any).SpeechRecognition = MockSpeechRecognition;
    (window as any).webkitSpeechRecognition = MockSpeechRecognition;

    // Mock SpeechSynthesis
    const mockVoices = [
      { name: 'French (Switzerland)', lang: 'fr-CH', default: false, localService: true, voiceURI: 'fr-CH' },
      { name: 'French (France)', lang: 'fr-FR', default: false, localService: true, voiceURI: 'fr-FR' },
      { name: 'English', lang: 'en-US', default: true, localService: true, voiceURI: 'en-US' },
    ];

    const spokenTexts: string[] = [];
    (window as any).__spokenTexts = spokenTexts;
    (window as any).__speechSynthesisUtterances = [] as any[];

    const originalSpeechSynthesis = window.speechSynthesis;
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        ...originalSpeechSynthesis,
        getVoices: () => mockVoices,
        speak: (utterance: SpeechSynthesisUtterance) => {
          spokenTexts.push(utterance.text);
          (window as any).__speechSynthesisUtterances.push({
            text: utterance.text,
            lang: utterance.lang,
            rate: utterance.rate,
            voice: utterance.voice,
          });
          // Fire end event
          setTimeout(() => {
            utterance.dispatchEvent(new Event('end'));
          }, 50);
        },
        cancel: () => {},
        pause: () => {},
        resume: () => {},
        speaking: false,
        paused: false,
        pending: false,
        onvoiceschanged: null,
      },
      writable: true,
    });

    // Trigger voiceschanged after a tick
    setTimeout(() => {
      const event = new Event('voiceschanged');
      window.speechSynthesis.dispatchEvent?.(event);
    }, 100);
  });
}

/**
 * Navigate to the app with all mocks and API key set up.
 */
export async function setupApp(page: Page): Promise<void> {
  await clearIndexedDB(page);
  await setApiKey(page);
  await mockWebSpeechAPI(page);
  await mockAnthropicAPI(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to a specific mode via the sidebar.
 */
export async function navigateToMode(page: Page, mode: 'Vocabulary' | 'Conversation' | 'Exam' | 'Dashboard'): Promise<void> {
  const sidebar = page.locator('nav, [role="navigation"], aside');
  const link = sidebar.getByText(mode, { exact: false }).first();
  await link.click();
  await page.waitForTimeout(300);
}
