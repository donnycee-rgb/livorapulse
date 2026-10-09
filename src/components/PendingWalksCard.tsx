import { CloudUpload, Trash2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { notifyPendingWalksChanged, syncPendingWalks, usePendingWalks } from '../hooks/usePendingWalkSync'
import { removePendingWalk } from '../utils/pendingWalks'

/** Walks saved on this phone that haven't reached the server yet */
export default function PendingWalksCard() {
  const walks = usePendingWalks()
  const [busy, setBusy] = useState(false)
  if (walks.length === 0) return null

  const upload = async () => {
    setBusy(true)
    const saved = await syncPendingWalks()
    setBusy(false)
    if (saved === walks.length) toast.success(saved === 1 ? 'Walk uploaded' : `${saved} walks uploaded`)
    else toast.error("Couldn't upload yet. Check your connection; we'll keep trying.")
  }

  const discard = (id: string) => {
    if (!window.confirm('Delete this walk from your phone? It has not been uploaded.')) return
    removePendingWalk(id)
    notifyPendingWalksChanged()
  }

  return (
    <div className="rounded-3xl p-4 border border-amber-500/30 bg-amber-500/[0.07]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-semibold text-black/80 dark:text-white/85">
          <CloudUpload size={16} className="text-amber-500" />
          {walks.length === 1 ? '1 walk waiting to upload' : `${walks.length} walks waiting to upload`}
        </div>
        <button
          type="button"
          onClick={upload}
          disabled={busy}
          className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-lp-primary text-white disabled:opacity-60"
        >
          {busy ? 'Uploading…' : 'Upload now'}
        </button>
      </div>
      <ul className="mt-2 space-y-1">
        {walks.map((w) => (
          <li key={w.id} className="flex items-center justify-between gap-3 text-xs text-black/60 dark:text-white/55">
            <span>
              {new Date(w.startedAt).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
              {' · '}{w.distanceKm.toFixed(2)} km · {w.steps.toLocaleString()} steps
            </span>
            <button type="button" onClick={() => discard(w.id)} aria-label="Delete this walk" className="p-1 text-black/35 dark:text-white/35 hover:text-lp-alert">
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-black/40 dark:text-white/35">Saved on this phone. They upload automatically when you're online.</p>
    </div>
  )
}
