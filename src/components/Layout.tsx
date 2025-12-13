import type { PropsWithChildren } from 'react'

import AppHeader from './AppHeader'
import BottomNav from './BottomNav'
import SideNav from './SideNav'

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-dvh bg-lp-neutral">
      <AppHeader />

      <div className="mx-auto max-w-6xl px-4 md:px-4 py-4 md:py-6 flex gap-6">
        <SideNav />

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-24 md:pb-0">{children}</main>
      </div>

      <BottomNav />
    </div>
  )
}
