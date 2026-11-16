import { describe, expect, it } from 'vitest'
import { ecoSentence, focusGrid, focusSentence, plateSentence, plateSlices, screenSplitSentence } from './visualStories'

describe('plate', () => {
  it('splits today by energy and points to the biggest gap with Kenyan foods', () => {
    // 300 g carbs (1200 kcal), 20 g protein (80), 20 g fat (180)
    const slices = plateSlices({ carbsG: 300, proteinG: 20, fatG: 20 })!
    expect(slices.find((s) => s.macro === 'carbs')!.share).toBeCloseTo(1200 / 1460, 5)
    expect(plateSentence(slices)).toBe('Your plate is light on protein today. Try adding beans, eggs, fish, ndengu or a little nyama.')
  })
  it('puts protein first for an ugali-and-sukuma lunch, even when fat is lower', () => {
    expect(plateSentence(plateSlices({ carbsG: 137, proteinG: 16, fatG: 9 })))
      .toBe('Your plate is light on protein today. Try adding beans, eggs, fish, ndengu or a little nyama.')
  })
  it('names another gap when protein is fine', () => {
    expect(plateSentence(plateSlices({ carbsG: 50, proteinG: 60, fatG: 50 }))).toContain('light on starch')
  })
  it('praises a balanced plate', () => {
    expect(plateSentence(plateSlices({ carbsG: 250, proteinG: 100, fatG: 66 }))).toBe('Nicely balanced plate so far today.')
  })
  it('says nothing before anything is logged', () => {
    expect(plateSlices({ carbsG: 0, proteinG: 0, fatG: 0 })).toBeNull()
    expect(plateSentence(null)).toBeNull()
  })
})

describe('focus times', () => {
  const now = new Date(2026, 10, 13, 18, 0) // Friday 13 Nov 2026, 18:00
  const at = (day: number, h: number) => new Date(2026, 10, day, h, 0).getTime()

  it('buckets this week’s sessions by day and part of the day', () => {
    const grid = focusGrid([
      { startedAt: at(9, 8), durationSec: 50 * 60 },   // Mon morning
      { startedAt: at(10, 9), durationSec: 40 * 60 },  // Tue morning
      { startedAt: at(11, 14), durationSec: 30 * 60 }, // Wed afternoon
      { startedAt: at(12, 1), durationSec: 20 * 60 },  // Thu 01:00 -> Wed night
      { startedAt: at(2, 8), durationSec: 99 * 60 },   // last week: ignored
    ], now)
    expect(grid.Mon.morning).toBe(50)
    expect(grid.Wed.afternoon).toBe(30)
    expect(grid.Wed.night).toBe(20)
    expect(focusSentence(grid)).toBe('You focus most in the morning: 1h 30m of your 2h 20m this week.')
  })
  it('says nothing without sessions', () => {
    expect(focusSentence(focusGrid([], now))).toBeNull()
  })
})

describe('screen split and eco', () => {
  it('names where most screen time went', () => {
    expect(screenSplitSentence([{ category: 'Social', minutes: 120 }, { category: 'Productive', minutes: 60 }, { category: 'Entertainment', minutes: 20 }]))
      .toBe('Most of your screen time went to social media (60%).')
  })
  it('turns CO₂ saved into car kilometres', () => {
    expect(ecoSentence(5, 2.4)).toBe('5 leaves on your plant this week. You saved 2.4 kg CO₂, like leaving a car parked for 14 km.')
    expect(ecoSentence(1, 0)).toBe('1 leaf on your plant this week. Every choice counts.')
    expect(ecoSentence(0, 0)).toBeNull()
  })
})
