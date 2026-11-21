import { apiGet, apiPost } from './client'

// Shapes returned by the backend's /api/insights routes

export type InsightComparison = {
  low: { label: string; value: number }
  high: { label: string; value: number }
  /** 'score' values are on the 1–5 scale the app shows; minutes and steps are raw */
  unit: 'score' | 'minutes' | 'steps'
  scaleMax: number | null
}

export type Insight = {
  id: string
  key: string
  text: string
  driver: string
  outcome: string
  lag: string
  nDays: number
  feedback: 'useful' | 'not-true' | null
  firstFoundAt: string
  /** The change to try in a 14-day experiment, or null if there isn't one */
  suggestion: string | null
  comparison: InsightComparison
}

export type InsightStatus = {
  windowDays: number
  minDays: number
  activeCount: number
  areas: { area: string; label: string; days: number }[]
  nextUp: { key: string; label: string; pairedDays: number; daysNeeded: number; message: string }[]
}

type Envelope<T> = { success: boolean; data: T }

export async function fetchInsights(): Promise<Insight[]> {
  return (await apiGet<Envelope<Insight[]>>('/api/insights')).data
}

/** The person's own numbers so far, before any pattern is tested (nothing estimated) */
export type EarlyGroup = { label: string; value: number; days: number }
export type EarlyLook = {
  daysLogged: number
  averages: {
    sleepMinutes: { value: number; days: number } | null
    mood: { value: number; days: number } | null
    stress: { value: number; days: number } | null
    steps: { value: number; days: number } | null
  }
  comparisons: { key: string; title: string; unit: 'score'; a: EarlyGroup; b: EarlyGroup }[]
}

export async function fetchEarlyLook(): Promise<EarlyLook> {
  return (await apiGet<Envelope<EarlyLook>>('/api/insights/early')).data
}

export async function fetchInsightStatus(): Promise<InsightStatus> {
  return (await apiGet<Envelope<InsightStatus>>('/api/insights/status')).data
}

export async function sendInsightFeedback(id: string, feedback: 'useful' | 'not-true'): Promise<Insight> {
  return (await apiPost<Envelope<Insight>>(`/api/insights/${encodeURIComponent(id)}/feedback`, { feedback })).data
}
