import styles from './ThinkingIndicator.module.css';

const ThinkingIndicator: React.FC = () => {
  return (
    <div className={styles.bubble}>
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </div>
  );
};

export default ThinkingIndicator;
