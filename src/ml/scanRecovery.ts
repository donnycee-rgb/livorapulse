// On phones low on memory, Android may close the browser tab while the camera
// or photo picker is open. When the user comes back the page reloads and the
// photo is gone. We note when we hand off to the camera; if the page starts
// again with that note still there, the hand-off was interrupted, and the
// Nutrition page reopens the scanner with an explanation.
//
// sessionStorage survives Android restoring a closed tab, but not a new tab.

const KEY = 'lp-scan-handoff'
const MAX_AGE_MS = 15 * 60 * 1000

function store(): Storage | null {
  try { return window.sessionStorage } catch { return null }
}

/** Call just before opening the camera or photo picker. */
export function markHandoff(now = Date.now()): void {
  try { store()?.setItem(KEY, String(now)) } catch { /* private mode etc. */ }
}

/** Call when a photo arrives or the picker is cancelled. */
export function clearHandoff(): void {
  try { store()?.removeItem(KEY) } catch { /* ignore */ }
}

/** True once if the last hand-off never came back (and was recent). Clears the note. */
export function takeInterruptedHandoff(now = Date.now()): boolean {
  const s = store()
  let raw: string | null = null
  try { raw = s?.getItem(KEY) ?? null } catch { return false }
  if (raw === null) return false
  clearHandoff()
  const at = Number(raw)
  return Number.isFinite(at) && now - at >= 0 && now - at < MAX_AGE_MS
}

// Read once per page load, so React rendering a component twice (Strict Mode
// in development, or remounts) can't use up the answer before it's shown.
let thisLoad: boolean | undefined

/** Was this page load caused by Android closing the page during a photo? Until dismissed. */
export function interruptedThisLoad(): boolean {
  if (thisLoad === undefined) thisLoad = takeInterruptedHandoff()
  return thisLoad
}

/** The user has seen the explanation: don't reopen the scanner again this load. */
export function dismissInterrupted(): void {
  thisLoad = false
}
