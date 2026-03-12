import styles from './ConversationMode.module.css';

const SCENARIO_TYPES = [
  { id: 'all', label: 'All' },
  { id: 'role_play', label: 'Role Play' },
  { id: 'open_discussion', label: 'Discussion' },
  { id: 'image_description', label: 'Image' },
  { id: 'sequential_images', label: 'Sequence' },
  { id: 'self_introduction', label: 'Intro' },
  { id: 'listening_comprehension', label: 'Listening' },
  { id: 'letter_writing', label: 'Letter' },
] as const;

interface ScenarioFilterProps {
  selected: string;
  onChange: (type: string) => void;
}

const ScenarioFilter: React.FC<ScenarioFilterProps> = ({ selected, onChange }) => {
  return (
    <div className={styles.scenarioFilter}>
      {SCENARIO_TYPES.map((t) => (
        <button
          key={t.id}
          className={`${styles.scenarioChip} ${selected === t.id ? styles.scenarioChipActive : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

export default ScenarioFilter;
