import { describe, expect, it } from 'vitest'
import type { MoodEffect } from '../api/ml'
import { HABITS, describeEffect, describeForecast } from './moodWording'

const effect = (over: Partial<MoodEffect>): MoodEffect => ({
  feature: 'sleepHours', unit: '1 hour of sleep', mean: 0.3, sd: 0.08, probPositive: 0.99,
  claim: 'personal', updatedAt: '2026-11-16T00:00:00Z', ...over,
})

describe('describeEffect', () => {
  it('says "for you" only for personal patterns', () => {
    expect(describeEffect(effect({}))!.headline).toBe('For you, more sleep goes with a better mood.')
    expect(describeEffect(effect({ claim: 'typical' }))!.headline).toBe('For most people, more sleep goes with a better mood.')
  })

  it('words habits that hurt as "a lower mood" with a tip to do less', () => {
    const s = describeEffect(effect({ feature: 'socialHours', mean: -0.12 }))!
    expect(s.headline).toBe('For you, more social media the day before goes with a lower mood.')
    expect(s.detail).toBe('About −0.1 on a 1–5 mood per extra hour.')
    expect(s.helps).toBe(false)
    expect(s.tip).toBe(HABITS.socialHours.tip.down)
    expect(s.to).toBe('/digital')
  })

  it('keeps small sizes readable and hides tiny ones', () => {
    expect(describeEffect(effect({ feature: 'stepsK', mean: 0.03 }))!.detail).toBe('About +0.03 on a 1–5 mood per 1,000 steps.')
    expect(describeEffect(effect({ feature: 'stepsK', mean: 0.03 }))!.headline).toBe('For you, more steps the day before go with a better mood.')
    expect(describeEffect(effect({ mean: 0.004 }))!.detail).toBeNull()
  })

  it('ignores habits it has no words for', () => {
    expect(describeEffect(effect({ feature: 'somethingNew' }))).toBeNull()
  })

  it('has words for every habit the model reports', () => {
    for (const f of ['sleepHours', 'stepsK', 'screenHours', 'socialHours', 'focusHours', 'waterGlasses']) {
      expect(HABITS[f]).toBeDefined()
    }
  })
})

describe('describeForecast', () => {
  it('is supportive across the scale', () => {
    expect(describeForecast(4.3).title).toBe('Today looks like a good day')
    expect(describeForecast(3.5).title).toBe('Today looks steady')
    expect(describeForecast(2.8).title).toBe('Today might feel a little heavier')
    expect(describeForecast(1.6).body).toContain('reach out')
  })
})
