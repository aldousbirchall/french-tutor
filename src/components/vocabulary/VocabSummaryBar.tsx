import styles from './VocabSummaryBar.module.css';

interface VocabSummaryBarProps {
  dueCount: number;
  newCount: number;
}

const VocabSummaryBar: React.FC<VocabSummaryBarProps> = ({ dueCount, newCount }) => {
  return (
    <div className={styles.bar}>
      <div className={styles.stat}>
        <span className={styles.statValue}>{dueCount}</span>
        <span className={styles.statLabel}>Due for Review</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.statValue}>{newCount}</span>
        <span className={styles.statLabel}>New Cards</span>
      </div>
    </div>
  );
};

export default VocabSummaryBar;
