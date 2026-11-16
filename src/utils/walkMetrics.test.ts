import { describe, expect, it } from 'vitest'
import { activeCalories, metForSpeed, WalkClock } from './walkMetrics'

describe('activeCalories', () => {
  it('counts only what the walk added on top of resting', () => {
    // 1 h moderate walk (MET 3.5) at 70 kg: (3.5 − 1) × 70 = 175 kcal, not 245
    expect(activeCalories(4.5, 70, 1)).toBeCloseTo(175)
  })

  it('treats waiting at a crossing as standing, not strolling', () => {
    expect(metForSpeed(0.4)).toBe(1.3)
    // 10 minutes standing at 70 kg ≈ 3.5 kcal (strolling would have said 11.7)
    expect(activeCalories(0.4, 70, 10 / 60)).toBeCloseTo(3.5)
  })

  it('scales with weight and time', () => {
    expect(activeCalories(5.2, 90, 0.5)).toBeCloseTo((4.3 - 1) * 90 * 0.5)
  })

  it('is 0 for no time or no weight', () => {
    expect(activeCalories(5, 70, 0)).toBe(0)
    expect(activeCalories(5, 0, 1)).toBe(0)
    expect(activeCalories(5, 70, -1)).toBe(0)
  })
})

describe('WalkClock', () => {
  it('measures real elapsed time, however rarely it is read', () => {
    const c = new WalkClock()
    c.start(0)
    // The screen was off for an hour; no ticks were missed because nothing ticks
    expect(c.seconds(60 * 60 * 1000)).toBe(3600)
  })

  it('leaves out paused stretches', () => {
    const c = new WalkClock()
    c.start(0)
    c.pause(10 * 60_000) // 10 min walked
    c.start(25 * 60_000) // 15 min paused
    expect(c.seconds(30 * 60_000)).toBe(15 * 60) // 10 + 5 min walked
  })

  it('ignores repeated start and pause calls', () => {
    const c = new WalkClock()
    c.start(0)
    c.start(5000)
    c.pause(10_000)
    c.pause(20_000)
    expect(c.seconds(30_000)).toBe(10)
  })

  it('resets', () => {
    const c = new WalkClock()
    c.start(0)
    c.reset()
    expect(c.seconds(10_000)).toBe(0)
  })
})
