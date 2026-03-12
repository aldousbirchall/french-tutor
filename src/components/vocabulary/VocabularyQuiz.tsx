import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import vocabulary from '../../data/vocabulary';
import { useDatabaseService } from '../../contexts/DatabaseContext';
import ModeIntro from '../shared/ModeIntro';
import QuizCard from './QuizCard';
import QuizSummary from './QuizSummary';
import type { VocabWord } from '../../data/types';
import type { CardState } from '../../services/types';

const BATCH_SIZE = 20;
const OPTIONS_COUNT = 4;

interface QuizQuestion {
  word: VocabWord;
  options: string[];
  correctIndex: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Compute a sampling weight for a word based on FSRS state and session failures. */
function getWeight(
  word: VocabWord,
  cardMap: Map<string, CardState>,
  sessionFailures: Map<string, number>
): number {
  let weight = 1.0;

  const card = cardMap.get(word.id);
  if (card) {
    if (card.lapses > 0) weight += card.lapses * 0.5;
    if (card.stability < 2) weight *= 1.5;
    if (card.state === 3) weight *= 1.5;
  } else {
    weight *= 1.2;
  }

  const failures = sessionFailures.get(word.id) ?? 0;
  if (failures > 0) weight *= 1 + failures;

  return weight;
}

/** Weighted random sample without replacement. */
function weightedSample(
  words: VocabWord[],
  count: number,
  cardMap: Map<string, CardState>,
  sessionFailures: Map<string, number>
): VocabWord[] {
  const n = Math.min(count, words.length);
  const pool = words.map((w) => ({ word: w, weight: getWeight(w, cardMap, sessionFailures) }));
  const selected: VocabWord[] = [];

  for (let i = 0; i < n; i++) {
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    let r = Math.random() * totalWeight;
    let idx = 0;
    for (let j = 0; j < pool.length; j++) {
      r -= pool[j].weight;
      if (r <= 0) {
        idx = j;
        break;
      }
    }
    selected.push(pool[idx].word);
    pool.splice(idx, 1);
  }

  return selected;
}

function generateDistractors(target: VocabWord, pool: VocabWord[], count: number): string[] {
  const candidates = pool.filter((w) => w.id !== target.id && w.english !== target.english);

  // Priority 1: same POS
  const samePOS = candidates.filter((w) => w.pos === target.pos);
  // Priority 2: same topic
  const sameTopic = candidates.filter((w) => w.topic === target.topic && w.pos !== target.pos);
  // Priority 3: any remaining
  const rest = candidates.filter((w) => w.pos !== target.pos && w.topic !== target.topic);

  const ordered = [...shuffle(samePOS), ...shuffle(sameTopic), ...shuffle(rest)];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const w of ordered) {
    if (result.length >= count) break;
    if (!seen.has(w.english)) {
      seen.add(w.english);
      result.push(w.english);
    }
  }

  return result;
}

function buildBatch(words: VocabWord[], allWords: VocabWord[]): QuizQuestion[] {
  return words.map((word) => {
    const distractors = generateDistractors(word, allWords, OPTIONS_COUNT - 1);
    const options = shuffle([word.english, ...distractors]);
    const correctIndex = options.indexOf(word.english);
    return { word, options, correctIndex };
  });
}

interface VocabularyQuizProps {
  selectedTopics: string[];
}

