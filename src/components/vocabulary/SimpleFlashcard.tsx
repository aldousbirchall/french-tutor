import { useState, useMemo, useCallback } from 'react';
import vocabulary from '../../data/vocabulary';
import ModeIntro from '../shared/ModeIntro';
import styles from './SimpleFlashcard.module.css';

interface SimpleFlashcardProps {
  selectedTopics: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SimpleFlashcard: React.FC<SimpleFlashcardProps> = ({ selectedTopics }) => {
  const words = useMemo(() => {
    const filtered = selectedTopics.length === 0
      ? vocabulary.words
      : vocabulary.words.filter((w) => selectedTopics.includes(w.topic));
    return shuffle(filtered);
  }, [selectedTopics]);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Reset index when word pool changes
  const poolKey = words.map((w) => w.id).join(',');
  const [lastPoolKey, setLastPoolKey] = useState(poolKey);
  if (poolKey !== lastPoolKey) {
    setIndex(0);
    setFlipped(false);
    setLastPoolKey(poolKey);
  }

  const handleFlip = useCallback(() => {
    setFlipped((prev) => !prev);
  }, []);

  const handleNext = useCallback(() => {
    setFlipped(false);
    setIndex((prev) => {
      if (prev + 1 >= words.length) return 0; // wrap around
      return prev + 1;
    });
  }, [words.length]);

  const handlePrev = useCallback(() => {
    setFlipped(false);
    setIndex((prev) => {
      if (prev - 1 < 0) return words.length - 1;
      return prev - 1;
    });
  }, [words.length]);

  if (words.length === 0) {
    return <div className={styles.empty}>No words match the selected topics.</div>;
  }

  const word = words[index];

  return (
    <>
      <ModeIntro title="How Flashcards Work" storageKey="vocabulary-flashcards">
        <p>
          Simple flip cards. Click the card to reveal the English translation.
          Use the arrows to move through the deck. No scoring, no scheduling.
        </p>
      </ModeIntro>
      <div className={styles.progress}>
        {index + 1} / {words.length}
      </div>
      <div
        className={`${styles.card} ${flipped ? styles.flipped : ''}`}
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFlip(); }}
      >
        <div className={styles.cardInner}>
          <div className={styles.cardFront}>
            <div className={styles.wordText}>{word.french}</div>
            <div className={styles.pos}>
              {word.level} · {word.pos}
              {word.gender ? ` (${word.gender})` : ''}
            </div>
            <div className={styles.hint}>Click to flip</div>
          </div>
          <div className={styles.cardBack}>
            <div className={styles.wordText}>{word.english}</div>
            <div className={styles.example}>{word.example_fr}</div>
            <div className={styles.example}>{word.example_en}</div>
          </div>
        </div>
      </div>
      <div className={styles.nav}>
        <button className={styles.navBtn} onClick={handlePrev}>&larr; Prev</button>
        <button className={styles.navBtn} onClick={handleNext}>Next &rarr;</button>
      </div>
    </>
  );
};

export default SimpleFlashcard;
