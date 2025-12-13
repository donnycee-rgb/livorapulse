import seed from './seed.json'
import type { AppState } from './types'

export const seedState: Omit<AppState, 'meta'> = seed as unknown as Omit<AppState, 'meta'>
