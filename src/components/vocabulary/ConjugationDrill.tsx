import { useState, useMemo, useCallback } from 'react';
import conjugations from '../../data/conjugations';
import ModeIntro from '../shared/ModeIntro';
import QuizSummary from './QuizSummary';
import type { ConjugationItem } from '../../data/types';
import flashStyles from './SimpleFlashcard.module.css';
import quizStyles from './QuizCard.module.css';

const BATCH_SIZE = 20;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function flattenConjugations(): ConjugationItem[] {
  const items: ConjugationItem[] = [];
  for (const verb of conjugations.verbs) {
    for (const [tenseKey, tense] of Object.entries(verb.tenses)) {
      for (const [pronoun, form] of Object.entries(tense.forms)) {
        items.push({
          id: `${verb.infinitive}_${tenseKey}_${pronoun}`,
          infinitive: verb.infinitive,
          pronoun,
          tense: tenseKey,
          tenseLabel: tense.label,
          form,
          english: tense.english[pronoun],
          group: verb.group,
        });
      }
    }
  }
  return items;
}

// Extract unique groups from the data
const GROUPS = Array.from(new Set(conjugations.verbs.map((v) => v.group).filter(Boolean))) as string[];

type Mode = 'flashcard' | 'quiz';

const TENSE_OPTIONS = [
  { key: 'all', label: 'All Tenses' },
  { key: 'present', label: 'Présent' },
  { key: 'passe_compose', label: 'Passé composé' },
  { key: 'futur_proche', label: 'Futur proche' },
  { key: 'imparfait', label: 'Imparfait' },
];

