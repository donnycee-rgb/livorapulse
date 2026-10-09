import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import type { HealthSummary } from '../api/summary'
import { fetchSharedSummary, sharedPdfUrl } from '../api/summary'
import HealthSummaryView from '../components/HealthSummaryView'
import Skeleton from '../components/ui/Skeleton'

/**
 * Public page for a shared health summary (e.g. opened by a doctor).
 * No sign-in; the token in the link is the only key.
 */
export default function SharedSummary() {
  const { token = '' } = useParams()
  const [summary, setSummary] = useState<HealthSummary | null>(null)
  const [failed, setFailed] = useState(false)

  // Don't send this page's address (which holds the token) to anywhere it links or loads from
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'referrer'
    meta.content = 'no-referrer'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchSharedSummary(token)
      .then((s) => { if (!cancelled) setSummary(s) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [token])

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-[#0a0f1a]">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <div className="text-xs font-bold text-lp-primary">LivoraPulse</div>
            <h1 className="text-xl sm:text-2xl font-black text-black/85 dark:text-white/90">Shared health summary</h1>
          </div>
          {summary && (
            <a
              href={sharedPdfUrl(token)}
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-lp-primary text-white shadow-card hover:opacity-95"
            >
              <Download size={15} /> PDF
            </a>
          )}
        </div>

        <div className="rounded-3xl p-5 max-sm:p-4 bg-white dark:bg-slate-950 border border-black/[0.08] dark:border-white/[0.08]">
          {!summary && !failed && (
            <div className="space-y-3">
              <Skeleton className="h-10" />
              <div className="grid sm:grid-cols-2 gap-3"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
            </div>
          )}
          {failed && (
            <div className="py-8 text-center">
              <div className="text-base font-bold text-black/75 dark:text-white/80">This link isn't available</div>
              <p className="text-sm text-black/50 dark:text-white/45 mt-1">
                It may have expired (links last 7 days) or been revoked. Ask the person who shared it for a new one.
              </p>
            </div>
          )}
          {summary && <HealthSummaryView summary={summary} />}
        </div>
      </div>
    </div>
  )
}
