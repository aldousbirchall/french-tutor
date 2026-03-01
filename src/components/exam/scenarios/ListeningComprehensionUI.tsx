import { useState, useCallback, useMemo } from 'react';
import { useSpeechService } from '../../../contexts/SpeechContext';
import { useExamSession } from '../../../hooks/useExamSession';
import ExamScoreCard from '../ExamScoreCard';
import styles from './scenarios.module.css';

interface ListeningComprehensionUIProps {
  scenarioId: string;
  onBack: () => void;
}

interface Exercise {
  id: string;
  level: string;
  passage: string;
  plays: number;
  questions: Array<{
    question: string;
    answer: string;
    distractors: string[];
  }>;
}

const ListeningComprehensionUI: React.FC<ListeningComprehensionUIProps> = ({ scenarioId, onBack }) => {
  const { scenario, examScores, submitForScoring, reset } = useExamSession(scenarioId);
  const speech = useSpeechService();
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [playsUsed, setPlaysUsed] = useState<Record<number, number>>({});

  const exercises = useMemo(() => (scenario?.exercises as Exercise[]) ?? [], [scenario]);
  const currentEx = exercises[currentExIdx];

  const playPassage = useCallback(() => {
    if (!currentEx) return;
    const used = playsUsed[currentExIdx] ?? 0;
    if (used >= currentEx.plays) return;
    speech.speak(currentEx.passage, { rate: 0.85 });
    setPlaysUsed((prev) => ({ ...prev, [currentExIdx]: (prev[currentExIdx] ?? 0) + 1 }));
  }, [currentEx, currentExIdx, playsUsed, speech]);

  const selectAnswer = useCallback((questionIdx: number, answer: string) => {
    const key = `${currentExIdx}-${questionIdx}`;
    setAnswers((prev) => ({ ...prev, [key]: answer }));
  }, [currentExIdx]);

  const handleFinish = useCallback(() => {
    const responseLines: string[] = [];
    exercises.forEach((ex, eIdx) => {
      responseLines.push(`Exercise: ${ex.id}`);
      ex.questions.forEach((q, qIdx) => {
        const key = `${eIdx}-${qIdx}`;
        responseLines.push(`Q: ${q.question} A: ${answers[key] ?? 'No answer'} (Correct: ${q.answer})`);
      });
    });
    submitForScoring(responseLines.join('\n'));
  }, [exercises, answers, submitForScoring]);

  if (examScores) {
    return (
      <ExamScoreCard scores={examScores.scores} totalPercent={examScores.totalPercent} feedback={examScores.feedback} onRetry={reset} onBack={onBack} />
    );
  }

  if (!currentEx) return null;

  const usedPlays = playsUsed[currentExIdx] ?? 0;

  return (
    <div className={styles.scenario}>
      <h2 className={styles.title}>Listening Comprehension</h2>
      <p className={styles.description}>
        Exercise {currentExIdx + 1} of {exercises.length} ({currentEx.level})
      </p>

      <button className={styles.playBtn} onClick={playPassage} disabled={usedPlays >= currentEx.plays}>
        🔊 Play Passage ({currentEx.plays - usedPlays} plays remaining)
      </button>

      {currentEx.questions.map((q, qIdx) => {
        const key = `${currentExIdx}-${qIdx}`;
        const allOptions = [q.answer, ...q.distractors].sort();
        return (
          <div key={qIdx} className={styles.questionCard}>
            <div className={styles.questionText}>{q.question}</div>
            {allOptions.map((opt) => (
              <button
                key={opt}
                className={`${styles.option} ${answers[key] === opt ? styles.optionSelected : ''}`}
                onClick={() => selectAnswer(qIdx, opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        {currentExIdx < exercises.length - 1 ? (
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setCurrentExIdx((p) => p + 1)}>
            Next Exercise
          </button>
        ) : (
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleFinish}>
            Finish &amp; Score
          </button>
        )}
        {currentExIdx > 0 && (
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setCurrentExIdx((p) => p - 1)}>
            Previous
          </button>
        )}
      </div>
    </div>
  );
};

export default ListeningComprehensionUI;
