import { apiGet, apiPost } from './client'

// Shapes returned by the backend's /api/flags routes

export type SupportContact = { name: string; phone: string; description: string }

export type HealthFlag = {
  id: string
  key: string
  title: string
  message: string
  /** "Why am I seeing this?" */
  why: string
  actions: ('summary' | 'support')[]
  /** Only verified contacts, only on flags that offer support */
  contacts: SupportContact[]
  firstRaisedAt: string
}

type Envelope<T> = { success: boolean; data: T }

export async function fetchFlags(): Promise<{ enabled: boolean; flags: HealthFlag[] }> {
  return (await apiGet<Envelope<{ enabled: boolean; flags: HealthFlag[] }>>('/api/flags')).data
}

export async function dismissFlag(id: string): Promise<void> {
  await apiPost(`/api/flags/${encodeURIComponent(id)}/dismiss`)
}
