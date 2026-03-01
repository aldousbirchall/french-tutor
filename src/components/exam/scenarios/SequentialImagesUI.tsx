import { useState, useCallback } from 'react';
import { useExamSession } from '../../../hooks/useExamSession';
import VoiceInput from '../../shared/VoiceInput';
import ExamScoreCard from '../ExamScoreCard';
import styles from './scenarios.module.css';

interface SequentialImagesUIProps {
  scenarioId: string;
  onBack: () => void;
}

const SequentialImagesUI: React.FC<SequentialImagesUIProps> = ({ scenarioId, onBack }) => {
  const { scenario, messages, streaming, streamingText, examScores, sendMessage, submitForScoring, reset } = useExamSession(scenarioId);
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [selectedSequence, setSelectedSequence] = useState<string | null>(null);

  const sequences = (scenario?.sequences as Array<{ id: string; title: string; images: string[] }>) ?? [];
  const current = sequences.find((s) => s.id === selectedSequence);

  const handleSend = useCallback((text: string) => {
    if (!text.trim() || streaming) return;
    sendMessage(text.trim());
    setTextInput('');
  }, [streaming, sendMessage]);

  if (examScores) {
    return (
      <ExamScoreCard scores={examScores.scores} totalPercent={examScores.totalPercent} feedback={examScores.feedback} onRetry={reset} onBack={onBack} />
    );
  }

  if (!selectedSequence) {
    return (
      <div className={styles.scenario}>
        <h2 className={styles.title}>Choose an Image Sequence</h2>
        {sequences.map((s) => (
          <div key={s.id} className={styles.promptCard} style={{ cursor: 'pointer' }} onClick={() => setSelectedSequence(s.id)}>
            <strong>{s.title}</strong>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.scenario}>
      <h2 className={styles.title}>{current?.title ?? 'Sequential Images'}</h2>

      {current && (
        <div className={styles.imageSequence}>
          {current.images.map((img, i) => (
            <div key={i} className={styles.sequenceItem}>
              <span className={styles.sequenceNumber}>{i + 1}</span>
              <span className={styles.sequenceText}>{img}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.messageArea} style={{ marginTop: 'var(--space-4)' }}>
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? styles.userBubble : styles.assistantBubble}>{m.content}</div>
        ))}
        {streamingText && <div className={styles.assistantBubble}>{streamingText}</div>}
      </div>

      <div className={styles.inputRow}>
        <VoiceInput onTranscript={(text) => handleSend(text)} lang="fr-CH" isListening={isListening} onListeningChange={setIsListening} />
        <input className={styles.textInput} value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Narrate the story..." onKeyDown={(e) => e.key === 'Enter' && handleSend(textInput)} disabled={streaming} />
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => handleSend(textInput)} disabled={streaming}>Send</button>
      </div>

      <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => {
        const responses = messages.filter((m) => m.role === 'user').map((m) => m.content).join('\n');
        submitForScoring(responses);
      }} disabled={messages.length < 1}>Finish &amp; Score</button>
    </div>
  );
};

export default SequentialImagesUI;
