import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Play, Pause, Square, X, Save, Trash2, Navigation } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppStore } from '../store/useAppStore'
import { useAuthStore } from '../store/useAuthStore'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Coord {
  lat: number
  lng: number
}

type TrackingState = 'idle' | 'requesting' | 'active' | 'paused' | 'done'

// ---------------------------------------------------------------------------
// Haversine distance between two coords in km
// ---------------------------------------------------------------------------
function haversine(a: Coord, b: Coord): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

// ---------------------------------------------------------------------------
// Calories: MET × body weight × hours, worked out per GPS segment so that
// running, brisk walking and standing still are each counted properly.
// MET values from the Compendium of Physical Activities.
// ---------------------------------------------------------------------------
function metForSpeed(kmh: number): number {
  if (kmh < 2.5) return 2.0   // strolling
  if (kmh < 4) return 2.8     // slow walk
  if (kmh < 5) return 3.5     // moderate walk
  if (kmh < 5.6) return 4.3   // brisk walk
  if (kmh < 6.5) return 5.0   // very brisk walk
  if (kmh < 8) return 7.0     // jogging
  if (kmh < 9.7) return 8.3   // running ~6:45 min/km
  if (kmh < 11.3) return 9.8  // running ~5:50 min/km
  return 11.0                 // running faster
}

