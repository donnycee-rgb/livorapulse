// Google sign-in comes back to /dashboard?code=<one-time code> (backend
// routes/auth.ts). The code has to be read before anything else runs: the
// dashboard is a protected page, and its guard sends signed-out visitors to
// /login straight away, which would drop the code. main.tsx calls this
// before the app renders.

/** The one-time code if this page load is the return from Google sign-in, else null. */
export function readGoogleReturn(loc: Pick<Location, 'pathname' | 'search'>): string | null {
  // Only on the address the backend sends people to: other pages use their
  // own query values (e.g. /reset-password?token=...)
  if (loc.pathname !== '/dashboard') return null
  const code = new URLSearchParams(loc.search).get('code')
  return code && code.trim() ? code.trim() : null
}

// Read once per page load: React may render a component twice (Strict Mode in
// development), and the first read removes the marker from the address bar.
let googleFailedThisLoad: boolean | undefined

/** True if this page load is /login?error=oauth_failed (Google sign-in didn't finish). Cleans the address. */
export function googleSignInFailed(): boolean {
  if (googleFailedThisLoad === undefined) {
    googleFailedThisLoad = new URLSearchParams(window.location.search).get('error') === 'oauth_failed'
    if (googleFailedThisLoad) window.history.replaceState(window.history.state, '', window.location.pathname)
  }
  return googleFailedThisLoad
}
