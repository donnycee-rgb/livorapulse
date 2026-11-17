import { describe, expect, it } from 'vitest'
import { DISTANCE_MARKS, NAIROBI_STOPS, journeyFor, journeyOn, roughly } from '../src/lib/walkRoute'

const stops = [
  { name: 'Kisumu', km: 2.4 }, { name: 'Mamboleo', km: 4.4 }, { name: 'Kibos', km: 8.6 },
  { name: 'Ahero', km: 24 }, { name: 'Kakamega', km: 51 }, { name: 'Nakuru', km: 185 },
]

describe('which journey a person sees', () => {
  it('the Nairobi route until they set theirs', () => {
    for (const p of [null, undefined, {}]) {
      expect(journeyFor(p)).toMatchObject({ start: 'Nairobi', stops: NAIROBI_STOPS, chosen: false })
    }
  })

  it('their own route, built around where they are', () => {
    expect(journeyFor({ walkArea: 'Kondele', walkRoute: stops })).toMatchObject({ start: 'Kondele', kind: 'places', chosen: true })
  })

  it('plain distances when too few places were found, or the saved route is damaged', () => {
    expect(journeyFor({ walkArea: 'Your area', walkRoute: null })).toMatchObject({ stops: DISTANCE_MARKS, kind: 'distances' })
    expect(journeyFor({ walkArea: 'Kondele', walkRoute: [{ name: 'x' }] })).toMatchObject({ kind: 'distances' })
  })
})

it('a location is rounded to about 1 km before it leaves the phone', () => {
  expect(roughly(-0.0874321)).toBe(-0.09)
  expect(roughly(34.7701234)).toBe(34.77)
})

it('a week of walking along the route', () => {
  expect(journeyOn(stops, 30)).toEqual({ reached: { name: 'Ahero', km: 24 }, next: { name: 'Kakamega', km: 51, toGo: 21 } })
  expect(journeyOn(stops, 1).reached).toBeNull()
})
