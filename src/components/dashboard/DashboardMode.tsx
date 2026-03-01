import { useEffect, useState } from 'react';
import { useDatabaseService } from '../../contexts/DatabaseContext';
import vocabulary from '../../data/vocabulary';
import ReadinessGauge from './ReadinessGauge';
import ScheduleView from './ScheduleView';
import VocabCoverageChart from './VocabCoverageChart';
import ConversationStats from './ConversationStats';
import ExamScoresChart from './ExamScoresChart';
import ExportButton from './ExportButton';
import ModeIntro from '../shared/ModeIntro';
import styles from './DashboardMode.module.css';

function calculateStudyStreak(reviewDates: Date[]): number {
  if (reviewDates.length === 0) return 0;

  // Get unique review days (normalised to midnight)
  const uniqueDays = new Set<string>();
  for (const d of reviewDates) {
    const date = new Date(d);
    uniqueDays.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
  }

  // Sort days descending
  const sortedDays = Array.from(uniqueDays)
    .map((key) => {
      const [y, m, d] = key.split('-').map(Number);
      return new Date(y, m, d);
    })
    .sort((a, b) => b.getTime() - a.getTime());

  // Count consecutive days ending today (or yesterday)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let streak = 0;
  let checkDate = sortedDays[0].getTime() === today.getTime() ? today : yesterday;

  if (sortedDays[0].getTime() !== today.getTime() && sortedDays[0].getTime() !== yesterday.getTime()) {
    return 0;
  }

  for (const day of sortedDays) {
    if (day.getTime() === checkDate.getTime()) {
      streak++;
      checkDate = new Date(checkDate);
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (day.getTime() < checkDate.getTime()) {
      break;
    }
  }

  return streak;
}

const DashboardMode: React.FC = () => {
  const db = useDatabaseService();
  const [readiness, setReadiness] = useState(0);
  const [vocabLearned, setVocabLearned] = useState(0);
  const [studyStreak, setStudyStreak] = useState(0);

  useEffect(() => {
    (async () => {
      // Vocabulary coverage
      const allCards = await db.getAllCards();
      const learnedCards = allCards.filter((c) => c.reps > 0);
      setVocabLearned(learnedCards.length);
      const vocabCoverage = vocabulary.metadata.total_words > 0
        ? learnedCards.length / vocabulary.metadata.total_words
        : 0;

      // Study streak: consecutive days with at least one card reviewed
      const reviewDates = allCards
        .filter((c) => c.last_review != null)
        .map((c) => new Date(c.last_review as Date));
      setStudyStreak(calculateStudyStreak(reviewDates));

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
      <ModeIntro title="Your Study Hub" storageKey="dashboard">
        <p>
          Follow today's schedule and track your progress towards the Fide exam.
          Readiness combines vocabulary coverage (40%), exam scores (30%), and
          conversation frequency (30%).
        </p>
      </ModeIntro>
      <h1 className={styles.heading}>Dashboard</h1>
      <div className={styles.metrics}>
        <div className={styles.metricCard}>
          <span className={styles.metricValue}>{vocabLearned} / {vocabulary.metadata.total_words}</span>
          <span className={styles.metricLabel}>Vocabulary coverage</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricValue}>{studyStreak} day streak</span>
          <span className={styles.metricLabel}>Study streak: {studyStreak} consecutive days</span>
        </div>
      </div>
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
