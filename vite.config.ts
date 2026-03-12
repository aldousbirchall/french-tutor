import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import type { IncomingMessage, ServerResponse } from 'http';

function getKeychainToken(): string | null {
  try {
    const result = execSync(
      "security find-generic-password -s 'Claude Code-credentials' -w",
      { encoding: 'utf8', timeout: 5000 },
    );
    const creds = JSON.parse(result.trim());
    return creds?.claudeAiOauth?.accessToken ?? null;
  } catch {
    return null;
  }
}

function getApiKey(): string | null {
  return process.env.ANTHROPIC_API_KEY ?? getKeychainToken();
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function claudeProxy(): Plugin {
  return {
    name: 'claude-proxy',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.url === '/api/health' && req.method === 'GET') {
          const key = getApiKey();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ available: !!key }));
          return;
        }

        if (req.url === '/api/messages' && req.method === 'POST') {
          const key = getApiKey();
          if (!key) {
            res.statusCode = 503;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'No API key available' }));
            return;
          }

          try {
            const body = JSON.parse(await readBody(req));
            const { default: Anthropic } = await import('@anthropic-ai/sdk');
            const client = new Anthropic({ apiKey: key });

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const stream = client.messages.stream({
              model: body.model || 'claude-sonnet-4-20250514',
              max_tokens: body.max_tokens || 1024,
              system: body.system,
              messages: body.messages,
            });

            stream.on('text', (text) => {
              res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
            });

            await stream.finalMessage();
            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
            res.end();
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: msg }));
            } else {
              res.write(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`);
              res.end();
            }
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [claudeProxy(), react()],
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
});
