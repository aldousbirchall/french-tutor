import Anthropic from '@anthropic-ai/sdk';
import { getApiKey, checkProxyAvailable } from '../utils/apiKey';
import type { AppError } from './types';

const MODEL = 'claude-sonnet-4-20250514';

export interface SendMessageParams {
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: AppError) => void;
}

function mapSdkError(err: unknown): AppError {
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
  private _proxyAvailable: boolean | null = null;

  async checkAvailability(): Promise<boolean> {
    this._proxyAvailable = await checkProxyAvailable();
    if (this._proxyAvailable) return true;
    return !!getApiKey();
  }

  get available(): boolean {
    if (this._proxyAvailable) return true;
    return !!getApiKey();
  }

  get proxyAvailable(): boolean {
    return !!this._proxyAvailable;
  }

  sendMessage(params: SendMessageParams): AbortController {
    if (this._proxyAvailable) {
      return this._sendViaProxy(params);
    }
    return this._sendDirectly(params);
  }

  private _sendViaProxy(params: SendMessageParams): AbortController {
    const { systemPrompt, messages, onToken, onComplete, onError } = params;
    const abortController = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 1024,
            system: systemPrompt,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Proxy error' }));
          onError({ code: 'SERVER_ERROR', message: data.error || `Proxy returned ${res.status}` });
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          onError({ code: 'SERVER_ERROR', message: 'No response stream' });
          return;
        }

        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = JSON.parse(line.slice(6));
            if (payload.type === 'text') {
              fullText += payload.text;
              onToken(payload.text);
            } else if (payload.type === 'error') {
              onError({ code: 'SERVER_ERROR', message: payload.error });
              return;
            }
          }
        }

        onComplete(fullText);
      } catch (err) {
        if (abortController.signal.aborted) return;
        onError({ code: 'NETWORK_ERROR', message: 'Lost connection to proxy server.' });
      }
    })();

    return abortController;
  }

  private _sendDirectly(params: SendMessageParams): AbortController {
    const { systemPrompt, messages, onToken, onComplete, onError } = params;
    const abortController = new AbortController();

    const apiKey = getApiKey();
    if (!apiKey) {
      onError({ code: 'NO_API_KEY', message: 'Claude AI is not available. Conversation and exam features are disabled.' });
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
        onError(mapSdkError(err));
      }
    })();

    return abortController;
  }
}
