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
  | { type: 'session'; scenarioId: string }
  | { type: 'mock'; examType: 'oral' | 'written' };

function matchTaskToScenario(task: string): string | null {
  const lower = task.toLowerCase();
  const scenarioList = Object.values(scenarios);
  // Try matching by scenario title prefix (e.g. "Form filling: ..." → form-filling)
  for (const s of scenarioList) {
    if (lower.startsWith(s.title.toLowerCase())) return s.id;
  }
  // Fuzzy: check if the task contains the scenario title
  for (const s of scenarioList) {
    if (lower.includes(s.title.toLowerCase())) return s.id;
  }
  return null;
}

const ExamMode: React.FC = () => {
  const { available } = useClaudeAvailability();
  const [searchParams] = useSearchParams();
  const taskFromSchedule = searchParams.get('task');
  const initialScenario = taskFromSchedule ? matchTaskToScenario(taskFromSchedule) : null;
  const [view, setView] = useState<ExamView>(
    initialScenario ? { type: 'session', scenarioId: initialScenario } : { type: 'list' }
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
        <ExamSession scenarioId={view.scenarioId} onBack={handleBack} />
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
