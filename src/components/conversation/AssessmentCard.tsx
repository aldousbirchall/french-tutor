import { formatDuration } from '../../utils/formatters';
import styles from './AssessmentCard.module.css';

interface AssessmentCardProps {
  assessment: string;
  duration: number;
  wordCount: number;
  onNewConversation: () => void;
}

const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
  duration,
  wordCount,
  onNewConversation,
}) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.heading}>Session Assessment</h3>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{formatDuration(duration)}</span>
          <span className={styles.statLabel}>Duration</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{wordCount}</span>
          <span className={styles.statLabel}>Words Written</span>
        </div>
      </div>
      <p className={styles.text}>{assessment}</p>
      <button className={styles.newBtn} onClick={onNewConversation}>
        Start New Conversation
      </button>
    </div>
  );
};

export default AssessmentCard;
