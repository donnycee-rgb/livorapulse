import { useState } from 'react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { Check, MapPin, Navigation } from 'lucide-react'

import Modal from '../ui/Modal'
import { apiPut } from '../../api/client'
import { useAuthStore } from '../../store/useAuthStore'
import { OTHER_TOWN, TOWNS, journeyOn, routeFor, routeStops } from '../../lib/towns'

/**
 * The week's walking distance as a trip out of the person's own town: "about
 * as far as Kisumu to Maseno", with a route line, the places passed and how
 * far to the next one. "Somewhere else" uses plain distances instead.
 */
export default function StepsJourney({ km }: { km: number }) {
  const homeTown = useAuthStore((s) => s.user?.profile?.homeTown)
  const [picking, setPicking] = useState(false)
  const route = routeFor(homeTown)
  const stops = routeStops(route)
  const start = route.kind === 'town' ? route.town.name : 'Start'
  const { reached, next } = journeyOn(stops, km)

  // Show the route up to the next stop (at least three stops)
  const nextIdx = stops.findIndex((p) => km < p.km)
  const shown = stops.slice(0, nextIdx === -1 ? stops.length : Math.max(3, nextIdx + 1))
  const end = shown[shown.length - 1].km
  const pct = Math.min(100, (km / end) * 100)
  const kmText = km >= 10 ? Math.round(km).toString() : km.toFixed(1)
  const mark = (name: string) => (/^\d/.test(name) ? `the ${name} mark` : name)

  return (
    <div>
      <p className="text-[17px] font-bold text-ui-ink leading-snug">
        {km <= 0
          ? 'Start a walk to begin this week’s journey.'
          : reached
            ? route.kind === 'town'
              ? <>You’ve walked <b className="font-semibold">{kmText} km</b> this week, about as far as <span className="text-[#2E7D32] dark:text-[#6FCF73]">{start} to {reached.name}</span>.</>
              : <>You’ve walked <b className="font-semibold">{kmText} km</b> this week, past <span className="text-[#2E7D32] dark:text-[#6FCF73]">{mark(reached.name)}</span>.</>
            : <>You’ve walked <b className="font-semibold">{kmText} km</b> this week. Keep going to reach {mark(next?.name ?? '')}.</>}
      </p>
      {next && km > 0 && (
        <p className="text-sm text-black/50 dark:text-white/50 mt-1">{next.toGo} km more to reach {mark(next.name)}.</p>
      )}

      <div className="relative mt-6 mb-2 mx-2" aria-hidden>
        <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08]" />
        <div className="absolute top-0 left-0 h-1.5 rounded-full bg-[#3D9A41] transition-all duration-700" style={{ width: `${pct}%` }} />
        {/* Start */}
        <div className="absolute -top-[5px] -translate-x-1/2 flex flex-col items-center" style={{ left: '0%' }}>
          <span className="w-4 h-4 rounded-full border-2 bg-[#3D9A41] border-[#3D9A41]" />
          <span className="mt-1.5 text-[10px] whitespace-nowrap text-black/55 dark:text-white/60 font-medium">{start}</span>
        </div>
        {shown.map((p) => {
          const left = (p.km / end) * 100
          const passed = km >= p.km
          // Name only the last place reached and the next one; the rest are dots (no overlapping labels)
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

      <button type="button" onClick={() => setPicking(true)}
        className="mt-7 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ui-muted hover:text-ui-ink">
        <MapPin size={13} />
        {homeTown ? <>From {start} · <span className="underline underline-offset-2">Change town</span></> : <span className="underline underline-offset-2">Not in Nairobi? Choose your town</span>}
      </button>

      <TownPicker open={picking} onClose={() => setPicking(false)} current={homeTown ?? null} />
    </div>
  )
}

function TownPicker({ open, onClose, current }: { open: boolean; onClose: () => void; current: string | null }) {
  const patchProfile = useAuthStore((s) => s.patchProfile)
  const [saving, setSaving] = useState<string | null>(null)

  const choose = async (id: string) => {
    if (saving) return
    setSaving(id)
    try {
      await apiPut('/api/user/profile', { homeTown: id })
      patchProfile({ homeTown: id })
      const town = TOWNS.find((t) => t.id === id)
      toast.success(town ? `Your journey now starts from ${town.name}` : 'Your journey now uses distances')
      onClose()
    } catch {
      toast.error("Couldn't save. Check your connection.")
    } finally {
      setSaving(null)
    }
  }

  const option = (id: string, label: string, sub?: string) => (
    <button key={id} type="button" onClick={() => choose(id)} aria-pressed={current === id}
      className={clsx('flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors border',
        current === id ? 'border-lp-primary/60 bg-lp-primary/10' : 'border-transparent bg-ui-raised hover:bg-ui-line/[0.08]')}>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-ui-ink truncate">{saving === id ? 'Saving…' : label}</span>
        {sub && <span className="block text-[12px] text-ui-muted">{sub}</span>}
      </span>
      {current === id && <Check size={15} className="text-lp-primary flex-shrink-0" />}
    </button>
  )

  return (
    <Modal open={open} onClose={onClose} title="Where do you walk?">
      <p className="-mt-2 text-[13.5px] text-ui-muted">Your weekly walking journey starts from this town, past real places nearby.</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {TOWNS.map((t) => option(t.id, t.name))}
      </div>
      <div className="mt-2 grid">
        {option(OTHER_TOWN, 'Somewhere else', 'Use distances: 5 km, a half marathon, a marathon…')}
      </div>
    </Modal>
  )
}
