/**
 * Structural tests verifying the project is set up correctly.
 * Black-box: checks file existence and structure, not imports.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '../../../src');

describe('Project Structure', () => {
  it('src directory exists', () => {
    expect(fs.existsSync(SRC_DIR)).toBe(true);
  });

  it('package.json exists with required dependencies', () => {
    const pkgPath = path.join(SRC_DIR, 'package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    // React and Vite
    expect(allDeps).toHaveProperty('react');
    expect(allDeps).toHaveProperty('vite');

    // FSRS library
    expect(allDeps).toHaveProperty('ts-fsrs');

    // Anthropic SDK
    expect(allDeps).toHaveProperty('@anthropic-ai/sdk');
  });

  it('vite.config exists', () => {
    const candidates = [
      path.join(SRC_DIR, 'vite.config.ts'),
      path.join(SRC_DIR, 'vite.config.js'),
      path.join(SRC_DIR, 'vite.config.mjs'),
    ];
    const exists = candidates.some((p) => fs.existsSync(p));
    expect(exists).toBe(true);
  });

  it('tsconfig.json exists', () => {
    const candidates = [
      path.join(SRC_DIR, 'tsconfig.json'),
      path.join(SRC_DIR, 'tsconfig.app.json'),
    ];
    const exists = candidates.some((p) => fs.existsSync(p));
    expect(exists).toBe(true);
  });

  it('index.html exists', () => {
    const indexPath = path.join(SRC_DIR, 'index.html');
    expect(fs.existsSync(indexPath)).toBe(true);
  });

  it('index.html references a TypeScript/JavaScript entry point', () => {
    const indexPath = path.join(SRC_DIR, 'index.html');
    if (!fs.existsSync(indexPath)) return;

    const html = fs.readFileSync(indexPath, 'utf-8');
    // Should have a script tag pointing to the app entry
    expect(html).toMatch(/<script[^>]*src=["'][^"']*\.(ts|tsx|js|jsx)["']/);
  });
});

describe('React Application Structure', () => {
  it('has a main App component file', () => {
    const candidates = [
      path.join(SRC_DIR, 'src', 'App.tsx'),
      path.join(SRC_DIR, 'src', 'App.jsx'),
      path.join(SRC_DIR, 'src', 'app.tsx'),
      path.join(SRC_DIR, 'src', 'app', 'App.tsx'),
      path.join(SRC_DIR, 'App.tsx'),
    ];
    const exists = candidates.some((p) => fs.existsSync(p));
    expect(exists).toBe(true);
  });

  it('has a main entry point (main.tsx or index.tsx)', () => {
    const candidates = [
      path.join(SRC_DIR, 'src', 'main.tsx'),
      path.join(SRC_DIR, 'src', 'main.jsx'),
      path.join(SRC_DIR, 'src', 'index.tsx'),
      path.join(SRC_DIR, 'src', 'index.jsx'),
      path.join(SRC_DIR, 'main.tsx'),
    ];
    const exists = candidates.some((p) => fs.existsSync(p));
    expect(exists).toBe(true);
  });
});

describe('Dependencies: ts-fsrs', () => {
  it('ts-fsrs is listed as a dependency', () => {
    const pkgPath = path.join(SRC_DIR, 'package.json');
    if (!fs.existsSync(pkgPath)) return;

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(allDeps).toHaveProperty('ts-fsrs');
  });
});

describe('Dependencies: @anthropic-ai/sdk', () => {
  it('@anthropic-ai/sdk is listed as a dependency', () => {
    const pkgPath = path.join(SRC_DIR, 'package.json');
    if (!fs.existsSync(pkgPath)) return;

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(allDeps).toHaveProperty('@anthropic-ai/sdk');
  });
});

describe('IndexedDB Database Name', () => {
  it('source code references the database name "french-tutor-db"', () => {
    // Search for the database name in source files
    function searchFiles(dir: string, pattern: RegExp): boolean {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            const content = fs.readFileSync(full, 'utf-8');
            if (pattern.test(content)) return true;
          }
          if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
            if (searchFiles(full, pattern)) return true;
          }
        }
      } catch {
        // ignore
      }
      return false;
    }

    const found = searchFiles(SRC_DIR, /french-tutor-db/);
    expect(found).toBe(true);
  });
});

describe('localStorage Key for API Key', () => {
  it('source code references localStorage for the API key', () => {
    function searchFiles(dir: string, pattern: RegExp): boolean {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            const content = fs.readFileSync(full, 'utf-8');
            if (pattern.test(content)) return true;
          }
          if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
            if (searchFiles(full, pattern)) return true;
          }
        }
      } catch {
        // ignore
      }
      return false;
    }

    const found = searchFiles(SRC_DIR, /localStorage.*(?:api.?key|anthropic)/i);
    expect(found).toBe(true);
  });
});

describe('FSRS Integration', () => {
  it('source code imports or references ts-fsrs', () => {
    function searchFiles(dir: string, pattern: RegExp): boolean {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            const content = fs.readFileSync(full, 'utf-8');
            if (pattern.test(content)) return true;
          }
          if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
            if (searchFiles(full, pattern)) return true;
          }
        }
      } catch {
        // ignore
      }
      return false;
    }

    const found = searchFiles(SRC_DIR, /ts-fsrs|FSRS|fsrs/);
    expect(found).toBe(true);
  });
});

describe('Anthropic SDK Configuration', () => {
  it('source code sets dangerouslyAllowBrowser to true', () => {
    function searchFiles(dir: string, pattern: RegExp): boolean {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            const content = fs.readFileSync(full, 'utf-8');
            if (pattern.test(content)) return true;
          }
          if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
            if (searchFiles(full, pattern)) return true;
          }
        }
      } catch {
        // ignore
      }
      return false;
    }

    const found = searchFiles(SRC_DIR, /dangerouslyAllowBrowser\s*:\s*true/);
    expect(found).toBe(true);
  });

  it('source code references the correct model name', () => {
    function searchFiles(dir: string, pattern: RegExp): boolean {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            const content = fs.readFileSync(full, 'utf-8');
            if (pattern.test(content)) return true;
          }
          if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
            if (searchFiles(full, pattern)) return true;
          }
        }
      } catch {
        // ignore
      }
      return false;
    }

    const found = searchFiles(SRC_DIR, /claude-sonnet-4-20250514/);
    expect(found).toBe(true);
  });
});

describe('Web Speech API Configuration', () => {
  it('source code configures SpeechRecognition with fr-CH locale', () => {
    function searchFiles(dir: string, pattern: RegExp): boolean {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            const content = fs.readFileSync(full, 'utf-8');
            if (pattern.test(content)) return true;
          }
          if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
            if (searchFiles(full, pattern)) return true;
          }
        }
      } catch {
        // ignore
      }
      return false;
    }

    const found = searchFiles(SRC_DIR, /fr-CH/);
    expect(found).toBe(true);
  });

  it('source code sets TTS rate to 0.9', () => {
    function searchFiles(dir: string, pattern: RegExp): boolean {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            const content = fs.readFileSync(full, 'utf-8');
            if (pattern.test(content)) return true;
          }
          if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
            if (searchFiles(full, pattern)) return true;
          }
        }
      } catch {
        // ignore
      }
      return false;
    }

    const found = searchFiles(SRC_DIR, /rate\s*=\s*0\.9|\.rate\s*=\s*0\.9/);
    expect(found).toBe(true);
  });
});

describe('Conversation System Prompt', () => {
  it('source code contains the required conversation system prompt text', () => {
    function searchFiles(dir: string, pattern: RegExp): boolean {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            const content = fs.readFileSync(full, 'utf-8');
            if (pattern.test(content)) return true;
          }
          if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
            if (searchFiles(full, pattern)) return true;
          }
        }
      } catch {
        // ignore
      }
      return false;
    }

    // Check for key phrases from the required system prompt
    const found = searchFiles(SRC_DIR, /French conversation partner/i);
    expect(found).toBe(true);
  });
});

describe('New Card Daily Limit', () => {
  it('source code references the daily new card limit of 25', () => {
    function searchFiles(dir: string, pattern: RegExp): boolean {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            const content = fs.readFileSync(full, 'utf-8');
            if (pattern.test(content)) return true;
          }
          if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
            if (searchFiles(full, pattern)) return true;
          }
        }
      } catch {
        // ignore
      }
      return false;
    }

    // Look for 25 as a constant near "new" or "daily" or "limit" or "max"
    const found = searchFiles(SRC_DIR, /(?:new|daily|limit|max|NEW|DAILY|LIMIT|MAX).*25|25.*(?:new|daily|limit|max)/i);
    expect(found).toBe(true);
  });
});
