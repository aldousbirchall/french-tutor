import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useClaudeAvailability } from '../../contexts/ClaudeContext';
import scenarios from '../../data/scenarios';
import ExamTaskList from './ExamTaskList';
import ExamSession from './ExamSession';
import FullMockExam from './FullMockExam';
import ModeIntro from '../shared/ModeIntro';
import styles from './ExamMode.module.css';

type ExamView =
  | { type: 'list' }
  | { type: 'session'; scenarioId: string; taskHint?: string }
  | { type: 'mock'; examType: 'oral' | 'written' };

// Maps schedule task prefixes/keywords to scenario IDs where the schedule
// wording doesn't match the scenario title exactly.
const TASK_ALIASES: Record<string, string> = {
  'letter writing': 'letter-writing',
  'role-play': 'role-play',
  'sequential image': 'sequential-images',
};

type MatchResult =
  | { type: 'scenario'; scenarioId: string; taskHint: string }
  | { type: 'mock'; examType: 'oral' | 'written' }
  | null;

/** Extract the specific task description after the "Scenario type: " prefix. */
function extractTaskHint(task: string): string {
  const colonIdx = task.indexOf(':');
  return colonIdx >= 0 ? task.substring(colonIdx + 1).trim() : task;
}

function matchTaskToView(task: string): MatchResult {
  const lower = task.toLowerCase();

  // Mock / simulation tasks → route to full mock view
  if (lower.includes('oral exam simulation') || lower.includes('mock oral') || lower.includes('half mock oral')) {
    return { type: 'mock', examType: 'oral' };
  }
  if (lower.includes('written exam simulation') || lower.includes('mock written') || lower.includes('written mock')) {
    return { type: 'mock', examType: 'written' };
  }

  const hint = extractTaskHint(task);

  // Check aliases first (handles mismatches between schedule wording and scenario titles)
  for (const [prefix, scenarioId] of Object.entries(TASK_ALIASES)) {
    if (lower.startsWith(prefix)) return { type: 'scenario', scenarioId, taskHint: hint };
  }

  // Then try matching by scenario title
  const scenarioList = Object.values(scenarios);
  for (const s of scenarioList) {
    if (lower.startsWith(s.title.toLowerCase())) return { type: 'scenario', scenarioId: s.id, taskHint: hint };
  }
  for (const s of scenarioList) {
    if (lower.includes(s.title.toLowerCase())) return { type: 'scenario', scenarioId: s.id, taskHint: hint };
  }

  return null;
}

const ExamMode: React.FC = () => {
  const { available } = useClaudeAvailability();
  const [searchParams] = useSearchParams();
  const taskFromSchedule = searchParams.get('task');
  const matchResult = taskFromSchedule ? matchTaskToView(taskFromSchedule) : null;
  const [view, setView] = useState<ExamView>(
    matchResult
      ? matchResult.type === 'scenario'
        ? { type: 'session', scenarioId: matchResult.scenarioId, taskHint: matchResult.taskHint }
        : { type: 'mock', examType: matchResult.examType }
      : { type: 'list' }
  );

  if (!available) {
    return (
      <div className={styles.page}>
        <h1 className={styles.heading}>Exam Practice</h1>
        <div style={{
          padding: '2rem',
          background: 'var(--color-warning-bg, #fff3cd)',
          border: '1px solid var(--color-warning-border, #ffc107)',
          borderRadius: '8px',
          marginTop: '1rem',
        }}>
          <p style={{ margin: 0, fontSize: '1rem' }}>
            <strong>Exam practice requires Claude AI.</strong>
          </p>
          <p style={{ margin: '0.5rem 0 0', opacity: 0.8 }}>
            Claude Code is not running or no API key is configured.
            Start Claude Code with a Max subscription, or add an API key in Settings.
          </p>
        </div>
      </div>
    );
  }

  const handleBack = () => setView({ type: 'list' });

  if (view.type === 'session') {
    return (
      <div className={styles.page}>
        <ExamSession scenarioId={view.scenarioId} taskHint={view.taskHint} onBack={handleBack} />
      </div>
    );
  }

  if (view.type === 'mock') {
    return (
      <div className={styles.page}>
        <FullMockExam type={view.examType} onBack={handleBack} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <ModeIntro title="How Exam Practice Works" storageKey="exam">
        <p>
          Practice individual exam tasks or run a full mock. Oral: 40 min
          (speaking + listening). Written: 60 min (forms, letters). Select a
          task below or start a timed mock exam.
        </p>
      </ModeIntro>
      <h1 className={styles.heading}>Exam Practice</h1>
      <div className={styles.mockExamButtons}>
        <button
          className={styles.mockBtn}
          onClick={() => setView({ type: 'mock', examType: 'oral' })}
        >
          Full Oral Mock (40 min)
        </button>
        <button
          className={styles.mockBtn}
          onClick={() => setView({ type: 'mock', examType: 'written' })}
        >
          Full Written Mock (60 min)
        </button>
      </div>
      <ExamTaskList onSelect={(id) => setView({ type: 'session', scenarioId: id })} />
    </div>
  );
};

export default ExamMode;
