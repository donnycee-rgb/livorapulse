import type { AppState, MoodEmoji, UserGoals } from '../data/types'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function emojiToScore(e: MoodEmoji) {
  const map: Record<MoodEmoji, number> = {
    '😄': 5, '🙂': 4, '😐': 3, '😕': 2, '😣': 1,
  }
  return map[e]
}

function getDayKey(): AppState['physical']['weeklySteps'][number]['day'] {
  const wd = new Date().toLocaleDateString('en-US', { weekday: 'short' })
  const allowed = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  return (allowed.has(wd) ? wd : 'Mon') as any
}

function getForDay<T extends { day: string }>(arr: T[], day: string) {
  return arr.find((x) => x.day === day)
}

// ---------------------------------------------------------------------------
// Default goals — used when user has not set personal goals yet
// ---------------------------------------------------------------------------
const DEFAULT_GOALS: UserGoals = {
  goalStepsPerDay: 8000,
  goalSleepHours: 8,
  goalScreenMinutes: 240,
  goalFocusMinutes: 120,
  goalEcoActionsPerDay: 3,
  goalSocialMinutes: 60,
  goalEntertainmentMinutes: 90,
}

// ---------------------------------------------------------------------------
// Progressive goal multiplier based on streak
// Streak grows the target so the user is always being gently challenged
// ---------------------------------------------------------------------------
export function getStreakMultiplier(streak: number): number {
  if (streak >= 60) return 1.50
  if (streak >= 30) return 1.35
  if (streak >= 14) return 1.20
  if (streak >= 7)  return 1.10
  return 1.00
}

// ---------------------------------------------------------------------------
// Returns the effective goals for today — base goals × streak multiplier
// Applied only to quantitative upward goals (steps, sleep, focus, eco)
// Screen time limits go DOWN as streak grows (more discipline)
// ---------------------------------------------------------------------------
export function selectProgressiveGoals(s: AppState): UserGoals {
  const streak = parseInt(localStorage.getItem('lp_streak') || '0', 10)
  const multiplier = getStreakMultiplier(streak)
  const goals = s.goals ?? DEFAULT_GOALS

  return {
    goalStepsPerDay: Math.round((goals.goalStepsPerDay * multiplier) / 500) * 500,
    goalSleepHours: Math.min(Math.round(goals.goalSleepHours * multiplier * 2) / 2, 9),
    // Screen limit decreases as streak grows — more discipline
    goalScreenMinutes: Math.round((goals.goalScreenMinutes / multiplier) / 15) * 15,
    goalFocusMinutes: Math.round((goals.goalFocusMinutes * multiplier) / 15) * 15,
    goalEcoActionsPerDay: Math.min(Math.round(goals.goalEcoActionsPerDay * multiplier), 8),
    goalSocialMinutes: Math.round((goals.goalSocialMinutes ?? 60) / multiplier),
    goalEntertainmentMinutes: Math.round((goals.goalEntertainmentMinutes ?? 90) / multiplier),
  }
}

