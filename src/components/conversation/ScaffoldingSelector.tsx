import type { ScaffoldingLevel } from '../../hooks/useConversation';
import styles from './ScaffoldingSelector.module.css';

interface ScaffoldingSelectorProps {
  level: ScaffoldingLevel;
  onChange: (level: ScaffoldingLevel) => void;
}

const levels: { value: ScaffoldingLevel; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const ScaffoldingSelector: React.FC<ScaffoldingSelectorProps> = ({ level, onChange }) => {
  return (
    <div className={styles.container}>
      <span className={styles.label}>Scaffolding:</span>
      {levels.map((l) => (
        <button
          key={l.value}
          className={`${styles.btn} ${level === l.value ? styles.active : ''}`}
          onClick={() => onChange(l.value)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
};

export default ScaffoldingSelector;
