import { useState } from 'react';
import type { ComprehensionQuestion, DialogueTurn } from '../../data/types';
import styles from './DialogueQuizCard.module.css';

interface DialogueQuizCardProps {
  question: ComprehensionQuestion & { shuffledOptions?: string[]; shuffledCorrectIndex?: number };
  turns: DialogueTurn[];
  dialogueTitle: string;
  onAnswer: (correct: boolean) => void;
}

const TYPE_LABELS: Record<string, string> = {
  gist: 'Main Idea',
  response: 'Appropriate Response',
  vocab_in_context: 'Vocabulary in Context',
};

const DialogueQuizCard: React.FC<DialogueQuizCardProps> = ({ question, turns, dialogueTitle, onAnswer }) => {
  const [selected, setSelected] = useState<number | null>(null);

  // Use shuffled options if available, otherwise fall back to original
  const options = question.shuffledOptions ?? question.options;
  const correctIdx = question.shuffledCorrectIndex ?? question.correct_index;

  // Show setup turns before the answer; reveal the answer turn after selecting
  const contextStart = Math.max(0, question.context_turn - 2);
  const setupTurns = turns.slice(contextStart, question.context_turn);
  const answerTurn = turns[question.context_turn];

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setTimeout(() => {
      onAnswer(idx === correctIdx);
    }, 1200);
  };

  return (
    <div className={styles.card}>
      <div className={styles.contextSection}>
        <div className={styles.contextTitle}>
          From: {dialogueTitle}
        </div>
        {setupTurns.map((turn, i) => (
          <div key={i} className={styles.contextBubble}>
            <div className={styles.contextSpeaker}>
              {turn.speaker === 'examiner' ? 'Examiner' : 'Candidate'}
            </div>
            {turn.french}
          </div>
        ))}
        {selected !== null && answerTurn && (
          <div className={`${styles.contextBubble} ${styles.revealedTurn}`}>
            <div className={styles.contextSpeaker}>
              {answerTurn.speaker === 'examiner' ? 'Examiner' : 'Candidate'}
            </div>
            {answerTurn.french}
          </div>
        )}
      </div>

      <div className={styles.questionType}>{TYPE_LABELS[question.type] || question.type}</div>
      <div className={styles.question}>{question.question}</div>

      <div className={styles.options}>
        {options.map((opt, idx) => {
          let className = styles.option;
          if (selected !== null) {
            if (idx === correctIdx) className += ` ${styles.correct}`;
            else if (idx === selected) className += ` ${styles.wrong}`;
          }
          return (
            <button
              key={idx}
              className={className}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className={styles.explanation}>{question.explanation}</div>
      )}
    </div>
  );
};

export default DialogueQuizCard;
