import Anthropic from '@anthropic-ai/sdk';
import { getApiKey } from '../utils/apiKey';
import type { AppError } from './types';

const MODEL = 'claude-sonnet-4-20250514';

export interface SendMessageParams {
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: AppError) => void;
}

function mapError(err: unknown): AppError {
  if (err instanceof Anthropic.APIError) {
    if (err.status === 401) {
      return { code: 'AUTH_ERROR', message: 'Invalid API key. Please check your key in Settings.' };
    }
    if (err.status === 429) {
      return { code: 'RATE_LIMIT', message: 'Rate limit exceeded. Please wait a moment and try again.' };
    }
    if (err.status && err.status >= 500) {
      return { code: 'SERVER_ERROR', message: 'The API server is temporarily unavailable. Please try again later.' };
    }
  }
  if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('network'))) {
    return { code: 'NETWORK_ERROR', message: 'Network error. Please check your internet connection.' };
  }
  return { code: 'SERVER_ERROR', message: 'An unexpected error occurred. Please try again.' };
}

export class ClaudeService {
  sendMessage(params: SendMessageParams): AbortController {
    const { systemPrompt, messages, onToken, onComplete, onError } = params;
    const abortController = new AbortController();

    const apiKey = getApiKey();
    if (!apiKey) {
      onError({ code: 'NO_API_KEY', message: 'No API key configured. Please add your key in Settings.' });
      return abortController;
    }

    const client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    let fullText = '';

    (async () => {
      try {
        const stream = client.messages.stream({
          model: MODEL,
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }, { signal: abortController.signal });

        stream.on('text', (text) => {
          fullText += text;
          onToken(text);
        });

        await stream.finalMessage();
        onComplete(fullText);
      } catch (err) {
        if (abortController.signal.aborted) return;
        onError(mapError(err));
      }
    })();

    return abortController;
  }
}
