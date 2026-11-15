import { describe, expect, it } from 'vitest'
import { goalFraction, journey, moodForecastSentence, weekSentence } from './weekStory'

const steps = (vals: Array<number | null>) =>
  (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const).map((day, i) => ({ day, value: vals[i] ?? null }))

describe('goalFraction', () => {
  it('fills toward the goal and caps at full', () => {
    expect(goalFraction(4000, 8000)).toBe(0.5)
    expect(goalFraction(12000, 8000)).toBe(1)
    expect(goalFraction(null, 8000)).toBe(0)
  })
  it('counts staying within a limit as full', () => {
    expect(goalFraction(180, 240, true)).toBe(1)
    expect(goalFraction(360, 240, true)).toBe(0.5)
  })
})

describe('weekSentence', () => {
  it('counts goal days and names the best day, ignoring days still to come', () => {
    expect(weekSentence({ values: steps([9000, 3000, 8500, 12000, null, 20000]), today: 'Thu', goal: 8000, noun: 'step goal' }))
      .toBe('You reached your step goal on 3 of 4 days. Thursday was your best.')
  })
  it('is encouraging when no day hit the goal', () => {
    expect(weekSentence({ values: steps([2000, 5000]), today: 'Tue', goal: 8000, noun: 'step goal' }))
      .toBe("You haven't reached your step goal yet this week. Tuesday came closest.")
  })
  it('handles limits where less is better', () => {
    expect(weekSentence({ values: steps([180, 300, 200]), today: 'Wed', goal: 240, noun: 'screen limit', lowerIsBetter: true }))
      .toBe('You stayed within your screen limit on 2 of 3 days. Monday was your lightest.')
  })
  it('says nothing when nothing is logged', () => {
    expect(weekSentence({ values: steps([]), today: 'Wed', goal: 8000, noun: 'step goal' })).toBeNull()
  })
})

describe('moodForecastSentence', () => {
  it('describes the week as weather and mentions a dip', () => {
    expect(moodForecastSentence([{ day: 'Mon', emoji: '😄' }, { day: 'Tue', emoji: '🙂' }, { day: 'Wed', emoji: '😕' }, { day: 'Thu', emoji: '😄' }], 'Thu'))
      .toBe('Mostly bright this week, with showers on Wednesday.')
  })
  it('is gentle about a hard week', () => {
    expect(moodForecastSentence([{ day: 'Mon', emoji: '😣' }, { day: 'Tue', emoji: '😕' }], 'Tue')).toContain('Be gentle with yourself')
  })
})

describe('journey', () => {
  it('names the furthest place reached and the next one', () => {
    expect(journey(47)).toEqual({ reached: { name: 'Thika', km: 45 }, next: { name: 'Machakos', km: 63, toGo: 16 } })
    expect(journey(2).reached).toBeNull()
  })
})
