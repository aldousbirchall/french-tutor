import styles from './ExamScoreCard.module.css';

interface ExamScoreCardProps {
  scores: Record<string, number>;
  totalPercent: number;
  feedback: string;
  onRetry: () => void;
  onBack: () => void;
}

const ExamScoreCard: React.FC<ExamScoreCardProps> = ({
  scores,
  totalPercent,
  feedback,
  onRetry,
  onBack,
}) => {
  const scoreClass =
    totalPercent >= 70
      ? styles.scoreGood
      : totalPercent >= 50
        ? styles.scoreMid
        : styles.scoreLow;

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>Exam Results</h2>
      <div className={styles.totalScore}>
        <span className={`${styles.totalValue} ${scoreClass}`}>
          {totalPercent}%
        </span>
      </div>
      <div className={styles.categories}>
        {Object.entries(scores).map(([category, score]) => (
          <div key={category} className={styles.category}>
            <span className={styles.categoryName}>
              {category.replace(/_/g, ' ')}
            </span>
            <span className={styles.categoryScore}>{score}</span>
          </div>
        ))}
      </div>
      {feedback && <div className={styles.feedback}>{feedback}</div>}
      <div className={styles.actions}>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onRetry}>
          Try Again
        </button>
        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onBack}>
          Back to Tasks
        </button>
      </div>
    </div>
  );
};

export default ExamScoreCard;
