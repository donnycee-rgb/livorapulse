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

export async function fetchInsightStatus(): Promise<InsightStatus> {
  return (await apiGet<Envelope<InsightStatus>>('/api/insights/status')).data
}

export async function sendInsightFeedback(id: string, feedback: 'useful' | 'not-true'): Promise<Insight> {
  return (await apiPost<Envelope<Insight>>(`/api/insights/${encodeURIComponent(id)}/feedback`, { feedback })).data
}
