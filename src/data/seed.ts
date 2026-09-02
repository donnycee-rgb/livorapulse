import seed from './seed.json'
import type { AppState } from './types'

const raw = seed as unknown as Omit<AppState, 'meta' | 'dashboard'>

export const seedState: Omit<AppState, 'meta'> = {
  ...raw,
  dashboard: {
    score: 0,
    insight: 'Log your first activity to generate your LifePulse Score.',
    loading: false,
  },
}