/**
 * Calculate the current study day number (1-based) given the schedule start date.
 * Skips weekends (Saturday=6, Sunday=0).
 * Returns null if today is before start or after the study period.
 */
export function getCurrentStudyDay(
  startDate: string,
  today: Date,
  totalDays: number
): number | null {
  const start = new Date(startDate + 'T00:00:00');
  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startNorm = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  if (todayNorm < startNorm) return null;

  let studyDay = 0;
  const current = new Date(startNorm);

  while (current <= todayNorm) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) {
      studyDay++;
      if (
        current.getFullYear() === todayNorm.getFullYear() &&
        current.getMonth() === todayNorm.getMonth() &&
        current.getDate() === todayNorm.getDate()
      ) {
        return studyDay <= totalDays ? studyDay : null;
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return null;
}

/**
 * Check if a date falls on a weekend.
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Get a human-readable date string from an ISO date.
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
