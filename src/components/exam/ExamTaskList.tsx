import scenarios from '../../data/scenarios';
import styles from './ExamTaskList.module.css';

interface ExamTaskListProps {
  onSelect: (scenarioId: string) => void;
}

const ExamTaskList: React.FC<ExamTaskListProps> = ({ onSelect }) => {
  const scenarioList = Object.values(scenarios);
  const oral = scenarioList.filter(
    (s) => (s.exam_section as string).includes('oral')
  );
  const written = scenarioList.filter(
    (s) => s.exam_section === 'written'
  );

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Oral</h2>
        <div className={styles.taskGrid}>
          {oral.map((s) => (
            <div
              key={s.id}
              className={styles.taskCard}
              onClick={() => onSelect(s.id)}
            >
              <div className={styles.taskTitle}>{s.title}</div>
              <div className={styles.taskDesc}>{s.description}</div>
              <div className={styles.taskMeta}>
                {s.level} &middot; {s.duration_minutes} min
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Written</h2>
        <div className={styles.taskGrid}>
          {written.map((s) => (
            <div
              key={s.id}
              className={styles.taskCard}
              onClick={() => onSelect(s.id)}
            >
              <div className={styles.taskTitle}>{s.title}</div>
              <div className={styles.taskDesc}>{s.description}</div>
              <div className={styles.taskMeta}>
                {s.level} &middot; {s.duration_minutes} min
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamTaskList;
