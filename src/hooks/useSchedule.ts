import { useState, useEffect, useCallback } from 'react';
import { useDatabaseService } from '../contexts/DatabaseContext';
import schedule from '../data/schedule';
import { getCurrentStudyDay } from '../utils/dateUtils';
import type { StudyDay } from '../data/types';
import type { ScheduleProgress } from '../services/types';

export function useSchedule() {
  const db = useDatabaseService();
  const [currentDay, setCurrentDay] = useState<StudyDay | null>(null);
  const [studyDayNumber, setStudyDayNumber] = useState<number | null>(null);
  const [progress, setProgress] = useState<ScheduleProgress[]>([]);

  const loadProgress = useCallback(async () => {
    const prog = await db.getScheduleProgress();
    setProgress(prog);
  }, [db]);

  useEffect(() => {
    const today = new Date();
    const dayNum = getCurrentStudyDay(schedule.start_date, today, schedule.total_days);
    setStudyDayNumber(dayNum);

    if (dayNum !== null) {
      const day = schedule.days.find((d) => d.day === dayNum) ?? null;
      setCurrentDay(day);
    } else {
      setCurrentDay(null);
    }

    loadProgress();
  }, [loadProgress]);

  const isActivityComplete = useCallback(
    (day: number, activityIndex: number): boolean => {
      return progress.some(
        (p) => p.day === day && p.activityIndex === activityIndex && p.completed
      );
    },
    [progress]
  );

  const markComplete = useCallback(
    async (day: number, activityIndex: number) => {
      await db.markActivityComplete(day, activityIndex);
      await loadProgress();
    },
    [db, loadProgress]
  );

  const getPhase = useCallback((): string => {
    if (!studyDayNumber) return 'Not started';
    const phase = schedule.phases.find(
      (p) => studyDayNumber >= p.days[0] && studyDayNumber <= p.days[1]
    );
    return phase?.name ?? 'Complete';
  }, [studyDayNumber]);

  return {
    schedule,
    currentDay,
    studyDayNumber,
    progress,
    isActivityComplete,
    markComplete,
    getPhase,
  };
}
