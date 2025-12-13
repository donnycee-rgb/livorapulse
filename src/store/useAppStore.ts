import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppCategory, AppState, DayKey, MoodEmoji, ThemeMode, TransportMode, Units } from '../data/types'
import { seedState } from '../data/seed'

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`
}

function now() {
  return Date.now()
}

function getDayKey(): DayKey {
  const wd = new Date().toLocaleDateString('en-US', { weekday: 'short' })
  const allowed = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  return (allowed.has(wd) ? wd : 'Mon') as DayKey
}

function updateByDay<T extends { day: DayKey }>(arr: T[], day: DayKey, patch: Partial<T>): T[] {
  return arr.map((x) => (x.day === day ? ({ ...x, ...patch } as T) : x))
}

function incrementByDay<T extends { day: DayKey }>(arr: T[], day: DayKey, key: keyof T, amount: number): T[] {
  return arr.map((x) => (x.day === day ? ({ ...x, [key]: (x[key] as any) + amount } as T) : x))
}

export type AppActions = {
  // Preferences
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  setUnits: (units: Units) => void
  setNotificationsEnabled: (enabled: boolean) => void

  // User
  updateProfile: (patch: Partial<AppState['user']>) => void

  // Notifications
  pushNotification: (n: Omit<AppState['notifications'][number], 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  // Physical
  addActivity: (input: { steps: number; distanceKm: number; caloriesKcal: number; note?: string }) => void
  updateSleepForToday: (hours: number) => void

  // Digital
  addScreenSession: (input: { category: AppCategory; minutes: number }) => void
  toggleFocusMode: () => void

  // Productivity
  startFocusTimer: (minutes: number, label?: string) => void
  pauseFocusTimer: () => void
  resumeFocusTimer: () => void
  tickFocusTimer: () => void
  endFocusTimer: (reason?: 'completed' | 'manual') => void
  addStudySession: () => void

  // Environment
  addEcoAction: (input: { type: string; impactKgCO2: number }) => void
  setTransportMode: (mode: TransportMode) => void

  // Mood
  setMoodEmoji: (emoji: MoodEmoji) => void
  setStressScore: (score: number) => void

  // Reset
  resetAll: () => void
}

export type AppStore = AppState & AppActions

const initialState: AppState = {
  ...seedState,
  meta: {
    lastUpdatedAt: now(),
  },
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTheme: (theme) => {
        set((s) => ({ ...s, preferences: { ...s.preferences, theme }, meta: { lastUpdatedAt: now() } }))
      },
      toggleTheme: () => {
        const current = get().preferences.theme
        const next: ThemeMode = current === 'dark' ? 'light' : 'dark'
        set((s) => ({ ...s, preferences: { ...s.preferences, theme: next }, meta: { lastUpdatedAt: now() } }))
      },
      setUnits: (units) => {
        set((s) => ({ ...s, preferences: { ...s.preferences, units }, meta: { lastUpdatedAt: now() } }))
      },
      setNotificationsEnabled: (enabled) => {
        set((s) => ({ ...s, preferences: { ...s.preferences, notificationsEnabled: enabled }, meta: { lastUpdatedAt: now() } }))
      },

      updateProfile: (patch) => {
        set((s) => ({ ...s, user: { ...s.user, ...patch }, meta: { lastUpdatedAt: now() } }))
      },

      pushNotification: ({ title, message }) => {
        if (!get().preferences.notificationsEnabled) return
        const item = { id: uid('n'), title, message, timestamp: now(), read: false }
        set((s) => ({ ...s, notifications: [item, ...s.notifications].slice(0, 20), meta: { lastUpdatedAt: now() } }))
      },
      markNotificationRead: (id) => {
        set((s) => ({
          ...s,
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
          meta: { lastUpdatedAt: now() },
        }))
      },
      markAllNotificationsRead: () => {
        set((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })), meta: { lastUpdatedAt: now() } }))
      },

      addActivity: ({ steps, distanceKm, caloriesKcal, note }) => {
        const day = getDayKey()
        set((s) => ({
          ...s,
          physical: {
            ...s.physical,
            weeklySteps: incrementByDay(s.physical.weeklySteps, day, 'steps', steps),
            weeklyDistanceKm: incrementByDay(s.physical.weeklyDistanceKm, day, 'km', distanceKm),
            weeklyCaloriesKcal: incrementByDay(s.physical.weeklyCaloriesKcal, day, 'kcal', caloriesKcal),
            activityLog: [{ id: uid('act'), timestamp: now(), steps, distanceKm, caloriesKcal, note }, ...s.physical.activityLog],
          },
          meta: { lastUpdatedAt: now() },
        }))
        get().pushNotification({ title: 'Activity logged', message: `Added ${steps} steps and ${distanceKm.toFixed(1)} km.` })
      },
      updateSleepForToday: (hours) => {
        const day = getDayKey()
        set((s) => ({
          ...s,
          physical: {
            ...s.physical,
            sleepHours: updateByDay(s.physical.sleepHours, day, { hours }),
          },
          meta: { lastUpdatedAt: now() },
        }))
      },

      addScreenSession: ({ category, minutes }) => {
        const day = getDayKey()
        set((s) => {
          const updatedCategories = s.digital.appUsageCategoriesMin.map((c) =>
            c.category === category ? { ...c, minutes: c.minutes + minutes } : c,
          )
          return {
            ...s,
            digital: {
              ...s.digital,
              weeklyScreenTimeMin: incrementByDay(s.digital.weeklyScreenTimeMin, day, 'minutes', minutes),
              appUsageCategoriesMin: updatedCategories,
              screenSessions: [{ id: uid('ss'), timestamp: now(), category, minutes }, ...s.digital.screenSessions],
            },
            meta: { lastUpdatedAt: now() },
          }
        })
      },
      toggleFocusMode: () => {
        const next = !get().digital.focusMode
        set((s) => ({ ...s, digital: { ...s.digital, focusMode: next }, meta: { lastUpdatedAt: now() } }))
        get().pushNotification({
          title: next ? 'Focus Mode enabled' : 'Focus Mode disabled',
          message: next ? 'Notifications and distractions are reduced.' : 'Back to standard mode.',
        })
      },

      startFocusTimer: (minutes, label = 'Focus session') => {
        const durationSec = Math.max(5 * 60, Math.round(minutes * 60))
        set((s) => ({
          ...s,
          productivity: {
            ...s.productivity,
            focusTimer: {
              status: 'running',
              durationSec,
              remainingSec: durationSec,
              startedAt: now(),
            },
          },
          meta: { lastUpdatedAt: now() },
        }))
        get().pushNotification({ title: 'Focus started', message: label })
      },
      pauseFocusTimer: () => {
        set((s) => ({
          ...s,
          productivity: {
            ...s.productivity,
            focusTimer: { ...s.productivity.focusTimer, status: 'paused' },
          },
          meta: { lastUpdatedAt: now() },
        }))
      },
      resumeFocusTimer: () => {
        set((s) => ({
          ...s,
          productivity: {
            ...s.productivity,
            focusTimer: { ...s.productivity.focusTimer, status: 'running' },
          },
          meta: { lastUpdatedAt: now() },
        }))
      },
      tickFocusTimer: () => {
        const t = get().productivity.focusTimer
        if (t.status !== 'running') return
        if (t.remainingSec <= 0) return
        set((s) => ({
          ...s,
          productivity: {
            ...s.productivity,
            focusTimer: {
              ...s.productivity.focusTimer,
              remainingSec: Math.max(0, s.productivity.focusTimer.remainingSec - 1),
            },
          },
        }))

        const after = get().productivity.focusTimer
        if (after.remainingSec === 0) {
          get().endFocusTimer('completed')
        }
      },
      endFocusTimer: (reason = 'manual') => {
        const state = get()
        const t = state.productivity.focusTimer
        if (!t.startedAt) {
          // reset
          set((s) => ({
            ...s,
            productivity: {
              ...s.productivity,
              focusTimer: { status: 'idle', durationSec: 1500, remainingSec: 1500, startedAt: null },
            },
            meta: { lastUpdatedAt: now() },
          }))
          return
        }

        const elapsed = t.durationSec - t.remainingSec
        const endedAt = now()
        const minutes = Math.max(0, Math.round(elapsed / 60))
        const day = getDayKey()

        set((s) => ({
          ...s,
          productivity: {
            ...s.productivity,
            focusMinutesByDay: incrementByDay(s.productivity.focusMinutesByDay, day, 'minutes', minutes),
            focusSessions: [
              {
                id: uid('fs'),
                label: reason === 'completed' ? 'Completed focus' : 'Focus session',
                startedAt: t.startedAt!,
                endedAt,
                durationSec: elapsed,
              },
              ...s.productivity.focusSessions,
            ],
            focusTimer: { status: 'idle', durationSec: 1500, remainingSec: 1500, startedAt: null },
          },
          meta: { lastUpdatedAt: now() },
        }))

        get().pushNotification({ title: 'Focus saved', message: `Logged ${minutes} minutes of focus.` })
      },

      addStudySession: () => {
        const day = getDayKey()
        set((s) => ({
          ...s,
          productivity: {
            ...s.productivity,
            studySessionsByDay: incrementByDay(s.productivity.studySessionsByDay, day, 'sessions', 1),
          },
          meta: { lastUpdatedAt: now() },
        }))
      },

      addEcoAction: ({ type, impactKgCO2 }) => {
        const day = getDayKey()
        set((s) => ({
          ...s,
          environment: {
            ...s.environment,
            ecoActions: [{ id: uid('eco'), timestamp: now(), type, impactKgCO2 }, ...s.environment.ecoActions],
            recycledItemsByDay: type.toLowerCase().includes('recycle')
              ? incrementByDay(s.environment.recycledItemsByDay, day, 'items', 1)
              : s.environment.recycledItemsByDay,
            carbonKgByDay: updateByDay(s.environment.carbonKgByDay, day, {
              kg: Math.max(0, (s.environment.carbonKgByDay.find((x) => x.day === day)?.kg ?? 0) - impactKgCO2),
            }),
          },
          meta: { lastUpdatedAt: now() },
        }))
        get().pushNotification({ title: 'Eco action added', message: type })
      },
      setTransportMode: (mode) => {
        set((s) => ({
          ...s,
          environment: {
            ...s.environment,
            transportMode: mode,
            transportModeSplit: s.environment.transportModeSplit.map((m) =>
              m.mode === mode ? { ...m, trips: m.trips + 1 } : m,
            ),
          },
          meta: { lastUpdatedAt: now() },
        }))
      },

      setMoodEmoji: (emoji) => {
        const day = getDayKey()
        set((s) => ({
          ...s,
          mood: {
            ...s.mood,
            today: { ...s.mood.today, emoji },
            moodByDay: updateByDay(s.mood.moodByDay, day, { emoji }),
          },
          meta: { lastUpdatedAt: now() },
        }))
      },
      setStressScore: (score) => {
        const day = getDayKey()
        const clamped = Math.min(5, Math.max(1, Math.round(score)))
        set((s) => ({
          ...s,
          mood: {
            ...s.mood,
            today: { ...s.mood.today, stressScore: clamped },
            stressByDay: updateByDay(s.mood.stressByDay, day, { score: clamped }),
          },
          meta: { lastUpdatedAt: now() },
        }))
      },

      resetAll: () => {
        set(() => ({ ...initialState, meta: { lastUpdatedAt: now() } }))
      },
    }),
    {
      name: 'livorapulse-store-v1',
      partialize: (s) => {
        // Persist everything except ephemeral timer tick precision.
        return {
          user: s.user,
          preferences: s.preferences,
          notifications: s.notifications,
          physical: s.physical,
          digital: s.digital,
          productivity: {
            ...s.productivity,
            focusTimer: {
              ...s.productivity.focusTimer,
              // if user reloads, resume in paused state
              status: s.productivity.focusTimer.status === 'running' ? 'paused' : s.productivity.focusTimer.status,
              startedAt: null,
            },
          },
          environment: s.environment,
          mood: s.mood,
          meta: s.meta,
        } satisfies Partial<AppState>
      },
    },
  ),
)
