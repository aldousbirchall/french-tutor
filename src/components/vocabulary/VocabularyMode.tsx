import { useState, useCallback } from 'react';
import { useSchedule } from '../../hooks/useSchedule';
import TopicFilter from './TopicFilter';
import SpokenVocabulary from './SpokenVocabulary';
import SimpleFlashcard from './SimpleFlashcard';
import VocabularyQuiz from './VocabularyQuiz';
import ConjugationDrill from './ConjugationDrill';
import styles from './VocabularyMode.module.css';

const tabs = [
  { id: 'spoken', label: 'Spoken' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'conjugation', label: 'Conjugation' },
] as const;

type TabId = (typeof tabs)[number]['id'];

const VocabularyMode: React.FC = () => {
  const { currentDay } = useSchedule();
  const [activeTab, setActiveTab] = useState<TabId>('spoken');
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    () => currentDay?.topics ?? []
  );

  const handleToggleTopic = useCallback((topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedTopics([]);
  }, []);

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Vocabulary</h1>
      <div className={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab !== 'conjugation' && (
        <TopicFilter
          selectedTopics={selectedTopics}
          onToggle={handleToggleTopic}
          onSelectAll={handleSelectAll}
        />
      )}
      <div className={styles.content}>
        {activeTab === 'spoken' && <SpokenVocabulary selectedTopics={selectedTopics} />}
        {activeTab === 'flashcards' && <SimpleFlashcard selectedTopics={selectedTopics} />}
        {activeTab === 'quiz' && <VocabularyQuiz selectedTopics={selectedTopics} />}
        {activeTab === 'conjugation' && <ConjugationDrill />}
      </div>
    </div>
  );
};

export default VocabularyMode;
