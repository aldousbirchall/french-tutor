import { useState } from 'react';
import ExamTimer from '../shared/ExamTimer';
import ExamSession from './ExamSession';

interface FullMockExamProps {
  type: 'oral' | 'written';
  onBack: () => void;
}

const ORAL_SCENARIO_IDS = ['self-introduction', 'image-description', 'role-play', 'open-discussion', 'sequential-images', 'listening-comprehension'];
const WRITTEN_SCENARIO_IDS = ['form-filling', 'letter-writing'];

const FullMockExam: React.FC<FullMockExamProps> = ({ type, onBack }) => {
  const scenarioIds = type === 'oral' ? ORAL_SCENARIO_IDS : WRITTEN_SCENARIO_IDS;
  const durationMinutes = type === 'oral' ? 40 : 60;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const [expired, setExpired] = useState(false);

  const handleExpired = () => {
    setExpired(true);
    setTimerActive(false);
  };

  const handleNext = () => {
    if (currentIdx < scenarioIds.length - 1) {
      setCurrentIdx((p) => p + 1);
    } else {
      onBack();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Full Mock Exam ({type === 'oral' ? 'Oral' : 'Written'})</h2>
        <ExamTimer
          durationMinutes={durationMinutes}
          onExpired={handleExpired}
          active={timerActive}
        />
      </div>
      {expired && (
        <div style={{ padding: '1rem', background: 'var(--color-error)', color: '#fff', borderRadius: 'var(--border-radius)', marginBottom: '1rem', textAlign: 'center' }}>
          Time is up! You can still finish this task.
        </div>
      )}
      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
        Task {currentIdx + 1} of {scenarioIds.length}
      </div>
      <ExamSession
        scenarioId={scenarioIds[currentIdx]}
        onBack={handleNext}
      />
    </div>
  );
};

export default FullMockExam;
