import type { PropsWithChildren } from 'react'

import AppHeader from './AppHeader'
import BottomNav from './BottomNav'
import SideNav from './SideNav'
import Skeleton from './ui/Skeleton'
import { useStoreHydration } from '../hooks/useStoreHydration'

export default function Layout({ children }: PropsWithChildren) {
  const hydrated = useStoreHydration()

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <AppHeader />

      <div className="mx-auto max-w-6xl px-4 py-4 md:py-6 flex gap-6">
        <SideNav />

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-24 md:pb-0">
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
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
