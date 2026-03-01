/**
 * Structural tests for bundled curriculum data.
 * Verifies that the build output contains correctly structured data files.
 *
 * These are black-box tests: we check the built output (dist/) or the
 * public data files, NOT the source code.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// The src directory where curriculum data should live
const SRC_DIR = path.resolve(__dirname, '../../../src');
const PUBLIC_DIR = path.join(SRC_DIR, 'public');
const DATA_DIR_CANDIDATES = [
  path.join(SRC_DIR, 'data'),
  path.join(SRC_DIR, 'src', 'data'),
  path.join(PUBLIC_DIR, 'data'),
  path.join(SRC_DIR, 'assets'),
  path.join(SRC_DIR, 'src', 'assets'),
];

function findDataDir(): string | null {
  for (const dir of DATA_DIR_CANDIDATES) {
    if (fs.existsSync(dir)) return dir;
  }
  return null;
}

function findFile(filename: string): string | null {
  const dataDir = findDataDir();
  if (!dataDir) return null;

  // Search recursively
  function search(dir: string): string | null {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isFile() && entry.name === filename) return full;
      if (entry.isDirectory()) {
        const found = search(full);
        if (found) return found;
      }
    }
    return null;
  }

  // Also check src root
  const inRoot = search(SRC_DIR);
  return inRoot;
}

describe('Bundled Data: vocabulary.json', () => {
  it('vocabulary.json file exists', () => {
    const vocabPath = findFile('vocabulary.json');
    expect(vocabPath).not.toBeNull();
  });

  it('vocabulary.json contains an array of word objects', () => {
    const vocabPath = findFile('vocabulary.json');
    if (!vocabPath) return;

    const data = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('each vocabulary word has required fields', () => {
    const vocabPath = findFile('vocabulary.json');
    if (!vocabPath) return;

    const data = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
    const requiredFields = ['id', 'french', 'english', 'example_fr', 'example_en', 'topic', 'level', 'pos'];

    for (const word of data.slice(0, 20)) {
      for (const field of requiredFields) {
        expect(word).toHaveProperty(field);
      }
    }
  });

  it('vocabulary words have valid level values (A1 or A2)', () => {
    const vocabPath = findFile('vocabulary.json');
    if (!vocabPath) return;

    const data = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
    for (const word of data) {
      expect(['A1', 'A2']).toContain(word.level);
    }
  });

  it('vocabulary has at least 5 distinct topics', () => {
    const vocabPath = findFile('vocabulary.json');
    if (!vocabPath) return;

    const data = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
    const topics = new Set(data.map((w: any) => w.topic));
    expect(topics.size).toBeGreaterThanOrEqual(5);
  });

  it('vocabulary word IDs are unique', () => {
    const vocabPath = findFile('vocabulary.json');
    if (!vocabPath) return;

    const data = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
    const ids = data.map((w: any) => w.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('vocabulary words have non-empty French and English fields', () => {
    const vocabPath = findFile('vocabulary.json');
    if (!vocabPath) return;

    const data = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
    for (const word of data) {
      expect(word.french.trim().length).toBeGreaterThan(0);
      expect(word.english.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('Bundled Data: schedule.json', () => {
  it('schedule.json file exists', () => {
    const schedulePath = findFile('schedule.json');
    expect(schedulePath).not.toBeNull();
  });

  it('schedule.json has start_date and exam_date', () => {
    const schedulePath = findFile('schedule.json');
    if (!schedulePath) return;

    const data = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));
    // Schedule might be at top level or nested
    const schedule = data.schedule || data;

    if (Array.isArray(schedule)) {
      // If it's an array of days, check the structure
      expect(schedule.length).toBeGreaterThan(0);
    } else {
      // If it's an object, check for dates
      expect(data).toHaveProperty('start_date');
      expect(data).toHaveProperty('exam_date');
    }
  });

  it('schedule contains study day definitions', () => {
    const schedulePath = findFile('schedule.json');
    if (!schedulePath) return;

    const data = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));
    const days = data.days || data.schedule || (Array.isArray(data) ? data : []);

    expect(days.length).toBeGreaterThan(0);

    // First day should have required fields
    const day = days[0];
    expect(day).toHaveProperty('day');
    expect(day).toHaveProperty('activities');
    expect(Array.isArray(day.activities)).toBe(true);
  });

  it('study day activities have mode and minutes fields', () => {
    const schedulePath = findFile('schedule.json');
    if (!schedulePath) return;

    const data = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));
    const days = data.days || data.schedule || (Array.isArray(data) ? data : []);

    for (const day of days.slice(0, 5)) {
      for (const activity of day.activities) {
        expect(activity).toHaveProperty('mode');
        expect(activity).toHaveProperty('minutes');
        expect(['vocabulary', 'conversation', 'exam', 'dashboard']).toContain(activity.mode);
        expect(typeof activity.minutes).toBe('number');
      }
    }
  });

  it('study days have phase names', () => {
    const schedulePath = findFile('schedule.json');
    if (!schedulePath) return;

    const data = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));
    const days = data.days || data.schedule || (Array.isArray(data) ? data : []);

    for (const day of days) {
      expect(day).toHaveProperty('phase');
      expect(typeof day.phase).toBe('string');
      expect(day.phase.length).toBeGreaterThan(0);
    }
  });

  it('study days have grammar_focus text', () => {
    const schedulePath = findFile('schedule.json');
    if (!schedulePath) return;

    const data = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));
    const days = data.days || data.schedule || (Array.isArray(data) ? data : []);

    for (const day of days) {
      expect(day).toHaveProperty('grammar_focus');
      expect(typeof day.grammar_focus).toBe('string');
    }
  });

  it('schedule skips weekends (no Saturday/Sunday dates)', () => {
    const schedulePath = findFile('schedule.json');
    if (!schedulePath) return;

    const data = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));
    const days = data.days || data.schedule || (Array.isArray(data) ? data : []);

    for (const day of days) {
      if (day.date) {
        const d = new Date(day.date);
        const dayOfWeek = d.getDay();
        expect(dayOfWeek).not.toBe(0); // Not Sunday
        expect(dayOfWeek).not.toBe(6); // Not Saturday
      }
    }
  });
});

describe('Bundled Data: Exam Scenarios', () => {
  it('scenario files exist', () => {
    const dataDir = findDataDir();
    if (!dataDir) return;

    // Look for scenario files
    function findScenarios(dir: string): string[] {
      const results: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.includes('scenario') && entry.name.endsWith('.json')) {
          results.push(full);
        }
        if (entry.isDirectory()) {
          results.push(...findScenarios(full));
        }
      }
      return results;
    }

    const scenarios = findScenarios(SRC_DIR);
    expect(scenarios.length).toBeGreaterThan(0);
  });

  it('scenario definitions have required structure', () => {
    function findScenarios(dir: string): string[] {
      const results: string[] = [];
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isFile() && entry.name.includes('scenario') && entry.name.endsWith('.json')) {
            results.push(full);
          }
          if (entry.isDirectory()) {
            results.push(...findScenarios(full));
          }
        }
      } catch {
        // ignore
      }
      return results;
    }

    const scenarioFiles = findScenarios(SRC_DIR);

    for (const file of scenarioFiles) {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      const scenarios = Array.isArray(data) ? data : (data.scenarios || [data]);

      for (const scenario of scenarios) {
        // Each scenario should have an id and type
        if (scenario.id) {
          expect(typeof scenario.id).toBe('string');
        }
        if (scenario.type || scenario.task_type) {
          const type = scenario.type || scenario.task_type;
          expect(typeof type).toBe('string');
        }
      }
    }
  });
});
