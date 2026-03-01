import vocabulary from '../../data/vocabulary';
import styles from './TopicFilter.module.css';

interface TopicFilterProps {
  selectedTopics: string[];
  onToggle: (topic: string) => void;
}

const TopicFilter: React.FC<TopicFilterProps> = ({ selectedTopics, onToggle }) => {
  const topics = vocabulary.metadata.topics;

  return (
    <div className={styles.container}>
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
