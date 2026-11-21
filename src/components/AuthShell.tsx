import type { ReactNode } from 'react'
import { HomeLink, Wordmark } from '../pages/AuthPage'

/** The light, centred card used by the email-confirm and reset-password pages (matches the sign-in page) */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10 bg-[#F5F5F5] dark:bg-[#050b18]">
      <div className="w-full max-w-[420px]">
        <div className="flex items-center justify-between gap-3 mb-6"><Wordmark sub={false} /><HomeLink /></div>
        <div className="lp-card rounded-3xl p-8 max-sm:p-5">{children}</div>
      </div>
    </div>
  )
}
