import { useEffect, useState } from 'react';
import { useDatabaseService } from '../../contexts/DatabaseContext';
import { formatShortDate } from '../../utils/formatters';
import MiniLineChart from '../shared/MiniLineChart';
import styles from './ExamScoresChart.module.css';

interface ExamStats {
  oralAvg: number;
  writtenAvg: number;
  recentScores: Array<{ x: string; y: number }>;
}

const ExamScoresChart: React.FC = () => {
  const db = useDatabaseService();
  const [stats, setStats] = useState<ExamStats>({
    oralAvg: 0,
    writtenAvg: 0,
    recentScores: [],
  });

  useEffect(() => {
    (async () => {
      const all = await db.getExamResults();
      const oral = all.filter((r) => r.taskType === 'oral');
      const written = all.filter((r) => r.taskType === 'written');

      const oralAvg = oral.length > 0
        ? Math.round(oral.reduce((s, r) => s + r.totalPercent, 0) / oral.length)
        : 0;
      const writtenAvg = written.length > 0
        ? Math.round(written.reduce((s, r) => s + r.totalPercent, 0) / written.length)
        : 0;

      // Last 10 results for line chart
      const recent = all.slice(0, 10).reverse().map((r) => ({
        x: formatShortDate(new Date(r.timestamp)),
        y: r.totalPercent,
      }));

      setStats({ oralAvg, writtenAvg, recentScores: recent });
    })();
  }, [db]);

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Exam Scores</h3>
      <div className={styles.averages}>
        <div className={styles.avg}>
          <span className={styles.avgValue}>
            {stats.oralAvg > 0 ? `${stats.oralAvg}%` : 'No data yet'}
          </span>
          <span className={styles.avgLabel}>Oral Average</span>
        </div>
        <div className={styles.avg}>
          <span className={styles.avgValue}>
            {stats.writtenAvg > 0 ? `${stats.writtenAvg}%` : 'No data yet'}
          </span>
          <span className={styles.avgLabel}>Written Average</span>
        </div>
      </div>
      <MiniLineChart data={stats.recentScores} width={400} height={120} color="var(--color-success)" />
    </div>
  );
};

export default ExamScoresChart;
