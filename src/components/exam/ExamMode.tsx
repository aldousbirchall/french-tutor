import { useState } from 'react';
import ExamTaskList from './ExamTaskList';
import ExamSession from './ExamSession';
import FullMockExam from './FullMockExam';
import ModeIntro from '../shared/ModeIntro';
import styles from './ExamMode.module.css';

type ExamView =
  | { type: 'list' }
  | { type: 'session'; scenarioId: string }
  | { type: 'mock'; examType: 'oral' | 'written' };

const ExamMode: React.FC = () => {
  const [view, setView] = useState<ExamView>({ type: 'list' });

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
