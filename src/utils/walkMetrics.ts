// ─── Walk calories and time ─────────────────────────────────────────────────

/**
 * MET (energy use as a multiple of resting) by speed, from the Compendium of
 * Physical Activities. Below 1.5 km/h the person is mostly standing — at a
 * crossing, chatting — not strolling.
 */
export function metForSpeed(kmh: number): number {
  if (kmh < 1.5) return 1.3   // standing / waiting
  if (kmh < 2.5) return 2.0   // strolling
  if (kmh < 4) return 2.8     // slow walk
  if (kmh < 5) return 3.5     // moderate walk
  if (kmh < 5.6) return 4.3   // brisk walk
  if (kmh < 6.5) return 5.0   // very brisk walk
  if (kmh < 8) return 7.0     // jogging
  if (kmh < 9.7) return 8.3   // running ~6:45 min/km
  if (kmh < 11.3) return 9.8  // running ~5:50 min/km
  return 11.0                 // running faster
}

/**
 * Active calories for one stretch of the walk: MET minus the 1 MET the body
 * burns at rest anyway, × body weight × hours. Counting the resting part too
 * would add about 1 kcal per kg per hour that the walk didn't cause.
 */
export function activeCalories(kmh: number, weightKg: number, hours: number): number {
  if (!(hours > 0) || !(weightKg > 0)) return 0
  return Math.max(0, metForSpeed(kmh) - 1) * weightKg * hours
}

/**
 * Walk time from real timestamps, not a ticking counter: phones slow timers
 * down in the background, so counting ticks lost time. Paused stretches are
 * left out.
 */
export class WalkClock {
  private activeSince: number | null = null
  private banked = 0

  start(now: number): void {
    if (this.activeSince === null) this.activeSince = now
  }

  pause(now: number): void {
    if (this.activeSince !== null) {
      this.banked += now - this.activeSince
      this.activeSince = null
    }
  }

  /** Whole seconds walked so far */
  seconds(now: number): number {
    const ms = this.banked + (this.activeSince !== null ? now - this.activeSince : 0)
    return Math.max(0, Math.floor(ms / 1000))
  }

  reset(): void {
    this.activeSince = null
    this.banked = 0
  }
}

// ─── Steps counted by the phone itself ──────────────────────────────────────

/** Average walking stride is about 41.5% of height (0.75 m when height is unknown) */
export function strideFromHeight(heightCm: number | null | undefined): number {
  return heightCm && heightCm > 0 ? heightCm * 0.00415 : 0.75
}

/** A normal walking pace, for steps whose speed we don't know */
const TYPICAL_WALK_KMH = 4.5

/**
 * Distance and active calories for steps typed in from the phone's own step
 * counter. Distance from the person's stride (their height); calories as a
 * walk at a normal pace for that distance, from their weight (MET method, as
 * for tracked walks). `estimated` is true when height or weight is missing
 * and a typical value was used.
 */
export function stepsEstimate(steps: number, heightCm: number | null | undefined, weightKg: number | null | undefined) {
  const s = Math.max(0, Math.round(steps))
  const distanceKm = Math.round(((s * strideFromHeight(heightCm)) / 1000) * 100) / 100
  const kg = weightKg && weightKg > 0 ? weightKg : 70
  const caloriesKcal = Math.round(activeCalories(TYPICAL_WALK_KMH, kg, distanceKm / TYPICAL_WALK_KMH))
  return { distanceKm, caloriesKcal, estimated: !(heightCm && heightCm > 0) || !(weightKg && weightKg > 0) }
}
