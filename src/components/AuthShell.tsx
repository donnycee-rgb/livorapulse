import type { ReactNode } from 'react'

/** The dark, centred card used by the email-confirm and reset-password pages (matches the sign-in page) */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-dvh flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(135deg, #091525 0%, #0e1d40 45%, #0b2218 100%)' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="text-lg font-black text-white">Livora</span>
          <span className="text-lg font-black text-lp-primary">Pulse</span>
        </div>
        <div className="rounded-3xl p-6 bg-white/[0.04] border border-white/10 shadow-2xl">{children}</div>
      </div>
    </div>
  )
}