const ConjugationDrill: React.FC = () => {
  const allItems = useMemo(() => flattenConjugations(), []);
  const [mode, setMode] = useState<Mode>('flashcard');
  const [groupFilter, setGroupFilter] = useState(GROUPS.length > 0 ? GROUPS[0] : 'all');
  const [tenseFilter, setTenseFilter] = useState('all');

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (groupFilter !== 'all') {
      items = items.filter((it) => it.group === groupFilter);
    }
    if (tenseFilter !== 'all') {
      items = items.filter((it) => it.tense === tenseFilter);
    }
    return items;
  }, [allItems, groupFilter, tenseFilter]);

  // Flashcard state
  const [fcPool, setFcPool] = useState(() => shuffle(allItems));
  const [fcIndex, setFcIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Quiz state
  const [quizPool, setQuizPool] = useState(() => shuffle(allItems));
  const [batchStart, setBatchStart] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<{ french: string; english: string }[]>([]);
  const [wrongItems, setWrongItems] = useState<ConjugationItem[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [retryMode, setRetryMode] = useState(false);

  // Reset pools when filters change
  const [lastTenseFilter, setLastTenseFilter] = useState(tenseFilter);
  const [lastGroupFilter, setLastGroupFilter] = useState(groupFilter);
  if (tenseFilter !== lastTenseFilter || groupFilter !== lastGroupFilter) {
    let newFiltered = allItems;
    if (groupFilter !== 'all') {
      newFiltered = newFiltered.filter((it) => it.group === groupFilter);
    }
    if (tenseFilter !== 'all') {
      newFiltered = newFiltered.filter((it) => it.tense === tenseFilter);
    }
    setFcPool(shuffle(newFiltered));
    setFcIndex(0);
    setFlipped(false);
    setQuizPool(shuffle(newFiltered));
    setBatchStart(0);
    setQIndex(0);
    setCorrect(0);
    setWrongAnswers([]);
    setWrongItems([]);
    setShowSummary(false);
    setRetryMode(false);
    setLastTenseFilter(tenseFilter);
    setLastGroupFilter(groupFilter);
  }

  // Quiz batch
  const batchItems = useMemo(() => {
    if (retryMode) return shuffle(wrongItems);
    const end = Math.min(batchStart + BATCH_SIZE, quizPool.length);
    return quizPool.slice(batchStart, end);
  }, [quizPool, batchStart, retryMode, wrongItems]);

  // Generate quiz options for current question
  // All distractors must use the same pronoun so you can't eliminate by form alone
  const quizOptions = useMemo(() => {
    if (batchItems.length === 0) return [];
    const current = batchItems[qIndex];
    if (!current) return [];

    // Priority 1: same pronoun, different verb or tense (hardest)
    const samePronoun = allItems.filter(
      (it) => it.id !== current.id && it.pronoun === current.pronoun
    );
    // Priority 2: same pronoun and tense, different verb
    const samePronounDiffVerb = samePronoun.filter(
      (it) => it.tense === current.tense && it.infinitive !== current.infinitive
    );
    // Priority 3: same pronoun, different tense
    const samePronounDiffTense = samePronoun.filter(
      (it) => it.tense !== current.tense
    );

    const candidates = [...shuffle(samePronounDiffVerb), ...shuffle(samePronounDiffTense)];
    const seen = new Set<string>([current.form]);
    const distractors: string[] = [];
    for (const c of candidates) {
      if (distractors.length >= 3) break;
      if (!seen.has(c.form)) {
        seen.add(c.form);
        distractors.push(c.form);
      }
    }

    const options = shuffle([current.form, ...distractors]);
    return options;
  }, [batchItems, qIndex, allItems]);

  const correctIndex = quizOptions.indexOf(batchItems[qIndex]?.form ?? '');

  // Flashcard handlers
  const handleFlip = useCallback(() => setFlipped((v) => !v), []);
  const handleFcNext = useCallback(() => {
    setFlipped(false);
    setFcIndex((i) => (i + 1 >= fcPool.length ? 0 : i + 1));
  }, [fcPool.length]);
  const handleFcPrev = useCallback(() => {
    setFlipped(false);
    setFcIndex((i) => (i - 1 < 0 ? fcPool.length - 1 : i - 1));
  }, [fcPool.length]);

  // Quiz handlers
  const handleQuizSelect = useCallback((idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const isCorrect = idx === correctIndex;
    if (isCorrect) {
      setCorrect((c) => c + 1);
    } else {
      const item = batchItems[qIndex];
      setWrongAnswers((w) => [...w, { french: `${item.infinitive}: ${item.pronoun} (${item.tenseLabel})`, english: item.form }]);
      setWrongItems((w) => [...w, item]);
    }
    setTimeout(() => {
      setSelected(null);
      if (qIndex + 1 >= batchItems.length) {
        setShowSummary(true);
      } else {
        setQIndex((i) => i + 1);
      }
    }, 800);
  }, [selected, correctIndex, batchItems, qIndex]);

  const handleRetryWrong = useCallback(() => {
    setQIndex(0);
    setCorrect(0);
    setWrongAnswers([]);
    setShowSummary(false);
    setRetryMode(true);
  }, []);

  const handleContinue = useCallback(() => {
    if (!retryMode) {
      let next = batchStart + BATCH_SIZE;
      if (next >= quizPool.length) {
        setQuizPool(shuffle(filteredItems));
        next = 0;
      }
      setBatchStart(next);
    }
    setQIndex(0);
    setCorrect(0);
    setWrongAnswers([]);
    setWrongItems([]);
    setShowSummary(false);
    setRetryMode(false);
  }, [batchStart, quizPool.length, filteredItems, retryMode]);

  const handleRestart = useCallback(() => {
    setQuizPool(shuffle(filteredItems));
    setBatchStart(0);
    setQIndex(0);
    setCorrect(0);
    setWrongAnswers([]);
    setWrongItems([]);
    setShowSummary(false);
    setRetryMode(false);
  }, [filteredItems]);

  const fcItem = fcPool[fcIndex];
  const quizItem = batchItems[qIndex];

  return (
    <>
      <ModeIntro title="How Conjugation Drill Works" storageKey="vocabulary-conjugation">
        <p>
          Drill verb conjugations. Flashcard mode: see the verb, pronoun, and tense, then flip
          to reveal the conjugated form. Quiz mode: choose the correct conjugation from four options.
        </p>
      </ModeIntro>

      {GROUPS.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button
            onClick={() => setGroupFilter('all')}
            style={{
              padding: '4px var(--space-2)',
              border: `1px solid ${groupFilter === 'all' ? 'var(--color-secondary, #6c757d)' : 'var(--color-border)'}`,
              borderRadius: '999px',
              background: groupFilter === 'all' ? 'var(--color-secondary, #6c757d)' : 'var(--color-surface)',
              color: groupFilter === 'all' ? '#fff' : 'var(--color-text-muted)',
              fontSize: 'var(--font-size-xs)',
              cursor: 'pointer',
            }}
          >
            All Verbs
          </button>
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setGroupFilter(g)}
              style={{
                padding: '4px var(--space-2)',
                border: `1px solid ${groupFilter === g ? 'var(--color-secondary, #6c757d)' : 'var(--color-border)'}`,
                borderRadius: '999px',
                background: groupFilter === g ? 'var(--color-secondary, #6c757d)' : 'var(--color-surface)',
                color: groupFilter === g ? '#fff' : 'var(--color-text-muted)',
                fontSize: 'var(--font-size-xs)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {g} verbs
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
        {TENSE_OPTIONS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTenseFilter(t.key)}
            style={{
              padding: '4px var(--space-2)',
              border: `1px solid ${tenseFilter === t.key ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: '999px',
              background: tenseFilter === t.key ? 'var(--color-primary)' : 'var(--color-surface)',
              color: tenseFilter === t.key ? '#fff' : 'var(--color-text-muted)',
              fontSize: 'var(--font-size-xs)',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <button
          onClick={() => setMode('flashcard')}
          style={{
            padding: 'var(--space-1) var(--space-3)',
            border: `2px solid ${mode === 'flashcard' ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: 'var(--border-radius)',
            background: mode === 'flashcard' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: mode === 'flashcard' ? '#fff' : 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: mode === 'flashcard' ? 600 : 400,
            cursor: 'pointer',
          }}
        >
          Flashcard
        </button>
        <button
          onClick={() => setMode('quiz')}
          style={{
            padding: 'var(--space-1) var(--space-3)',
            border: `2px solid ${mode === 'quiz' ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: 'var(--border-radius)',
            background: mode === 'quiz' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: mode === 'quiz' ? '#fff' : 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: mode === 'quiz' ? 600 : 400,
            cursor: 'pointer',
          }}
        >
          Quiz
        </button>
      </div>

      {mode === 'flashcard' && fcItem && (
        <>
          <div className={flashStyles.progress}>
            {fcIndex + 1} / {fcPool.length}
          </div>
          <div
            className={`${flashStyles.card} ${flipped ? flashStyles.flipped : ''}`}
            onClick={handleFlip}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFlip(); }}
          >
            <div className={flashStyles.cardInner}>
              <div className={flashStyles.cardFront}>
                <div className={flashStyles.wordText}>{fcItem.infinitive}</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>
                  {fcItem.pronoun}
                </div>
                <div className={flashStyles.pos}>{fcItem.tenseLabel}</div>
                <div className={flashStyles.hint}>Click to flip</div>
              </div>
              <div className={flashStyles.cardBack}>
                <div className={flashStyles.wordText}>{fcItem.form}</div>
                <div className={flashStyles.example}>{fcItem.english}</div>
              </div>
            </div>
          </div>
          <div className={flashStyles.nav}>
            <button className={flashStyles.navBtn} onClick={handleFcPrev}>&larr; Prev</button>
            <button className={flashStyles.navBtn} onClick={handleFcNext}>Next &rarr;</button>
          </div>
        </>
      )}

      {mode === 'quiz' && showSummary && (
        <QuizSummary
          correct={correct}
          total={batchItems.length}
          wrongAnswers={wrongAnswers}
          onContinue={handleContinue}
          onRestart={handleRestart}
          onRetryWrong={handleRetryWrong}
        />
      )}

      {mode === 'quiz' && !showSummary && quizItem && (
        <>
          <div style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
            Question {qIndex + 1} / {batchItems.length}
          </div>
          <div className={quizStyles.card}>
            <div className={quizStyles.frenchWord}>{quizItem.infinitive}</div>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>
              {quizItem.pronoun}
            </div>
            <div className={quizStyles.pos}>{quizItem.tenseLabel}</div>
            <div className={quizStyles.prompt}>Choose the correct conjugation:</div>
            <div className={quizStyles.options}>
              {quizOptions.map((opt, idx) => {
                let className = quizStyles.option;
                if (selected !== null) {
                  if (idx === correctIndex) className += ` ${quizStyles.correct}`;
                  else if (idx === selected) className += ` ${quizStyles.wrong}`;
                }
                return (
                  <button
                    key={idx}
                    className={className}
                    onClick={() => handleQuizSelect(idx)}
                    disabled={selected !== null}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ConjugationDrill;