// ---------------------------------------------------------------------------
// Main score selector — fully personalised + category-weighted screen time
// ---------------------------------------------------------------------------
export function selectLifePulseScore(s: AppState): number {
  const day = getDayKey()
  const goals = selectProgressiveGoals(s)

  // ── Physical ──────────────────────────────────────────────────────────────
  const steps = getForDay(s.physical.weeklySteps, day)?.steps ?? 0
  const sleep = getForDay(s.physical.sleepHours, day)?.hours ?? 0

  const stepsScore = clamp((steps / goals.goalStepsPerDay) * 100, 0, 100)
  const sleepScore = clamp((sleep / goals.goalSleepHours) * 100, 0, 100)
  const physicalScore = 0.7 * stepsScore + 0.3 * sleepScore

  // ── Digital — category weighted ───────────────────────────────────────────
  // Productive screen time does NOT penalise — it flows into productivity
  // Social and entertainment are penalised beyond personal limits
  const socialMin = s.digital.appUsageCategoriesMin.find(c => c.category === 'Social')?.minutes ?? 0
  const entertainMin = s.digital.appUsageCategoriesMin.find(c => c.category === 'Entertainment')?.minutes ?? 0
  const productiveMin = s.digital.appUsageCategoriesMin.find(c => c.category === 'Productive')?.minutes ?? 0

  const socialLimit = goals.goalSocialMinutes ?? 60
  const entertainLimit = goals.goalEntertainmentMinutes ?? 90

  // Penalty: how far over the limit as a percentage of the limit
  const socialPenalty = socialMin > socialLimit
    ? clamp(((socialMin - socialLimit) / socialLimit) * 50, 0, 50)
    : 0
  const entertainPenalty = entertainMin > entertainLimit
    ? clamp(((entertainMin - entertainLimit) / entertainLimit) * 50, 0, 50)
    : 0

  const digitalScore = clamp(100 - socialPenalty - entertainPenalty, 0, 100)

  // ── Productivity — includes productive screen time ────────────────────────
  const focusMin = getForDay(s.productivity.focusMinutesByDay, day)?.minutes ?? 0

  // Productive screen time contributes up to 30% of the focus goal
  const productiveScreenBonus = clamp((productiveMin / goals.goalFocusMinutes) * 30, 0, 30)
  const focusContribution = clamp((focusMin / goals.goalFocusMinutes) * 100, 0, 100)

  // Blend focus sessions + productive screen time
  const prodScore = clamp(
    focusContribution * 0.7 + productiveScreenBonus * (30 / 30) * 0.3,
    0, 100
  ) * (s.digital.focusMode ? 1.05 : 1)

  // ── Environment ───────────────────────────────────────────────────────────
  const recycled = getForDay(s.environment.recycledItemsByDay, day)?.items ?? 0
  const carbon = getForDay(s.environment.carbonKgByDay, day)?.kg ?? 5

  const ecoActionsScore = clamp((recycled / goals.goalEcoActionsPerDay) * 100, 0, 100)
  const carbonScore = clamp(110 - (carbon / 8) * 100, 0, 100)
  const ecoScore = 0.55 * ecoActionsScore + 0.45 * carbonScore

  // ── Mood & Stress ─────────────────────────────────────────────────────────
  const moodScore = clamp((emojiToScore(s.mood.today.emoji) / 5) * 100, 0, 100)
  const stressScore = clamp(110 - (s.mood.today.stressScore / 5) * 100, 0, 100)
  const mentalScore = 0.6 * moodScore + 0.4 * stressScore

  // ── Nutrition score — from localStorage (set by Dashboard fetch) ─────────
  const todayCalories = parseInt(localStorage.getItem('lp_today_calories') || '0', 10)
  const calorieGoal = (s as any).goals?.goalCaloriesPerDay ?? 2000
  const nutritionScore = todayCalories > 0
    ? clamp((todayCalories / calorieGoal) * 100, 0, 100)
    : 50 // neutral when not logged — don't punish for not logging

  // ── Weighted total ────────────────────────────────────────────────────────
  const score =
    0.23 * physicalScore +
    0.18 * digitalScore +
    0.20 * clamp(prodScore, 0, 100) +
    0.14 * ecoScore +
    0.14 * mentalScore +
    0.11 * nutritionScore

  return Math.round(clamp(score, 0, 100))
}

