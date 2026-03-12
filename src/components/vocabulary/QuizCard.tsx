import { useState } from 'react';
import styles from './QuizCard.module.css';

interface QuizCardProps {
  french: string;
  pos: string;
  gender: string | null;
  level: string;
  options: string[];
  correctIndex: number;
  onAnswer: (correct: boolean) => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ french, pos, gender, level, options, correctIndex, onAnswer }) => {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (idx: number) => {
    if (selected !== null) return; // already answered
    setSelected(idx);
    setTimeout(() => {
      onAnswer(idx === correctIndex);
    }, 800);
  };

  return (
    <div className={styles.card}>
      <div className={styles.frenchWord}>{french}</div>
      <div className={styles.pos}>
        {level} · {pos}
        {gender ? ` (${gender})` : ''}
      </div>
      <div className={styles.prompt}>Choose the English translation:</div>
      <div className={styles.options}>
        {options.map((opt, idx) => {
          let className = styles.option;
          if (selected !== null) {
            if (idx === correctIndex) className += ` ${styles.correct}`;
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
    </div>
  );
};

export default QuizCard;
