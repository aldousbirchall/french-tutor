import vocabulary from '../../data/vocabulary';
import styles from './TopicFilter.module.css';

interface TopicFilterProps {
  selectedTopics: string[];
  onToggle: (topic: string) => void;
  onSelectAll?: () => void;
}

const TopicFilter: React.FC<TopicFilterProps> = ({ selectedTopics, onToggle, onSelectAll }) => {
  const topics = vocabulary.metadata.topics;
  const allSelected = selectedTopics.length === 0;

  return (
    <div className={styles.container}>
      {onSelectAll && (
        <button
          className={`${styles.chip} ${allSelected ? styles.active : ''}`}
          onClick={onSelectAll}
        >
          All
        </button>
      )}
      {topics.map((topic) => (
        <button
          key={topic}
          className={`${styles.chip} ${selectedTopics.includes(topic) ? styles.active : ''}`}
          onClick={() => onToggle(topic)}
        >
          {topic.replace(/_/g, ' ')}
        </button>
      ))}
    </div>
  );
};

export default TopicFilter;
