import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// "Going to sleep": only the moment is kept, on the phone, so it survives
// closing the app, works offline and uses no battery. Tied to the person who
// tapped it, so another account on the same phone never sees it.

type SleepSessionState = {
  startedAt: number | null
  userId: string | null
  start: (userId: string) => void
  clear: () => void
}

export const useSleepSession = create<SleepSessionState>()(
  persist(
    (set) => ({
      startedAt: null,
      userId: null,
      start: (userId) => set({ startedAt: Date.now(), userId }),
      clear: () => set({ startedAt: null, userId: null }),
    }),
    { name: 'lp-sleep-session' },
  ),
)
