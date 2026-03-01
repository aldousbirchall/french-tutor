import type { ScaffoldingLevel } from '../../hooks/useConversation';
import styles from './ScaffoldingSelector.module.css';

interface ScaffoldingSelectorProps {
  level: ScaffoldingLevel;
  onChange: (level: ScaffoldingLevel) => void;
}

const levels: { value: ScaffoldingLevel; label: string; description: string }[] = [
  { value: 'high', label: 'High', description: 'Translations, sentence starters, explicit corrections' },
  { value: 'medium', label: 'Medium', description: 'Corrections by rephrasing, no translations' },
  { value: 'low', label: 'Low', description: 'Natural conversation, minimal intervention' },
];

const ScaffoldingSelector: React.FC<ScaffoldingSelectorProps> = ({ level, onChange }) => {
  const activeLevel = levels.find((l) => l.value === level);

  return (
    <div className={styles.container}>
      <div className={styles.row}>
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
      {activeLevel && (
        <div className={styles.description}>{activeLevel.description}</div>
      )}
    </div>
  );
};

export default ScaffoldingSelector;
