// ─── Sign-in tokens and renewing them ───────────────────────────────────────
// The access token lasts 15 minutes; the refresh token lasts 30 days and is
// swapped for a new pair whenever the access token runs out. Each refresh
// token works once, so renewals must never run twice at the same time — in
// this tab or another one.

const ACCESS_KEY = 'lp_access_token'
const REFRESH_KEY = 'lp_refresh_token'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export type TokenPair = { accessToken: string; refreshToken: string }

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

type Listener = (accessToken: string | null) => void
const listeners = new Set<Listener>()

/** Called whenever the tokens change (sign-in, renewal, sign-out) */
export function onTokensChanged(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function setTokens(tokens: TokenPair): void {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
  listeners.forEach((fn) => fn(tokens.accessToken))
}

/** For an old-style sign-in that only had an access token */
export function setAccessTokenOnly(accessToken: string): void {
  localStorage.setItem(ACCESS_KEY, accessToken)
  listeners.forEach((fn) => fn(accessToken))
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  listeners.forEach((fn) => fn(null))
}

/** Thrown when the server can't be reached — the session is still fine */
export class OfflineError extends Error {
  readonly offline = true
  constructor() {
    super("Can't reach LivoraPulse — check your internet connection.")
  }
}

let renewing: Promise<string | null> | null = null

async function renew(failedToken: string | null): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
  } catch {
    throw new OfflineError()
  }

  if (res.ok) {
    const data = (await res.json()) as TokenPair
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
    return data.accessToken
  }
  if (res.status === 401) {
    // Another tab may have renewed with this same refresh token a moment ago
    const latest = getAccessToken()
    if (latest && latest !== failedToken && getRefreshToken() !== refreshToken) return latest
    return null
  }
  throw new Error('Could not renew your session. Please try again.')
}

/**
 * Gets a fresh access token after `failedToken` was rejected. Returns null
 * when the session can't be renewed (the user must sign in again). Throws
 * OfflineError when the server can't be reached.
 */
export async function renewSession(failedToken: string | null): Promise<string | null> {
  // Already renewed by another request or tab since this one was sent
  const current = getAccessToken()
  if (current && current !== failedToken) return current

  if (!renewing) renewing = renew(failedToken).finally(() => { renewing = null })
  return renewing
}

let expiredHandler: (() => void) | null = null

/** What to do when the session has ended for good (set by the auth store) */
export function setSessionExpiredHandler(fn: () => void): void {
  expiredHandler = fn
}

export function sessionExpired(): void {
  expiredHandler?.()
}
