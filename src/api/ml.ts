import { apiGet } from './client'

// Results of the nightly mood model (see the backend's ml/ folder)

export type MoodEffect = {
  feature: string // e.g. "sleepHours"
  unit: string // e.g. "1 hour of sleep"
  mean: number // change in mood (1-5 scale) per unit
  sd: number
  probPositive: number
  claim: 'personal' | 'typical' // "for you" vs "for most people"
  updatedAt: string
}

export type MoodModel = {
  minMoodDays: number
  moodDays: number
  effects: MoodEffect[]
  /** usesSleep: last night's sleep was logged and is part of the forecast */
  forecast: { date: string; mean: number; lower: number; upper: number; usesSleep?: boolean } | null
  lastRun: { status: string; finishedAt: string | null } | null
}

export async function fetchMoodModel(): Promise<MoodModel> {
  return (await apiGet<{ success: boolean; data: MoodModel }>('/api/ml/mood')).data
}
