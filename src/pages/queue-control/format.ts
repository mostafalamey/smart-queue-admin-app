/**
 * Compact wait-time formatter:  "< 1m", "5m", "1h 23m"
 */
export function formatWaitTime(isoOrDate: string | Date): string {
  const ts =
    typeof isoOrDate === "string"
      ? new Date(isoOrDate).getTime()
      : isoOrDate.getTime();
  if (!Number.isFinite(ts)) return "--";
  const ms = Date.now() - ts;
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  if (totalMin < 1) return "< 1m";
  if (totalMin < 60) return `${totalMin}m`;
  const hr = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  return min > 0 ? `${hr}h ${min}m` : `${hr}h`;
}
