// ─── Walks kept on the phone until they're saved ────────────────────────────
// A walk is written here before it's sent to the server and removed only once
// the server has it. If saving fails (no signal, signed out, server down) the
// walk waits here and is sent again later — it's never lost.

const KEY = 'lp_pending_walks'
const MAX_KEPT = 10

export type PendingWalk = {
  id: string
  /** Whose walk this is — never uploaded to a different account */
  userId: string
  /** When the walk started (ISO), so it lands on the right day even if saved later */
  startedAt: string
  steps: number
  distanceKm: number
  caloriesKcal: number
  durationSec: number
  trail: { lat: number; lng: number }[]
  note: string
}

export function listPendingWalks(): PendingWalk[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? (JSON.parse(raw) as PendingWalk[]) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function write(list: PendingWalk[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_KEPT)))
  } catch {
    // Storage full: drop the route of older walks rather than losing the newest walk
    const slim = list.slice(-MAX_KEPT).map((w, i, all) => (i < all.length - 1 ? { ...w, trail: [] } : w))
    try { localStorage.setItem(KEY, JSON.stringify(slim)) } catch { /* nothing more we can do */ }
  }
}

export function keepPendingWalk(walk: PendingWalk): void {
  write([...listPendingWalks().filter((w) => w.id !== walk.id), walk])
}

export function removePendingWalk(id: string): void {
  write(listPendingWalks().filter((w) => w.id !== id))
}

export function pendingWalksFor(userId: string | undefined): PendingWalk[] {
  return userId ? listPendingWalks().filter((w) => w.userId === userId) : []
}
