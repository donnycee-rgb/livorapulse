import { NAIROBI_STOPS, journeyOn } from './walkRoute'
// Plain-language takeaways for a week of data ("You hit your step goal on 3
// of 5 days — Thursday was your best"), so each visual leads with what it
// means rather than numbers on an axis.

import type { DayKey, MoodEmoji } from '../data/types'

export const WEEK: readonly DayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const FULL: Record<DayKey, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
}
export const fullDay = (d: DayKey) => FULL[d]

export type DayValue = { day: DayKey; value: number | null }

/** Days up to and including today (later days this week haven't happened yet) */
export function daysSoFar(today: DayKey): DayKey[] {
  return WEEK.slice(0, WEEK.indexOf(today) + 1) as DayKey[]
}

/** How close a day came to its goal, 0..1. For "less is better" metrics, within the limit counts as 1. */
export function goalFraction(value: number | null, goal: number, lowerIsBetter = false): number {
  if (value === null || value <= 0 || goal <= 0) return 0
  if (lowerIsBetter) return value <= goal ? 1 : Math.max(0, 1 - (value - goal) / goal)
  return Math.min(1, value / goal)
}

/**
 * One sentence about the week so far for a "more is better" or "less is
 * better" habit. Null when nothing's been logged yet.
 */
export function weekSentence(opts: {
  values: DayValue[]
  today: DayKey
  goal: number
  noun: string // "step goal", "sleep goal", "focus goal", "screen limit"
  lowerIsBetter?: boolean
}): string | null {
  const { values, today, goal, noun, lowerIsBetter = false } = opts
  const sofar = daysSoFar(today)
  const logged = sofar
    .map((day) => ({ day, value: values.find((v) => v.day === day)?.value ?? null }))
    .filter((d): d is { day: DayKey; value: number } => d.value !== null && d.value > 0)
  if (logged.length === 0) return null

  const hit = logged.filter((d) => goalFraction(d.value, goal, lowerIsBetter) >= 1)
  const best = [...logged].sort((a, b) => (lowerIsBetter ? a.value - b.value : b.value - a.value))[0]

  if (lowerIsBetter) {
    if (hit.length === logged.length) return `You stayed within your ${noun} every day you logged. Nicely done.`
    return `You stayed within your ${noun} on ${hit.length} of ${logged.length} days. ${fullDay(best.day)} was your lightest.`
  }
  if (hit.length === logged.length && logged.length > 1) return `You reached your ${noun} every day you logged. Keep it going.`
  if (hit.length === 0) return `You haven't reached your ${noun} yet this week. ${fullDay(best.day)} came closest.`
  return `You reached your ${noun} on ${hit.length} of ${logged.length} days. ${fullDay(best.day)} was your best.`
}

// ─── Mood as weather ────────────────────────────────────────────────────────
export type Weather = { kind: 'sunny' | 'bright' | 'cloudy' | 'showers' | 'rain'; label: string }

export const MOOD_WEATHER: Record<MoodEmoji, Weather> = {
  '😄': { kind: 'sunny', label: 'Sunny' },
  '🙂': { kind: 'bright', label: 'Bright spells' },
  '😐': { kind: 'cloudy', label: 'Cloudy' },
  '😕': { kind: 'showers', label: 'Showers' },
  '😣': { kind: 'rain', label: 'Stormy' },
}
const MOOD_SCORE: Record<MoodEmoji, number> = { '😄': 5, '🙂': 4, '😐': 3, '😕': 2, '😣': 1 }

/** "Mostly sunny this week, with a cloudy Wednesday." Null when no moods are logged. */
export function moodForecastSentence(byDay: Array<{ day: DayKey | string; emoji: MoodEmoji | null }>, today: DayKey): string | null {
  const sofar = new Set<string>(daysSoFar(today))
  const logged = byDay.filter((d): d is { day: DayKey; emoji: MoodEmoji } => d.emoji !== null && sofar.has(d.day))
  if (logged.length === 0) return null
  const avg = logged.reduce((s, d) => s + MOOD_SCORE[d.emoji], 0) / logged.length
  const overall = avg >= 4.3 ? 'Sunny' : avg >= 3.6 ? 'Mostly bright' : avg >= 2.8 ? 'A mix of sun and cloud' : avg >= 2 ? 'A bit overcast' : 'A stormy stretch'
  const lowest = [...logged].sort((a, b) => MOOD_SCORE[a.emoji] - MOOD_SCORE[b.emoji])[0]
  const dip = MOOD_SCORE[lowest.emoji] <= 2 && avg >= 3
    ? `, with ${MOOD_WEATHER[lowest.emoji].label.toLowerCase()} on ${fullDay(lowest.day)}`
    : ''
  const kind = avg < 2.8 ? ' Be gentle with yourself; the weather changes.' : ''
  return `${overall} this week${dip}.${kind}`
}

// ─── Steps as a journey ──────────────────────────────────────────────────────
// The journey is built around each person (lib/walkRoute.ts). These stay for
// anything that still means "from Nairobi".
export const NAIROBI_PLACES: ReadonlyArray<{ name: string; km: number }> = NAIROBI_STOPS

/** The furthest place reached from Nairobi, and the next one with the distance still to go. */
export function journey(km: number) {
  return journeyOn(NAIROBI_STOPS, km)
}
