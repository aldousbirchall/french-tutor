import { useState } from 'react';
import { useClaudeAvailability } from '../../contexts/ClaudeContext';
import LiveConversation from './LiveConversation';
import DialogueReader from './DialogueReader';
import DialogueQuiz from './DialogueQuiz';
import ScenarioFilter from './ScenarioFilter';
import styles from './ConversationMode.module.css';

const tabs = [
  { id: 'live', label: 'Live', requiresClaude: true },
  { id: 'read', label: 'Read', requiresClaude: false },
  { id: 'quiz', label: 'Quiz', requiresClaude: false },
] as const;

type TabId = (typeof tabs)[number]['id'];

const ConversationMode: React.FC = () => {
  const { available } = useClaudeAvailability();
  const [activeTab, setActiveTab] = useState<TabId>(available ? 'live' : 'read');
  const [scenarioFilter, setScenarioFilter] = useState('all');

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Conversation</h1>
      <div className={styles.tabBar}>
        {tabs.map((tab) => {
          const disabled = tab.requiresClaude && !available;
          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => !disabled && setActiveTab(tab.id)}
              disabled={disabled}
              title={disabled ? 'Requires Claude AI connection' : undefined}
            >
              {tab.label}
              {disabled && ' (offline)'}
            </button>
          );
        })}
      </div>
      {activeTab !== 'live' && (
        <ScenarioFilter selected={scenarioFilter} onChange={setScenarioFilter} />
      )}
      <div className={styles.content}>
        {activeTab === 'live' && <LiveConversation />}
        {activeTab === 'read' && <DialogueReader scenarioFilter={scenarioFilter} />}
        {activeTab === 'quiz' && <DialogueQuiz scenarioFilter={scenarioFilter} />}
      </div>
    </div>
  );
};

export default ConversationMode;
