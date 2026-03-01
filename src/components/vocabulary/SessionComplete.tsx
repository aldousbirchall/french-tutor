import styles from './SessionComplete.module.css';

interface SessionCompleteProps {
  reviewedCount: number;
  newCount: number;
}

const SessionComplete: React.FC<SessionCompleteProps> = ({ reviewedCount, newCount }) => {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>🎉</div>
      <h2 className={styles.heading}>Session Complete!</h2>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{reviewedCount}</span>
          <span className={styles.statLabel}>Reviewed</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{newCount}</span>
          <span className={styles.statLabel}>New Learned</span>
        </div>
      </div>
    </div>
  );
};

export default SessionComplete;
