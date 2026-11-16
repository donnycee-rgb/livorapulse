import { describe, expect, it, beforeEach } from 'vitest'
import { nutritionFor, perServing, topK, rememberGrams, rememberedGrams } from './portion'
import { SCAN_FOODS, scanFoodFor } from './foodLabels'

const ugali = { calories: 122, proteinG: 2.7, carbsG: 27, fatG: 0.4 } // per 100 g

describe('nutritionFor', () => {
  it('scales per-100g values to the portion', () => {
    expect(nutritionFor(ugali, 150)).toEqual({ calories: 183, proteinG: 4.1, carbsG: 40.5, fatG: 0.6 })
  })

  it('counts only what was eaten', () => {
    expect(nutritionFor(ugali, 200, 0.5).calories).toBe(122)
  })

  it('never goes negative or above the full portion', () => {
    expect(nutritionFor(ugali, -50).calories).toBe(0)
    expect(nutritionFor(ugali, 100, 3).calories).toBe(122)
  })
})

describe('perServing', () => {
  it('scales per-100g search results to one serving', () => {
    const chapati = { name: 'Chapati', calories: 300, proteinG: 8, carbsG: 50, fatG: 9, servingGrams: 60 }
    expect(perServing(chapati)).toMatchObject({ name: 'Chapati', calories: 180, proteinG: 4.8, carbsG: 30, fatG: 5.4 })
  })

  it('treats a missing serving weight as 100 g', () => {
    expect(perServing({ calories: 250, proteinG: 1, carbsG: 2, fatG: 3 }).calories).toBe(250)
  })
})

describe('topK', () => {
  it('returns the most likely labels first', () => {
    const out = topK(['ugali', 'chapati', 'pilau', 'chai'], [0.1, 0.6, 0.05, 0.25], 2)
    expect(out.map((p) => p.label)).toEqual(['chapati', 'chai'])
  })
})

describe('portion memory', () => {
  beforeEach(() => localStorage.clear())

  it('remembers the last grams chosen per food', () => {
    expect(rememberedGrams('chapati')).toBeUndefined()
    rememberGrams('chapati', 90.4)
    expect(rememberedGrams('chapati')).toBe(90)
  })
})

describe('scan foods', () => {
  it('maps labels from the model, tolerating spaces and case', () => {
    expect(scanFoodFor('Sukuma Wiki')?.foodId).toBe('sukuma-wiki')
    expect(scanFoodFor('unknown')).toBeUndefined()
  })

  it('gives every food at least one portion option', () => {
    for (const f of Object.values(SCAN_FOODS)) expect(f.portions.length).toBeGreaterThan(0)
  })
})
