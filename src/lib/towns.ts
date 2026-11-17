// ─── The walking journey, from the person's own town ────────────────────────
// A week's walking distance shown as a trip: "about as far as Kisumu to
// Maseno". Each town has real places around it at rough road distances from
// the town centre (rounded; good enough to picture, not to navigate by).
// People elsewhere pick "Somewhere else" and get plain distances instead.
// The choice is saved on the profile (homeTown), so every device shows it.

export type Place = { name: string; km: number }
export type Town = { id: string; name: string; places: Place[] }

export const TOWNS: Town[] = [
  { id: 'nairobi', name: 'Nairobi', places: [
    { name: 'Westlands', km: 4 }, { name: 'Kasarani', km: 13 }, { name: 'Ruiru', km: 25 }, { name: 'Thika', km: 45 },
    { name: 'Machakos', km: 63 }, { name: 'Naivasha', km: 90 }, { name: 'Nakuru', km: 160 }, { name: 'Kisumu', km: 345 },
    { name: 'Mombasa', km: 480 },
  ] },
  { id: 'mombasa', name: 'Mombasa', places: [
    { name: 'Nyali', km: 6 }, { name: 'Bamburi', km: 12 }, { name: 'Mtwapa', km: 20 }, { name: 'Kilifi', km: 57 },
    { name: 'Malindi', km: 118 }, { name: 'Voi', km: 160 }, { name: 'Mtito Andei', km: 245 }, { name: 'Nairobi', km: 480 },
  ] },
  { id: 'kisumu', name: 'Kisumu', places: [
    { name: 'Kondele', km: 3 }, { name: 'Mamboleo', km: 7 }, { name: 'Maseno', km: 25 }, { name: 'Kakamega', km: 52 },
    { name: 'Kericho', km: 83 }, { name: 'Eldoret', km: 155 }, { name: 'Nakuru', km: 185 }, { name: 'Nairobi', km: 345 },
  ] },
  { id: 'nakuru', name: 'Nakuru', places: [
    { name: 'Lanet', km: 8 }, { name: 'Njoro', km: 20 }, { name: 'Gilgil', km: 40 }, { name: 'Molo', km: 50 },
    { name: 'Naivasha', km: 70 }, { name: 'Nyahururu', km: 72 }, { name: 'Eldoret', km: 155 }, { name: 'Nairobi', km: 160 },
    { name: 'Kisumu', km: 185 },
  ] },
  { id: 'eldoret', name: 'Eldoret', places: [
    { name: 'Kapsoya', km: 5 }, { name: 'Iten', km: 35 }, { name: 'Kapsabet', km: 40 }, { name: 'Webuye', km: 60 },
    { name: 'Kitale', km: 70 }, { name: 'Kakamega', km: 110 }, { name: 'Nakuru', km: 155 }, { name: 'Nairobi', km: 310 },
  ] },
  { id: 'thika', name: 'Thika', places: [
    { name: 'Juja', km: 15 }, { name: 'Kenol', km: 22 }, { name: 'Ruiru', km: 25 }, { name: 'Nairobi', km: 45 },
    { name: "Murang'a", km: 48 }, { name: 'Embu', km: 90 }, { name: 'Nyeri', km: 105 },
  ] },
  { id: 'nyeri', name: 'Nyeri', places: [
    { name: 'Mweiga', km: 18 }, { name: 'Othaya', km: 28 }, { name: 'Karatina', km: 30 }, { name: 'Naro Moru', km: 35 },
    { name: 'Nanyuki', km: 60 }, { name: "Murang'a", km: 75 }, { name: 'Thika', km: 105 }, { name: 'Nairobi', km: 150 },
  ] },
  { id: 'machakos', name: 'Machakos', places: [
    { name: 'Kangundo', km: 33 }, { name: 'Athi River', km: 37 }, { name: 'Nairobi', km: 63 }, { name: 'Wote', km: 70 },
    { name: 'Kitui', km: 105 }, { name: 'Mombasa', km: 450 },
  ] },
  { id: 'kakamega', name: 'Kakamega', places: [
    { name: 'Vihiga', km: 25 }, { name: 'Mumias', km: 36 }, { name: 'Webuye', km: 50 }, { name: 'Kisumu', km: 52 },
    { name: 'Bungoma', km: 65 }, { name: 'Eldoret', km: 110 }, { name: 'Nairobi', km: 390 },
  ] },
  { id: 'meru', name: 'Meru', places: [
    { name: 'Nkubu', km: 17 }, { name: 'Timau', km: 50 }, { name: 'Isiolo', km: 58 }, { name: 'Chuka', km: 65 },
    { name: 'Nanyuki', km: 85 }, { name: 'Embu', km: 125 }, { name: 'Nairobi', km: 230 },
  ] },
  { id: 'kisii', name: 'Kisii', places: [
    { name: 'Keroka', km: 22 }, { name: 'Nyamira', km: 25 }, { name: 'Oyugis', km: 30 }, { name: 'Homa Bay', km: 65 },
    { name: 'Migori', km: 67 }, { name: 'Kericho', km: 100 }, { name: 'Kisumu', km: 110 }, { name: 'Nairobi', km: 310 },
  ] },
  { id: 'malindi', name: 'Malindi', places: [
    { name: 'Gede', km: 16 }, { name: 'Watamu', km: 22 }, { name: 'Kilifi', km: 58 }, { name: 'Mtwapa', km: 98 },
    { name: 'Garsen', km: 110 }, { name: 'Mombasa', km: 118 },
  ] },
]

/** For "Somewhere else": distances people know */
export const DISTANCE_MARKS: Place[] = [
  { name: '5 km', km: 5 }, { name: '10 km', km: 10 }, { name: 'a half marathon', km: 21.1 },
  { name: 'a marathon', km: 42.2 }, { name: '100 km', km: 100 }, { name: '200 km', km: 200 },
]

export const OTHER_TOWN = 'other'

export type Route = { kind: 'town'; town: Town } | { kind: 'distances' }

/** The route for a saved homeTown: a known town, distances for "other", Nairobi until chosen */
export function routeFor(homeTown: string | null | undefined): Route {
  if (homeTown === OTHER_TOWN) return { kind: 'distances' }
  const town = TOWNS.find((t) => t.id === homeTown)
  if (town) return { kind: 'town', town }
  return { kind: 'town', town: TOWNS[0] }
}

export const routeStops = (r: Route): Place[] => (r.kind === 'town' ? r.town.places : DISTANCE_MARKS)

/** The furthest stop reached, and the next one with the distance still to go */
export function journeyOn(stops: Place[], km: number): { reached: Place | null; next: (Place & { toGo: number }) | null } {
  const reached = [...stops].reverse().find((p) => km >= p.km) ?? null
  const nextPlace = stops.find((p) => km < p.km) ?? null
  return { reached, next: nextPlace ? { ...nextPlace, toGo: Math.round((nextPlace.km - km) * 10) / 10 } : null }
}
