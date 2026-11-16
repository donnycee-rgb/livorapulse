// ─── Green habits and trips ──────────────────────────────────────────────────
// The same lists and rules as the server (livoraPulse_Backend/src/utils/
// green.ts — keep the two in step; test/green-parity.test.ts checks). The
// server saves the numbers; the app uses these to show them before saving.
// Habits carry no CO₂ number (it can't be measured honestly per person);
// trips do: what a car would emit for the distance minus what you did.

export const HABITS = {
  bag:     'Carried a reusable bag',
  bottle:  'Refilled a water bottle',
  recycle: 'Sorted or recycled waste',
  cooking: 'Cooked without charcoal (gas, electric or a clean stove)',
  power:   'Switched off lights and unplugged chargers',
  tree:    'Planted or watered a tree',
  meatfree:'Had a meat-free meal',
} as const

export type Habit = keyof typeof HABITS
export const HABIT_KEYS = Object.keys(HABITS) as Habit[]

export const TRIP_MODES = {
  walk:   { label: 'Walked',       kgPerKm: 0 },
  bike:   { label: 'Cycled',       kgPerKm: 0 },
  matatu: { label: 'Matatu / bus', kgPerKm: 0.10 },
  boda:   { label: 'Boda boda',    kgPerKm: 0.11 },
  car:    { label: 'Car / taxi',   kgPerKm: 0.17 },
} as const

export type TripMode = keyof typeof TRIP_MODES
export const TRIP_MODE_KEYS = Object.keys(TRIP_MODES) as TripMode[]
export const CAR_KG_PER_KM = TRIP_MODES.car.kgPerKm

export function tripAvoidedKg(mode: TripMode, km: number): number {
  return Math.round(Math.max(0, CAR_KG_PER_KM - TRIP_MODES[mode].kgPerKm) * Math.max(0, km) * 100) / 100
}

export const isLowCarbon = (mode: string) => mode !== 'car'
export const isHabit = (v: unknown): v is Habit => typeof v === 'string' && v in HABITS
export const isTripMode = (v: unknown): v is TripMode => typeof v === 'string' && v in TRIP_MODES
