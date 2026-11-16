// ─── Activities other than walking ──────────────────────────────────────────
// The same table and rules as the server (livoraPulse_Backend/src/utils/
// activities.ts — keep the two in step). The server works out the saved
// numbers; the app uses this to show a preview before saving.
// MET values: Compendium of Physical Activities (Ainsworth et al., 2011).

export const ACTIVITIES = {
  gym:       { label: 'Gym / weights',          met: 5.0 },
  running:   { label: 'Running',                met: 8.3 },
  cycling:   { label: 'Cycling',                met: 7.5 },
  football:  { label: 'Football',               met: 7.0 },
  basketball:{ label: 'Basketball',             met: 6.5 },
  swimming:  { label: 'Swimming',               met: 6.0 },
  hiking:    { label: 'Hiking',                 met: 6.0 },
  dancing:   { label: 'Dancing',                met: 5.0 },
  skipping:  { label: 'Skipping rope',          met: 11.0 },
  aerobics:  { label: 'Aerobics / HIIT',        met: 7.3 },
  farming:   { label: 'Shamba work / digging',  met: 5.0 },
  housework: { label: 'Housework / cleaning',   met: 3.3 },
  yoga:      { label: 'Yoga / stretching',      met: 2.5 },
} as const

export type ActivityType = keyof typeof ACTIVITIES

export const ACTIVITY_TYPES = Object.keys(ACTIVITIES) as ActivityType[]

export const DEFAULT_WEIGHT_KG = 70
const VIGOROUS_MET = 6
const STEPS_PER_MODERATE_MINUTE = 100

/** Active calories and the credit toward the step goal (same rules as the server) */
export function activityValue(type: ActivityType, minutes: number, weightKg: number | null | undefined) {
  const { met } = ACTIVITIES[type]
  const mins = Math.max(0, Math.round(minutes))
  const kg = weightKg && weightKg > 0 ? weightKg : DEFAULT_WEIGHT_KG
  const caloriesKcal = Math.round(Math.max(0, met - 1) * kg * (mins / 60))
  const perMinute = met >= VIGOROUS_MET ? 2 : met >= 3 ? 1 : 0
  return { caloriesKcal, stepEquivalent: mins * STEPS_PER_MODERATE_MINUTE * perMinute, intensity: perMinute === 2 ? 'vigorous' : perMinute === 1 ? 'moderate' : 'light' } as const
}

export function isActivityType(v: unknown): v is ActivityType {
  return typeof v === 'string' && v in ACTIVITIES
}
