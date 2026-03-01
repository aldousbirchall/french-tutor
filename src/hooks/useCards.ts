import { useState, useCallback, useEffect, useRef } from 'react';
import { type Grade, createEmptyCard, Card } from 'ts-fsrs';
import { useFSRS } from './useFSRS';
import { useDatabaseService } from '../contexts/DatabaseContext';
import vocabulary from '../data/vocabulary';
import type { CardState } from '../services/types';

const DAILY_NEW_LIMIT = 25;

function cardStateToFSRS(card: CardState): Card {
  return {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? new Date(card.last_review) : undefined,
  } as Card;
}

export function useCards(topic?: string) {
  const db = useDatabaseService();
  const f = useFSRS();
  const [dueCards, setDueCards] = useState<CardState[]>([]);
  const [newCards, setNewCards] = useState<CardState[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSessionDone, setIsSessionDone] = useState(false);
  // Track cards rated in this session to immediately remove from queues
  const ratedInSessionRef = useRef<Set<string>>(new Set());
  // Track how many new cards have been introduced this session
  const sessionNewCardsRef = useRef<number>(0);

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const ratedIds = ratedInSessionRef.current;
      const due = await db.getCardsDueForReview(now);
      const filteredDue = (topic ? due.filter((c) => c.topic === topic) : due)
        .filter((c) => !ratedIds.has(c.wordId));
      setDueCards(filteredDue);

      // Calculate remaining new card budget for this session
      const remainingNewBudget = Math.max(0, DAILY_NEW_LIMIT - sessionNewCardsRef.current);

      // Get words that have no card yet (truly new)
      const allCards = await db.getAllCards();
      const cardIds = new Set(allCards.map((c) => c.wordId));
      const wordsWithoutCards = vocabulary.words.filter(
        (w) => !cardIds.has(w.id) && !ratedIds.has(w.id) && (!topic || w.topic === topic)
      );

      // Also get cards in New state (state 0) that have been created
      const newState = topic ? (await db.getNewCards(topic)) : (await db.getNewCards());
      const combinedNew: CardState[] = [
        ...newState.filter((c) => !ratedIds.has(c.wordId)),
        ...wordsWithoutCards.map((w) => {
          const empty = createEmptyCard();
          return {
            wordId: w.id,
            due: empty.due,
            stability: empty.stability,
            difficulty: empty.difficulty,
            elapsed_days: empty.elapsed_days,
            scheduled_days: empty.scheduled_days,
            reps: empty.reps,
            lapses: empty.lapses,
            state: empty.state as number,
            last_review: null,
            topic: w.topic,
          };
        }),
      ];

      const cappedNew = combinedNew.slice(0, remainingNewBudget);
      setNewCards(cappedNew);

      // Session is done when no due cards remain and new card budget is exhausted
      if (filteredDue.length === 0 && cappedNew.length === 0) {
        setIsSessionDone(true);
      }
    } catch (err) {
      console.error('Failed to load cards:', err);
    } finally {
      setLoading(false);
    }
  }, [db, topic]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const rateCard = useCallback(
    async (card: CardState, rating: Grade) => {
      const fsrsCard = cardStateToFSRS(card);
      const now = new Date();
      const result = f.repeat(fsrsCard, now);
      const scheduled = result[rating];
      const updated: CardState = {
        ...card,
        due: scheduled.card.due,
        stability: scheduled.card.stability,
        difficulty: scheduled.card.difficulty,
        elapsed_days: scheduled.card.elapsed_days,
        scheduled_days: scheduled.card.scheduled_days,
        reps: scheduled.card.reps,
        lapses: scheduled.card.lapses,
        state: scheduled.card.state as number,
        last_review: now,
      };
      await db.saveCard(updated);
      // Immediately mark as rated in session to prevent re-display
      ratedInSessionRef.current.add(card.wordId);
      // Track new cards introduced this session
      if (card.state === 0) {
        sessionNewCardsRef.current += 1;
      }
      // Optimistically remove from current queues
      setDueCards((prev) => prev.filter((c) => c.wordId !== card.wordId));
      setNewCards((prev) => prev.filter((c) => c.wordId !== card.wordId));
      // Then reload from DB for consistency
      await loadCards();
    },
    [f, db, loadCards]
  );

  return { dueCards, newCards, loading, isSessionDone, rateCard, refresh: loadCards };
}
