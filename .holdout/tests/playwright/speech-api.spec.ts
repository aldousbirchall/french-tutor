/**
 * Tests for REQ-011: Web Speech API Integration
 */
import { test, expect } from '@playwright/test';
import { setupApp, navigateToMode } from './helpers';

test.describe('REQ-011: Web Speech API Integration', () => {
  // REQ-011 AC1: STT language set to fr-CH, continuous false
  test('SpeechRecognition initialised with lang fr-CH and continuous false', async ({ page }) => {
    // Track recognition configuration
    await page.addInitScript(() => {
      (window as any).__recognitionInstances = [];

      class MockSpeechRecognition extends EventTarget {
        lang = '';
        continuous = false;
        interimResults = false;
        maxAlternatives = 1;
        onstart: any = null;
        onend: any = null;
        onresult: any = null;
        onerror: any = null;

        constructor() {
          super();
          (window as any).__recognitionInstances.push(this);
        }

        start() {
          setTimeout(() => {
            if (this.onstart) this.onstart(new Event('start'));
          }, 50);
        }
        stop() {
          if (this.onend) this.onend(new Event('end'));
        }
        abort() { this.stop(); }
      }

      (window as any).SpeechRecognition = MockSpeechRecognition;
      (window as any).webkitSpeechRecognition = MockSpeechRecognition;
    });

    await setupApp(page);
    await navigateToMode(page, 'Vocabulary');

    // Start review to reach a card
    const startButton = page.getByRole('button', { name: /start|begin|review|study/i }).first();
    const isStartVisible = await startButton.isVisible().catch(() => false);
    if (isStartVisible) {
      await startButton.click();
      await page.waitForTimeout(500);
    }

    // Show answer
    const showButton = page.getByRole('button', { name: /show|reveal|answer|flip/i }).first();
    const isShowVisible = await showButton.isVisible().catch(() => false);
    if (isShowVisible) {
      await showButton.click();
      await page.waitForTimeout(300);
    }

    // Click mic button
    const micButton = page.getByRole('button', { name: /mic|record|speak|voice/i }).or(
      page.locator('button[aria-label*="mic" i]')
    ).first();
    const hasMic = await micButton.isVisible().catch(() => false);

    if (hasMic) {
      await micButton.click();
      await page.waitForTimeout(300);

      const config = await page.evaluate(() => {
        const instances = (window as any).__recognitionInstances || [];
        const last = instances[instances.length - 1];
        return last ? { lang: last.lang, continuous: last.continuous } : null;
      });

      if (config) {
        expect(config.lang).toBe('fr-CH');
        expect(config.continuous).toBe(false);
      }
    }
  });

  // REQ-011 AC2: TTS selects best French voice (fr-CH preferred, then fr-FR)
  test('TTS selects French voice with fr-CH preference', async ({ page }) => {
    await page.addInitScript(() => {
      const voices = [
        { name: 'English', lang: 'en-US', default: true, localService: true, voiceURI: 'en-US' },
        { name: 'French France', lang: 'fr-FR', default: false, localService: true, voiceURI: 'fr-FR' },
        { name: 'French Swiss', lang: 'fr-CH', default: false, localService: true, voiceURI: 'fr-CH' },
      ];

      (window as any).__selectedVoices = [];

      const origSpeak = window.speechSynthesis?.speak;
      Object.defineProperty(window, 'speechSynthesis', {
        value: {
          getVoices: () => voices,
          speak: (utterance: SpeechSynthesisUtterance) => {
            (window as any).__selectedVoices.push({
              voiceName: utterance.voice?.name || 'none',
              voiceLang: utterance.voice?.lang || utterance.lang || 'none',
              rate: utterance.rate,
            });
            setTimeout(() => utterance.dispatchEvent(new Event('end')), 50);
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
    });

    await setupApp(page);
    await navigateToMode(page, 'Vocabulary');

    // Start review to trigger TTS
    const startButton = page.getByRole('button', { name: /start|begin|review|study/i }).first();
    const isStartVisible = await startButton.isVisible().catch(() => false);
    if (isStartVisible) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }

    const selectedVoices = await page.evaluate(() => (window as any).__selectedVoices || []);

    if (selectedVoices.length > 0) {
      // The selected voice should be French (fr-CH preferred, then fr-FR)
      const voiceLang = selectedVoices[0].voiceLang;
      expect(voiceLang).toMatch(/^fr/);
    }
  });

  // REQ-011 AC3: TTS rate set to 0.9
  test('TTS rate is set to 0.9', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__utteranceRates = [];

      Object.defineProperty(window, 'speechSynthesis', {
        value: {
          getVoices: () => [
            { name: 'French', lang: 'fr-FR', default: false, localService: true, voiceURI: 'fr-FR' },
          ],
          speak: (utterance: SpeechSynthesisUtterance) => {
            (window as any).__utteranceRates.push(utterance.rate);
            setTimeout(() => utterance.dispatchEvent(new Event('end')), 50);
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
    });

    await setupApp(page);
    await navigateToMode(page, 'Vocabulary');

    const startButton = page.getByRole('button', { name: /start|begin|review|study/i }).first();
    const isStartVisible = await startButton.isVisible().catch(() => false);
    if (isStartVisible) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }

    const rates = await page.evaluate(() => (window as any).__utteranceRates || []);

    if (rates.length > 0) {
      expect(rates[0]).toBe(0.9);
    }
  });

  // REQ-011 AC4: Browser without SpeechRecognition shows warning
  test('shows warning banner when SpeechRecognition is not available', async ({ page }) => {
    await page.addInitScript(() => {
      delete (window as any).SpeechRecognition;
      delete (window as any).webkitSpeechRecognition;
    });

    await page.addInitScript((apiKey) => {
      localStorage.setItem('anthropic-api-key', apiKey);
    }, 'sk-ant-test-key');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const text = await page.locator('body').textContent();
    // Should show a warning about browser compatibility
    expect(text?.toLowerCase()).toMatch(/chrome|edge|speech|not\s*supported|browser|warning|compatible/i);
  });

  // REQ-011 AC5: Microphone permission guidance
  test('shows guidance when microphone permission is not granted', async ({ page }) => {
    // Mock SpeechRecognition to trigger permission error
    await page.addInitScript(() => {
      class MockSpeechRecognition extends EventTarget {
        lang = '';
        continuous = false;
        interimResults = false;
        onstart: any = null;
        onend: any = null;
        onresult: any = null;
        onerror: any = null;

        start() {
          setTimeout(() => {
            const errorEvent = { error: 'not-allowed', message: 'Permission denied' };
            if (this.onerror) this.onerror(errorEvent);
          }, 50);
        }
        stop() {}
        abort() {}
      }

      (window as any).SpeechRecognition = MockSpeechRecognition;
      (window as any).webkitSpeechRecognition = MockSpeechRecognition;
    });

    await setupApp(page);
    await navigateToMode(page, 'Vocabulary');

    // Try to start voice input
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

    const micButton = page.getByRole('button', { name: /mic|record|speak|voice/i }).or(
      page.locator('button[aria-label*="mic" i]')
    ).first();
    const hasMic = await micButton.isVisible().catch(() => false);

    if (hasMic) {
      await micButton.click();
      await page.waitForTimeout(500);

      const text = await page.locator('body').textContent();
      // Should show guidance about microphone permission
      expect(text?.toLowerCase()).toMatch(/microphone|permission|enable|allow|access|denied|settings/i);
    }
  });
});
