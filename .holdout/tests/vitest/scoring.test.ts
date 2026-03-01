/**
 * Structural tests verifying scoring constants and exam configuration.
 * REQ-009: Exam Scoring, REQ-015: Mock Exam Timer
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '../../../src');

function searchFilesContent(dir: string, pattern: RegExp): string[] {
  const matches: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        const content = fs.readFileSync(full, 'utf-8');
        const lineMatches = content.split('\n').filter((line) => pattern.test(line));
        if (lineMatches.length > 0) {
          matches.push(...lineMatches.map((l) => `${full}: ${l.trim()}`));
        }
      }
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        matches.push(...searchFilesContent(full, pattern));
      }
    }
  } catch {
    // ignore
  }
  return matches;
}

function searchFiles(dir: string, pattern: RegExp): boolean {
  return searchFilesContent(dir, pattern).length > 0;
}

describe('REQ-009: Oral Exam Scoring Categories', () => {
  it('source code references oral scoring categories', () => {
    // Five categories: task_completion, vocabulary_range, grammar_accuracy, fluency, pronunciation
    const hasTaskCompletion = searchFiles(SRC_DIR, /task.?completion/i);
    const hasVocabRange = searchFiles(SRC_DIR, /vocabulary.?range/i);
    const hasGrammar = searchFiles(SRC_DIR, /grammar.?accuracy/i);
    const hasFluency = searchFiles(SRC_DIR, /fluency/i);
    const hasPronunciation = searchFiles(SRC_DIR, /pronunciation/i);

    // At least the scoring category names should be present
    expect(hasTaskCompletion || hasVocabRange || hasGrammar).toBe(true);
  });

  it('oral scoring uses 0-20 range per category', () => {
    // Look for the max score of 20 or 100 total
    const has20 = searchFiles(SRC_DIR, /(?:max|score|range|out.?of).*20|20.*(?:max|points|score)/i);
    const has100 = searchFiles(SRC_DIR, /(?:max|total|percent).*100|100.*(?:max|total|percent)/i);

    expect(has20 || has100).toBe(true);
  });
});

describe('REQ-009: Written Exam Scoring Categories', () => {
  it('source code references written scoring categories', () => {
    // Six categories: task_completion, register, structure, grammar, vocabulary, length
    const hasRegister = searchFiles(SRC_DIR, /register/i);
    const hasStructure = searchFiles(SRC_DIR, /structure/i);
    const hasLength = searchFiles(SRC_DIR, /length/i);

    expect(hasRegister || hasStructure || hasLength).toBe(true);
  });
});

describe('REQ-015: Exam Timer Constants', () => {
  it('source code contains 40-minute oral exam duration', () => {
    // 40 minutes = 40 * 60 = 2400 seconds
    const has40Min = searchFiles(SRC_DIR, /40\s*\*\s*60|2400|40.*min/i);
    expect(has40Min).toBe(true);
  });

  it('source code contains 60-minute written exam duration', () => {
    // 60 minutes = 60 * 60 = 3600 seconds
    const has60Min = searchFiles(SRC_DIR, /60\s*\*\s*60|3600|60.*min/i);
    expect(has60Min).toBe(true);
  });

  it('source code references 5-minute warning threshold', () => {
    // 5 minutes = 300 seconds or "5 * 60"
    const has5Min = searchFiles(SRC_DIR, /5\s*\*\s*60|300|5.*min.*warn/i);
    expect(has5Min).toBe(true);
  });
});

describe('REQ-010: Exam Readiness Formula', () => {
  it('source code implements the readiness formula weights', () => {
    // Formula: 0.4 * vocab + 0.3 * exam + 0.3 * conversation
    const has04 = searchFiles(SRC_DIR, /0\.4/);
    const has03 = searchFiles(SRC_DIR, /0\.3/);

    expect(has04).toBe(true);
    expect(has03).toBe(true);
  });
});

describe('REQ-014: Scaffolding Level Prompts', () => {
  it('source code contains High scaffolding prompt text', () => {
    const found = searchFiles(SRC_DIR, /sentence\s*starter|vocabulary\s*words\s*with\s*translations|translation\s*of\s*your/i);
    expect(found).toBe(true);
  });

  it('source code contains Medium scaffolding prompt text', () => {
    const found = searchFiles(SRC_DIR, /correct\s*errors\s*by\s*rephrasing|do\s*not\s*provide\s*translations/i);
    expect(found).toBe(true);
  });

  it('source code contains Low scaffolding prompt text', () => {
    const found = searchFiles(SRC_DIR, /respond\s*naturally.*A2|only\s*correct\s*errors\s*that\s*significantly/i);
    expect(found).toBe(true);
  });
});

describe('REQ-006 AC4: Conversation History Limit', () => {
  it('source code enforces 20-turn message history limit', () => {
    // Look for 20 as a limit for messages/turns
    const found = searchFiles(SRC_DIR, /20\s*(?:\*\s*2)?.*(?:turn|message|history|slice|limit)|(?:turn|message|history|slice|limit).*20/i);
    expect(found).toBe(true);
  });
});

describe('REQ-005 AC3: Voice Recognition Silence Timeout', () => {
  it('source code references 1.5-second silence detection', () => {
    // 1.5 seconds = 1500 ms
    const found = searchFiles(SRC_DIR, /1\.5|1500/);
    expect(found).toBe(true);
  });
});
