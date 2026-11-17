// ─── "Going to sleep" on every device ────────────────────────────────────────
// The server holds the one true answer to "is a sleep running, and since
// when?". Each device:
//  - sends its own taps (start, end) through the offline outbox, so a tap
//    made without signal still gets there, in order;
//  - asks the server when the app opens, comes back to the screen, every
//    minute while it's in view, and when the connection returns.
// A device never lets the server's answer overwrite a tap of its own that
// hasn't reached the server yet.

import { apiGet } from '../api/client'
import { pendingFor, saveLog } from '../offline/outbox'
import { useAuthStore } from '../store/useAuthStore'
import { useSleepSession } from '../store/useSleepSession'

const PATH = '/api/push/sleep-session'
let applyingRemote = false
let sending = 0
let started = false

const myId = () => useAuthStore.getState().user?.id

/** Send this device's taps to the server (call once) */
export function startSleepSessionSync(): void {
  if (started || typeof window === 'undefined') return
  started = true
  useSleepSession.subscribe((s, prev) => {
    if (applyingRemote || s.startedAt === prev.startedAt || !myId()) return
    sending++
    const startedAt = s.startedAt
    saveLog(PATH, { startedAt: startedAt ? new Date(startedAt).toISOString() : null })
      .then((r) => {
        if (r === 'sent' && useSleepSession.getState().startedAt === startedAt) useSleepSession.setState({ synced: true })
      })
      .catch(() => null)
      .finally(() => { sending-- })
  })
  // Keep in step while the app is open on more than one device
  setInterval(() => { if (document.visibilityState === 'visible') void pullSleepSession() }, 60000)
  window.addEventListener('online', () => { void pullSleepSession() })
}

/** Take the server's answer, unless this device has a tap still on its way */
export async function pullSleepSession(): Promise<void> {
  const userId = myId()
  if (!userId) return
  const waiting = () => sending > 0 || pendingFor(userId, PATH).length > 0
  if (waiting()) return
  const before = useSleepSession.getState().startedAt
  const { data } = await apiGet<{ data: { startedAt: string | null } }>(PATH)
  // A tap happened while asking: it wins
  if (waiting() || useSleepSession.getState().startedAt !== before) return

  const remote = data.startedAt ? Date.parse(data.startedAt) : null
  const local = useSleepSession.getState()
  const mine = local.userId === userId ? local.startedAt : null
  if (remote === mine) {
    if (mine && !local.synced) useSleepSession.setState({ synced: true })
    return
  }
  // A sleep the server never received (started offline, or before devices
  // shared it): send it up rather than wiping it
  if (mine && !remote && !local.synced) {
    sending++
    await saveLog(PATH, { startedAt: new Date(mine).toISOString() })
      .then((r) => { if (r === 'sent') useSleepSession.setState({ synced: true }) })
      .catch(() => null)
      .finally(() => { sending-- })
    return
  }
  applyingRemote = true
  try {
    useSleepSession.setState(remote ? { startedAt: remote, userId, synced: true } : { startedAt: null, userId: null, synced: false })
  } finally {
    applyingRemote = false
  }
}
