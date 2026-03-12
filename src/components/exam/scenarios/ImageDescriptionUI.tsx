import { useState, useCallback } from 'react';
import { useExamSession } from '../../../hooks/useExamSession';
import ExamScoreCard from '../ExamScoreCard';
import styles from './scenarios.module.css';

interface ImageDescriptionUIProps {
  scenarioId: string;
  onBack: () => void;
}

const ImageDescriptionUI: React.FC<ImageDescriptionUIProps> = ({ scenarioId, onBack }) => {
  const { scenario, messages, streaming, streamingText, examScores, sendMessage, submitForScoring, reset } = useExamSession(scenarioId);
  const [textInput, setTextInput] = useState('');
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  const imagePrompts = (scenario?.image_prompts as Array<{ id: string; description: string }>) ?? [];
  const currentImage = imagePrompts[currentImageIdx];

  const handleSend = useCallback((text: string) => {
    if (!text.trim() || streaming) return;
    sendMessage(text.trim());
    setTextInput('');
  }, [streaming, sendMessage]);

  if (examScores) {
    return (
      <ExamScoreCard
        scores={examScores.scores}
        totalPercent={examScores.totalPercent}
        feedback={examScores.feedback}
        onRetry={reset}
        onBack={onBack}
      />
    );
  }

  return (
    <div className={styles.scenario}>
      <h2 className={styles.title}>{scenario?.title ?? 'Image Description'}</h2>

      {currentImage && (
        <div className={styles.imageCard}>
          📷 {currentImage.description}
        </div>
      )}

      {imagePrompts.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {imagePrompts.map((_, i) => (
            <button
              key={i}
              className={`${styles.btn} ${i === currentImageIdx ? styles.btnPrimary : styles.btnSecondary}`}
              onClick={() => setCurrentImageIdx(i)}
            >
              Image {i + 1}
            </button>
          ))}
        </div>
      )}

      <div className={styles.messageArea}>
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? styles.userBubble : styles.assistantBubble}>
            {m.content}
          </div>
        ))}
        {streamingText && <div className={styles.assistantBubble}>{streamingText}</div>}
      </div>

      <div className={styles.inputRow}>
        <input className={styles.textInput} value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Describe what you see..." onKeyDown={(e) => e.key === 'Enter' && handleSend(textInput)} disabled={streaming} />
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => handleSend(textInput)} disabled={streaming}>Send</button>
      </div>

      <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => {
        const responses = messages.filter((m) => m.role === 'user').map((m) => m.content).join('\n');
        submitForScoring(responses);
      }} disabled={messages.length < 2}>Finish &amp; Score</button>
    </div>
  );
};

export default ImageDescriptionUI;
