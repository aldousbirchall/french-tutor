import { useState } from 'react';
import { useSchedule } from '../../hooks/useSchedule';
import { formatDate } from '../../utils/dateUtils';
import schedule from '../../data/schedule';
import ActivityItem from './ActivityItem';
import type { StudyDay } from '../../data/types';
import styles from './ScheduleView.module.css';

const ScheduleView: React.FC = () => {
  const { studyDayNumber, isActivityComplete, markComplete } = useSchedule();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const allDays: StudyDay[] = schedule.days;
  // Only show days up to today (or all if study period is over)
  const todayNum = studyDayNumber ?? schedule.total_days;
  const visibleDays = allDays.filter((d) => d.day <= todayNum);

  const getPhaseForDay = (dayNum: number): string => {
    const phase = schedule.phases.find(
      (p) => dayNum >= p.days[0] && dayNum <= p.days[1]
    );
    return phase?.name ?? '';
  };

  const isDayComplete = (day: StudyDay): boolean => {
    return day.activities.every((_, idx) => isActivityComplete(day.day, idx));
  };

  const getDayCompletionCount = (day: StudyDay): number => {
    return day.activities.filter((_, idx) => isActivityComplete(day.day, idx)).length;
  };

  const viewing = selectedDay !== null ? allDays.find((d) => d.day === selectedDay) : null;

  // Detail view for a selected day
  if (viewing) {
    const isToday = viewing.day === studyDayNumber;
    return (
      <div className={styles.container}>
        <button className={styles.backBtn} onClick={() => setSelectedDay(null)}>
          &larr; All days
        </button>
        <h3 className={styles.heading}>
          Day {viewing.day}: {viewing.title}
          {isToday && <span className={styles.todayBadge}>Today</span>}
        </h3>
        <div className={styles.dayInfo}>
          {formatDate(viewing.date)} · {getPhaseForDay(viewing.day)} phase · {viewing.grammar_focus}
        </div>
        <div className={styles.activities}>
          {viewing.activities.map((activity, idx) => (
            <ActivityItem
              key={idx}
              activity={activity}
              index={idx}
              day={viewing.day}
              completed={isActivityComplete(viewing.day, idx)}
              onMarkComplete={markComplete}
            />
          ))}
        </div>
      </div>
    );
  }

  // Day list view
  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Study Schedule</h3>
      {visibleDays.length === 0 && (
        <div className={styles.notStarted}>Study period has not started yet.</div>
      )}
      <div className={styles.dayList}>
        {visibleDays.map((day) => {
          const complete = isDayComplete(day);
          const completedCount = getDayCompletionCount(day);
          const total = day.activities.length;
          const isToday = day.day === studyDayNumber;
          const phase = getPhaseForDay(day.day);

          return (
            <button
              key={day.day}
              className={`${styles.dayCard} ${complete ? styles.dayComplete : ''} ${isToday ? styles.dayCurrent : ''}`}
              onClick={() => setSelectedDay(day.day)}
            >
              <div className={styles.dayCardLeft}>
                <span className={styles.dayNum}>
                  {day.day}
                </span>
                <div className={styles.dayCardInfo}>
                  <span className={styles.dayTitle}>
                    {day.title}
                    {isToday && <span className={styles.todayBadge}>Today</span>}
                  </span>
                  <span className={styles.dayMeta}>
                    {formatDate(day.date)} · {phase}
                  </span>
                </div>
              </div>
              <span className={styles.dayProgress}>
                {complete ? '\u2713' : `${completedCount}/${total}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleView;
