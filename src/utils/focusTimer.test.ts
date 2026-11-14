import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FocusTimerState } from '../data/types'
import { elapsedAt, endedAtFor, remainingAt } from './focusTimer'

const T0 = 1_800_000_000_000

const running = (over: Partial<FocusTimerState> = {}): FocusTimerState => ({
  status: 'running', durationSec: 1500, remainingSec: 1500, startedAt: T0, endsAt: T0 + 1500 * 1000, ...over,
})

describe('focus timer clock', () => {
  it('works out time left from the end time, not from ticks', () => {
    expect(remainingAt(running(), T0 + 10 * 60 * 1000)).toBe(15 * 60)
    // Even if the stored remainingSec is stale (tab was asleep)
    expect(remainingAt(running({ remainingSec: 1500 }), T0 + 20 * 60 * 1000)).toBe(5 * 60)
  })

  it('never goes below zero', () => {
    expect(remainingAt(running(), T0 + 2 * 60 * 60 * 1000)).toBe(0)
  })

  it('uses the stored time left while paused', () => {
    const paused: FocusTimerState = { ...running(), status: 'paused', endsAt: null, remainingSec: 600 }
    expect(remainingAt(paused, T0 + 99 * 60 * 1000)).toBe(600)
    expect(elapsedAt(paused, T0 + 99 * 60 * 1000)).toBe(900)
  })

  it('records a session that ran out while away as ending when it hit zero', () => {
    const t = running()
    expect(endedAtFor(t, T0 + 3 * 60 * 60 * 1000)).toBe(t.endsAt)
    expect(endedAtFor(t, T0 + 60 * 1000)).toBe(T0 + 60 * 1000)
  })
})

// ---------------------------------------------------------------------------
// Store behaviour: start → pause → resume → finish, with the API mocked
// ---------------------------------------------------------------------------
vi.mock('../api/client', () => ({
  apiGet: vi.fn(async () => ({ success: true, data: [] })),
  apiPost: vi.fn(async () => ({ success: true })),
  apiPut: vi.fn(async () => ({ success: true })),
  apiDel: vi.fn(async () => ({ success: true })),
}))

describe('focus timer in the store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(T0)
  })
  afterEach(() => vi.useRealTimers())

  it('keeps time while paused and saves the label with the session', async () => {
    const { useAppStore } = await import('../store/useAppStore')
    const { apiPost } = await import('../api/client')
    const store = useAppStore.getState()

    store.startFocusTimer(25, 'Revise Calculus ch. 4')
    vi.setSystemTime(T0 + 10 * 60 * 1000)
    useAppStore.getState().pauseFocusTimer()
    expect(useAppStore.getState().productivity.focusTimer.remainingSec).toBe(15 * 60)

    // A long pause doesn't use up time
    vi.setSystemTime(T0 + 60 * 60 * 1000)
    useAppStore.getState().resumeFocusTimer()
    vi.setSystemTime(T0 + 65 * 60 * 1000)
    useAppStore.getState().tickFocusTimer()
    expect(useAppStore.getState().productivity.focusTimer.remainingSec).toBe(10 * 60)

    await useAppStore.getState().endFocusTimer('manual')
    const body = (vi.mocked(apiPost).mock.calls.at(-1) as unknown as [string, { label: string; durationSec: number }])[1]
    expect(body.label).toBe('Revise Calculus ch. 4')
    expect(body.durationSec).toBe(15 * 60)
    expect(useAppStore.getState().productivity.focusTimer.status).toBe('idle')
  })

  it('finishes on its own once the end time passes, e.g. after a reload', async () => {
    const { useAppStore } = await import('../store/useAppStore')
    const { apiPost } = await import('../api/client')
    vi.mocked(apiPost).mockClear()

    useAppStore.getState().startFocusTimer(25, 'Reading')
    vi.setSystemTime(T0 + 40 * 60 * 1000) // came back 40 minutes later
    useAppStore.getState().tickFocusTimer()
    await vi.waitFor(() => expect(apiPost).toHaveBeenCalledTimes(1))

    const body = (vi.mocked(apiPost).mock.calls[0] as unknown as [string, { durationSec: number; endedAt: string }])[1]
    expect(body.durationSec).toBe(25 * 60)
    expect(body.endedAt).toBe(new Date(T0 + 25 * 60 * 1000).toISOString())
  })

  it('keeps a running session when the app reloads its data and a request fails', async () => {
    const { useAppStore } = await import('../store/useAppStore')
    const { apiGet } = await import('../api/client')
    useAppStore.getState().startFocusTimer(25, 'Revision')
    vi.mocked(apiGet).mockRejectedValue(new Error('offline'))
    await useAppStore.getState().hydrateFromApi()
    vi.mocked(apiGet).mockReset()
    const t = useAppStore.getState().productivity.focusTimer
    expect(t.status).toBe('running')
    expect(t.label).toBe('Revision')
  })

  it('persists a running session instead of dropping it', async () => {
    const { useAppStore } = await import('../store/useAppStore')
    useAppStore.getState().startFocusTimer(45, 'Lab report')
    // What the store writes to localStorage (tests swap localStorage per test, so read the partialized state)
    const saved = useAppStore.persist.getOptions().partialize!(useAppStore.getState()) as { productivity: { focusTimer: { status: string; startedAt: number; endsAt: number; label: string } } }
    const timer = saved.productivity.focusTimer
    expect(timer.status).toBe('running')
    expect(timer.startedAt).toBe(T0)
    expect(timer.endsAt).toBe(T0 + 45 * 60 * 1000)
    expect(timer.label).toBe('Lab report')
  })
})
