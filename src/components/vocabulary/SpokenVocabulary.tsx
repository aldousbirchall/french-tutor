import { useState, useMemo, useCallback } from 'react';
import type { Grade } from 'ts-fsrs';
import { useCards } from '../../hooks/useCards';
import VocabSummaryBar from './VocabSummaryBar';
import FlashCard from './FlashCard';
import SessionComplete from './SessionComplete';
import ModeIntro from '../shared/ModeIntro';
import type { CardState } from '../../services/types';
import styles from './VocabularyMode.module.css';

interface SpokenVocabularyProps {
  selectedTopics: string[];
}

const SpokenVocabulary: React.FC<SpokenVocabularyProps> = ({ selectedTopics }) => {
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, newLearned: 0 });

  // Use the first selected topic for filtering, or undefined for all
  const filterTopic = selectedTopics.length === 1 ? selectedTopics[0] : undefined;
  const { dueCards, newCards, loading, isSessionDone, rateCard } = useCards(filterTopic);

  const filteredDueCards = useMemo(() => {
    if (selectedTopics.length <= 1) return dueCards;
    return dueCards.filter((c) => selectedTopics.includes(c.topic));
  }, [dueCards, selectedTopics]);

  const filteredNewCards = useMemo(() => {
    if (selectedTopics.length <= 1) return newCards;
    return newCards.filter((c) => selectedTopics.includes(c.topic));
  }, [newCards, selectedTopics]);

  const currentCard = filteredDueCards[0] ?? filteredNewCards[0] ?? null;
  const sessionDone = !loading && (isSessionDone || !currentCard);

  const handleRate = useCallback(
    async (card: CardState, rating: Grade) => {
      const isNew = card.state === 0;
      await rateCard(card, rating);
      setSessionStats((prev) => ({
        reviewed: prev.reviewed + (isNew ? 0 : 1),
        newLearned: prev.newLearned + (isNew ? 1 : 0),
      }));
    },
    [rateCard]
  );

  if (loading) {
    return <div className={styles.loading}>Loading cards...</div>;
  }

  return (
    <>
      <ModeIntro title="How Spoken Vocabulary Works" storageKey="vocabulary-spoken">
        <p>
          Each card shows a French word. Use the microphone to <strong>say the
          word aloud in French</strong> (pronunciation practice), or click
          &quot;Listen&quot; to hear it first. Then click &quot;Show Answer&quot; to see the English
          translation. Rate how well you knew the word to schedule future reviews
          via spaced repetition.
        </p>
      </ModeIntro>
      <VocabSummaryBar
        dueCount={filteredDueCards.length}
        newCount={filteredNewCards.length}
      />
      {sessionDone ? (
        <SessionComplete
          reviewedCount={sessionStats.reviewed}
          newCount={sessionStats.newLearned}
        />
      ) : currentCard ? (
        <FlashCard card={currentCard} onRate={handleRate} />
      ) : null}
    </>
  );
};

export default SpokenVocabulary;
