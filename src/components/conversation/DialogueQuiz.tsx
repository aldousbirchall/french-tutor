import { useState, useMemo, useCallback } from 'react';
import dialogues from '../../data/dialogues';
import ModeIntro from '../shared/ModeIntro';
import DialogueQuizCard from './DialogueQuizCard';
import QuizSummary from '../vocabulary/QuizSummary';
import type { ComprehensionQuestion, DialogueTurn } from '../../data/types';
import pickerStyles from './DialogueReader.module.css';

const BATCH_SIZE = 20;

interface ShuffledQuestion extends ComprehensionQuestion {
  shuffledOptions: string[];
  shuffledCorrectIndex: number;
}

interface QuizItem {
  question: ShuffledQuestion;
  turns: DialogueTurn[];
  dialogueTitle: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface DialogueQuizProps {
  scenarioFilter: string;
}

const DialogueQuiz: React.FC<DialogueQuizProps> = ({ scenarioFilter }) => {
  const filtered = useMemo(() => {
    if (scenarioFilter === 'all') return dialogues.dialogues;
    return dialogues.dialogues.filter((d) => d.scenario_type === scenarioFilter);
  }, [scenarioFilter]);

  // null = show picker, -1 = all dialogues, >= 0 = specific dialogue index
  const [selectedDialogue, setSelectedDialogue] = useState<number | null>(null);

  // Build pool of questions based on selection
  const allItems = useMemo(() => {
    const source = selectedDialogue !== null && selectedDialogue >= 0
      ? [filtered[selectedDialogue]]
      : filtered;

    const items: QuizItem[] = [];
    for (const d of source) {
      if (!d) continue;
      for (const q of d.questions) {
        const indices = shuffle([0, 1, 2, 3].slice(0, q.options.length));
        const shuffledOptions = indices.map((i) => q.options[i]);
        const shuffledCorrectIndex = indices.indexOf(q.correct_index);
        items.push({
          question: { ...q, shuffledOptions, shuffledCorrectIndex },
          turns: d.turns,
          dialogueTitle: d.title,
        });
      }
    }
    return items;
  }, [filtered, selectedDialogue]);

  const [pool, setPool] = useState(() => shuffle(allItems));
  const [batchStart, setBatchStart] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<{ french: string; english: string }[]>([]);
  const [wrongItems, setWrongItems] = useState<QuizItem[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [retryMode, setRetryMode] = useState(false);

  // Reset when filter changes
  const [lastFilter, setLastFilter] = useState(scenarioFilter);
  if (scenarioFilter !== lastFilter) {
    setSelectedDialogue(null);
    setPool([]);
    setBatchStart(0);
    setQuestionIndex(0);
    setCorrect(0);
    setWrongAnswers([]);
    setWrongItems([]);
    setShowSummary(false);
    setRetryMode(false);
    setLastFilter(scenarioFilter);
  }

  const startQuiz = useCallback((dialogueIndex: number | null) => {
    setSelectedDialogue(dialogueIndex);
    // Rebuild pool for new selection
    const source = dialogueIndex !== null && dialogueIndex >= 0
      ? [filtered[dialogueIndex]]
      : filtered;
    const items: QuizItem[] = [];
    for (const d of source) {
      if (!d) continue;
      for (const q of d.questions) {
        const indices = shuffle([0, 1, 2, 3].slice(0, q.options.length));
        const shuffledOptions = indices.map((i) => q.options[i]);
        const shuffledCorrectIndex = indices.indexOf(q.correct_index);
        items.push({
          question: { ...q, shuffledOptions, shuffledCorrectIndex },
          turns: d.turns,
          dialogueTitle: d.title,
        });
      }
    }
    setPool(shuffle(items));
    setBatchStart(0);
    setQuestionIndex(0);
    setCorrect(0);
    setWrongAnswers([]);
    setWrongItems([]);
    setShowSummary(false);
    setRetryMode(false);
  }, [filtered]);

  const batchItems = useMemo(() => {
    if (retryMode) return shuffle(wrongItems);
    const end = Math.min(batchStart + BATCH_SIZE, pool.length);
    return pool.slice(batchStart, end);
  }, [pool, batchStart, retryMode, wrongItems]);

  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (isCorrect) {
      setCorrect((prev) => prev + 1);
    } else {
      const item = batchItems[questionIndex];
      setWrongAnswers((prev) => [
        ...prev,
        {
          french: item.question.question,
          english: item.question.shuffledOptions[item.question.shuffledCorrectIndex],
        },
      ]);
      setWrongItems((prev) => [...prev, item]);
    }

    setTimeout(() => {
      const nextIdx = questionIndex + 1;
      if (nextIdx >= batchItems.length) {
        setShowSummary(true);
      } else {
        setQuestionIndex(nextIdx);
      }
    }, 400);
  }, [questionIndex, batchItems]);

