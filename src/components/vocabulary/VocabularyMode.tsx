import { useState, useMemo, useCallback } from 'react';
import type { Grade } from 'ts-fsrs';
import { useCards } from '../../hooks/useCards';
import { useSchedule } from '../../hooks/useSchedule';
import VocabSummaryBar from './VocabSummaryBar';
import TopicFilter from './TopicFilter';
import FlashCard from './FlashCard';
import SessionComplete from './SessionComplete';
import type { CardState } from '../../services/types';
import styles from './VocabularyMode.module.css';

const VocabularyMode: React.FC = () => {
  const { currentDay } = useSchedule();
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    () => currentDay?.topics ?? []
  );
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

  // Current card: due cards first, then new cards
  const currentCard = filteredDueCards[0] ?? filteredNewCards[0] ?? null;
  const sessionDone = !loading && (isSessionDone || !currentCard);

  const handleToggleTopic = useCallback((topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }, []);

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
    return (
      <div className={styles.page}>
        <h1 className={styles.heading}>Vocabulary</h1>
        <div className={styles.loading}>Loading cards...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Vocabulary</h1>
      <VocabSummaryBar
        dueCount={filteredDueCards.length}
        newCount={filteredNewCards.length}
      />
      <TopicFilter
        selectedTopics={selectedTopics}
        onToggle={handleToggleTopic}
      />
      {sessionDone ? (
        <SessionComplete
          reviewedCount={sessionStats.reviewed}
          newCount={sessionStats.newLearned}
        />
      ) : currentCard ? (
        <FlashCard card={currentCard} onRate={handleRate} />
      ) : null}
    </div>
  );
};

export default VocabularyMode;
