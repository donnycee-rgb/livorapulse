// ─── Step counting from the phone's motion sensor ───────────────────────────
//
// Each step makes the total acceleration rise above its usual level and fall
// back again. The detector:
//   1. smooths the raw signal (fast moving average) to remove sensor jitter,
//   2. tracks the usual level (slow moving average, roughly gravity) and how
//      much the signal normally swings around it,
//   3. counts a step each time the smoothed signal climbs clearly above the
//      usual level and then drops back below it.
// The bar for "clearly above" adapts to how the phone is carried (hand vs
// pocket), but never drops below a floor, so a phone lying still or gently
// swaying counts nothing. Movement faster than MIN_STEP_GAP_MS (~3.5 steps
// a second) is treated as shaking and resets the rhythm.
//
// The old detector looked at separate 5-sample chunks, so a step only counted
// when its peak happened to fall inside one chunk.

export const MIN_STEP_GAP_MS = 280
/** Steps further apart than this don't make a walking rhythm */
const MAX_STEP_GAP_MS = 2000
/** Smallest swing (m/s²) that can be a step */
const MIN_SWING = 1.2
/** How far above the usual level, in typical swings, a peak must reach */
const SWING_FACTOR = 0.9
/** Consecutive rhythmic steps needed before counting starts (ignores single bumps) */
const STEPS_TO_START = 4

export class StepDetector {
  private fast: number | null = null
  private slow: number | null = null
  private swing = 0 // moving average of |fast − slow|
  private above = false
  private lastStepAt = -Infinity
  /** Steps seen in the current rhythm before it's confirmed as walking */
  private pending = 0
  private walking = false
  count = 0

  /**
   * Feed one sensor reading: the magnitude of accelerationIncludingGravity
   * (m/s²) and its time in ms. Returns the steps added by this reading.
   */
  push(magnitude: number, timeMs: number): number {
    if (!Number.isFinite(magnitude)) return 0
    if (this.fast === null || this.slow === null) {
      this.fast = magnitude
      this.slow = magnitude
      return 0
    }
    this.fast += 0.35 * (magnitude - this.fast)
    this.slow += 0.02 * (magnitude - this.slow)
    const dev = this.fast - this.slow
    this.swing += 0.02 * (Math.abs(dev) - this.swing)

    const bar = Math.max(MIN_SWING, SWING_FACTOR * this.swing)
    if (!this.above && dev > bar) {
      this.above = true
      return 0
    }
    if (this.above && dev < 0) {
      this.above = false
      return this.registerStep(timeMs)
    }
    return 0
  }

  private registerStep(timeMs: number): number {
    const gap = timeMs - this.lastStepAt
    this.lastStepAt = timeMs
    if (gap < MIN_STEP_GAP_MS) {
      // Faster than anyone steps: the phone is being shaken. Drop the rhythm
      // so a burst of shaking can't add steps.
      this.walking = false
      this.pending = 0
      return 0
    }

    if (gap > MAX_STEP_GAP_MS) {
      // Rhythm broken (stopped, or a one-off bump): start confirming again
      this.walking = false
      this.pending = 1
      return 0
    }
    if (this.walking) {
      this.count += 1
      return 1
    }
    this.pending += 1
    if (this.pending >= STEPS_TO_START) {
      // Walking confirmed: count the steps that confirmed it too
      this.walking = true
      this.count += this.pending
      const added = this.pending
      this.pending = 0
      return added
    }
    return 0
  }
}

// ─── Which step count to show and save ──────────────────────────────────────

/**
 * Decides the walk's step count. The motion sensor is used when it's working;
 * when it clearly isn't (no sensor, or far fewer steps than the distance
 * walked implies — e.g. the screen was off), steps are estimated from the
 * GPS distance and stride length. The screen shows this same result, so the
 * number seen is the number saved.
 */
export function chooseSteps(sensorSteps: number, sensorWorking: boolean, distanceKm: number, strideM: number): {
  steps: number
  estimated: boolean
} {
  const fromDistance = Math.round((distanceKm * 1000) / strideM)
  // Too little distance to judge the sensor by: trust it
  if (distanceKm < 0.2) return { steps: sensorWorking ? sensorSteps : fromDistance, estimated: !sensorWorking }
  if (!sensorWorking || sensorSteps < fromDistance * 0.5) return { steps: fromDistance, estimated: true }
  return { steps: sensorSteps, estimated: false }
}
