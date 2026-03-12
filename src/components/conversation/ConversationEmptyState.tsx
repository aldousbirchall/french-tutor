import styles from './ConversationEmptyState.module.css';

interface ConversationEmptyStateProps {
  topic: string;
}

const ConversationEmptyState: React.FC<ConversationEmptyStateProps> = ({ topic }) => {
  return (
    <div className={styles.container}>
      <div className={styles.topicHint}>
        <span className={styles.topicLabel}>Topic:</span> {topic}
      </div>
      <div className={styles.suggestion}>
        Start with: <em>"Bonjour"</em> — the examiner will guide the conversation.
      </div>
      <div className={styles.hint}>
        ~8 exchanges, like a Fide oral task
      </div>
    </div>
  );
};

export default ConversationEmptyState;
