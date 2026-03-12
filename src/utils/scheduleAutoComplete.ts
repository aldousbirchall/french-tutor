import schedule from '../data/schedule';

/**
 * Auto-mark all activities of a given mode for the current study day.
 * Called when a user completes meaningful work in a mode.
 */
export function autoCompleteActivities(
  mode: string,
  studyDayNumber: number | null,
  isActivityComplete: (day: number, idx: number) => boolean,
  markComplete: (day: number, idx: number) => void,
): void {
  if (!studyDayNumber) return;
  const day = schedule.days.find((d) => d.day === studyDayNumber);
  if (!day) return;
  day.activities.forEach((act, idx) => {
    if (act.mode === mode && !isActivityComplete(day.day, idx)) {
      markComplete(day.day, idx);
    }
  });
}
