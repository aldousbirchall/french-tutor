import { useState, useCallback, useEffect } from 'react';
import { useExamSession } from '../../../hooks/useExamSession';
import { matchTaskHint } from '../../../utils/taskHintMatch';
import ExamScoreCard from '../ExamScoreCard';
import styles from './scenarios.module.css';

interface RolePlayUIProps {
  scenarioId: string;
  taskHint?: string;
  subScenarioId?: string;
  onBack: () => void;
}

const RolePlayUI: React.FC<RolePlayUIProps> = ({ scenarioId, taskHint, subScenarioId, onBack }) => {
  const { scenario, messages, streaming, streamingText, examScores, sendMessage, submitForScoring, reset } = useExamSession(scenarioId);
  const [textInput, setTextInput] = useState('');

  const subScenarios = (scenario?.scenarios as Array<{ id: string; role: string; scenario: string; opening: string }>) ?? [];
  const autoMatch = subScenarioId ?? matchTaskHint(taskHint, subScenarios.map((s) => ({ id: s.id, desc: `${s.role} ${s.scenario}` }))) ?? undefined;
  const [selectedScenario, setSelectedScenario] = useState<string | undefined>(autoMatch);
  const current = subScenarios.find((s) => s.id === selectedScenario) ?? subScenarios[0];

  // Auto-start with opening message
  useEffect(() => {
    if (current && messages.length === 0 && !streaming) {
      sendMessage(current.opening);
    }
  }, [current, messages.length, streaming, sendMessage]);

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

  if (!selectedScenario && subScenarios.length > 1) {
    return (
      <div className={styles.scenario}>
        <h2 className={styles.title}>Choose a Role-Play Scenario</h2>
        {subScenarios.map((s) => (
          <div key={s.id} className={styles.promptCard} style={{ cursor: 'pointer' }} onClick={() => setSelectedScenario(s.id)}>
            <strong>{s.role}</strong>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{s.scenario}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.scenario}>
      <h2 className={styles.title}>{scenario?.title ?? 'Role-Play'}</h2>
      {current && <p className={styles.description}>{current.scenario}</p>}

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

export default RolePlayUI;
