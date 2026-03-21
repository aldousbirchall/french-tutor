import { defineConfig, type Plugin, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

// Load .env into process.env for server-side plugin use
const env = loadEnv('development', process.cwd(), '');
Object.assign(process.env, env);

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
  return process.env.ANTHROPIC_API_KEY
    ?? process.env.CLAUDE_CODE_OAUTH_TOKEN
    ?? getKeychainToken();
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const DB_PATH = resolve(__dirname, 'data/db.json');

interface DbData {
  cards: Record<string, unknown>[];
  conversations: Record<string, unknown>[];
  examResults: Record<string, unknown>[];
  scheduleProgress: Record<string, unknown>[];
}

function loadDb(): DbData {
  if (existsSync(DB_PATH)) {
    return JSON.parse(readFileSync(DB_PATH, 'utf8'));
  }
  return { cards: [], conversations: [], examResults: [], scheduleProgress: [] };
}

function saveDb(data: DbData): void {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function filePersistence(): Plugin {
  return {
    name: 'file-persistence',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (!req.url?.startsWith('/api/db')) return next();

        res.setHeader('Content-Type', 'application/json');

        if (req.url === '/api/db' && req.method === 'GET') {
          res.end(JSON.stringify(loadDb()));
          return;
        }

        if (req.url === '/api/db' && req.method === 'PUT') {
          const body = JSON.parse(await readBody(req));
          saveDb(body);
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        if (req.url === '/api/db/cards' && req.method === 'PUT') {
          const card = JSON.parse(await readBody(req));
          const db = loadDb();
          const idx = db.cards.findIndex((c: Record<string, unknown>) => c.wordId === card.wordId);
          if (idx >= 0) db.cards[idx] = card; else db.cards.push(card);
          saveDb(db);
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        if (req.url === '/api/db/conversations' && req.method === 'POST') {
          const session = JSON.parse(await readBody(req));
          const db = loadDb();
          session.id = db.conversations.length + 1;
          db.conversations.push(session);
          saveDb(db);
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        if (req.url === '/api/db/examResults' && req.method === 'POST') {
          const result = JSON.parse(await readBody(req));
          const db = loadDb();
          result.id = db.examResults.length + 1;
          db.examResults.push(result);
          saveDb(db);
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        if (req.url === '/api/db/scheduleProgress' && req.method === 'PUT') {
          const prog = JSON.parse(await readBody(req));
          const db = loadDb();
          const idx = db.scheduleProgress.findIndex(
            (p: Record<string, unknown>) => p.day === prog.day && p.activityIndex === prog.activityIndex
          );
          if (idx >= 0) db.scheduleProgress[idx] = prog; else db.scheduleProgress.push(prog);
          saveDb(db);
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        next();
      });
    },
  };
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
  plugins: [filePersistence(), claudeProxy(), react()],
  server: {
    port: 5174,
    strictPort: true,
  },
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
