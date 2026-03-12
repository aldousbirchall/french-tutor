import { useState, useMemo } from 'react';
import dialogues from '../../data/dialogues';
import ModeIntro from '../shared/ModeIntro';
import DialogueBubble from './DialogueBubble';
import styles from './DialogueReader.module.css';

interface DialogueReaderProps {
  scenarioFilter: string;
}

const DialogueReader: React.FC<DialogueReaderProps> = ({ scenarioFilter }) => {
  const filtered = useMemo(() => {
    if (scenarioFilter === 'all') return dialogues.dialogues;
    return dialogues.dialogues.filter((d) => d.scenario_type === scenarioFilter);
  }, [scenarioFilter]);

  const [index, setIndex] = useState<number | null>(null);
  const [showEnglish, setShowEnglish] = useState(false);

  // Reset selection when filter changes
  const [lastFilter, setLastFilter] = useState(scenarioFilter);
  if (scenarioFilter !== lastFilter) {
    setIndex(null);
    setLastFilter(scenarioFilter);
  }

  if (filtered.length === 0) {
    return <div className={styles.empty}>No dialogues match this filter.</div>;
  }

  // Dialogue picker view
  if (index === null) {
    return (
      <>
        <ModeIntro title="How Reading Mode Works" storageKey="conversation-read">
          <p>
            Browse model exam dialogues. Read the French, toggle English translations
            to check understanding. Key phrases are highlighted at the bottom.
          </p>
        </ModeIntro>
        <div className={styles.pickerList}>
          {filtered.map((d, i) => (
            <button
              key={i}
              className={styles.pickerItem}
              onClick={() => setIndex(i)}
            >
              <span className={styles.pickerTitle}>{d.title}</span>
              <span className={styles.pickerMeta}>
                {d.level} · {d.scenario_type.replace(/_/g, ' ')} · {d.turns.length} turns
              </span>
            </button>
          ))}
        </div>
      </>
    );
  }

  const dialogue = filtered[index];

  return (
    <>
      <div className={styles.reader}>
        <div className={styles.dialogueHeader}>
          <div>
            <div className={styles.dialogueTitle}>{dialogue.title}</div>
            <div className={styles.dialogueMeta}>
              {dialogue.level} · {dialogue.scenario_type.replace(/_/g, ' ')}
            </div>
          </div>
          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>English</span>
            <button
              className={`${styles.toggle} ${showEnglish ? styles.toggleOn : ''}`}
              onClick={() => setShowEnglish((v) => !v)}
              aria-label="Toggle English translations"
            />
          </div>
        </div>

        <div className={styles.context}>{dialogue.context}</div>

        <div className={styles.turns}>
          {dialogue.turns.map((turn, i) => (
            <DialogueBubble key={i} turn={turn} showEnglish={showEnglish} />
          ))}
        </div>

        {dialogue.key_phrases.length > 0 && (
          <div className={styles.keyPhrases}>
            <div className={styles.keyPhrasesTitle}>Key Phrases</div>
            <div className={styles.phraseList}>
              {dialogue.key_phrases.map((p, i) => (
                <span key={i} className={styles.phrase}>
                  <span className={styles.phraseFr}>{p.french}</span>
                  {showEnglish && <span className={styles.phraseEn}>{p.english}</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className={styles.nav}>
          <button
            className={styles.navBtn}
            onClick={() => setIndex(null)}
          >
            &larr; All dialogues
          </button>
          <span className={styles.navCount}>
            {index + 1} / {filtered.length}
          </span>
          <div className={styles.navArrows}>
            <button
              className={styles.navBtn}
              onClick={() => setIndex((i) => (i ?? 1) - 1)}
              disabled={index === 0}
            >
              Prev
            </button>
            <button
              className={styles.navBtn}
              onClick={() => setIndex((i) => (i ?? 0) + 1)}
              disabled={index >= filtered.length - 1}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DialogueReader;
