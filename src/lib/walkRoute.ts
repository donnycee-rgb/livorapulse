// ─── The walking journey ─────────────────────────────────────────────────────
// A week's walking shown as a trip past real places: "about as far as Kondele
// to Maseno". The route is built by the server from the person's rough
// location (rounded here to ~1 km, used once, never stored) or a town they
// pick, and saved on their profile so every device shows it. Until then:
// the Nairobi route. Too few places around: plain distances.

import { apiGet, apiPost } from '../api/client'
import { useAuthStore } from '../store/useAuthStore'

export type Stop = { name: string; km: number }
export type Journey = { start: string; stops: Stop[]; kind: 'places' | 'distances'; chosen: boolean }

/** Rough road distances from Nairobi CBD: the route until someone sets theirs */
export const NAIROBI_STOPS: Stop[] = [
  { name: 'Westlands', km: 4 }, { name: 'Kasarani', km: 13 }, { name: 'Ruiru', km: 25 }, { name: 'Thika', km: 45 },
  { name: 'Machakos', km: 63 }, { name: 'Naivasha', km: 90 }, { name: 'Nakuru', km: 160 }, { name: 'Kisumu', km: 345 },
  { name: 'Mombasa', km: 480 },
]

/** Distances people know, when there aren't enough named places around */
export const DISTANCE_MARKS: Stop[] = [
  { name: '5 km', km: 5 }, { name: '10 km', km: 10 }, { name: 'a half marathon', km: 21.1 },
  { name: 'a marathon', km: 42.2 }, { name: '100 km', km: 100 }, { name: '200 km', km: 200 },
]

type ProfileRoute = { walkArea?: string | null; walkRoute?: unknown } | null | undefined

const isStops = (v: unknown): v is Stop[] =>
  Array.isArray(v) && v.length >= 4 && v.every((s) => s && typeof s.name === 'string' && typeof s.km === 'number')

export function journeyFor(p: ProfileRoute): Journey {
  if (p?.walkArea && isStops(p.walkRoute)) return { start: p.walkArea, stops: p.walkRoute, kind: 'places', chosen: true }
  if (p?.walkArea) return { start: p.walkArea, stops: DISTANCE_MARKS, kind: 'distances', chosen: true }
  return { start: 'Nairobi', stops: NAIROBI_STOPS, kind: 'places', chosen: false }
}

/** The furthest stop reached, and the next one with the distance still to go */
export function journeyOn(stops: Stop[], km: number): { reached: Stop | null; next: (Stop & { toGo: number }) | null } {
  const reached = [...stops].reverse().find((p) => km >= p.km) ?? null
  const nextPlace = stops.find((p) => km < p.km) ?? null
  return { reached, next: nextPlace ? { ...nextPlace, toGo: Math.round((nextPlace.km - km) * 10) / 10 } : null }
}

/** About 1 km: the area around someone, not where they live */
export const roughly = (n: number) => Math.round(n * 100) / 100

export type LocateResult = { ok: true; area: string } | { ok: false; reason: 'denied' | 'unavailable' | 'failed' }

async function save(body: object): Promise<string> {
  const { data } = await apiPost<{ data: { area: string | null; stops: Stop[] | null } }>('/api/user/walk-route', body)
  useAuthStore.getState().patchProfile({ walkArea: data.area, walkRoute: data.stops })
  return data.area ?? 'your area'
}

/** Ask for the location once (the phone shows its own question), then build the route from it */
export function locateMe(): Promise<LocateResult> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) { resolve({ ok: false, reason: 'unavailable' }); return }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const area = await save({ lat: roughly(pos.coords.latitude), lng: roughly(pos.coords.longitude) })
          resolve({ ok: true, area })
        } catch {
          resolve({ ok: false, reason: 'failed' })
        }
      },
      (err) => resolve({ ok: false, reason: err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable' }),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 24 * 3600 * 1000 },
    )
  })
}

export const chooseTown = (town: string) => save({ town })
export const walkTowns = async () => (await apiGet<{ data: string[] }>('/api/user/walk-towns')).data
