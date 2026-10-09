import { Copy, Download, Link2, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import type { HealthSummary as Summary, SummaryMonths, SummaryShare } from '../api/summary'
import { createShare, downloadSummaryPdf, fetchShares, fetchSummary, revokeShare } from '../api/summary'
import HealthSummaryView, { formatDateLong } from '../components/HealthSummaryView'
import Skeleton from '../components/ui/Skeleton'

const panel = 'rounded-3xl p-5 max-sm:p-4 border border-black/[0.08] dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.02]'

export default function HealthSummary() {
  const [months, setMonths] = useState<SummaryMonths>(1)
  const [notes, setNotes] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [failed, setFailed] = useState(false)
  const [shares, setShares] = useState<SummaryShare[]>([])
  const [newLink, setNewLink] = useState<{ url: string; expiresAt: string } | null>(null)
  const [busy, setBusy] = useState<'pdf' | 'share' | null>(null)

  useEffect(() => {
    let cancelled = false
    setSummary(null)
    setFailed(false)
    fetchSummary(months, notes)
      .then((s) => { if (!cancelled) setSummary(s) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [months, notes])

  const loadShares = useCallback(() => {
    fetchShares().then(setShares).catch(() => null)
  }, [])
  useEffect(loadShares, [loadShares])

  const download = async () => {
    setBusy('pdf')
    try {
      await downloadSummaryPdf(months, notes)
    } catch {
      toast.error("Couldn't make the PDF. Please try again.")
    } finally {
      setBusy(null)
    }
  }

  const share = async () => {
    setBusy('share')
    try {
      const link = await createShare(months, notes)
      setNewLink({ url: link.url, expiresAt: link.expiresAt })
      loadShares()
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Couldn't create the link. Please try again.")
    } finally {
      setBusy(null)
    }
  }

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    } catch {
      toast.error('Copy failed — select the link and copy it instead')
    }
  }

  const revoke = async (id: string) => {
    if (!window.confirm('Revoke this link? Anyone who has it will no longer be able to open it.')) return
    try {
      await revokeShare(id)
      setShares((list) => list.filter((s) => s.id !== id))
      setNewLink(null)
      toast.success('Link revoked')
    } catch {
      toast.error("Couldn't revoke the link. Please try again.")
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-black/85 dark:text-white/90">Health summary</h1>
        <p className="text-sm text-black/45 dark:text-white/40 mt-0.5 max-w-lg">
          A one-page summary of your sleep, mood, stress, walks and cycle to show a doctor. Download it as a PDF or share a link that expires.
        </p>
      </div>

      {/* Options and actions */}
      <div className={panel}>
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="inline-flex rounded-xl bg-black/[0.05] dark:bg-white/[0.07] p-1" role="group" aria-label="Time period">
            {([1, 3] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMonths(m); setNewLink(null) }}
                aria-pressed={months === m}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-semibold transition',
                  months === m ? 'bg-white dark:bg-slate-800 text-black/85 dark:text-white shadow-sm' : 'text-black/55 dark:text-white/55',
                )}
              >
                {m === 1 ? 'Last month' : 'Last 3 months'}
              </button>
            ))}
          </div>

          <label className="flex items-start gap-2 text-sm text-black/70 dark:text-white/70 cursor-pointer">
            <input
              type="checkbox"
              checked={notes}
              onChange={(e) => { setNotes(e.target.checked); setNewLink(null) }}
              className="mt-0.5 h-4 w-4 accent-[#4CAF50]"
            />
            <span>
              Include my notes
              <span className="block text-xs text-black/40 dark:text-white/35">Notes you wrote with mood and period logs. Off unless you tick it.</span>
            </span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={download}
            disabled={busy !== null || !summary}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-lp-primary text-white shadow-card hover:opacity-95 disabled:opacity-60"
          >
            <Download size={15} /> {busy === 'pdf' ? 'Making PDF…' : 'Download PDF'}
          </button>
          <button
            type="button"
            onClick={share}
            disabled={busy !== null || !summary}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-black/[0.06] dark:bg-white/[0.08] text-black/75 dark:text-white/80 hover:bg-black/[0.1] dark:hover:bg-white/[0.12] disabled:opacity-60"
          >
            <Link2 size={15} /> {busy === 'share' ? 'Creating link…' : 'Share a link'}
          </button>
        </div>

        {newLink && (
          <div className="mt-4 rounded-2xl p-3 bg-lp-primary/10">
            <div className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1.5">
              Anyone with this link can see this summary until {formatDateLong(newLink.expiresAt)}. You can revoke it below.
            </div>
            <div className="flex gap-2">
              <input
                readOnly
                value={newLink.url}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-black/75 dark:text-white/80"
              />
              <button
                type="button"
                onClick={() => copy(newLink.url)}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold bg-lp-primary text-white"
              >
                <Copy size={13} /> Copy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Links that still work */}
      {shares.length > 0 && (
        <div className={panel}>
          <div className="text-sm font-bold text-black/75 dark:text-white/80 mb-3">Shared links</div>
          <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {shares.map((s) => (
              <li key={s.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0 text-sm text-black/70 dark:text-white/65">
                  {s.months === 1 ? 'Last month' : 'Last 3 months'}{s.includeNotes ? ', with notes' : ''}
                  <div className="text-xs text-black/40 dark:text-white/35">
                    Made {formatDateLong(s.createdAt)} · expires {formatDateLong(s.expiresAt)} · opened {s.viewCount} {s.viewCount === 1 ? 'time' : 'times'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => revoke(s.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-lp-alert hover:bg-lp-alert/10 flex-shrink-0"
                >
                  <Trash2 size={13} /> Revoke
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview of exactly what will be shared */}
      <div className={panel}>
        <div className="text-[10px] font-bold text-black/35 dark:text-white/30 uppercase tracking-wider mb-3">Preview</div>
        {!summary && !failed && (
          <div className="space-y-3">
            <Skeleton className="h-10" />
            <div className="grid sm:grid-cols-2 gap-3"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
          </div>
        )}
        {failed && <p className="text-sm text-black/60 dark:text-white/55">Couldn't load your summary. Check your connection and try again.</p>}
        {summary && <HealthSummaryView summary={summary} />}
      </div>
    </div>
  )
}
