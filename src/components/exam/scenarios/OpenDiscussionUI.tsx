import { useState, useCallback } from 'react';
import { useExamSession } from '../../../hooks/useExamSession';
import ExamScoreCard from '../ExamScoreCard';
import styles from './scenarios.module.css';

interface OpenDiscussionUIProps {
  scenarioId: string;
  onBack: () => void;
}

const OpenDiscussionUI: React.FC<OpenDiscussionUIProps> = ({ scenarioId, onBack }) => {
  const { scenario, messages, streaming, streamingText, examScores, sendMessage, submitForScoring, reset } = useExamSession(scenarioId);
  const [textInput, setTextInput] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const topics = (scenario?.topics as Array<{ id: string; title: string }>) ?? [];
  const current = topics.find((t) => t.id === selectedTopic);

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

  if (!selectedTopic) {
    return (
      <div className={styles.scenario}>
        <h2 className={styles.title}>Choose a Discussion Topic</h2>
        {topics.map((t) => (
          <div key={t.id} className={styles.promptCard} style={{ cursor: 'pointer' }} onClick={() => setSelectedTopic(t.id)}>
            <strong>{t.title}</strong>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.scenario}>
      <h2 className={styles.title}>{current?.title ?? 'Open Discussion'}</h2>

      <div className={styles.messageArea}>
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? styles.userBubble : styles.assistantBubble}>{m.content}</div>
        ))}
        {streamingText && <div className={styles.assistantBubble}>{streamingText}</div>}
      </div>

      <div className={styles.inputRow}>
        <input className={styles.textInput} value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Your response..." onKeyDown={(e) => e.key === 'Enter' && handleSend(textInput)} disabled={streaming} />
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => handleSend(textInput)} disabled={streaming}>Send</button>
      </div>

      <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => {
        const responses = messages.filter((m) => m.role === 'user').map((m) => m.content).join('\n');
        submitForScoring(responses);
      }} disabled={messages.length < 2}>Finish &amp; Score</button>
    </div>
  );
};

export default OpenDiscussionUI;
