import { describe, expect, it } from 'vitest'
import { inThisWeek, startOfThisWeek } from './useAppStore'

// Local times: new Date(y, m, d, h) — 16 Nov 2026 is a Monday
const at = (d: number, h = 12) => new Date(2026, 10, d, h)

describe('the charts show this week, Monday to Sunday', () => {
  it('starts the week at midnight on Monday', () => {
    expect(new Date(startOfThisWeek(at(16, 9))).toString()).toBe(new Date(2026, 10, 16, 0).toString())
    expect(new Date(startOfThisWeek(at(18))).toString()).toBe(new Date(2026, 10, 16, 0).toString()) // Wednesday
    expect(new Date(startOfThisWeek(at(22, 23))).toString()).toBe(new Date(2026, 10, 16, 0).toString()) // Sunday night
  })

  it("on a Monday, last weekend's logs are not in this week", () => {
    const monday = at(16, 15)
    expect(inThisWeek(at(14).toISOString(), monday)).toBe(false) // last Saturday
    expect(inThisWeek(at(15, 23).toISOString(), monday)).toBe(false) // last Sunday night
    expect(inThisWeek(at(16, 0).toISOString(), monday)).toBe(true) // just after midnight
  })

  it('on a Sunday, the whole week since Monday counts', () => {
    const sunday = at(22, 20)
    expect(inThisWeek(at(16, 8).toISOString(), sunday)).toBe(true)
    expect(inThisWeek(at(22, 10).toISOString(), sunday)).toBe(true)
    expect(inThisWeek(at(15, 10).toISOString(), sunday)).toBe(false)
  })
})
