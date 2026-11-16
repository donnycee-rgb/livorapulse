import { describe, expect, it } from 'vitest'
import { chooseSteps, StepDetector } from './stepDetector'

const G = 9.81
const HZ = 60

/** Small deterministic pseudo-random noise */
function noise(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296 - 0.5
  }
}

/** Feeds `seconds` of a signal into a detector and returns the count */
function run(seconds: number, signal: (t: number) => number, d = new StepDetector()): StepDetector {
  for (let i = 0; i < seconds * HZ; i++) {
    const t = (i / HZ) * 1000
    d.push(signal(t / 1000), t)
  }
  return d
}

/** A walking signal: one bump per step at `cadence` steps/s, with sensor noise */
const walking = (cadence: number, amplitude: number, jitter = 0.8, seed = 1) => {
  const n = noise(seed)
  return (t: number) => G + amplitude * Math.sin(2 * Math.PI * cadence * t) + jitter * n()
}

describe('StepDetector', () => {
  it('counts a normal walk (about 1.9 steps a second) within 5%', () => {
    const d = run(60, walking(1.9, 3))
    expect(d.count).toBeGreaterThanOrEqual(Math.round(114 * 0.95))
    expect(d.count).toBeLessThanOrEqual(Math.round(114 * 1.05))
  })

  it('counts a slow walk and a brisk walk', () => {
    expect(run(60, walking(1.3, 2.5, 0.8, 2)).count).toBeGreaterThanOrEqual(74) // 78 steps
    expect(run(60, walking(2.4, 4, 0.8, 3)).count).toBeGreaterThanOrEqual(137) // 144 steps
  })

  it('counts a noisy walk', () => {
    expect(run(60, walking(1.9, 2, 1.5, 11)).count).toBeGreaterThanOrEqual(108) // 114 steps
  })

  it('counts a phone in a pocket (smaller swings) too', () => {
    expect(run(60, walking(1.8, 1.8, 0.4, 4)).count).toBeGreaterThanOrEqual(103) // 108 steps
  })

  it('counts nothing when the phone is still', () => {
    const n = noise(5)
    expect(run(60, () => G + 0.3 * n()).count).toBe(0)
  })

  it('counts nothing for gentle swaying', () => {
    expect(run(60, (t) => G + 0.6 * Math.sin(2 * Math.PI * 0.8 * t)).count).toBe(0)
  })

  it('does not count fast shaking as steps', () => {
    // 8 shakes a second: faster than anyone walks
    expect(run(20, walking(8, 6, 0.5, 6)).count).toBeLessThanOrEqual(3)
    expect(run(20, walking(5, 6, 0.5, 12)).count).toBeLessThanOrEqual(3)
  })

  it('ignores a one-off bump', () => {
    const n = noise(7)
    const d = run(10, (t) => G + 0.3 * n() + (t > 5 && t < 5.2 ? 8 : 0))
    expect(d.count).toBe(0)
  })

  it('keeps counting through a short stop and restart', () => {
    const walk = walking(1.9, 3, 0.8, 8)
    const n = noise(9)
    const d = run(90, (t) => (t >= 30 && t < 40 ? G + 0.3 * n() : walk(t)))
    // 80 s of walking ≈ 152 steps
    expect(d.count).toBeGreaterThanOrEqual(144)
    expect(d.count).toBeLessThanOrEqual(160)
  })
})

describe('chooseSteps', () => {
  it('uses the sensor when it is working', () => {
    expect(chooseSteps(3100, true, 2.4, 0.75)).toEqual({ steps: 3100, estimated: false })
  })

  it('estimates from distance when the sensor clearly missed steps', () => {
    // 2.4 km at 0.75 m strides = 3,200 steps; the sensor saw 900 (screen was off)
    expect(chooseSteps(900, true, 2.4, 0.75)).toEqual({ steps: 3200, estimated: true })
  })

  it('estimates from distance when there is no sensor', () => {
    expect(chooseSteps(0, false, 1.5, 0.7)).toEqual({ steps: 2143, estimated: true })
  })

  it('trusts the sensor on very short distances, where GPS says little', () => {
    expect(chooseSteps(150, true, 0.05, 0.75)).toEqual({ steps: 150, estimated: false })
  })
})
