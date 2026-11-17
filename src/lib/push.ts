// ─── Phone notifications (Web Push) ──────────────────────────────────────────
// Reminders arrive in the phone's notification shade even when LivoraPulse is
// closed. The phone asks "Allow notifications?" once; we only trigger that
// from a tap on our own "Turn on reminders" button, so people know why.
//
// Works on Android (Chrome, Edge, Samsung Internet), desktop browsers, and
// iPhone/iPad once LivoraPulse is installed to the home screen (iOS 16.4+).

import { apiGet, apiPost, apiPut } from '../api/client'
import { isIOS, isStandalone } from './install'

export type PushSupport = 'ok' | 'install-first' | 'unsupported'
export type PushStatus = 'on' | 'off' | 'blocked' | 'install-first' | 'unsupported'
export type ReminderSettings = { bedtime: string | null; wakeReminder: boolean; timezone: string; devices: number }

export function pushSupport(): PushSupport {
  if (typeof window === 'undefined') return 'unsupported'
  const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  if (ok) return 'ok'
  // iPhone Safari only offers notifications to an installed app
  return isIOS() && !isStandalone() ? 'install-first' : 'unsupported'
}

const timezone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Nairobi' } catch { return 'Africa/Nairobi' }
}

async function registration(timeoutMs = 8000): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((r) => setTimeout(() => r(null), timeoutMs)),
  ])
}

/** Is this phone set up to receive reminders right now? */
export async function pushStatus(): Promise<PushStatus> {
  const support = pushSupport()
  if (support !== 'ok') return support
  if (Notification.permission === 'denied') return 'blocked'
  if (Notification.permission !== 'granted') return 'off'
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return sub ? 'on' : 'off'
}

function keyBytes(base64url: string): Uint8Array {
  const pad = '='.repeat((4 - (base64url.length % 4)) % 4)
  const raw = atob((base64url + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export type TurnOnResult = 'on' | 'blocked' | 'dismissed' | 'unavailable'

/**
 * Ask the phone for permission (call from a tap), then register this phone
 * with the server. 'unavailable': the server or this browser can't send them.
 */
export async function turnOnPush(): Promise<TurnOnResult> {
  if (pushSupport() !== 'ok') return 'unavailable'
  const permission = await Notification.requestPermission()
  if (permission === 'denied') return 'blocked'
  if (permission !== 'granted') return 'dismissed'

  const { data } = await apiGet<{ data: { publicKey: string | null } }>('/api/push/key')
  if (!data.publicKey) return 'unavailable'
  const reg = await registration()
  if (!reg) return 'unavailable'

  const existing = await reg.pushManager.getSubscription()
  const sub = existing ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(data.publicKey) as BufferSource })
  await apiPost('/api/push/subscribe', sub.toJSON())
  await apiPut('/api/push/settings', { timezone: timezone() })
  return 'on'
}

/** Stop notifications on this phone (other phones keep theirs) */
export async function turnOffPush(): Promise<void> {
  const reg = await navigator.serviceWorker?.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return
  await apiPost('/api/push/unsubscribe', { endpoint: sub.endpoint }).catch(() => null)
  await sub.unsubscribe().catch(() => false)
}

export async function getReminderSettings(): Promise<ReminderSettings> {
  return (await apiGet<{ data: ReminderSettings }>('/api/push/settings')).data
}

export async function saveReminderSettings(patch: Partial<Pick<ReminderSettings, 'bedtime' | 'wakeReminder'>>): Promise<ReminderSettings> {
  return (await apiPut<{ data: ReminderSettings }>('/api/push/settings', { ...patch, timezone: timezone() })).data
}

export async function sendTestNotification(): Promise<void> {
  await apiPost('/api/push/test')
}

// ── Asked once ──────────────────────────────────────────────────────────────

const ASKED = 'lp-reminders-asked'
export function remindersAsked(): boolean {
  try { return localStorage.getItem(ASKED) === '1' } catch { return true }
}
export function markRemindersAsked(): void {
  try { localStorage.setItem(ASKED, '1') } catch { /* private mode */ }
}
