// ─── Logs kept on the phone until the server has them ───────────────────────
// Every log (a meal, a glass of water, mood, sleep, screen time, a focus
// session, an eco action) goes through saveLog. With a connection it's sent
// straight away. Without one, or if the server is down, it's kept here with
// the time it was made, shown in the app as if saved, and uploaded later in
// the order it was made. Each log carries a random id the server uses to save
// it exactly once, so a retry after a dropped reply never doubles it.

import { createElement } from 'react'
import { CloudOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiRequest } from '../api/client'
import { useAuthStore } from '../store/useAuthStore'

export type OutboxItem = {
  /** Also the Idempotency-Key the server dedupes on */
  id: string
  /** Whose log this is: never uploaded to a different account */
  userId: string
  path: string
  body: Record<string, unknown>
  createdAt: string
}

const KEY = 'lp_outbox'
const MAX_ITEMS = 300
/** The server won't accept logs older than this (see clientTime on the backend) */
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000

// ─── Storage ─────────────────────────────────────────────────────────────────
const listeners = new Set<() => void>()

export function listOutbox(): OutboxItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? (JSON.parse(raw) as OutboxItem[]) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function write(list: OutboxItem[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_ITEMS)))
  } catch { /* storage full or blocked: nothing more we can do */ }
  listeners.forEach((fn) => fn())
}

/** Re-render when the queue changes (here or in another tab) */
export function subscribeOutbox(fn: () => void): () => void {
  listeners.add(fn)
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) fn() }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(fn)
    window.removeEventListener('storage', onStorage)
  }
}

/** Take back a log that hasn't uploaded yet (e.g. a meal deleted while offline) */
export function removeFromOutbox(id: string): void {
  write(listOutbox().filter((i) => i.id !== id))
}

export function pendingFor(userId: string | undefined, path?: string): OutboxItem[] {
  if (!userId) return []
  return listOutbox().filter((i) => i.userId === userId && (path === undefined || i.path === path))
}

function newId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// ─── Sending ─────────────────────────────────────────────────────────────────

/** No signal, server down or busy, or signed out for now: worth trying again later */
export function isRetryable(err: unknown): boolean {
  const e = err as { offline?: boolean; status?: number; sessionEnded?: boolean } | null
  if (!e) return false
  if (e.offline || e.sessionEnded) return true
  const status = e.status ?? 0
  return status === 0 || status === 408 || status === 429 || status >= 500
}

function send(item: OutboxItem): Promise<unknown> {
  return apiRequest(item.path, {
    method: 'POST',
    body: JSON.stringify(item.body),
    headers: { 'Idempotency-Key': item.id },
  })
}

export type SaveResult = 'sent' | 'queued'

/**
 * Save a log now, or keep it on the phone to upload later. Resolves 'queued'
 * when it was kept; throws only for a log the server rejected (bad data),
 * which retrying won't fix.
 */
export async function saveLog(path: string, body: Record<string, unknown>): Promise<SaveResult> {
  const userId = useAuthStore.getState().user?.id
  const item: OutboxItem = { id: newId(), userId: userId ?? '', path, body, createdAt: new Date().toISOString() }

  // Earlier logs still waiting go first, so this one doesn't overtake them
  if (userId && pendingFor(userId).length > 0) {
    write([...listOutbox(), item])
    void flushOutbox()
    notifyQueued()
    return 'queued'
  }

  try {
    await send(item)
    return 'sent'
  } catch (err) {
    if (!userId || !isRetryable(err)) throw err
    write([...listOutbox(), item])
    notifyQueued()
    return 'queued'
  }
}

function notifyQueued(): void {
  toast("Saved on your phone. It'll upload when you're back online.", { id: 'outbox-queued', icon: createElement(CloudOff, { size: 18, 'aria-hidden': true }) })
}

// ─── Uploading what's waiting ────────────────────────────────────────────────
let flushing: Promise<FlushResult> | null = null

export type FlushResult = { sent: number; dropped: number; left: number }

/**
 * Upload the signed-in person's waiting logs, oldest first. One run at a
 * time: asked while a run is going (the connection may have just come back),
 * it runs again once that one ends.
 */
export function flushOutbox(): Promise<FlushResult> {
  if (flushing) return flushing.then(() => flushOutbox())
  flushing = runFlush().finally(() => { flushing = null })
  return flushing
}

async function runFlush(): Promise<FlushResult> {
  const userId = useAuthStore.getState().user?.id
  let sent = 0
  let dropped = 0
  if (!userId) return { sent, dropped, left: 0 }

  for (const item of pendingFor(userId)) {
    // Too old for the server to accept: let it go rather than retry forever
    if (Date.now() - Date.parse(item.createdAt) > MAX_AGE_MS) {
      write(listOutbox().filter((i) => i.id !== item.id))
      dropped++
      continue
    }
    try {
      await send(item)
      sent++
    } catch (err) {
      if (isRetryable(err)) break // still offline: keep this and everything after it
      dropped++ // the server rejected it; retrying won't help
    }
    write(listOutbox().filter((i) => i.id !== item.id))
  }

  if (dropped > 0) {
    toast.error(`${dropped} saved ${dropped === 1 ? 'log' : 'logs'} couldn't be uploaded and ${dropped === 1 ? 'was' : 'were'} removed.`, { id: 'outbox-dropped' })
  }
  return { sent, dropped, left: pendingFor(userId).length }
}
