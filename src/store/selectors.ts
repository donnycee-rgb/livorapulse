import type { AppState, ScoreDimension, UserGoals } from '../data/types'

// The LifePulse Score, its parts, today's goals and the streak are all
// calculated by the server (ScoreService) — the same numbers the score history
// and the AI coach use. These selectors only read them.

// ---------------------------------------------------------------------------
// Default goals — used until the user has goals of their own
// ---------------------------------------------------------------------------
const DEFAULT_GOALS: Required<UserGoals> = {
  goalStepsPerDay: 8000,
  goalSleepHours: 8,
  goalScreenMinutes: 240,
  goalFocusMinutes: 60,
  goalEcoActionsPerDay: 3,
  goalSocialMinutes: 60,
  goalEntertainmentMinutes: 90,
  goalCaloriesPerDay: 2000,
}

export function getStreakMultiplier(streak: number): number {
  if (streak >= 60) return 1.5
  if (streak >= 30) return 1.35
  if (streak >= 14) return 1.2
  if (streak >= 7) return 1.1
  return 1.0
}

/** Consecutive days with at least one log (from the server) */
export function selectStreak(s: AppState): number {
  return s.dashboard.streak ?? 0
}

/**
 * Today's goals after the streak multiplier, as used by the score.
 * Before the first sync it falls back to the user's own goals unchanged.
 */
export function selectProgressiveGoals(s: AppState): Required<UserGoals> {
  if (s.dashboard.goals) return s.dashboard.goals
  return { ...DEFAULT_GOALS, ...s.goals, goalCaloriesPerDay: s.goals?.goalCaloriesPerDay ?? DEFAULT_GOALS.goalCaloriesPerDay }
}

export function selectLifePulseScore(s: AppState): number {
  return s.dashboard.score ?? 0
}

/** False until anything has been logged in the last 7 days */
export function selectScoreReady(s: AppState): boolean {
  return s.dashboard.scoreReady ?? true
}

/** Each area's 7-day value behind the LifePulse Score; null = not tracked this week */
export function selectRollingScores(s: AppState): Record<ScoreDimension, number | null> {
  return s.dashboard.rolling ?? selectDimensionScores(s)
}

/** Today's per-area scores (0–100), for the "today's goals" cards */
export function selectDimensionScores(s: AppState): Record<ScoreDimension, number> {
  return s.dashboard.components ?? { physical: 0, digital: 0, productivity: 0, mood: 0, eco: 0, nutrition: 0 }
}

/** Which dimensions have something logged today — unlogged ones count as 0 */
export function selectLoggedDimensions(s: AppState): Record<ScoreDimension, boolean> {
  return s.dashboard.logged ?? { physical: false, digital: false, productivity: false, mood: false, eco: false, nutrition: false }
}

export function selectDailyInsight(s: AppState): string {
  return s.dashboard.insight
}
