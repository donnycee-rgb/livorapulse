import { Suspense, useEffect, useRef, type PropsWithChildren } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import AppHeader from './AppHeader'
import OfflineStatus from './OfflineStatus'
import BottomNav from './BottomNav'
import SideNav from './SideNav'
import PageSkeleton from './PageSkeleton'
import AICoachButton from './AICoachButton'
import FocusTimerTicker from './FocusTimerTicker'
import SleepBanner from './sleep/SleepBanner'
import { SleepSheetHost } from './sleep/SleepSheet'
import { useStoreHydration } from '../hooks/useStoreHydration'
import { preloadPages } from '../pages/lazyPages'

/**
 * The signed-in frame: header, side nav, bottom nav. It stays on screen while
 * moving between pages; only the content area changes. A page that's still
 * downloading shows a skeleton there, never a blank screen.
 *
 * Used as a layout route (renders the matched page through <Outlet />), or
 * with children for one-off pages like Not Found.
 */
export default function Layout({ children }: PropsWithChildren) {
  const hydrated = useStoreHydration()
  const { pathname } = useLocation()
  const scrollRef = useRef<HTMLDivElement>(null)

  // The frame no longer remounts per page, so start each page at the top
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  // Once signed in and idle, fetch the other pages so switching is instant
  useEffect(() => {
    if (!hydrated) return
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void }
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(preloadPages, { timeout: 4000 })
      return () => w.cancelIdleCallback?.(id)
    }
    const t = setTimeout(preloadPages, 1500)
    return () => clearTimeout(t)
  }, [hydrated])

  return (
    <div className="h-dvh flex flex-col bg-ui-bg">

      {/* Header — full width, never scrolls */}
      <AppHeader />

      {/* While asleep: a strip of night sky with "I'm awake" */}
      <SleepBanner />
      <SleepSheetHost />

      {/* Offline, or logs waiting to upload */}
      <OfflineStatus />

      {/* Body — the scroll area spans the window (scrollbar at the edge); inside
          it the side nav and the page sit together in a centred column that
          lines up with the header, like the landing page */}
      <div ref={scrollRef} className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-[1400px] mx-auto flex">

          {/* SideNav column — stays in view while the page scrolls */}
          {/* Hidden on phones — the side nav is md+ only, so its padding just wasted 16px */}
          <div className="flex-shrink-0 pl-4 py-5 sticky top-0 self-start max-sm:hidden">
            <SideNav />
          </div>

          {/* Main content — takes the remaining width, centred within it */}
          <main className="flex-1 min-w-0">
            <div className="max-w-[1200px] mx-auto px-5 py-5 md:py-6 pb-24 md:pb-6 max-sm:px-4 max-sm:pt-4 max-sm:pb-28">
              {hydrated ? (
                <Suspense fallback={<PageSkeleton />}>
                  {/* A CSS fade per page: no waiting for the old page to animate out */}
                  <div key={pathname} className="animate-fadeIn">
                    {children ?? <Outlet />}
                  </div>
                </Suspense>
              ) : (
                <PageSkeleton />
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* AI Coach — fixed to viewport */}
      <AICoachButton />

      {/* Keeps a running focus session going on every page */}
      {hydrated && <FocusTimerTicker />}
    </div>
  )
}
