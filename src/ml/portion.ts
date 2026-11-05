// Pure helpers for turning a recognised food + portion into nutrition numbers.

export interface Per100g {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

export interface Nutrients extends Per100g {}

export const EATEN_OPTIONS = [
  { label: 'All of it', fraction: 1 },
  { label: '¾', fraction: 0.75 },
  { label: 'Half', fraction: 0.5 },
  { label: '¼', fraction: 0.25 },
] as const

const round1 = (n: number) => Math.round(n * 10) / 10

/** Nutrition for `grams` of a food whose values are per 100 g, scaled by how much was eaten. */
export function nutritionFor(food: Per100g, grams: number, eatenFraction = 1): Nutrients {
  const g = Math.max(0, grams) * Math.min(1, Math.max(0, eatenFraction))
  const f = g / 100
  return {
    calories: Math.round(food.calories * f),
    proteinG: round1(food.proteinG * f),
    carbsG: round1(food.carbsG * f),
    fatG: round1(food.fatG * f),
  }
}

/**
 * Food search returns values per 100 g plus the weight of one serving.
 * Convert to values for one serving, so "1 chapati" means 60 g, not 100 g.
 * With no serving weight, a serving is taken to be 100 g.
 */
export function perServing<T extends Per100g & { servingGrams?: number }>(food: T): T {
  const grams = food.servingGrams && food.servingGrams > 0 ? food.servingGrams : 100
  return { ...food, ...nutritionFor(food, grams) }
}

export interface Prediction {
  label: string
  probability: number
}

/** Highest-probability labels first. */
export function topK(labels: string[], probs: ArrayLike<number>, k = 3): Prediction[] {
  return labels
    .map((label, i) => ({ label, probability: probs[i] ?? 0 }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, k)
}

// ---------------------------------------------------------------------------
// Personal portion memory — remembers the grams each user usually picks for a
// food so the next scan defaults to it. Stored only on this device.
// ---------------------------------------------------------------------------
const MEMORY_KEY = 'lp-portion-memory'

export function rememberedGrams(foodId: string): number | undefined {
  try {
    const all = JSON.parse(localStorage.getItem(MEMORY_KEY) || '{}') as Record<string, number>
    const g = all[foodId]
    return typeof g === 'number' && g > 0 ? g : undefined
  } catch {
    return undefined
  }
}

export function rememberGrams(foodId: string, grams: number): void {
  try {
    const all = JSON.parse(localStorage.getItem(MEMORY_KEY) || '{}') as Record<string, number>
    all[foodId] = Math.round(grams)
    localStorage.setItem(MEMORY_KEY, JSON.stringify(all))
  } catch {
    /* storage unavailable — memory is a nice-to-have */
  }
}
