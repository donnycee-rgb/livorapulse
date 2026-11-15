import { MapPin, Navigation } from 'lucide-react'
import { NAIROBI_PLACES, journey } from '../../lib/weekStory'

/**
 * The week's walking distance as a trip out of Nairobi: "about as far as
 * Thika", with a route line, the places passed and how far to the next one.
 */
export default function StepsJourney({ km }: { km: number }) {
  const { reached, next } = journey(km)
  // Show the route up to the next stop (at least three stops)
  const nextIdx = NAIROBI_PLACES.findIndex((p) => km < p.km)
  const stops = NAIROBI_PLACES.slice(0, nextIdx === -1 ? NAIROBI_PLACES.length : Math.max(3, nextIdx + 1))
  const end = stops[stops.length - 1].km
  const pct = Math.min(100, (km / end) * 100)
  const kmText = km >= 10 ? Math.round(km).toString() : km.toFixed(1)

  return (
    <div>
      <p className="font-serif text-xl text-black/85 dark:text-white/90 leading-snug">
        {km <= 0
          ? 'Start a walk to begin this week’s journey.'
          : reached
            ? <>You’ve walked <b className="font-semibold">{kmText} km</b> this week, about as far as <span className="text-[#2E7D32] dark:text-[#6FCF73]">Nairobi to {reached.name}</span>.</>
            : <>You’ve walked <b className="font-semibold">{kmText} km</b> this week. Keep going to reach {next?.name}.</>}
      </p>
      {next && km > 0 && (
        <p className="text-sm text-black/50 dark:text-white/50 mt-1">{next.toGo} km more to reach {next.name}.</p>
      )}

      <div className="relative mt-6 mb-2 mx-2" aria-hidden>
        <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08]" />
        <div className="absolute top-0 left-0 h-1.5 rounded-full bg-[#3D9A41] transition-all duration-700" style={{ width: `${pct}%` }} />
        {/* Start */}
        <div className="absolute -top-[5px] -translate-x-1/2 flex flex-col items-center" style={{ left: '0%' }}>
          <span className="w-4 h-4 rounded-full border-2 bg-[#3D9A41] border-[#3D9A41]" />
          <span className="mt-1.5 text-[10px] whitespace-nowrap text-black/55 dark:text-white/60 font-medium">Nairobi</span>
        </div>
        {stops.map((p) => {
          const left = (p.km / end) * 100
          const passed = km >= p.km
          // Name only the last place reached and the next one; the rest are dots (no overlapping labels)
          const named = p.name === reached?.name || p.name === next?.name
          return (
            <div key={p.name} className="absolute -top-[5px] -translate-x-1/2 flex flex-col items-center" style={{ left: `${left}%` }}>
              <span className={`w-4 h-4 rounded-full border-2 ${passed ? 'bg-[#3D9A41] border-[#3D9A41]' : 'bg-white dark:bg-[#0d1526] border-black/15 dark:border-white/20'}`} />
              {named && (
                <span className={`mt-1.5 text-[10px] whitespace-nowrap ${passed ? 'text-black/70 dark:text-white/75 font-medium' : 'text-black/40 dark:text-white/40'}`}>{p.name}</span>
              )}
            </div>
          )
        })}
        <div className="absolute -top-[30px] -translate-x-1/2 text-[#2E7D32] dark:text-[#6FCF73]" style={{ left: `${pct}%` }} title="You">
          {km > 0 ? <Navigation size={16} className="rotate-45" fill="currentColor" /> : <MapPin size={16} />}
        </div>
      </div>
      <div className="h-6" />
    </div>
  )
}
