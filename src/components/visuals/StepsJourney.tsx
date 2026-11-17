import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { Check, LocateFixed, MapPin, Navigation } from 'lucide-react'

import Modal from '../ui/Modal'
import { useAuthStore } from '../../store/useAuthStore'
import { chooseTown, journeyFor, journeyOn, locateMe, walkTowns, type LocateResult } from '../../lib/walkRoute'

/**
 * The week's walking distance as a trip out of where the person is: "about
 * as far as Kondele to Maseno", with a route line, the places passed and how
 * far to the next one.
 */
export default function StepsJourney({ km }: { km: number }) {
  const profile = useAuthStore((s) => s.user?.profile)
  const [open, setOpen] = useState(false)
  const j = journeyFor(profile)
  const { reached, next } = journeyOn(j.stops, km)

  // Show the route up to the next stop (at least three stops)
  const nextIdx = j.stops.findIndex((p) => km < p.km)
  const shown = j.stops.slice(0, nextIdx === -1 ? j.stops.length : Math.max(3, nextIdx + 1))
  const end = shown[shown.length - 1].km
  const pct = Math.min(100, (km / end) * 100)
  const kmText = km >= 10 ? Math.round(km).toString() : km.toFixed(1)
  const mark = (name: string) => (/^\d/.test(name) ? `the ${name} mark` : name)
  const startLabel = j.start.replace(/^near /, '')

  return (
    <div>
      <p className="text-[17px] font-bold text-ui-ink leading-snug">
        {km <= 0
          ? 'Start a walk to begin this week’s journey.'
          : reached
            ? j.kind === 'places'
              ? <>You’ve walked <b className="font-semibold">{kmText} km</b> this week, about as far as <span className="text-[#2E7D32] dark:text-[#6FCF73]">{startLabel} to {reached.name}</span>.</>
              : <>You’ve walked <b className="font-semibold">{kmText} km</b> this week, past <span className="text-[#2E7D32] dark:text-[#6FCF73]">{mark(reached.name)}</span>.</>
            : <>You’ve walked <b className="font-semibold">{kmText} km</b> this week. Keep going to reach {mark(next?.name ?? '')}.</>}
      </p>
      {next && km > 0 && (
        <p className="text-sm text-black/50 dark:text-white/50 mt-1">{next.toGo} km more to reach {mark(next.name)}.</p>
      )}

      <div className="relative mt-6 mb-2 mx-2" aria-hidden>
        <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08]" />
        <div className="absolute top-0 left-0 h-1.5 rounded-full bg-[#3D9A41] transition-all duration-700" style={{ width: `${pct}%` }} />
        <div className="absolute -top-[5px] -translate-x-1/2 flex flex-col items-center" style={{ left: '0%' }}>
          <span className="w-4 h-4 rounded-full border-2 bg-[#3D9A41] border-[#3D9A41]" />
          <span className="mt-1.5 text-[10px] whitespace-nowrap text-black/55 dark:text-white/60 font-medium">{startLabel}</span>
        </div>
        {shown.map((p) => {
          const left = (p.km / end) * 100
          const passed = km >= p.km
          // Name only the last place reached and the next one, away from the start label
          const named = p.name === reached?.name || p.name === next?.name
          return (
            <div key={p.name} className="absolute -top-[5px] -translate-x-1/2 flex flex-col items-center" style={{ left: `${left}%` }}>
              <span className={`w-4 h-4 rounded-full border-2 ${passed ? 'bg-[#3D9A41] border-[#3D9A41]' : 'bg-white dark:bg-[#0d1526] border-black/15 dark:border-white/20'}`} />
              {named && left > 22 && (
                <span className={`mt-1.5 text-[10px] whitespace-nowrap ${passed ? 'text-black/70 dark:text-white/75 font-medium' : 'text-black/40 dark:text-white/40'}`}>{p.name}</span>
              )}
            </div>
          )
        })}
        <div className="absolute -top-[30px] -translate-x-1/2 text-[#2E7D32] dark:text-[#6FCF73]" style={{ left: `${pct}%` }} title="You">
          {km > 0 ? <Navigation size={16} className="rotate-45" fill="currentColor" /> : <MapPin size={16} />}
        </div>
      </div>

      <button type="button" onClick={() => setOpen(true)}
        className="mt-7 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ui-muted hover:text-ui-ink">
        {j.chosen
          ? <><MapPin size={13} /> From {j.start} · <span className="underline underline-offset-2">Change</span></>
          : <><LocateFixed size={13} /> <span className="underline underline-offset-2">Start from where you are</span></>}
      </button>

      <JourneyStart open={open} onClose={() => setOpen(false)} current={j.chosen ? j.start : null} />
    </div>
  )
}

/** Explain a failed location request in plain words */
export function locateMessage(r: LocateResult): string {
  if (r.ok) return `Your journey now starts from ${r.area.replace(/^near /, 'near ')}`
  if (r.reason === 'denied') return "Location wasn't allowed. You can pick a town instead."
  if (r.reason === 'unavailable') return "Couldn't find your location. Try again outside, or pick a town."
  return "Couldn't set up your journey. Check your connection."
}

function JourneyStart({ open, onClose, current }: { open: boolean; onClose: () => void; current: string | null }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [towns, setTowns] = useState<string[] | null>(null)
  useEffect(() => {
    if (open && !towns) walkTowns().then(setTowns).catch(() => setTowns([]))
  }, [open, towns])

  const locate = async () => {
    setBusy('locate')
    const r = await locateMe()
    setBusy(null)
    if (r.ok) { toast.success(locateMessage(r)); onClose() } else toast.error(locateMessage(r))
  }
  const pick = async (town: string) => {
    setBusy(town)
    try { await chooseTown(town); toast.success(`Your journey now starts from ${town}`); onClose() }
    catch { toast.error("Couldn't save. Check your connection.") }
    finally { setBusy(null) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Where does your journey start?">
      <p className="-mt-2 text-[13.5px] text-ui-muted">Your weekly walk is shown as a trip past real places around you.</p>
      <button type="button" onClick={locate} disabled={!!busy}
        className="mt-4 w-full h-12 rounded-2xl text-sm font-bold bg-lp-btn text-lp-btn-ink inline-flex items-center justify-center gap-2 disabled:opacity-60">
        <LocateFixed size={17} /> {busy === 'locate' ? 'Finding places near you…' : 'Use my location'}
      </button>
      <p className="mt-2 text-[12px] text-ui-muted leading-relaxed">
        Only your rough area (about 1 km) is used, once, to find places nearby. Your location is not saved.
      </p>

      <div className="mt-5 text-[12px] font-semibold text-ui-muted">Or pick a town</div>
      <div className="mt-2 max-h-56 overflow-y-auto -mx-1 px-1 flex flex-wrap gap-1.5">
        {towns === null && <span className="text-[12.5px] text-ui-muted">Loading…</span>}
        {towns?.map((t) => (
          <button key={t} type="button" onClick={() => pick(t)} disabled={!!busy} aria-pressed={current === t}
            className={clsx('px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors inline-flex items-center gap-1',
              current === t ? 'border-lp-primary/60 bg-lp-primary/10 text-ui-ink' : 'border-ui-line/15 text-ui-ink hover:bg-ui-raised')}>
            {current === t && <Check size={13} className="text-lp-primary" />}
            {busy === t ? 'Saving…' : t}
          </button>
        ))}
      </div>
    </Modal>
  )
}