const VocabularyQuiz: React.FC<VocabularyQuizProps> = ({ selectedTopics }) => {
  const db = useDatabaseService();
  const [cardMap, setCardMap] = useState<Map<string, CardState>>(new Map());
  const sessionFailures = useRef<Map<string, number>>(new Map());

  // Load FSRS card state on mount
  useEffect(() => {
    db.getAllCards().then((cards) => {
      const map = new Map<string, CardState>();
      for (const c of cards) map.set(c.wordId, c);
      setCardMap(map);
    });
  }, [db]);

  const filteredWords = useMemo(() => {
    if (selectedTopics.length === 0) return vocabulary.words;
    return vocabulary.words.filter((w) => selectedTopics.includes(w.topic));
  }, [selectedTopics]);

  const [batchWords, setBatchWords] = useState<VocabWord[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<{ french: string; english: string }[]>([]);
  const [wrongWords, setWrongWords] = useState<VocabWord[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [retryMode, setRetryMode] = useState(false);
  const [batchKey, setBatchKey] = useState(0);

  // Sample a new batch using weighted selection
  const sampleBatch = useCallback(() => {
    const batch = weightedSample(filteredWords, BATCH_SIZE, cardMap, sessionFailures.current);
    setBatchWords(batch);
    setBatchKey((k) => k + 1);
  }, [filteredWords, cardMap]);

  // Reset on topic change
  const topicKey = selectedTopics.join(',');
  const [lastTopicKey, setLastTopicKey] = useState(topicKey);
  const [initialized, setInitialized] = useState(false);

  if (topicKey !== lastTopicKey) {
    sessionFailures.current = new Map();
    setQuestionIndex(0);
    setCorrect(0);
    setWrongAnswers([]);
    setWrongWords([]);
    setShowSummary(false);
    setRetryMode(false);
    setInitialized(false);
    setLastTopicKey(topicKey);
  }

  // Sample first batch once cards are loaded
  useEffect(() => {
    if (!initialized && filteredWords.length > 0) {
      const batch = weightedSample(filteredWords, BATCH_SIZE, cardMap, sessionFailures.current);
      setBatchWords(batch);
      setBatchKey((k) => k + 1);
      setInitialized(true);
    }
  }, [initialized, filteredWords, cardMap]);

  const questions = useMemo(
    () => retryMode ? buildBatch(wrongWords, vocabulary.words) : buildBatch(batchWords, vocabulary.words),
    [batchWords, retryMode, wrongWords, batchKey]
  );

  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (isCorrect) {
      setCorrect((prev) => prev + 1);
    } else {
      const q = questions[questionIndex];
      setWrongAnswers((prev) => [...prev, { french: q.word.french, english: q.word.english }]);
      setWrongWords((prev) => [...prev, q.word]);
      const current = sessionFailures.current.get(q.word.id) ?? 0;
      sessionFailures.current.set(q.word.id, current + 1);
    }

    setTimeout(() => {
      const nextIdx = questionIndex + 1;
      if (nextIdx >= questions.length) {
        setShowSummary(true);
      } else {
        setQuestionIndex(nextIdx);
      }
    }, 200);
  }, [questionIndex, questions]);

  const handleRetryWrong = useCallback(() => {
    setQuestionIndex(0);
    setCorrect(0);
    setWrongAnswers([]);
    setShowSummary(false);
    setRetryMode(true);
    setWrongWords((prev) => [...prev]);
  }, []);

  const handleContinue = useCallback(() => {
    sampleBatch();
    setQuestionIndex(0);
    setCorrect(0);
    setWrongAnswers([]);
    setWrongWords([]);
    setShowSummary(false);
    setRetryMode(false);
  }, [sampleBatch]);

  const handleRestart = useCallback(() => {
    sessionFailures.current = new Map();
    sampleBatch();
    setQuestionIndex(0);
    setCorrect(0);
    setWrongAnswers([]);
    setWrongWords([]);
    setShowSummary(false);
    setRetryMode(false);
  }, [sampleBatch]);

  if (filteredWords.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
        No words match the selected topics.
      </div>
    );
  }

  if (showSummary) {
    return (
      <QuizSummary
        correct={correct}
        total={questions.length}
        wrongAnswers={wrongAnswers}
        onContinue={handleContinue}
        onRestart={handleRestart}
        onRetryWrong={handleRetryWrong}
      />
    );
  }

  if (questions.length === 0) return null;

  const q = questions[questionIndex];

  return (
    <>
      <ModeIntro title="How the Quiz Works" storageKey="vocabulary-quiz">
        <p>
          Multiple-choice quiz in batches of {BATCH_SIZE}. For each French word,
          pick the correct English translation from four options. Words you get wrong
          and words you find difficult will appear more often.
        </p>
      </ModeIntro>
      <div style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
        Question {questionIndex + 1} / {questions.length}
      </div>
      <QuizCard
        key={`${batchKey}-${questionIndex}`}
        french={q.word.french}
        pos={q.word.pos}
        gender={q.word.gender}
        level={q.word.level}
        options={q.options}
        correctIndex={q.correctIndex}
        onAnswer={handleAnswer}
      />
    </>
  );
};

export default VocabularyQuiz;