// GPS filtering
const MAX_ACCURACY_M = 30    // ignore fixes less accurate than this
const MIN_MOVE_M = 5         // ignore movement smaller than this (GPS jitter)
const MAX_SPEED_KMH = 25     // faster than this is a GPS jump or a vehicle
const MIN_STEP_GAP_MS = 280  // ~3.5 steps/s — faster "steps" are phone shakes
const DEFAULT_WEIGHT_KG = 70

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------
function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function fmtDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(2)} km`
}

// ---------------------------------------------------------------------------
// Leaflet map component (lazy-loaded)
// ---------------------------------------------------------------------------
interface MapViewProps {
  trail: Coord[]
  current: Coord | null
}

function MapView({ trail, current }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)
  const polylineRef = useRef<unknown>(null)
  const markerRef = useRef<unknown>(null)
  const initializedRef = useRef(false)

  // Load Leaflet from CDN and initialise map
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const linkEl = document.createElement('link')
    linkEl.rel = 'stylesheet'
    linkEl.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
    document.head.appendChild(linkEl)

    const scriptEl = document.createElement('script')
    scriptEl.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
    scriptEl.onload = () => {
      if (!containerRef.current) return
      const L = (window as unknown as { L: unknown }).L as {
        map: (el: HTMLElement, opts: unknown) => unknown
        tileLayer: (url: string, opts: unknown) => { addTo: (m: unknown) => unknown }
        polyline: (coords: [number, number][], opts: unknown) => { addTo: (m: unknown) => unknown; setLatLngs: (c: [number, number][]) => void }
        circleMarker: (coord: [number, number], opts: unknown) => { addTo: (m: unknown) => unknown; setLatLng: (c: [number, number]) => void }
        latLng: (lat: number, lng: number) => unknown
      }

      const center: [number, number] = current
        ? [current.lat, current.lng]
        : [0, 0]

      const map = L.map(containerRef.current, {
        center,
        zoom: 16,
        zoomControl: true,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      const polyline = L.polyline(
        trail.map(c => [c.lat, c.lng] as [number, number]),
        { color: '#4CAF50', weight: 4, opacity: 0.85 },
      )
      polyline.addTo(map)

      const marker = current
        ? L.circleMarker([current.lat, current.lng], {
            radius: 8,
            fillColor: '#4CAF50',
            color: '#fff',
            weight: 2,
            fillOpacity: 1,
          })
        : null
      if (marker) marker.addTo(map)

      mapRef.current = map
      polylineRef.current = polyline
      markerRef.current = marker
    }
    document.head.appendChild(scriptEl)

    return () => {
      if (mapRef.current) {
        const m = mapRef.current as { remove: () => void }
        m.remove()
        mapRef.current = null
        initializedRef.current = false
      }
    }
  }, [])

  // Update trail and marker when coords change
  useEffect(() => {
    if (!mapRef.current || !polylineRef.current) return

    const polyline = polylineRef.current as {
      setLatLngs: (c: [number, number][]) => void
    }
    polyline.setLatLngs(trail.map(c => [c.lat, c.lng]))

    if (current && markerRef.current) {
      const marker = markerRef.current as { setLatLng: (c: [number, number]) => void }
      marker.setLatLng([current.lat, current.lng])

      const map = mapRef.current as { panTo: (c: [number, number]) => void }
      map.panTo([current.lat, current.lng])
    }
  }, [trail, current])

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-2xl overflow-hidden"
      style={{ minHeight: 280 }}
    />
  )
}

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------
function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
      <p className="text-white/40 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className="text-white text-2xl font-black mt-1 leading-none">{value}</p>
      {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// WalkTracker — main component
// ---------------------------------------------------------------------------
interface WalkTrackerProps {
  open: boolean
  onClose: () => void
}

export default function WalkTracker({ open, onClose }: WalkTrackerProps) {
  const addActivity = useAppStore((s) => s.addActivity)
  const weightKg = useAuthStore((s) => s.user?.profile?.weightKg) || DEFAULT_WEIGHT_KG
  const heightCm = useAuthStore((s) => s.user?.profile?.heightCm) || null
  // Average walking stride ≈ 41.5% of height; 0.75 m when height is unknown
  const strideM = heightCm ? heightCm * 0.00415 : 0.75

  const [trackingState, setTrackingState] = useState<TrackingState>('idle')
  const [trail, setTrail] = useState<Coord[]>([])
  const [currentPos, setCurrentPos] = useState<Coord | null>(null)
  const [distanceKm, setDistanceKm] = useState(0)
  const [steps, setSteps] = useState(0)
  const [calories, setCalories] = useState(0)
  const [durationSec, setDurationSec] = useState(0)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  const watchIdRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastCoordRef = useRef<Coord | null>(null)
  const stepBufferRef = useRef<number[]>([])
  const lastStepAtRef = useRef(0)
  const lastFixAtRef = useRef<number | null>(null)
  const weightRef = useRef(weightKg)
  weightRef.current = weightKg
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null)
  const isActiveRef = useRef(false)


  // ---------------------------------------------------------------------------
  // Step counting via DeviceMotion
  // ---------------------------------------------------------------------------
  const handleMotion = useCallback((e: DeviceMotionEvent) => {
    if (!isActiveRef.current) return
    const acc = e.accelerationIncludingGravity
    if (!acc) return
    const mag = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2)
    stepBufferRef.current.push(mag)

    if (stepBufferRef.current.length >= 5) {
      const avg = stepBufferRef.current.reduce((a, b) => a + b, 0) / stepBufferRef.current.length
      const max = Math.max(...stepBufferRef.current)
      const nowMs = e.timeStamp || performance.now()
      if (max - avg > 3.5 && nowMs - lastStepAtRef.current >= MIN_STEP_GAP_MS) {
        lastStepAtRef.current = nowMs
        setSteps(s => s + 1)
      }
      stepBufferRef.current = []
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Start tracking
  // ---------------------------------------------------------------------------
  const startTracking = useCallback(async () => {
    setTrackingState('requesting')
    setPermissionError(null)

    // Request motion permission on iOS
    if (typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
      try {
        const perm = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission()
        if (perm !== 'granted') {
          setPermissionError('Motion permission denied — step counting unavailable.')
        }
      } catch {
        setPermissionError('Could not request motion permission.')
      }
    }

    if (!navigator.geolocation) {
      setPermissionError('GPS is not supported on this device.')
      setTrackingState('idle')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coord: Coord = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCurrentPos(coord)
        lastCoordRef.current = coord
        lastFixAtRef.current = pos.timestamp || Date.now()
        setTrail([coord])
        isActiveRef.current = true
        setTrackingState('active')

        // Watch position
        watchIdRef.current = navigator.geolocation.watchPosition(
          (p) => {
            if (!isActiveRef.current) return
            const newCoord: Coord = { lat: p.coords.latitude, lng: p.coords.longitude }
            setCurrentPos(newCoord)

            // Inaccurate fixes (indoors, under cover) would add phantom distance
            if (p.coords.accuracy > MAX_ACCURACY_M) return

            const fixAt = p.timestamp || Date.now()
            if (!lastCoordRef.current || lastFixAtRef.current === null) {
              lastCoordRef.current = newCoord
              lastFixAtRef.current = fixAt
              return
            }

            const dKm = haversine(lastCoordRef.current, newCoord)
            // Movement must beat both the jitter floor and half the reported accuracy
            if (dKm * 1000 < Math.max(MIN_MOVE_M, p.coords.accuracy / 2)) return

            const hours = (fixAt - lastFixAtRef.current) / 3600000
            const kmh = hours > 0 ? dKm / hours : Infinity
            lastCoordRef.current = newCoord
            lastFixAtRef.current = fixAt

            // A jump or a vehicle ride — move the marker but don't count it
            if (kmh > MAX_SPEED_KMH) return

            setDistanceKm(prev => prev + dKm)
            setTrail(prev => [...prev, newCoord])
            setCalories(prev => prev + metForSpeed(kmh) * weightRef.current * hours)
          },
          (err) => {
            console.warn('GPS error:', err.message)
          },
          { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
        )

        // Duration timer
        timerRef.current = setInterval(() => {
          setDurationSec(s => s + 1)
        }, 1000)

        // Step counting
        window.addEventListener('devicemotion', handleMotion)

        // Wake lock
        if ('wakeLock' in navigator) {
          navigator.wakeLock.request('screen').then(lock => {
            wakeLockRef.current = lock
          }).catch(() => null)
        }
      },
      (err) => {
        setPermissionError(`Location error: ${err.message}`)
        setTrackingState('idle')
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }, [handleMotion])

  // ---------------------------------------------------------------------------
  // Pause / resume
  // ---------------------------------------------------------------------------
  const pauseTracking = useCallback(() => {
    isActiveRef.current = false
    if (timerRef.current) clearInterval(timerRef.current)
    setTrackingState('paused')
  }, [])

  const resumeTracking = useCallback(() => {
    // Start a fresh segment — distance moved while paused shouldn't count
    lastFixAtRef.current = null
    isActiveRef.current = true
    timerRef.current = setInterval(() => setDurationSec(s => s + 1), 1000)
    setTrackingState('active')
  }, [])

  // ---------------------------------------------------------------------------
  // Stop tracking
  // ---------------------------------------------------------------------------
  const stopTracking = useCallback(() => {
    isActiveRef.current = false
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    window.removeEventListener('devicemotion', handleMotion)
    if (wakeLockRef.current) wakeLockRef.current.release().catch(() => null)
    setTrackingState('done')
  }, [handleMotion])

  // ---------------------------------------------------------------------------
  // Save session
  // ---------------------------------------------------------------------------
  const saveSession = useCallback(async () => {
    if (distanceKm < 0.01 && steps < 10) {
      toast.error('Walk too short to save')
      return
    }
    // Phones without a usable motion sensor count few or no steps — fall back
    // to an estimate from the GPS distance and the user's stride
    const stepsFromDistance = Math.round((distanceKm * 1000) / strideM)
    const finalSteps = steps < stepsFromDistance * 0.5 ? stepsFromDistance : steps
    try {
      await addActivity({
        steps: finalSteps,
        distanceKm: Math.round(distanceKm * 100) / 100,
        caloriesKcal: Math.round(calories),
        durationSec,
        trail,
        note: `Walk · ${fmtDuration(durationSec)}`,
      })
      toast.success('Walk saved!')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save walk. Try again.')
    }
  }, [addActivity, steps, distanceKm, calories, durationSec, trail, onClose, strideM])

  // ---------------------------------------------------------------------------
  // Discard / reset
  // ---------------------------------------------------------------------------
  const discardSession = useCallback(() => {
    stopTracking()
    setTrail([])
    setCurrentPos(null)
    setDistanceKm(0)
    setSteps(0)
    setCalories(0)
    lastStepAtRef.current = 0
    lastFixAtRef.current = null
    setDurationSec(0)
    setPermissionError(null)
    setTrackingState('idle')
  }, [stopTracking])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
      window.removeEventListener('devicemotion', handleMotion)
      if (wakeLockRef.current) wakeLockRef.current.release().catch(() => null)
    }
  }, [handleMotion])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <AnimatePresence>
      {open && (
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
                <h2 className="text-white font-bold text-base leading-none">Walk Tracker</h2>
                <p className="text-white/40 text-xs mt-0.5">
                  {trackingState === 'idle' && 'Ready to start'}
                  {trackingState === 'requesting' && 'Getting GPS…'}
                  {trackingState === 'active' && 'Tracking your walk'}
                  {trackingState === 'paused' && 'Paused'}
                  {trackingState === 'done' && 'Walk complete'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (trackingState === 'active' || trackingState === 'paused') {
                  stopTracking()
                } else {
                  discardSession()
                  onClose()
                }
              }}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Map — takes remaining space */}
          <div className="flex-1 px-4 min-h-0">
            {(trackingState === 'active' || trackingState === 'paused' || trackingState === 'done') && currentPos ? (
              <MapView trail={trail} current={currentPos} />
            ) : (
              <div className="w-full h-full rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-full bg-lp-primary/10 border border-lp-primary/20 flex items-center justify-center">
                  <MapPin size={28} className="text-lp-primary/60" />
                </div>
                <p className="text-white/30 text-sm text-center px-8">
                  {trackingState === 'requesting'
                    ? 'Acquiring GPS signal…'
                    : 'Your route will appear here once you start walking'}
                </p>
              </div>
            )}
          </div>

          {/* Metrics */}
          {(trackingState === 'active' || trackingState === 'paused' || trackingState === 'done') && (
            <div className="px-4 pt-3 grid grid-cols-4 gap-2 flex-shrink-0">
              <MetricCard label="Distance" value={fmtDistance(distanceKm)} />
              <MetricCard label="Steps" value={steps.toLocaleString()} />
              <MetricCard label="Time" value={fmtDuration(durationSec)} />
              <MetricCard label="Calories" value={`${Math.round(calories)}`} sub="kcal" />
            </div>
          )}

          {/* Permission error */}
          {permissionError && (
            <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-lp-alert/10 border border-lp-alert/20 flex-shrink-0">
              <p className="text-lp-alert text-xs">{permissionError}</p>
            </div>
          )}

          {/* Controls */}
          <div className="px-4 pt-3 pb-6 flex gap-3 flex-shrink-0">

            {/* Idle */}
            {trackingState === 'idle' && (
              <button
                type="button"
                onClick={startTracking}
                className="flex-1 flex items-center justify-center gap-2 bg-lp-primary text-white font-semibold rounded-2xl py-4 hover:bg-green-500 hover:shadow-xl hover:shadow-lp-primary/25 transition-all duration-200 text-sm"
              >
                <Play size={18} />
                Start Walk
              </button>
            )}

            {/* Requesting */}
            {trackingState === 'requesting' && (
              <div className="flex-1 flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-2xl py-4">
                <div className="w-5 h-5 rounded-full border-2 border-t-lp-primary border-white/10 animate-spin" />
                <span className="text-white/50 text-sm">Getting your location…</span>
              </div>
            )}

            {/* Active */}
            {trackingState === 'active' && (
              <>
                <button
                  type="button"
                  onClick={pauseTracking}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/10 border border-white/15 text-white font-semibold rounded-2xl py-4 hover:bg-white/15 transition-all duration-200 text-sm"
                >
                  <Pause size={18} />
                  Pause
                </button>
                <button
                  type="button"
                  onClick={stopTracking}
                  className="flex-1 flex items-center justify-center gap-2 bg-lp-alert/15 border border-lp-alert/30 text-lp-alert font-semibold rounded-2xl py-4 hover:bg-lp-alert/25 transition-all duration-200 text-sm"
                >
                  <Square size={18} />
                  Stop
                </button>
              </>
            )}

            {/* Paused */}
            {trackingState === 'paused' && (
              <>
                <button
                  type="button"
                  onClick={resumeTracking}
                  className="flex-1 flex items-center justify-center gap-2 bg-lp-primary text-white font-semibold rounded-2xl py-4 hover:bg-green-500 transition-all duration-200 text-sm"
                >
                  <Play size={18} />
                  Resume
                </button>
                <button
                  type="button"
                  onClick={stopTracking}
                  className="flex-1 flex items-center justify-center gap-2 bg-lp-alert/15 border border-lp-alert/30 text-lp-alert font-semibold rounded-2xl py-4 hover:bg-lp-alert/25 transition-all duration-200 text-sm"
                >
                  <Square size={18} />
                  Stop
                </button>
              </>
            )}

            {/* Done */}
            {trackingState === 'done' && (
              <>
                <button
                  type="button"
                  onClick={discardSession}
                  className="w-12 h-14 flex items-center justify-center bg-white/5 border border-white/10 text-white/40 rounded-2xl hover:text-lp-alert hover:border-lp-alert/30 transition-all duration-200 flex-shrink-0"
                  aria-label="Discard"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={saveSession}
                  className="flex-1 flex items-center justify-center gap-2 bg-lp-primary text-white font-semibold rounded-2xl py-4 hover:bg-green-500 hover:shadow-xl hover:shadow-lp-primary/25 transition-all duration-200 text-sm"
                >
                  <Save size={18} />
                  Save Walk
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}