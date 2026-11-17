import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// "Going to sleep": only the moment is kept, so it survives closing the app,
// works offline and uses no battery. Shared with the server and so with the
// person's other devices (lib/sleepSync.ts). Tied to the person who tapped
// it, so another account on the same phone never sees it.

type SleepSessionState = {
  startedAt: number | null
  userId: string | null
  /** The server has this sleep (so the other devices can show it too) */
  synced?: boolean
  start: (userId: string) => void
  clear: () => void
}

export const useSleepSession = create<SleepSessionState>()(
  persist(
    (set) => ({
      startedAt: null,
      userId: null,
      start: (userId) => set({ startedAt: Date.now(), userId, synced: false }),
      clear: () => set({ startedAt: null, userId: null, synced: false }),
    }),
    { name: 'lp-sleep-session' },
  ),
)
