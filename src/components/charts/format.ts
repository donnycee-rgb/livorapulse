/** "45m", "1h", "1h 30m" */
export function fmtMin(min: number): string {
  const m = Math.round(min)
  if (m < 60) return `${m}m`
  return m % 60 === 0 ? `${m / 60}h` : `${Math.floor(m / 60)}h ${m % 60}m`
}
