/**
 * Converts a duration in seconds to a human-readable string.
 * Examples: 9138 -> "2h 32m", 2700 -> "45m", 0 -> "0m"
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0m';
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}
