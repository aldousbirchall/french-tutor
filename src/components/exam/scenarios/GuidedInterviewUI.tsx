import { useState, useCallback } from 'react';
import { useExamSession } from '../../../hooks/useExamSession';
import VoiceInput from '../../shared/VoiceInput';
import ExamScoreCard from '../ExamScoreCard';
import styles from './scenarios.module.css';

interface GuidedInterviewUIProps {
  scenarioId: string;
  onBack: () => void;
}

const GuidedInterviewUI: React.FC<GuidedInterviewUIProps> = ({ scenarioId, onBack }) => {
  const { scenario, messages, streaming, streamingText, examScores, sendMessage, submitForScoring, reset } = useExamSession(scenarioId);
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState('');

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
      <h2 className={styles.title}>{scenario?.title ?? 'Self-Introduction'}</h2>
      <p className={styles.description}>{scenario?.description ?? ''}</p>

      <div className={styles.messageArea}>
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? styles.userBubble : styles.assistantBubble}>
            {m.content}
          </div>
        ))}
        {streamingText && <div className={styles.assistantBubble}>{streamingText}</div>}
      </div>

      <div className={styles.inputRow}>
        <VoiceInput
          onTranscript={(text) => handleSend(text)}
          lang="fr-CH"
          isListening={isListening}
          onListeningChange={setIsListening}
        />
        <input
          className={styles.textInput}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Your response..."
          onKeyDown={(e) => e.key === 'Enter' && handleSend(textInput)}
          disabled={streaming}
        />
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => handleSend(textInput)} disabled={streaming}>
          Send
        </button>
      </div>

      <button
        className={`${styles.btn} ${styles.btnSecondary}`}
        onClick={() => {
          const responses = messages.filter((m) => m.role === 'user').map((m) => m.content).join('\n');
          submitForScoring(responses);
        }}
        disabled={messages.length < 2}
      >
        Finish &amp; Score
      </button>
    </div>
  );
};

export default GuidedInterviewUI;
