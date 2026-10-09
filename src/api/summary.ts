import { apiBlob, apiGet, apiRequest, apiUrl, apiPost } from './client'

// Shapes returned by the backend's /api/summary and /api/shared/summary routes

export type SummaryMonths = 1 | 3
export type MetricKey = 'sleep' | 'mood' | 'stress' | 'walks'

export type MetricSummary = {
  daysLogged: number
  /** Display units: sleep in minutes, mood and stress 1–5, walks in steps */
  average: number | null
  min: number | null
  max: number | null
  weekly: { weekStart: string; value: number | null }[]
  trend: 'higher' | 'lower' | 'steady' | null
  notableDays: number | null
  text: string
}

export type HealthSummary = {
  version: 1
  generatedAt: string
  period: { from: string; to: string; months: SummaryMonths; days: number }
  person: { name: string; age: number | null; sex: string | null }
  disclaimer: string
  sleep: MetricSummary
  mood: MetricSummary
  stress: MetricSummary
  walks: MetricSummary
  cycle: null | {
    periodsLogged: number
    lastPeriodStart: string | null
    lengths: number[]
    averageLength: number | null
    outsideTypicalRange: number
    flow: Record<string, number>
    symptoms: { name: string; count: number }[]
    text: string
  }
  insights: string[]
  flags: { title: string; detail: string }[]
  notes: { date: string; area: string; text: string }[] | null
}

export type SummaryShare = {
  id: string
  months: number
  includeNotes: boolean
  createdAt: string
  expiresAt: string
  viewCount: number
  lastViewedAt: string | null
}

type Envelope<T> = { success: boolean; data: T }

const query = (months: SummaryMonths, notes: boolean) => `months=${months}&notes=${notes}`

export async function fetchSummary(months: SummaryMonths, notes: boolean): Promise<HealthSummary> {
  return (await apiGet<Envelope<HealthSummary>>(`/api/summary?${query(months, notes)}`)).data
}

/** Downloads the user's own summary as a PDF file */
export async function downloadSummaryPdf(months: SummaryMonths, notes: boolean): Promise<void> {
  const blob = await apiBlob(`/api/summary/pdf?${query(months, notes)}`)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `livorapulse-health-summary-${new Date().toISOString().slice(0, 10)}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function createShare(months: SummaryMonths, includeNotes: boolean): Promise<SummaryShare & { url: string }> {
  return (await apiPost<Envelope<SummaryShare & { url: string }>>('/api/summary/share', { months, includeNotes })).data
}

export async function fetchShares(): Promise<SummaryShare[]> {
  return (await apiGet<Envelope<SummaryShare[]>>('/api/summary/shares')).data
}

export async function revokeShare(id: string): Promise<void> {
  await apiRequest(`/api/summary/shares/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/** Public: anyone with the link, no sign-in */
export async function fetchSharedSummary(token: string): Promise<HealthSummary> {
  return (await apiGet<Envelope<HealthSummary>>(`/api/shared/summary/${encodeURIComponent(token)}`, false)).data
}

export function sharedPdfUrl(token: string): string {
  return apiUrl(`/api/shared/summary/${encodeURIComponent(token)}/pdf`)
}
