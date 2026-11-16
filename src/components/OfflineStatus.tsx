import { CloudOff, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { flushOutbox } from '../offline/outbox'
import { useOnline, usePendingCount } from '../offline/useOutboxSync'

/**
 * A slim bar under the header when there's no connection or logs are waiting
 * to upload, so people know what they log is safe. Hidden otherwise.
 */
export default function OfflineStatus() {
  const online = useOnline()
  const pending = usePendingCount()
  const [busy, setBusy] = useState(false)
  if (online && pending === 0) return null

  const logs = `${pending} ${pending === 1 ? 'log' : 'logs'}`
  const text = !online
    ? pending > 0
      ? `You're offline. ${logs} saved on your phone will upload when you're back online.`
      : "You're offline. Anything you log is saved on your phone and uploads later."
    : `${logs} waiting to upload.`

  const retry = async () => {
    setBusy(true)
    await flushOutbox().catch(() => null)
    setBusy(false)
  }

  return (
    <div role="status" className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium bg-amber-50 text-amber-900 border-b border-amber-200/70 dark:bg-amber-400/10 dark:text-amber-200 dark:border-amber-300/15">
      <CloudOff size={14} className="flex-shrink-0" aria-hidden />
      <span>{text}</span>
      {online && pending > 0 && (
        <button type="button" onClick={retry} disabled={busy}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold hover:bg-amber-100 dark:hover:bg-amber-300/10 disabled:opacity-60">
          <RefreshCw size={12} className={busy ? 'animate-spin' : undefined} aria-hidden /> Upload now
        </button>
      )}
    </div>
  )
}
