import { useEffect, useSyncExternalStore } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { flushOutbox, pendingFor, subscribeOutbox } from './outbox'

const RETRY_MS = 60_000

/**
 * Uploads logs kept on the phone: when the connection comes back, when the
 * app comes to the front, and every minute while any are waiting. After an
 * upload, `onSynced` refreshes the app with the server's view.
 */
export function useOutboxSync(onSynced: () => void): void {
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    if (!userId) return
    const run = () => {
      if (pendingFor(userId).length === 0) return
      flushOutbox().then((r) => { if (r.sent > 0) onSynced() }).catch(() => null)
    }
    const onVisible = () => { if (document.visibilityState === 'visible') run() }
    window.addEventListener('online', run)
    document.addEventListener('visibilitychange', onVisible)
    const timer = window.setInterval(run, RETRY_MS)
    run()
    return () => {
      window.removeEventListener('online', run)
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [userId, onSynced])
}

/** How many of the signed-in person's logs are waiting to upload */
export function usePendingCount(): number {
  const userId = useAuthStore((s) => s.user?.id)
  return useSyncExternalStore(subscribeOutbox, () => pendingFor(userId).length, () => 0)
}

function subscribeOnline(fn: () => void): () => void {
  window.addEventListener('online', fn)
  window.addEventListener('offline', fn)
  return () => {
    window.removeEventListener('online', fn)
    window.removeEventListener('offline', fn)
  }
}

/** The browser's own idea of whether there's a connection */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true)
}
