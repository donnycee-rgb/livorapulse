import { describe, expect, it } from 'vitest'
import { SYMPTOMS, addDaysKey, cycleTrackingOn, dateRange, daysBetween, monthGrid } from '../src/lib/cycle'

describe('who sees the cycle tracker', () => {
  it("on for women and off for everyone else, until the person chooses", () => {
    expect(cycleTrackingOn({ gender: 'female' })).toBe(true)
    expect(cycleTrackingOn({ gender: 'male' })).toBe(false)
    expect(cycleTrackingOn({})).toBe(false)
    expect(cycleTrackingOn(null)).toBe(false)
  })

  it('their own choice wins either way', () => {
    expect(cycleTrackingOn({ gender: 'female', cycleTracking: false })).toBe(false)
    expect(cycleTrackingOn({ gender: 'other', cycleTracking: true })).toBe(true)
    expect(cycleTrackingOn({ gender: 'female', cycleTracking: null })).toBe(true)
  })
})

describe('dates', () => {
  it('adds and counts calendar days across months', () => {
    expect(addDaysKey('2026-11-30', 2)).toBe('2026-12-02')
    expect(daysBetween('2026-10-21', '2026-11-18')).toBe(28)
  })

  it('ranges read naturally', () => {
    expect(dateRange('2026-11-17', '2026-11-19')).toContain('17–19')
    expect(dateRange('2026-11-17', '2026-11-19')).not.toMatch(/–\D/)
    expect(dateRange('2026-11-30', '2026-12-02')).toContain(' – ')
  })

  it('month grid starts on Monday', () => {
    // 1 Nov 2026 is a Sunday: six blanks first
    const g = monthGrid(2026, 10)
    expect(g.slice(0, 6).every((k) => k === null)).toBe(true)
    expect(g[6]).toBe('2026-11-01')
    expect(g.filter(Boolean)).toHaveLength(30)
  })
})

it('"Severe cramps" stays a symptom: the health flags look for it by name', () => {
  expect(SYMPTOMS).toContain('Severe cramps')
})
