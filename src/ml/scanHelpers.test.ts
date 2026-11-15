import { beforeEach, describe, expect, it } from 'vitest'
import { fitWithin } from './photo'
import { clearHandoff, markHandoff, takeInterruptedHandoff } from './scanRecovery'

describe('fitWithin', () => {
  it('shrinks the longest side to the limit, keeping the shape', () => {
    expect(fitWithin(4000, 3000, 1024)).toEqual({ width: 1024, height: 768 })
    expect(fitWithin(3000, 4000, 1024)).toEqual({ width: 768, height: 1024 })
  })
  it('never enlarges small photos', () => {
    expect(fitWithin(640, 480, 1024)).toEqual({ width: 640, height: 480 })
  })
})

describe('scan hand-off recovery', () => {
  beforeEach(() => {
    // Node has no sessionStorage: give the module one through window
    const mem = new Map<string, string>()
    ;(globalThis as unknown as { window: unknown }).window = {
      sessionStorage: {
        getItem: (k: string) => mem.get(k) ?? null,
        setItem: (k: string, v: string) => void mem.set(k, v),
        removeItem: (k: string) => void mem.delete(k),
      },
    }
  })

  it('reports a hand-off that never came back, once', () => {
    markHandoff(1_000)
    expect(takeInterruptedHandoff(1_000 + 60_000)).toBe(true)
    expect(takeInterruptedHandoff(1_000 + 61_000)).toBe(false)
  })

  it('stays quiet when the photo arrived', () => {
    markHandoff(1_000)
    clearHandoff()
    expect(takeInterruptedHandoff(2_000)).toBe(false)
  })

  it('ignores an old hand-off', () => {
    markHandoff(0)
    expect(takeInterruptedHandoff(60 * 60 * 1000)).toBe(false)
  })
})

describe('interruptedThisLoad', () => {
  it('gives the same answer however many times it is asked, until dismissed', async () => {
    const mem = new Map<string, string>([['lp-scan-handoff', String(Date.now() - 1000)]])
    ;(globalThis as unknown as { window: unknown }).window = {
      sessionStorage: {
        getItem: (k: string) => mem.get(k) ?? null,
        setItem: (k: string, v: string) => void mem.set(k, v),
        removeItem: (k: string) => void mem.delete(k),
      },
    }
    const m = await import('./scanRecovery')
    expect(m.interruptedThisLoad()).toBe(true)
    expect(m.interruptedThisLoad()).toBe(true) // second render still sees it
    m.dismissInterrupted()
    expect(m.interruptedThisLoad()).toBe(false)
  })
})
