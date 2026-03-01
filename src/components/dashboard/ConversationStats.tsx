import { useEffect, useState } from 'react';
import { useDatabaseService } from '../../contexts/DatabaseContext';
import { formatDuration } from '../../utils/formatters';
import { formatShortDate } from '../../utils/formatters';
import MiniLineChart from '../shared/MiniLineChart';
import styles from './ConversationStats.module.css';

interface Stats {
  totalSessions: number;
  averageDuration: number;
  trendData: Array<{ x: string; y: number }>;
}

const ConversationStats: React.FC = () => {
  const db = useDatabaseService();
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    averageDuration: 0,
    trendData: [],
  });

  useEffect(() => {
    (async () => {
      const convStats = await db.getConversationStats();

      // Build 14-day trend
      const now = new Date();
      const trendData: Array<{ x: string; y: number }> = [];
      for (let i = 13; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = convStats.recentSessions.filter((s) => {
          const sDate = new Date(s.timestamp).toISOString().split('T')[0];
          return sDate === dateStr;
        }).length;
        trendData.push({ x: formatShortDate(date), y: count });
      }

      setStats({
        totalSessions: convStats.totalSessions,
        averageDuration: convStats.averageDuration,
        trendData,
      });
    })();
  }, [db]);

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Conversation Practice</h3>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.totalSessions}</span>
          <span className={styles.statLabel}>Total Sessions</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {stats.totalSessions > 0 ? formatDuration(Math.round(stats.averageDuration)) : 'No data yet'}
          </span>
          <span className={styles.statLabel}>Avg Duration</span>
        </div>
      </div>
      <MiniLineChart data={stats.trendData} width={400} height={120} color="var(--color-primary)" />
    </div>
  );
};

export default ConversationStats;