// ---------------------------------------------------------------------------
// Per-dimension scores — used by dashboard score breakdown bars
// ---------------------------------------------------------------------------
export function selectDimensionScores(s: AppState): Record<string, number> {
  const day = getDayKey()
  const goals = selectProgressiveGoals(s)

  const steps = getForDay(s.physical.weeklySteps, day)?.steps ?? 0
  const sleep = getForDay(s.physical.sleepHours, day)?.hours ?? 0
  const focusMin = getForDay(s.productivity.focusMinutesByDay, day)?.minutes ?? 0
  const recycled = getForDay(s.environment.recycledItemsByDay, day)?.items ?? 0
  const carbon = getForDay(s.environment.carbonKgByDay, day)?.kg ?? 5

  const socialMin = s.digital.appUsageCategoriesMin.find(c => c.category === 'Social')?.minutes ?? 0
  const entertainMin = s.digital.appUsageCategoriesMin.find(c => c.category === 'Entertainment')?.minutes ?? 0
  const productiveMin = s.digital.appUsageCategoriesMin.find(c => c.category === 'Productive')?.minutes ?? 0

  const socialPenalty = socialMin > (goals.goalSocialMinutes ?? 60)
    ? clamp(((socialMin - (goals.goalSocialMinutes ?? 60)) / (goals.goalSocialMinutes ?? 60)) * 50, 0, 50)
    : 0
  const entertainPenalty = entertainMin > (goals.goalEntertainmentMinutes ?? 90)
    ? clamp(((entertainMin - (goals.goalEntertainmentMinutes ?? 90)) / (goals.goalEntertainmentMinutes ?? 90)) * 50, 0, 50)
    : 0

  const productiveScreenBonus = clamp((productiveMin / goals.goalFocusMinutes) * 30, 0, 30)
  const focusContribution = clamp((focusMin / goals.goalFocusMinutes) * 100, 0, 100)

  return {
    physical: Math.round(clamp(0.7 * clamp((steps / goals.goalStepsPerDay) * 100, 0, 100) + 0.3 * clamp((sleep / goals.goalSleepHours) * 100, 0, 100), 0, 100)),
    digital: Math.round(clamp(100 - socialPenalty - entertainPenalty, 0, 100)),
    productivity: Math.round(clamp(focusContribution * 0.7 + productiveScreenBonus * 0.3, 0, 100)),
    eco: Math.round(clamp(0.55 * clamp((recycled / goals.goalEcoActionsPerDay) * 100, 0, 100) + 0.45 * clamp(110 - (carbon / 8) * 100, 0, 100), 0, 100)),
    mood: Math.round(clamp(0.6 * clamp((emojiToScore(s.mood.today.emoji) / 5) * 100, 0, 100) + 0.4 * clamp(110 - (s.mood.today.stressScore / 5) * 100, 0, 100), 0, 100)),
  }
}

// ---------------------------------------------------------------------------
// Daily insight — now goal-aware
// ---------------------------------------------------------------------------
export function selectDailyInsight(s: AppState): string {
  const day = getDayKey()
  const goals = selectProgressiveGoals(s)

  const steps = getForDay(s.physical.weeklySteps, day)?.steps ?? 0
  const sleep = getForDay(s.physical.sleepHours, day)?.hours ?? 0
  const focus = getForDay(s.productivity.focusMinutesByDay, day)?.minutes ?? 0
  const socialMin = s.digital.appUsageCategoriesMin.find(c => c.category === 'Social')?.minutes ?? 0
  const productiveMin = s.digital.appUsageCategoriesMin.find(c => c.category === 'Productive')?.minutes ?? 0

  const positives: string[] = []
  const watch: string[] = []

  // Steps vs personal goal
  if (steps >= goals.goalStepsPerDay) positives.push('daily step goal hit')
  else if (steps >= goals.goalStepsPerDay * 0.7) positives.push('solid activity')
  else if (steps > 0) watch.push('more movement')

  // Sleep vs personal goal
  if (sleep >= goals.goalSleepHours) positives.push('sleep goal reached')
  else if (sleep > 0 && sleep < goals.goalSleepHours * 0.8) watch.push('sleep recovery')

  // Screen quality
  if (productiveMin >= 60) positives.push('productive screen time')
  if (socialMin > (goals.goalSocialMinutes ?? 60) * 1.5) watch.push('social media usage')

  // Focus vs personal goal
  if (focus >= goals.goalFocusMinutes) positives.push('focus goal reached')
  else if (focus > 0 && focus < goals.goalFocusMinutes * 0.5) watch.push('focus consistency')

  const streak = parseInt(localStorage.getItem('lp_streak') || '0', 10)
  if (streak >= 7 && positives.length >= 2) {
    return `${streak}-day streak — ${positives.slice(0, 2).join(' + ')}. Keep it going.`
  }

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