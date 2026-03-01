import { useState, useMemo } from 'react';
import vocabulary from '../../data/vocabulary';
import styles from './VocabularyBrowser.module.css';

const VocabularyBrowser: React.FC = () => {
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vocabulary.words.filter((w) => {
      if (topicFilter && w.topic !== topicFilter) return false;
      if (levelFilter && w.level !== levelFilter) return false;
      if (q && !w.french.toLowerCase().includes(q) && !w.english.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [search, topicFilter, levelFilter]);

  return (
    <div>
      <div className={styles.filters}>
        <input
          className={styles.search}
          type="text"
          placeholder="Search French or English..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.select}
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
        >
          <option value="">All topics</option>
          {vocabulary.metadata.topics.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select
          className={styles.select}
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
        >
          <option value="">All levels</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
        </select>
      </div>
      <div className={styles.count}>
        {filtered.length} of {vocabulary.metadata.total_words} words
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>French</th>
              <th>English</th>
              <th>Topic</th>
              <th>Level</th>
              <th>Example</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <tr key={w.id}>
                <td className={styles.french}>{w.french}</td>
                <td>{w.english}</td>
                <td>{w.topic.replace(/_/g, ' ')}</td>
                <td>{w.level}</td>
                <td className={styles.example}>{w.example_fr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VocabularyBrowser;
