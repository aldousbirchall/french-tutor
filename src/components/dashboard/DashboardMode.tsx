import { useEffect, useState } from 'react';
import { useDatabaseService } from '../../contexts/DatabaseContext';
import vocabulary from '../../data/vocabulary';
import ReadinessGauge from './ReadinessGauge';
import ScheduleView from './ScheduleView';
import VocabCoverageChart from './VocabCoverageChart';
import ConversationStats from './ConversationStats';
import ExamScoresChart from './ExamScoresChart';
import ExportButton from './ExportButton';
import styles from './DashboardMode.module.css';

const DashboardMode: React.FC = () => {
  const db = useDatabaseService();
  const [readiness, setReadiness] = useState(0);

  useEffect(() => {
    (async () => {
      // Vocabulary coverage
      const allCards = await db.getAllCards();
      const learnedCards = allCards.filter((c) => c.reps > 0);
      const vocabCoverage = vocabulary.metadata.total_words > 0
        ? learnedCards.length / vocabulary.metadata.total_words
        : 0;

      // Normalised exam score
      const examResults = await db.getExamResults();
      const normExamScore = examResults.length > 0
        ? examResults.reduce((s, r) => s + r.totalPercent, 0) / examResults.length / 100
        : 0;

      // Conversation frequency
      const convos = await db.getConversations();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentConvos = convos.filter(
        (c) => new Date(c.timestamp) > sevenDaysAgo
      );
      const convFreq = Math.min(1.0, recentConvos.length / 7);

      // Readiness formula
      const readinessPercent = (0.4 * vocabCoverage + 0.3 * normExamScore + 0.3 * convFreq) * 100;
      setReadiness(readinessPercent);
    })();
  }, [db]);

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Dashboard</h1>
      <div className={styles.grid}>
        <ReadinessGauge percent={readiness} />
        <ScheduleView />
        <div className={styles.fullWidth}>
          <VocabCoverageChart />
        </div>
        <ConversationStats />
        <ExamScoresChart />
      </div>
      <div className={styles.actions}>
        <ExportButton />
      </div>
    </div>
  );
};

export default DashboardMode;
