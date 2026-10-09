import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { useAppStore } from '../store/useAppStore'
import { useAuthStore } from '../store/useAuthStore'
import { pendingWalksFor, removePendingWalk, type PendingWalk } from '../utils/pendingWalks'

const CHANGED = 'lp-pending-walks-changed'

/** Tell the app the list of waiting walks changed (so cards and counts update) */
export function notifyPendingWalksChanged(): void {
  window.dispatchEvent(new Event(CHANGED))
}

let syncing: Promise<number> | null = null

/**
 * Sends the signed-in user's waiting walks to the server, oldest first.
 * Stops at the first failure (likely still offline) and tries again later.
 * Returns how many were saved.
 */
export function syncPendingWalks(): Promise<number> {
  if (syncing) return syncing
  syncing = (async () => {
    const userId = useAuthStore.getState().user?.id
    let saved = 0
    for (const w of pendingWalksFor(userId)) {
      try {
        await useAppStore.getState().addActivity({
          steps: w.steps,
          distanceKm: w.distanceKm,
          caloriesKcal: w.caloriesKcal,
          durationSec: w.durationSec,
          trail: w.trail,
          note: w.note,
          startedAt: w.startedAt,
        })
        removePendingWalk(w.id)
        saved++
      } catch {
        break
      }
    }
    if (saved > 0) notifyPendingWalksChanged()
    return saved
  })().finally(() => { syncing = null })
  return syncing
}

/** Uploads waiting walks when the app opens and whenever the connection comes back */
export function usePendingWalkSync(): void {
  const userId = useAuthStore((s) => s.user?.id)
  useEffect(() => {
    if (!userId) return
    const run = () => {
      syncPendingWalks().then((n) => {
        if (n > 0) toast.success(n === 1 ? 'Your saved walk has been uploaded' : `${n} saved walks have been uploaded`)
      })
    }
    run()
    window.addEventListener('online', run)
    return () => window.removeEventListener('online', run)
  }, [userId])
}

/** The signed-in user's waiting walks, kept up to date */
export function usePendingWalks(): PendingWalk[] {
  const userId = useAuthStore((s) => s.user?.id)
  const [walks, setWalks] = useState<PendingWalk[]>(() => pendingWalksFor(userId))
  useEffect(() => {
    const update = () => setWalks(pendingWalksFor(userId))
    update()
    window.addEventListener(CHANGED, update)
    window.addEventListener('storage', update) // another tab
    return () => {
      window.removeEventListener(CHANGED, update)
      window.removeEventListener('storage', update)
    }
  }, [userId])
  return walks
}

