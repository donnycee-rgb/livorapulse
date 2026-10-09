import type { DayKey } from '../data/types'

export function getDayKey(): DayKey {
  const wd = new Date().toLocaleDateString('en-US', { weekday: 'short' })
  const allowed = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  return (allowed.has(wd) ? wd : 'Mon') as DayKey
}

/** Shift a YYYY-MM-DD key by whole days (calendar arithmetic, no timezone involved) */
export function addDaysToKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}
