import { ChevronDown, FileText, HeartHandshake, Phone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

import type { HealthFlag } from '../api/flags'
import { dismissFlag, fetchFlags } from '../api/flags'

// "Worth getting checked" prompts. Calm on purpose: a gentle nudge with the
// reason and one next step, never an alarm. All wording comes from the
// backend (one place to review and translate).

function FlagCard({ flag, onDismissed }: { flag: HealthFlag; onDismissed: (id: string) => void }) {
  const [showWhy, setShowWhy] = useState(false)
  const [busy, setBusy] = useState(false)

  const dismiss = async () => {
    setBusy(true)
    try {
      await dismissFlag(flag.id)
      onDismissed(flag.id)
      toast.success("Hidden. If the pattern continues, we'll mention it again in a month.")
    } catch {
      toast.error("Couldn't hide this right now. Please try again.")
      setBusy(false)
    }
  }

  return (
    <div
      className="rounded-3xl p-5 max-sm:p-4"
      style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(0,188,212,0.05) 100%)', border: '1px solid rgba(99,102,241,0.18)' }}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#6366F1]/15 flex items-center justify-center flex-shrink-0">
          <HeartHandshake size={17} className="text-[#6366F1]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold text-black/40 dark:text-white/35 uppercase tracking-wider">Worth checking</div>
          <div className="text-sm font-bold text-black/85 dark:text-white/90 mt-0.5">{flag.title}</div>
          <p className="mt-1.5 text-sm leading-relaxed text-black/65 dark:text-white/60">{flag.message}</p>

          {flag.actions.includes('support') && (
            <div className="mt-3 space-y-2">
              {flag.contacts.map((c) => (
                <a
                  key={c.phone}
                  href={`tel:${c.phone.replace(/\s+/g, '')}`}
                  className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 bg-white/70 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] hover:bg-white dark:hover:bg-white/[0.08] transition"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-black/80 dark:text-white/85">{c.name}</span>
                    <span className="block text-xs text-black/50 dark:text-white/45">{c.description}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-bold text-[#6366F1] flex-shrink-0">
                    <Phone size={14} /> {c.phone}
                  </span>
                </a>
              ))}
              <p className="text-xs text-black/50 dark:text-white/45">
                If you ever feel unsafe or might harm yourself, contact emergency services or go to the nearest hospital.
              </p>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {flag.actions.includes('summary') && (
              <Link
                to="/summary"
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold bg-[#6366F1] text-white hover:opacity-95"
              >
                <FileText size={13} /> Open health summary
              </Link>
            )}
            <button
              type="button"
              onClick={() => setShowWhy((v) => !v)}
              aria-expanded={showWhy}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-black/60 dark:text-white/60 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
            >
              Why am I seeing this?
              <ChevronDown size={13} className={showWhy ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
            <button
              type="button"
              onClick={dismiss}
              disabled={busy}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-black/45 dark:text-white/40 hover:bg-black/[0.05] dark:hover:bg-white/[0.07] disabled:opacity-60"
            >
              Dismiss
            </button>
          </div>
          {showWhy && <p className="mt-2 text-xs leading-relaxed text-black/50 dark:text-white/45">{flag.why}</p>}
        </div>
      </div>
    </div>
  )
}

/** The user's active flags. Renders nothing when there are none or the feature is switched off. */
export default function HealthFlags() {
  const [flags, setFlags] = useState<HealthFlag[]>([])

  useEffect(() => {
    let cancelled = false
    fetchFlags()
      .then((r) => { if (!cancelled && r.enabled) setFlags(r.flags) })
      .catch(() => null) // pages work without it
    return () => { cancelled = true }
  }, [])

  if (flags.length === 0) return null
  return (
    <div className="space-y-3">
      {flags.map((f) => (
        <FlagCard key={f.id} flag={f} onDismissed={(id) => setFlags((list) => list.filter((x) => x.id !== id))} />
      ))}
    </div>
  )
}
