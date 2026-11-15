// Sentences and numbers behind the friendly visuals on Nutrition,
// Productivity, Digital and Environment. Kept apart from the components so
// they can be tested.

import type { DayKey } from '../data/types'
import { WEEK } from './weekStory'

// ─── Nutrition: the plate ────────────────────────────────────────────────────
export type Macro = 'carbs' | 'protein' | 'fat'
export type PlateSlice = { macro: Macro; share: number; guide: number }

/** A balanced plate by energy: roughly half carbs, a fifth protein, the rest fat. */
export const PLATE_GUIDE: Record<Macro, number> = { carbs: 0.5, protein: 0.2, fat: 0.3 }
const KCAL_PER_G: Record<Macro, number> = { carbs: 4, protein: 4, fat: 9 }

const ADD: Record<Macro, string> = {
  protein: 'beans, eggs, fish, ndengu or a little nyama',
  carbs: 'ugali, rice, chapati or sweet potato',
  fat: 'avocado, groundnuts or a little cooking oil',
}

/** Each macro's share of today's energy, beside the balanced-plate guide. Null when nothing is logged. */
export function plateSlices(t: { carbsG: number; proteinG: number; fatG: number }): PlateSlice[] | null {
  const kcal = {
    carbs: Math.max(0, t.carbsG) * KCAL_PER_G.carbs,
    protein: Math.max(0, t.proteinG) * KCAL_PER_G.protein,
    fat: Math.max(0, t.fatG) * KCAL_PER_G.fat,
  }
  const total = kcal.carbs + kcal.protein + kcal.fat
  if (total <= 0) return null
  return (['carbs', 'protein', 'fat'] as const).map((m) => ({ macro: m, share: kcal[m] / total, guide: PLATE_GUIDE[m] }))
}

/** "Your plate is light on protein today. Try adding beans, eggs, fish…" */
export function plateSentence(slices: PlateSlice[] | null): string | null {
  if (!slices) return null
  // Compare each with its own target: 5% protein against 20% is further off
  // than 12% fat against 30%, though the raw gap is smaller
  const ratios = slices.map((s) => ({ ...s, ratio: s.share / s.guide }))
  // Protein first when it's short: it's the most useful gap to close (and
  // the usual one with ugali-and-sukuma style meals); otherwise the biggest gap
  const protein = ratios.find((r) => r.macro === 'protein')!
  const low = protein.ratio < 0.75 ? protein : [...ratios].sort((a, b) => a.ratio - b.ratio)[0]
  if (low.ratio >= 0.75) return 'Nicely balanced plate so far today.'
  const name = low.macro === 'carbs' ? 'starch' : low.macro
  return `Your plate is light on ${name} today. Try adding ${ADD[low.macro]}.`
}

// ─── Productivity: best focus times ──────────────────────────────────────────
export const DAY_PARTS = [
  { key: 'morning', label: 'Morning', from: 5, to: 12 },
  { key: 'afternoon', label: 'Afternoon', from: 12, to: 17 },
  { key: 'evening', label: 'Evening', from: 17, to: 21 },
  { key: 'night', label: 'Night', from: 21, to: 29 }, // 21:00 to 05:00
] as const
export type DayPart = (typeof DAY_PARTS)[number]['key']

function partOf(hour: number): DayPart {
  const h = hour < 5 ? hour + 24 : hour
  return (DAY_PARTS.find((p) => h >= p.from && h < p.to) ?? DAY_PARTS[3]).key
}

const dayKeyOf = (d: Date): DayKey => WEEK[(d.getDay() + 6) % 7]

/** Minutes of focus per weekday and part of the day, for sessions in the current week (Mon-Sun). */
export function focusGrid(sessions: Array<{ startedAt: number; durationSec: number }>, now = new Date()): Record<DayKey, Record<DayPart, number>> {
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const grid = Object.fromEntries(WEEK.map((d) => [d, { morning: 0, afternoon: 0, evening: 0, night: 0 }])) as Record<DayKey, Record<DayPart, number>>
  for (const s of sessions) {
    const at = new Date(s.startedAt)
    if (at < monday || at > now) continue
    // A session started after midnight belongs to the night before
    const day = at.getHours() < 5 ? dayKeyOf(new Date(at.getTime() - 5 * 3600_000)) : dayKeyOf(at)
    grid[day][partOf(at.getHours())] += Math.round(s.durationSec / 60)
  }
  return grid
}

const hm = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}` : `${min}m`)

/** "You focus best in the morning: 2h 10m of your 3h this week." */
export function focusSentence(grid: Record<DayKey, Record<DayPart, number>>): string | null {
  const totals = DAY_PARTS.map((p) => ({ ...p, min: WEEK.reduce((s, d) => s + grid[d][p.key], 0) }))
  const all = totals.reduce((s, p) => s + p.min, 0)
  if (all === 0) return null
  const best = [...totals].sort((a, b) => b.min - a.min)[0]
  const when = best.key === 'night' ? 'at night' : `in the ${best.label.toLowerCase()}`
  if (best.min === all) return `All ${hm(all)} of your focus this week was ${when}.`
  return `You focus most ${when}: ${hm(best.min)} of your ${hm(all)} this week.`
}

// ─── Digital: where the time went ────────────────────────────────────────────
export function screenSplitSentence(parts: Array<{ category: string; minutes: number }>): string | null {
  const total = parts.reduce((s, p) => s + p.minutes, 0)
  if (total <= 0) return null
  const top = [...parts].sort((a, b) => b.minutes - a.minutes)[0]
  const pct = Math.round((top.minutes / total) * 100)
  const what = top.category === 'Social' ? 'social media' : top.category === 'Productive' ? 'work and learning' : 'entertainment'
  return `Most of your screen time went to ${what} (${pct}%).`
}

// ─── Environment: the plant ──────────────────────────────────────────────────
/** An average petrol car emits about 0.17 kg CO₂ per km */
export const CAR_KG_PER_KM = 0.17

export function ecoSentence(actions: number, kgSaved: number): string | null {
  if (actions <= 0) return null
  const leaves = `${actions} ${actions === 1 ? 'leaf' : 'leaves'} on your plant this week`
  if (kgSaved < 0.05) return `${leaves}. Every choice counts.`
  const km = Math.round(kgSaved / CAR_KG_PER_KM)
  return `${leaves}. You saved ${kgSaved.toFixed(1)} kg CO₂, like leaving a car parked for ${km} km.`
}
