import { useEffect, useState } from 'react';
import { useDatabaseService } from '../../contexts/DatabaseContext';
import vocabulary from '../../data/vocabulary';
import styles from './VocabCoverageChart.module.css';

interface TopicCoverage {
  topic: string;
  learned: number;
  total: number;
  percent: number;
}

const VocabCoverageChart: React.FC = () => {
  const db = useDatabaseService();
  const [totalLearned, setTotalLearned] = useState(0);
  const [topicCoverage, setTopicCoverage] = useState<TopicCoverage[]>([]);

  useEffect(() => {
    (async () => {
      const allCards = await db.getAllCards();
      const learnedCards = allCards.filter((c) => c.reps > 0);
      setTotalLearned(learnedCards.length);

      // Per-topic breakdown
      const topicWordCounts: Record<string, number> = {};
      const topicLearnedCounts: Record<string, number> = {};

      vocabulary.words.forEach((w) => {
        topicWordCounts[w.topic] = (topicWordCounts[w.topic] ?? 0) + 1;
      });

      learnedCards.forEach((c) => {
        topicLearnedCounts[c.topic] = (topicLearnedCounts[c.topic] ?? 0) + 1;
      });

      const coverage = vocabulary.metadata.topics.map((topic) => {
        const total = topicWordCounts[topic] ?? 0;
        const learned = topicLearnedCounts[topic] ?? 0;
        return {
          topic,
          learned,
          total,
          percent: total > 0 ? Math.round((learned / total) * 100) : 0,
        };
      });

      setTopicCoverage(coverage);
    })();
  }, [db]);

  const totalWords = vocabulary.metadata.total_words;

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Vocabulary Coverage</h3>
      <div className={styles.summary}>
        {totalLearned} / {totalWords} words learned ({totalWords > 0 ? Math.round((totalLearned / totalWords) * 100) : 0}%)
      </div>
      <div className={styles.topicBars}>
        {topicCoverage.map((tc) => (
          <div key={tc.topic} className={styles.topicRow}>
            <span className={styles.topicLabel}>{tc.topic.replace(/_/g, ' ')}</span>
            <div className={styles.barBg}>
              <div className={styles.barFill} style={{ width: `${tc.percent}%` }} />
            </div>
            <span className={styles.topicPercent}>{tc.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VocabCoverageChart;
