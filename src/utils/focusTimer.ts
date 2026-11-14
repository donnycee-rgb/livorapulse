import type { FocusTimerState } from '../data/types'

// The focus timer stores *when it ends* (endsAt) while running, rather than
// counting down one tick at a time. Time left is always worked out from the
// clock, so it stays right when the tab sleeps, the phone locks, the user
// moves to another page, or the app is reloaded.

/** Seconds left on the timer at `nowMs`. */
export function remainingAt(t: FocusTimerState, nowMs: number): number {
  if (t.status === 'running' && t.endsAt != null) {
    return Math.max(0, Math.ceil((t.endsAt - nowMs) / 1000))
  }
  return t.remainingSec
}

/** Seconds of focus done so far (pauses don't count). */
export function elapsedAt(t: FocusTimerState, nowMs: number): number {
  return Math.max(0, t.durationSec - remainingAt(t, nowMs))
}

/**
 * When a session that ran out should be recorded as ending: the moment the
 * timer hit zero, not the later moment the app noticed (e.g. on reopening).
 */
export function endedAtFor(t: FocusTimerState, nowMs: number): number {
  if (t.status === 'running' && t.endsAt != null && t.endsAt < nowMs) return t.endsAt
  return nowMs
}
