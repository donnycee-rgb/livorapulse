import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import AppToaster from './components/ui/Toaster'
import { useThemeSync } from './hooks/useThemeSync'
import { useAuthStore } from './store/useAuthStore'
import { readGoogleReturn } from './auth/googleReturn'
import { useAppStore } from './store/useAppStore'
import { usePendingWalkSync } from './hooks/usePendingWalkSync'
import './styles/globals.css'

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

  // Pull data once authenticated
  useEffect(() => {
    if (!isAuthenticated) return
    hydrateFromApi().catch(() => null)
    syncDashboardScore().catch(() => null)
  }, [isAuthenticated, hydrateFromApi, syncDashboardScore])

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