import { useState } from 'react';
import ExamOverview from './ExamOverview';
import VocabularyBrowser from './VocabularyBrowser';
import GrammarGuide from './GrammarGuide';
import ExamTasksGuide from './ExamTasksGuide';
import StudyScheduleOverview from './StudyScheduleOverview';
import UsefulLinks from './UsefulLinks';
import styles from './ReferenceMode.module.css';

const tabs = [
  { id: 'exam', label: 'Exam Overview' },
  { id: 'vocabulary', label: 'Vocabulary' },
  { id: 'grammar', label: 'Grammar' },
  { id: 'tasks', label: 'Exam Tasks' },
  { id: 'schedule', label: 'Study Schedule' },
  { id: 'links', label: 'Links' },
] as const;

type TabId = (typeof tabs)[number]['id'];

const ReferenceMode: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('exam');

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Reference</h1>
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
      <div className={styles.content}>
        {activeTab === 'exam' && <ExamOverview />}
        {activeTab === 'vocabulary' && <VocabularyBrowser />}
        {activeTab === 'grammar' && <GrammarGuide />}
        {activeTab === 'tasks' && <ExamTasksGuide />}
        {activeTab === 'schedule' && <StudyScheduleOverview />}
        {activeTab === 'links' && <UsefulLinks />}
      </div>
    </div>
  );
};

export default ReferenceMode;
