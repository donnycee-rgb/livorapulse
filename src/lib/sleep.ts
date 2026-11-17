// ─── Sleep logged with times ─────────────────────────────────────────────────
// "Going to sleep" remembers the moment on the phone; "I'm awake" turns it into
// a sleep with a bedtime and a wake-up time. People who forget to tap type the
// two times instead. These are the rules both use; times are epoch ms.

export type SleepKind = 'night' | 'nap'

const MIN = 60000

/** Night sleep if it lasted 3+ hours or started in the evening or the small hours; otherwise a nap */
export function sleepKind(start: number, end: number): SleepKind {
  const hours = (end - start) / 3600000
  const startHour = new Date(start).getHours()
  return hours >= 3 || startHour >= 19 || startHour < 5 ? 'night' : 'nap'
}

/** "7h 25m", "45m", "8h" */
export function fmtDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  const h = Math.floor(m / 60)
  const r = m % 60
  if (h === 0) return `${r}m`
  return r === 0 ? `${h}h` : `${h}h ${r}m`
}

/** Clock time in the person's own format ("23:10" or "11:10 PM") */
export function fmtClock(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

/** "HH:MM" for an <input type="time"> */
export function toTimeInput(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * Bedtime and wake-up typed as clock times. The wake-up is on `wakeDay`;
 * a bedtime later than the wake-up (23:10 → 06:35) was the evening before.
 */
export function timesToSpan(bed: string, wake: string, wakeDay: Date): { start: number; end: number } {
  const at = (hhmm: string, day: Date) => {
    const [h, m] = hhmm.split(':').map(Number)
    const d = new Date(day)
    d.setHours(h, m, 0, 0)
    return d.getTime()
  }
  const end = at(wake, wakeDay)
  let start = at(bed, wakeDay)
  if (start >= end) start -= 24 * 60 * MIN
  return { start, end }
}

/** Why these times can't be saved, in plain words; null when they're fine. Matches the server's rule. */
export function spanProblem(start: number, end: number, now = Date.now()): string | null {
  const minutes = (end - start) / MIN
  if (end > now + 10 * MIN) return "The wake-up time is still to come. Check the time or the day."
  if (minutes < 10) return 'That\'s under 10 minutes, too short to count as sleep.'
  if (minutes > 20 * 60) return 'That\'s over 20 hours. Check the times.'
  return null
}

/** What to say when someone wakes up */
export function greeting(ms: number): string {
  const h = new Date(ms).getHours()
  if (h >= 4 && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 22) return 'Good evening'
  return 'Welcome back'
}
