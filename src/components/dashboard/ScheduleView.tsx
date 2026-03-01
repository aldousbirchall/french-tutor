import { useSchedule } from '../../hooks/useSchedule';
import { formatDate } from '../../utils/dateUtils';
import ActivityItem from './ActivityItem';
import styles from './ScheduleView.module.css';

const ScheduleView: React.FC = () => {
  const { currentDay, studyDayNumber, getPhase, isActivityComplete, markComplete } = useSchedule();

  if (!studyDayNumber || !currentDay) {
    return (
      <div className={styles.container}>
        <h3 className={styles.heading}>Today&apos;s Schedule</h3>
        <div className={styles.notStarted}>
          {studyDayNumber === null
            ? 'Study period has not started yet or is complete.'
            : 'No schedule data for today.'}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>
        Day {studyDayNumber}: {currentDay.title}
      </h3>
      <div className={styles.dayInfo}>
        {formatDate(currentDay.date)} &middot; {getPhase()} phase &middot; {currentDay.grammar_focus}
      </div>
      <div className={styles.activities}>
        {currentDay.activities.map((activity, idx) => (
          <ActivityItem
            key={idx}
            activity={activity}
            index={idx}
            day={currentDay.day}
            completed={isActivityComplete(currentDay.day, idx)}
            onMarkComplete={markComplete}
          />
        ))}
      </div>
    </div>
  );
};

export default ScheduleView;
