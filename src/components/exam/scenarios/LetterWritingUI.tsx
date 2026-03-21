import { useState, useCallback } from 'react';
import { useExamSession } from '../../../hooks/useExamSession';
import { matchTaskHint } from '../../../utils/taskHintMatch';
import ExamScoreCard from '../ExamScoreCard';
import styles from './scenarios.module.css';

interface LetterWritingUIProps {
  scenarioId: string;
  taskHint?: string;
  onBack: () => void;
}

interface LetterPrompt {
  id: string;
  level: string;
  situation: string;
  required_points: string[];
  word_target: [number, number];
  register: string;
}

const LetterWritingUI: React.FC<LetterWritingUIProps> = ({ scenarioId, taskHint, onBack }) => {
  const { scenario, examScores, submitForScoring, reset } = useExamSession(scenarioId);
  const [text, setText] = useState('');

  const prompts = (scenario?.prompts as LetterPrompt[]) ?? [];
  const autoMatch = matchTaskHint(taskHint, prompts.map((p) => ({ id: p.id, desc: p.situation })));
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(autoMatch);
  const currentPrompt = prompts.find((p) => p.id === selectedPrompt);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleSubmit = useCallback(() => {
    if (!currentPrompt) return;
    submitForScoring(`Situation: ${currentPrompt.situation}\nRegister: ${currentPrompt.register}\nTarget: ${currentPrompt.word_target[0]}-${currentPrompt.word_target[1]} words\n\nStudent's letter:\n${text}`);
  }, [currentPrompt, text, submitForScoring]);

  if (examScores) {
    return (
      <ExamScoreCard scores={examScores.scores} totalPercent={examScores.totalPercent} feedback={examScores.feedback} onRetry={reset} onBack={onBack} />
    );
  }

  if (!selectedPrompt) {
    return (
      <div className={styles.scenario}>
        <h2 className={styles.title}>Choose a Writing Task</h2>
        {prompts.map((p) => (
          <div key={p.id} className={styles.promptCard} style={{ cursor: 'pointer' }} onClick={() => setSelectedPrompt(p.id)}>
            <strong>{p.situation}</strong>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              {p.level} · {p.register} · {p.word_target[0]}-{p.word_target[1]} words
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (!currentPrompt) return null;

  return (
    <div className={styles.scenario}>
      <h2 className={styles.title}>Letter/Email Writing</h2>

      <div className={styles.situation}>{currentPrompt.situation}</div>

      <div className={styles.requiredPoints}>
        <strong>Required points:</strong>
        <ul>
          {currentPrompt.required_points.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      </div>

      <div className={styles.wordCount}>
        {wordCount} / {currentPrompt.word_target[0]}-{currentPrompt.word_target[1]} words
      </div>

      <textarea
        className={styles.textarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your letter here..."
      />

      <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSubmit} disabled={wordCount < 5}>
        Submit
      </button>
    </div>
  );
};

export default LetterWritingUI;
