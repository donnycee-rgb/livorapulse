// ─── Installing LivoraPulse as an app ────────────────────────────────────────
// Chrome (Android and desktop) and Edge fire `beforeinstallprompt` once a page
// can be installed; holding on to that event lets our own "Install app" button
// open the real install dialog any time, instead of relying on the browser's
// one-off banner. iPhones have no such event: there it's Share → Add to Home
// Screen, so we show those steps. In-app browsers (Instagram, TikTok, …) and
// phones without Google Play can't install at all, so we say how to get to a
// browser that can.
//
// Imported once at start-up (main.tsx) so the event is never missed.

import { useSyncExternalStore } from 'react'

type PromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallWay =
  /** The browser's install dialog can be opened */
  | 'prompt'
  /** iPhone / iPad Safari: Share → Add to Home Screen */
  | 'ios'
  /** Inside another app's browser: open in Chrome/Safari first */
  | 'in-app'
  /** Anything else: the browser menu, if it has an install option */
  | 'menu'

type State = { installed: boolean; deferred: PromptEvent | null }

let state: State = { installed: false, deferred: null }
const listeners = new Set<() => void>()
const setState = (patch: Partial<State>) => { state = { ...state, ...patch }; listeners.forEach((l) => l()) }

const ua = () => (typeof navigator === 'undefined' ? '' : navigator.userAgent)

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches
    || window.matchMedia?.('(display-mode: minimal-ui)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export const isIOS = () => /iphone|ipad|ipod/i.test(ua()) || (/macintosh/i.test(ua()) && navigator.maxTouchPoints > 1)
export const isInAppBrowser = () => /FBAN|FBAV|Instagram|musical_ly|Bytedance|TikTok|Snapchat|Line\/|Twitter/i.test(ua())

if (typeof window !== 'undefined') {
  state = { ...state, installed: isStandalone() }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // keep it for our button rather than the browser's banner
    setState({ deferred: e as PromptEvent })
  })
  window.addEventListener('appinstalled', () => setState({ installed: true, deferred: null }))
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', (m) => { if (m.matches) setState({ installed: true }) })
}

export function installWay(s: State = state): InstallWay {
  if (s.deferred) return 'prompt'
  if (isInAppBrowser()) return 'in-app'
  if (isIOS()) return 'ios'
  return 'menu'
}

/** Open the browser's install dialog. Resolves true if the person installed. */
export async function promptInstall(): Promise<boolean> {
  const e = state.deferred
  if (!e) return false
  await e.prompt()
  const { outcome } = await e.userChoice
  // the event can only be used once; the browser sends a new one if it may ask again
  setState({ deferred: null, installed: outcome === 'accepted' || state.installed })
  return outcome === 'accepted'
}

export function useInstall() {
  const s = useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l) } }, () => state, () => state)
  return { installed: s.installed, way: installWay(s) }
}

// ── The small reminder on Home: only after a few days of use, never again once closed ──

const DAYS_KEY = 'lp-use-days'
const HIDE_KEY = 'lp-install-nudge-hidden'

/** Note today as a day the app was used; returns how many different days so far (counts up to 3) */
export function noteUseDay(today: string): number {
  try {
    const days: string[] = JSON.parse(localStorage.getItem(DAYS_KEY) || '[]')
    if (!days.includes(today) && days.length < 3) { days.push(today); localStorage.setItem(DAYS_KEY, JSON.stringify(days)) }
    return days.length
  } catch { return 0 }
}

export function nudgeHidden(): boolean {
  try { return localStorage.getItem(HIDE_KEY) === '1' } catch { return true }
}

export function hideNudge(): void {
  try { localStorage.setItem(HIDE_KEY, '1') } catch { /* private mode: it'll just show again */ }
}
