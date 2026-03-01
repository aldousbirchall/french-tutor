import styles from './ReadinessGauge.module.css';

interface ReadinessGaugeProps {
  percent: number;
}

const ReadinessGauge: React.FC<ReadinessGaugeProps> = ({ percent }) => {
  const color =
    percent >= 70
      ? 'var(--color-success)'
      : percent >= 40
        ? 'var(--color-warning)'
        : 'var(--color-error)';

  return (
    <div className={styles.gauge}>
      <div className={styles.title}>Exam Readiness</div>
      <div className={styles.value} style={{ color }}>
        {Math.round(percent)}%
      </div>
      <div className={styles.label}>estimated readiness</div>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${Math.min(100, percent)}%`, background: color }}
        />
      </div>
    </div>
  );
};

export default ReadinessGauge;
