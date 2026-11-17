import React, { useCallback, useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import AppToaster from './components/ui/Toaster'
import { useThemeSync } from './hooks/useThemeSync'
import { useAuthStore } from './store/useAuthStore'
import { readGoogleReturn } from './auth/googleReturn'
import { useAppStore } from './store/useAppStore'
import { usePendingWalkSync } from './hooks/usePendingWalkSync'
import { flushOutbox } from './offline/outbox'
import { useOutboxSync } from './offline/useOutboxSync'
import { registerServiceWorker } from './offline/registerServiceWorker'
import { pullSleepSession } from './lib/sleepSync'
import './styles/globals.css'
// Catch the browser's "can install" signal from the very start (see lib/install.ts)
import './lib/install'

function Root() {
  useThemeSync()

  const loadMe = useAuthStore((s) => s.loadMe)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hydrateFromApi = useAppStore((s) => s.hydrateFromApi)
  const syncDashboardScore = useAppStore((s) => s.syncDashboardScore)
  const [authReady, setAuthReady] = useState(false)

  // Upload walks that were saved on this phone while offline or signed out
  usePendingWalkSync()

  // Wait for auth store hydration
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setAuthReady(true))
    if (useAuthStore.persist.hasHydrated()) setAuthReady(true)
    return () => unsub()
  }, [])

  // Verify token is still valid
  useEffect(() => {
    if (!authReady) return
    loadMe().catch(() => null)
  }, [authReady, loadMe])

  const refresh = useCallback(() => {
    hydrateFromApi().catch(() => null)
    syncDashboardScore().catch(() => null)
    pullSleepSession().catch(() => null)
  }, [hydrateFromApi, syncDashboardScore])

  // Upload logs saved on this phone while offline, whenever possible
  useOutboxSync(refresh)

  // Pull data once authenticated. Logs still waiting on the phone go up
  // first, so the server's copy already includes them.
  useEffect(() => {
    if (!isAuthenticated) return
    flushOutbox().catch(() => null).finally(refresh)
  }, [isAuthenticated, refresh])

  // Coming back to the app (switching from another app or tab, unlocking the
  // phone) pulls fresh data, so what was logged on another device shows here
  // too. Not more than once every 20 seconds; always on a new day (a new week
  // starts the charts again on Monday).
  useEffect(() => {
    if (!isAuthenticated) return
    let loadedOn = new Date().toDateString()
    let loadedAt = Date.now()
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const today = new Date().toDateString()
      if (today === loadedOn && Date.now() - loadedAt < 20000) return
      loadedOn = today
      loadedAt = Date.now()
      flushOutbox().catch(() => null).finally(refresh)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [isAuthenticated, refresh])

  return (
    <>
      <App />
      <AppToaster />
    </>
  )
}

// An address like "https://site//dashboard?code=..." (a link built from a URL
// ending in "/") matches no route and shows "Page not found". Repair it before
// the router reads it, keeping the query (e.g. Google sign-in's ?code=).
if (window.location.pathname.startsWith('//')) {
  const { pathname, search, hash } = window.location
  window.history.replaceState(window.history.state, '', pathname.replace(/^\/+/, '/') + search + hash)
}

// Back from Google sign-in: take the one-time code now, before the router and
// the dashboard's sign-in guard run (the guard would redirect to /login and
// drop it). Pages show "Signing you in" until the exchange finishes.
const googleCode = readGoogleReturn(window.location)
if (googleCode) {
  window.history.replaceState(null, '', '/dashboard') // keep the code out of the address bar and history
  void useAuthStore.getState().completeGoogleSignIn(googleCode)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>,
)
// Keep the app's files on the phone so it opens without a connection
registerServiceWorker()
