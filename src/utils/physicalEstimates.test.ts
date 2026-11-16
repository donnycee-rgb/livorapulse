import { describe, expect, it } from 'vitest'
import { stepsEstimate, strideFromHeight } from './walkMetrics'
import { activityValue } from '../lib/activities'
import { buildSleepToday } from '../store/useAppStore'

describe('steps typed in from the phone', () => {
  it('distance comes from the person’s stride (their height)', () => {
    expect(strideFromHeight(180)).toBeCloseTo(0.747, 3)
    expect(stepsEstimate(10000, 180, 75).distanceKm).toBeCloseTo(7.47, 2)
    // shorter people take shorter steps
    expect(stepsEstimate(10000, 150, 75).distanceKm).toBeLessThan(stepsEstimate(10000, 180, 75).distanceKm)
  })

  it('calories come from their weight: a heavier person burns more on the same steps', () => {
    const light = stepsEstimate(6000, 170, 55).caloriesKcal
    const heavy = stepsEstimate(6000, 170, 95).caloriesKcal
    expect(light).toBeGreaterThan(0)
    expect(heavy).toBeGreaterThan(light)
  })

  it('says when it had to use typical values', () => {
    expect(stepsEstimate(5000, null, 70).estimated).toBe(true)
    expect(stepsEstimate(5000, 170, null).estimated).toBe(true)
    expect(stepsEstimate(5000, 170, 70).estimated).toBe(false)
  })
})

describe('another activity', () => {
  it('matches the server: football, 80 kg, 30 min', () => {
    expect(activityValue('football', 30, 80)).toMatchObject({ caloriesKcal: 240, stepEquivalent: 6000, intensity: 'vigorous' })
  })
})

describe('sleep today', () => {
  const at = (h: number) => { const d = new Date(); d.setHours(h, 0, 0, 0); return d.toISOString() }
  const e = (sleepMinutes: number, sleepType: 'night' | 'nap' | null, h: number) =>
    ({ id: `${h}`, steps: 0, distanceKm: 0, caloriesKcal: 0, sleepMinutes, sleepType, timestamp: at(h) })

  it('last night plus naps', () => {
    const st = buildSleepToday([e(300, 'night', 7), e(120, 'nap', 15), e(30, 'nap', 17)])
    expect(st.nightHours).toBe(5)
    expect(st.napMinutes).toBe(150)
  })

  it('older entries without a type count as last night', () => {
    expect(buildSleepToday([e(420, null, 7)]).nightHours).toBe(7)
  })
})