  const handleRetryWrong = useCallback(() => {
    setQuestionIndex(0);
    setCorrect(0);
    setWrongAnswers([]);
    setShowSummary(false);
    setRetryMode(true);
  }, []);

  const handleContinue = useCallback(() => {
    if (!retryMode) {
      let nextStart = batchStart + BATCH_SIZE;
      if (nextStart >= pool.length) {
        setPool(shuffle(allItems));
        nextStart = 0;
      }
      setBatchStart(nextStart);
    }
    setQuestionIndex(0);
    setCorrect(0);
    setWrongAnswers([]);
    setWrongItems([]);
    setShowSummary(false);
    setRetryMode(false);
  }, [batchStart, pool.length, allItems, retryMode]);

  const handleRestart = useCallback(() => {
    setPool(shuffle(allItems));
    setBatchStart(0);
    setQuestionIndex(0);
    setCorrect(0);
    setWrongAnswers([]);
    setWrongItems([]);
    setShowSummary(false);
    setRetryMode(false);
  }, [allItems]);

  if (filtered.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
        No comprehension questions match this filter.
      </div>
    );
  }

  // Dialogue picker
  if (selectedDialogue === null) {
    return (
      <>
        <ModeIntro title="How Comprehension Quiz Works" storageKey="conversation-quiz">
          <p>
            Read dialogue excerpts and answer comprehension questions. Three types:
            main idea, appropriate response, and vocabulary in context. Batches of {BATCH_SIZE}.
          </p>
        </ModeIntro>
        <div className={pickerStyles.pickerList}>
          <button
            className={pickerStyles.pickerItem}
            onClick={() => startQuiz(-1)}
          >
            <span className={pickerStyles.pickerTitle}>All dialogues (mixed)</span>
            <span className={pickerStyles.pickerMeta}>
              {filtered.reduce((n, d) => n + d.questions.length, 0)} questions from {filtered.length} dialogues
            </span>
          </button>
          {filtered.map((d, i) => (
            <button
              key={i}
              className={pickerStyles.pickerItem}
              onClick={() => startQuiz(i)}
            >
              <span className={pickerStyles.pickerTitle}>{d.title}</span>
              <span className={pickerStyles.pickerMeta}>
                {d.level} · {d.scenario_type.replace(/_/g, ' ')} · {d.questions.length} questions
              </span>
            </button>
          ))}
        </div>
      </>
    );
  }

  if (showSummary) {
    return (
      <QuizSummary
        correct={correct}
        total={batchItems.length}
        wrongAnswers={wrongAnswers}
        onContinue={handleContinue}
        onRestart={handleRestart}
        onRetryWrong={handleRetryWrong}
      />
    );
  }

  if (batchItems.length === 0) return null;

  const item = batchItems[questionIndex];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <button
          className={pickerStyles.navBtn}
          onClick={() => setSelectedDialogue(null)}
        >
          &larr; All dialogues
        </button>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          Question {questionIndex + 1} / {batchItems.length}
        </span>
      </div>
      <DialogueQuizCard
        key={`${batchStart}-${questionIndex}`}
        question={item.question}
        turns={item.turns}
        dialogueTitle={item.dialogueTitle}
        onAnswer={handleAnswer}
      />
    </>
  );
};

export default DialogueQuiz;
