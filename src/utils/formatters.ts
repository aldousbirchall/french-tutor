/**
 * Format seconds to mm:ss.
 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format a number as a percentage string.
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Format an ISO date string for display.
 */
export function formatDisplayDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a Date object to a short display string.
 */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}
