// ─── Cycle tracker: who sees it, and the words and dates it shows ───────────
// The server works out periods, averages and predictions from the days the
// person logs (livoraPulse_Backend/src/utils/cycle.ts); the app shows them.

import { useAuthStore } from '../store/useAuthStore'

/**
 * Whether to show the cycle tracker. A person's own choice in Settings wins;
 * until they make one it's on for women and off for everyone else.
 */
export function cycleTrackingOn(profile: { gender?: string; cycleTracking?: boolean | null } | null | undefined): boolean {
  return profile?.cycleTracking ?? profile?.gender === 'female'
}

export function useCycleTracking(): boolean {
  return useAuthStore((s) => cycleTrackingOn(s.user?.profile))
}

export type Flow = 'spotting' | 'light' | 'medium' | 'heavy'
export const FLOWS: Array<{ value: Flow; label: string }> = [
  { value: 'spotting', label: 'Spotting' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
]

// "Severe cramps" (pain that gets in the way of the day) is kept apart from
// ordinary cramps: the health flags on the server look for it by name.
export const SYMPTOMS = [
  'Cramps', 'Severe cramps', 'Bloating', 'Fatigue', 'Mood swings',
  'Headache', 'Back pain', 'Tender breasts', 'Nausea', 'Acne', 'Trouble sleeping',
] as const

export type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

/** Plain words for each phase. Bodies differ, so these say "many people", not "you will". */
export const PHASES: Record<Phase, { label: string; hex: string; rgb: string; line: string; tip: string }> = {
  menstrual: {
    label: 'Period', hex: '#F43F5E', rgb: '244 63 94',
    line: 'Go easy on yourself. Rest counts.',
    tip: 'Iron-rich foods like managu, spinach, beans and lentils can help if you feel tired.',
  },
  follicular: {
    label: 'Follicular phase', hex: '#22C55E', rgb: '34 197 94',
    line: 'Many people feel their energy pick up now.',
    tip: 'If you have more energy, it can be a good time to start something new.',
  },
  ovulation: {
    label: 'Around ovulation', hex: '#F59E0B', rgb: '245 158 11',
    line: 'Estimated from your cycle length. It can shift a few days.',
    tip: 'Some people notice mild one-sided pain or more discharge around now. Both are common.',
  },
  luteal: {
    label: 'Luteal phase', hex: '#8B5CF6', rgb: '139 92 246',
    line: 'Lower energy or mood dips before a period are common.',
    tip: 'Sleep, regular meals and some movement can ease PMS. Groundnuts and greens bring magnesium.',
  },
}

export type CycleStatus = {
  lastPeriodStart: string
  dayOfCycle: number
  phase: Phase
  periodActive: boolean
  nextPeriodDate: string
  nextPeriodEarliest: string
  nextPeriodLatest: string
  daysUntilNextPeriod: number
  periodDueToday: boolean
  isLate: boolean
  daysLate: number
  ovulationDay: number
  fertileWindowStart: number
  fertileWindowEnd: number
  smartCycleLength: number
  smartDuration: number
  spread: number
  cyclesUsed: number
}

export type PeriodDay = { date: string; flow: Flow | null; symptoms: string[]; notes: string | null }
export type DayMark = 'period' | 'predicted-period' | 'fertile' | 'ovulation'

export type PeriodSummary = {
  start: string
  end: string
  days: number
  heaviestFlow: Flow | null
  symptoms: string[]
  notes: string[]
  /** Days from this period's start to the next one (null for the latest, or a gap too odd to trust) */
  cycleLength: number | null
}

// ── Dates as YYYY-MM-DD calendar days (no time zones) ──────────────────────

const pad = (n: number) => String(n).padStart(2, '0')
/** Today in the person's own time zone */
export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const toUTC = (k: string) => new Date(`${k}T00:00:00Z`)
export const addDaysKey = (k: string, n: number) => new Date(toUTC(k).getTime() + n * 86400000).toISOString().slice(0, 10)
export const daysBetween = (a: string, b: string) => Math.round((toUTC(b).getTime() - toUTC(a).getTime()) / 86400000)

/** "18 Nov" (or "Tue 18 Nov" with weekday) */
export function shortDate(k: string, weekday = false): string {
  return toUTC(k).toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC', ...(weekday ? { weekday: 'short' } : {}) })
}

/** "17–19 Nov", or "30 Nov – 2 Dec" across months */
export function dateRange(a: string, b: string): string {
  if (a === b) return shortDate(a)
  if (a.slice(0, 7) !== b.slice(0, 7)) return `${shortDate(a)} – ${shortDate(b)}`
  // same month: put the range where the day goes ("17–19 Nov", or "Nov 17–19" in US English)
  const db = Number(b.slice(8))
  return shortDate(b).replace(new RegExp(`\\b${db}\\b`), `${Number(a.slice(8))}–${db}`)
}

/** Monday-first grid of a month: leading nulls, then each day key */
export function monthGrid(year: number, month: number): Array<string | null> {
  const first = new Date(Date.UTC(year, month, 1))
  const lead = (first.getUTCDay() + 6) % 7
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: count }, (_, i) => `${year}-${pad(month + 1)}-${pad(i + 1)}`),
  ]
}
