import { useState } from 'react';
import { Rating } from 'ts-fsrs';
import type { Grade } from 'ts-fsrs';
import { useSpeechService } from '../../contexts/SpeechContext';
import { matchFrenchWord } from '../../utils/textMatch';
import VoiceInput from '../shared/VoiceInput';
import { useVoiceInput } from '../../hooks/useVoiceInput';
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
  const { isListening, setIsListening, finalText, handleTranscript, reset } = useVoiceInput();
  const [voiceMatch, setVoiceMatch] = useState<boolean | null>(null);

  const word = vocabulary.words.find((w) => w.id === card.wordId);
  if (!word) return null;

  const playAudio = () => {
    speech.speak(word.french);
  };

  const handleVoiceTranscript = (text: string) => {
    handleTranscript(text);
    const isMatch = matchFrenchWord(text, word.french);
    setVoiceMatch(isMatch);
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleRate = (rating: Grade) => {
    onRate(card, rating);
    setShowAnswer(false);
    setVoiceMatch(null);
    reset();
  };

  return (
    <div className={styles.card}>
      <div className={styles.frenchWord}>{word.french}</div>
      <div className={styles.pos}>
        {word.pos}
        {word.gender ? ` (${word.gender})` : ''}
      </div>
      <button className={styles.audioBtn} onClick={playAudio}>
        🔊 Listen
      </button>

      <div className={styles.voiceSection}>
        <div className={styles.voiceHint}>Say the word aloud in French:</div>
        <VoiceInput
          onTranscript={handleVoiceTranscript}
          lang="fr-CH"
          isListening={isListening}
          onListeningChange={setIsListening}
        />
        {finalText && (
          <div className={styles.matchResult}>
            <span>You said: &quot;{finalText}&quot;</span>
            {voiceMatch !== null && (
              <span className={voiceMatch ? styles.matchCorrect : styles.matchIncorrect}>
                {voiceMatch ? ' ✓ Correct!' : ' ✗ Try again'}
              </span>
            )}
          </div>
        )}
      </div>

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
            🔊 Replay
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
