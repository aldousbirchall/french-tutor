import styles from './ConversationEmptyState.module.css';

interface ConversationEmptyStateProps {
  topic: string;
}

const ConversationEmptyState: React.FC<ConversationEmptyStateProps> = ({ topic }) => {
  return (
    <div className={styles.container}>
      <div className={styles.steps}>
        <div className={styles.step}>
          <span className={styles.stepNum}>1</span>
          <span>Speak or type in French</span>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNum}>2</span>
          <span>The tutor responds and reads aloud</span>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNum}>3</span>
          <span>Continue naturally</span>
        </div>
      </div>
      <div className={styles.topicHint}>
        <span className={styles.topicLabel}>Today's topic:</span> {topic}
      </div>
      <div className={styles.suggestion}>
        Try: <em>"Bonjour, je voudrais parler de..."</em>
      </div>
      <div className={styles.hint}>
        Press <kbd className={styles.kbd}>Space</kbd> to start voice input
      </div>
    </div>
  );
};

export default ConversationEmptyState;
