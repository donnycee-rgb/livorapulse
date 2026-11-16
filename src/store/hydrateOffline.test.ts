import { describe, expect, it, vi } from 'vitest'

// Every request fails, as with no signal
vi.mock('../api/client', () => ({
  apiGet: vi.fn(async () => { throw Object.assign(new Error('offline'), { offline: true }) }),
  apiPost: vi.fn(async () => { throw Object.assign(new Error('offline'), { offline: true }) }),
  apiPut: vi.fn(async () => ({ success: true })),
  apiDel: vi.fn(async () => ({ success: true })),
}))

describe('loading data with no connection', () => {
  it("keeps this week's data on the phone instead of going blank", async () => {
    const { useAppStore } = await import('./useAppStore')
    const steps = useAppStore.getState().physical.weeklySteps.map((d) => ({ ...d, steps: 5000 }))
    useAppStore.setState((s) => ({ physical: { ...s.physical, weeklySteps: steps }, meta: { lastUpdatedAt: Date.now() } }))

    await useAppStore.getState().hydrateFromApi()

    expect(useAppStore.getState().physical.weeklySteps.every((d) => d.steps === 5000)).toBe(true)
  }, 30_000) // the first import of the store is slow while other test files run alongside

  it("drops data saved in an earlier week, so last week never shows as this week's", async () => {
    const { useAppStore } = await import('./useAppStore')
    const steps = useAppStore.getState().physical.weeklySteps.map((d) => ({ ...d, steps: 5000 }))
    const lastMonth = Date.now() - 30 * 24 * 60 * 60 * 1000
    useAppStore.setState((s) => ({ physical: { ...s.physical, weeklySteps: steps }, meta: { lastUpdatedAt: lastMonth } }))

    await useAppStore.getState().hydrateFromApi()

    expect(useAppStore.getState().physical.weeklySteps.every((d) => d.steps === 0)).toBe(true)
  })
})
