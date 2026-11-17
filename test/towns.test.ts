import { describe, expect, it } from 'vitest'
import { DISTANCE_MARKS, OTHER_TOWN, TOWNS, journeyOn, routeFor, routeStops } from '../src/lib/towns'

describe('the town list', () => {
  it('ids are ones the server accepts, and unique', () => {
    const ids = TOWNS.map((t) => t.id)
    for (const id of [...ids, OTHER_TOWN]) expect(id).toMatch(/^[a-z][a-z-]{1,30}$/)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every route goes outward: places in order of distance, none twice, none the town itself', () => {
    for (const t of TOWNS) {
      const kms = t.places.map((p) => p.km)
      expect(kms, t.name).toEqual([...kms].sort((a, b) => a - b))
      expect(new Set(t.places.map((p) => p.name)).size, t.name).toBe(t.places.length)
      expect(t.places.some((p) => p.name === t.name), t.name).toBe(false)
      expect(t.places.length, t.name).toBeGreaterThanOrEqual(5)
    }
  })

  it('road distances between two listed towns agree both ways (within 15%)', () => {
    for (const a of TOWNS) {
      for (const p of a.places) {
        const b = TOWNS.find((t) => t.name === p.name)
        const back = b?.places.find((q) => q.name === a.name)
        if (back) expect(Math.abs(back.km - p.km) / p.km, `${a.name} ↔ ${b!.name}`).toBeLessThanOrEqual(0.15)
      }
    }
  })
})

describe('which route a person sees', () => {
  it('their own town', () => {
    const r = routeFor('kisumu')
    expect(r.kind === 'town' && r.town.name).toBe('Kisumu')
  })
  it('plain distances for "somewhere else"', () => {
    expect(routeStops(routeFor(OTHER_TOWN))).toBe(DISTANCE_MARKS)
  })
  it('Nairobi until they choose, or for a town this version does not know', () => {
    for (const t of [null, undefined, 'atlantis']) {
      const r = routeFor(t)
      expect(r.kind === 'town' && r.town.id).toBe('nairobi')
    }
  })
})

it('a week of walking along the route', () => {
  const stops = routeStops(routeFor('kisumu'))
  expect(journeyOn(stops, 30)).toEqual({ reached: { name: 'Maseno', km: 25 }, next: { name: 'Kakamega', km: 52, toGo: 22 } })
  expect(journeyOn(stops, 1).reached).toBeNull()
  expect(journeyOn(DISTANCE_MARKS, 22).reached?.name).toBe('a half marathon')
})
