import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Navigation, Footprints, Flame, Clock } from 'lucide-react'
import type { ActivityLogEntry } from '../data/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtDuration(sec: number): string {
  if (!sec) return '—'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
}

function fmtDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(2)} km`
}

// ---------------------------------------------------------------------------
// Static map with green trail using Leaflet
// ---------------------------------------------------------------------------
interface ReplayMapProps {
  trail: Array<{ lat: number; lng: number }>
}

function ReplayMap({ trail }: ReplayMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current || trail.length === 0) return
    initializedRef.current = true

    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const linkEl = document.createElement('link')
      linkEl.rel = 'stylesheet'
      linkEl.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
      document.head.appendChild(linkEl)
    }

    const initMap = () => {
      if (!containerRef.current) return
      const L = (window as any).L

      const center: [number, number] = [trail[0].lat, trail[0].lng]

      const map = L.map(containerRef.current, {
        center,
        zoom: 16,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      // Draw the green trail
      const latlngs = trail.map(c => [c.lat, c.lng] as [number, number])
      const polyline = L.polyline(latlngs, {
        color: '#4CAF50',
        weight: 5,
        opacity: 0.9,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map)

      // Start marker — green circle
      L.circleMarker([trail[0].lat, trail[0].lng], {
        radius: 8,
        fillColor: '#4CAF50',
        color: '#fff',
        weight: 3,
        fillOpacity: 1,
      }).addTo(map).bindTooltip('Start', { permanent: false })

      // End marker — darker green circle
      if (trail.length > 1) {
        const last = trail[trail.length - 1]
        L.circleMarker([last.lat, last.lng], {
          radius: 8,
          fillColor: '#1A5C2A',
          color: '#fff',
          weight: 3,
          fillOpacity: 1,
        }).addTo(map).bindTooltip('Finish', { permanent: false })
      }

      // Fit map to trail bounds
      map.fitBounds(polyline.getBounds(), { padding: [32, 32] })

      mapRef.current = map
    }

    // Leaflet already loaded?
    if ((window as any).L) {
      initMap()
    } else {
      const scriptEl = document.createElement('script')
      scriptEl.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
      scriptEl.onload = initMap
      document.head.appendChild(scriptEl)
    }

    return () => {
      if (mapRef.current) {
        const m = mapRef.current as { remove: () => void }
        m.remove()
        mapRef.current = null
        initializedRef.current = false
      }
    }
  }, [trail])

  if (trail.length === 0) {
    return (
      <div className="w-full h-full rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-3">
        <MapPin size={28} className="text-white/20" />
        <p className="text-white/30 text-sm">No trail data recorded for this walk</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-2xl overflow-hidden"
      style={{ minHeight: 280 }}
    />
  )
}

// ---------------------------------------------------------------------------
// Stat pill
// ---------------------------------------------------------------------------
function StatPill({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex-1">
      <div className="text-lp-primary">{icon}</div>
      <span className="text-white text-lg font-black leading-none">{value}</span>
      <span className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">{label}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// WalkReplayMap — main component
// ---------------------------------------------------------------------------
interface WalkReplayMapProps {
  walk: ActivityLogEntry | null
  onClose: () => void
}

export default function WalkReplayMap({ walk, onClose }: WalkReplayMapProps) {
  const isOpen = walk !== null

  const date = walk
    ? new Date(walk.timestamp).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  const time = walk
    ? new Date(walk.timestamp).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : ''

  return (
    <AnimatePresence>
      {isOpen && walk && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col"
          style={{ background: 'linear-gradient(160deg, #091525 0%, #0e1d40 60%, #0b2218 100%)' }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-lp-primary/20 border border-lp-primary/30 flex items-center justify-center">
                <Navigation size={16} className="text-lp-primary" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base leading-none">Walk Replay</h2>
                <p className="text-white/40 text-xs mt-0.5">{date} · {time}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Map */}
          <div className="flex-1 px-4 min-h-0">
            <ReplayMap trail={walk.trail ?? []} />
          </div>

          {/* Stats */}
          <div className="px-4 pt-3 pb-6 flex-shrink-0 space-y-3">
            <div className="flex gap-2">
              <StatPill
                icon={<Navigation size={16} />}
                label="Distance"
                value={fmtDistance(walk.distanceKm)}
              />
              <StatPill
                icon={<Footprints size={16} />}
                label="Steps"
                value={walk.steps > 0 ? walk.steps.toLocaleString() : '—'}
              />
              <StatPill
                icon={<Flame size={16} />}
                label="Calories"
                value={walk.caloriesKcal > 0 ? `${walk.caloriesKcal}` : '—'}
              />
              <StatPill
                icon={<Clock size={16} />}
                label="Duration"
                value={fmtDuration(walk.durationSec ?? 0)}
              />
            </div>

            {/* Walk note */}
            {walk.note && (
              <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/50 text-xs">{walk.note}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
