import type { AppState, MoodEmoji } from '../data/types'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function emojiToScore(e: MoodEmoji) {
  const map: Record<MoodEmoji, number> = {
    '😄': 5,
    '🙂': 4,
    '😐': 3,
    '😕': 2,
    '😣': 1,
  }
  return map[e]
}

function getDayKey(): AppState['physical']['weeklySteps'][number]['day'] {
  const wd = new Date().toLocaleDateString('en-US', { weekday: 'short' })
  // Map locale values like "Mon" → our DayKey union
  const allowed = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  return (allowed.has(wd) ? wd : 'Mon') as any
}

function getForDay<T extends { day: string }>(arr: T[], day: string) {
  return arr.find((x) => x.day === day)
}

export function selectLifePulseScore(s: AppState): number {
  const day = getDayKey()

  // Physical
  const steps = getForDay(s.physical.weeklySteps, day)?.steps ?? 0
  const sleep = getForDay(s.physical.sleepHours, day)?.hours ?? 0
  const physicalScore =
    0.7 * clamp((steps / 8000) * 100, 0, 100) + 0.3 * clamp((sleep / 8) * 100, 0, 100)

  // Digital (lower is better)
  const screenMin = getForDay(s.digital.weeklyScreenTimeMin, day)?.minutes ?? 0
  const digitalScore = clamp(110 - (screenMin / 240) * 100, 0, 100)

  // Productivity
  const focusMin = getForDay(s.productivity.focusMinutesByDay, day)?.minutes ?? 0
  const prodScore = clamp((focusMin / 120) * 100, 0, 100) * (s.digital.focusMode ? 1.05 : 1)

  // Environment
  const recycled = getForDay(s.environment.recycledItemsByDay, day)?.items ?? 0
  const carbon = getForDay(s.environment.carbonKgByDay, day)?.kg ?? 5
  const ecoScore = 0.55 * clamp((recycled / 4) * 100, 0, 100) + 0.45 * clamp(110 - (carbon / 8) * 100, 0, 100)

  // Mood
  const moodScore = clamp((emojiToScore(s.mood.today.emoji) / 5) * 100, 0, 100)
  const stressScore = clamp(110 - (s.mood.today.stressScore / 5) * 100, 0, 100)
  const mentalScore = 0.6 * moodScore + 0.4 * stressScore

  // Weighted average
  const score =
    0.26 * physicalScore +
    0.20 * digitalScore +
    0.22 * prodScore +
    0.16 * ecoScore +
    0.16 * mentalScore

  return Math.round(clamp(score, 0, 100))
}

export function selectDailyInsight(s: AppState): string {
  const day = getDayKey()
  const steps = getForDay(s.physical.weeklySteps, day)?.steps ?? 0
  const screen = getForDay(s.digital.weeklyScreenTimeMin, day)?.minutes ?? 0
  const focus = getForDay(s.productivity.focusMinutesByDay, day)?.minutes ?? 0
  const sleep = getForDay(s.physical.sleepHours, day)?.hours ?? 0

  const positives: string[] = []
  const watch: string[] = []

  if (steps >= 8000) positives.push('strong movement')
  else if (steps >= 6000) positives.push('solid activity')
  else watch.push('more movement')

  if (sleep >= 7.5) positives.push('rested sleep')
  else if (sleep < 6.5) watch.push('sleep recovery')

  if (screen <= 150) positives.push('healthy screen time')
  else if (screen >= 210) watch.push('screen time')

  if (focus >= 75) positives.push('high focus')
  else if (focus < 40) watch.push('focus consistency')

  if (positives.length >= 2 && watch.length === 0) {
    return `A high-quality day: ${positives.slice(0, 2).join(' + ')}.`
  }

  if (positives.length >= 2 && watch.length >= 1) {
    return `Balanced day: ${positives.slice(0, 2).join(' + ')}, with room to improve ${watch[0]}.`
  }

  if (positives.length === 1 && watch.length >= 1) {
    return `Steady progress: ${positives[0]}, and consider improving ${watch[0]}.`
  }

  return 'Today is a good reset point — small wins will compound quickly.'
}
