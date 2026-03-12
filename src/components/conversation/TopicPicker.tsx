import { useState } from 'react';
import openDiscussion from '../../data/open-discussion.json';
import rolePlay from '../../data/role-play.json';
import styles from './TopicPicker.module.css';

interface TopicPickerProps {
  onSelect: (topic: string) => void;
  suggestedTopic: string | null;
}

interface TopicGroup {
  label: string;
  topics: Array<{ id: string; title: string }>;
}

const groups: TopicGroup[] = [
  {
    label: 'Discussion Topics',
    topics: (openDiscussion.topics as Array<{ id: string; title: string }>).map((t) => ({
      id: t.id,
      title: t.title,
    })),
  },
  {
    label: 'Role Play Scenarios',
    topics: (rolePlay.scenarios as Array<{ id: string; role: string; scenario: string }>).map((s) => ({
      id: s.id,
      title: s.role.replace(/^a /, '').replace(/^an /, ''),
    })),
  },
];

const TopicPicker: React.FC<TopicPickerProps> = ({ onSelect, suggestedTopic }) => {
  const [customTopic, setCustomTopic] = useState('');

  return (
    <div className={styles.picker}>
      <h2 className={styles.heading}>Choose a topic</h2>

      {suggestedTopic && (
        <div className={styles.suggested}>
          <span className={styles.suggestedLabel}>Today's schedule:</span>
          <button className={styles.suggestedBtn} onClick={() => onSelect(suggestedTopic)}>
            {suggestedTopic}
          </button>
        </div>
      )}

      {groups.map((group) => (
        <div key={group.label} className={styles.group}>
          <h3 className={styles.groupLabel}>{group.label}</h3>
          <div className={styles.topicGrid}>
            {group.topics.map((t) => (
              <button
                key={t.id}
                className={styles.topicBtn}
                onClick={() => onSelect(t.title)}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className={styles.customRow}>
        <input
          className={styles.customInput}
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          placeholder="Or type a custom topic..."
          onKeyDown={(e) => e.key === 'Enter' && customTopic.trim() && onSelect(customTopic.trim())}
        />
        <button
          className={styles.customBtn}
          onClick={() => customTopic.trim() && onSelect(customTopic.trim())}
          disabled={!customTopic.trim()}
        >
          Start
        </button>
      </div>
    </div>
  );
};

export default TopicPicker;
