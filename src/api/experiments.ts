import { apiGet, apiPost } from './client'

// Shapes returned by the backend's /api/experiments routes

export type PeriodSummary = { mean: number | null; days: number }

export type ExperimentResult = {
  verdict: 'improved' | 'worse' | 'no-clear-change' | 'not-enough-data'
  outcome: string
  driver: string
  /** Means are in stored units: stress is 1–10 here, shown halved as 1–5 */
  before: PeriodSummary
  during: PeriodSummary
  driverBefore: PeriodSummary
  driverDuring: PeriodSummary
  difference: number | null
  p: number | null
  daysDone: number
  daysAnswered: number
  text: string
}

export type Experiment = {
  id: string
  insightKey: string
  driver: string
  outcome: string
  change: string
  status: 'active' | 'completed' | 'stopped'
  startDate: string
  endDate: string
  dayNumber: number | null
  totalDays: number
  today: boolean | null
  yesterday: boolean | null
  checkins: { date: string; did: boolean }[]
  waitingForResult: boolean
  result: ExperimentResult | null
}

export type ExperimentList = { active: Experiment | null; past: Experiment[] }

type Envelope<T> = { success: boolean; data: T }

export async function fetchExperiments(): Promise<ExperimentList> {
  return (await apiGet<Envelope<ExperimentList>>('/api/experiments')).data
}

export async function startExperiment(insightId: string, change?: string): Promise<ExperimentList> {
  return (await apiPost<Envelope<ExperimentList>>('/api/experiments', { insightId, ...(change ? { change } : {}) })).data
}

export async function experimentCheckIn(id: string, did: boolean, day: 'today' | 'yesterday' = 'today'): Promise<ExperimentList> {
  return (await apiPost<Envelope<ExperimentList>>(`/api/experiments/${encodeURIComponent(id)}/checkin`, { did, day })).data
}

export async function stopExperiment(id: string): Promise<ExperimentList> {
  return (await apiPost<Envelope<ExperimentList>>(`/api/experiments/${encodeURIComponent(id)}/stop`)).data
}
