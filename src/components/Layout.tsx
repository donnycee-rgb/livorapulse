import type { PropsWithChildren } from 'react'

import AppHeader from './AppHeader'
import BottomNav from './BottomNav'
import SideNav from './SideNav'
import Skeleton from './ui/Skeleton'
import AICoachButton from './AICoachButton'
import { useStoreHydration } from '../hooks/useStoreHydration'

export default function Layout({ children }: PropsWithChildren) {
  const hydrated = useStoreHydration()

  return (
    <div className="h-dvh flex flex-col bg-slate-50 dark:bg-[#0a0f1a]">

      {/* Header — full width, never scrolls */}
      <AppHeader />

      {/* Body row — fills remaining height */}
      <div className="flex-1 flex min-h-0 w-full overflow-hidden">

        {/* SideNav column — fixed width, never shrinks below its own width */}
        <div className="flex-shrink-0 pl-4 py-5 min-h-0">
          <SideNav />
        </div>

        {/* Main content — takes all remaining space, never shrinks to 0 */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          <div className="max-w-[1200px] px-5 py-5 md:py-6 pb-24 md:pb-6">
            {hydrated ? (
              children
            ) : (
              <div className="space-y-4">
                <Skeleton className="h-28" />
                <div className="grid md:grid-cols-2 gap-4">
                  <Skeleton className="h-64" />
                  <Skeleton className="h-64" />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* AI Coach — fixed to viewport */}
      <AICoachButton />
    </div>
  )
}