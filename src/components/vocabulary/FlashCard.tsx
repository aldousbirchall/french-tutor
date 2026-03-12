import { useState } from 'react';
import { Rating } from 'ts-fsrs';
import type { Grade } from 'ts-fsrs';
import { useSpeechService } from '../../contexts/SpeechContext';
import vocabulary from '../../data/vocabulary';
import type { CardState } from '../../services/types';
import styles from './FlashCard.module.css';

interface FlashCardProps {
  card: CardState;
  onRate: (card: CardState, rating: Grade) => void;
}

const FlashCard: React.FC<FlashCardProps> = ({ card, onRate }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const speech = useSpeechService();

  const word = vocabulary.words.find((w) => w.id === card.wordId);
  if (!word) return null;

  const playAudio = () => {
    speech.speak(word.french);
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleRate = (rating: Grade) => {
    onRate(card, rating);
    setShowAnswer(false);
  };

  return (
    <div className={styles.card}>
      <div className={styles.frenchWord}>{word.french}</div>
      <div className={styles.pos}>
        {word.pos}
        {word.gender ? ` (${word.gender})` : ''}
      </div>
      <button className={styles.audioBtn} onClick={playAudio}>
        Listen
      </button>

      {!showAnswer ? (
        <button className={styles.showBtn} onClick={handleShowAnswer}>
          Show Answer
        </button>
      ) : (
        <div className={styles.answer}>
          <div className={styles.english}>{word.english}</div>
          <div className={styles.example}>{word.example_fr}</div>
          <div className={styles.example}>{word.example_en}</div>
          <button className={styles.audioBtn} onClick={playAudio}>
            Replay
          </button>
          <div className={styles.ratingButtons}>
            <button
              className={`${styles.ratingBtn} ${styles.again}`}
              onClick={() => handleRate(Rating.Again)}
            >
              Again
            </button>
            <button
              className={`${styles.ratingBtn} ${styles.hard}`}
              onClick={() => handleRate(Rating.Hard)}
            >
              Hard
            </button>
            <button
              className={`${styles.ratingBtn} ${styles.good}`}
              onClick={() => handleRate(Rating.Good)}
            >
              Good
            </button>
            <button
              className={`${styles.ratingBtn} ${styles.easy}`}
              onClick={() => handleRate(Rating.Easy)}
            >
              Easy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashCard;
