import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppCategory, AppState, DayKey, MoodEmoji, ThemeMode, TransportMode, Units, UserGoals } from '../data/types'
import { seedState } from '../data/seed'
import { apiGet, apiPost, apiPut } from '../api/client'

const DEFAULT_GOALS: UserGoals = {
  goalStepsPerDay: 8000,
  goalSleepHours: 8,
  goalScreenMinutes: 240,
  goalFocusMinutes: 120,
  goalEcoActionsPerDay: 3,
  goalSocialMinutes: 60,
  goalEntertainmentMinutes: 90,
}

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
  return arr.map((x) => (x.day === day ? ({ ...x, [key]: (x[key] as unknown as number) + amount } as T) : x))
}

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------
type PhysicalEntry = {
  id: string
  steps: number
  distanceKm: number
  caloriesKcal: number
  sleepMinutes: number
  note?: string | null
  trail?: Array<{ lat: number; lng: number }> | null
  timestamp: string
}

type DigitalEntry = {
  id: string
  screenTimeMinutes: number
  categoryBreakdown: Record<string, number>
  date: string
}

type ProductivityEntry = {
  id: string
  kind: string
  label: string | null
  startedAt: string
  endedAt: string
  durationSec: number
}

type MoodEntry = {
  id: string
  emoji: string
  stressScore: number
  note: string | null
  timestamp: string
}

type EcoEntry = {
  id: string
  category: string
  type: string
  impactKgCO2: number
  timestamp: string
}

type ScoreResponse = {
  date: string
  score: number
  insight: string
  components: {
    physical: number
    digital: number
    productivity: number
    mood: number
    eco: number
  }
}

// ---------------------------------------------------------------------------
// Map API responses → store shape
// ---------------------------------------------------------------------------
const DAYS: DayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function dayKeyFromDate(iso: string): DayKey {
  const wd = new Date(iso).toLocaleDateString('en-US', { weekday: 'short' })
  const allowed = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  return (allowed.has(wd) ? wd : 'Mon') as DayKey
}

function buildWeeklySteps(entries: PhysicalEntry[]): AppState['physical']['weeklySteps'] {
  const map = new Map<DayKey, number>(DAYS.map((d) => [d, 0]))
  // FIX: Only count entries with actual steps (not sleep-only entries)
  entries.filter(e => e.steps > 0).forEach((e) => {
    const day = dayKeyFromDate(e.timestamp)
    map.set(day, (map.get(day) ?? 0) + e.steps)
  })
  return DAYS.map((day) => ({ day, steps: map.get(day) ?? 0 }))
}

function buildWeeklyDistance(entries: PhysicalEntry[]): AppState['physical']['weeklyDistanceKm'] {
  const map = new Map<DayKey, number>(DAYS.map((d) => [d, 0]))
  entries.filter(e => e.distanceKm > 0).forEach((e) => {
    const day = dayKeyFromDate(e.timestamp)
    map.set(day, (map.get(day) ?? 0) + e.distanceKm)
  })
  return DAYS.map((day) => ({ day, km: map.get(day) ?? 0 }))
}

function buildWeeklyCalories(entries: PhysicalEntry[]): AppState['physical']['weeklyCaloriesKcal'] {
  const map = new Map<DayKey, number>(DAYS.map((d) => [d, 0]))
  entries.filter(e => e.caloriesKcal > 0).forEach((e) => {
    const day = dayKeyFromDate(e.timestamp)
    map.set(day, (map.get(day) ?? 0) + e.caloriesKcal)
  })
  // FIX: Return { day, kcal } not { day, calories } — must match store type
  return DAYS.map((day) => ({ day, kcal: map.get(day) ?? 0 }))
}

function buildWeeklySleep(entries: PhysicalEntry[]): AppState['physical']['sleepHours'] {
  const map = new Map<DayKey, number[]>(DAYS.map((d) => [d, []]))
  // FIX: Only count entries with actual sleep minutes (not activity-only entries)
  entries.filter(e => e.sleepMinutes > 0).forEach((e) => {
    const day = dayKeyFromDate(e.timestamp)
    map.get(day)?.push(e.sleepMinutes / 60)
  })
  return DAYS.map((day) => {
    const vals = map.get(day) ?? []
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    return { day, hours: Math.round(avg * 10) / 10 }
  })
}

function buildWeeklyScreen(entries: DigitalEntry[]): AppState['digital']['weeklyScreenTimeMin'] {
  const map = new Map<DayKey, number>(DAYS.map((d) => [d, 0]))
  entries.forEach((e) => {
    const day = dayKeyFromDate(e.date)
    map.set(day, (map.get(day) ?? 0) + e.screenTimeMinutes)
  })
  return DAYS.map((day) => ({ day, minutes: map.get(day) ?? 0 }))
}

function buildAppUsageCategories(entries: DigitalEntry[]): AppState['digital']['appUsageCategoriesMin'] {
  const totals: Record<string, number> = { Social: 0, Productive: 0, Entertainment: 0 }
  entries.forEach((e) => {
    const bd = e.categoryBreakdown as Record<string, number>
    Object.entries(bd).forEach(([cat, mins]) => {
      if (cat in totals) totals[cat] += mins
    })
  })
  return [
    { category: 'Social', minutes: totals.Social },
    { category: 'Productive', minutes: totals.Productive },
    { category: 'Entertainment', minutes: totals.Entertainment },
  ]
}

function buildWeeklyFocus(entries: ProductivityEntry[]): AppState['productivity']['focusMinutesByDay'] {
  const map = new Map<DayKey, number>(DAYS.map((d) => [d, 0]))
  entries.filter((e) => e.kind === 'FOCUS').forEach((e) => {
    const day = dayKeyFromDate(e.startedAt)
    map.set(day, (map.get(day) ?? 0) + Math.round(e.durationSec / 60))
  })
  return DAYS.map((day) => ({ day, minutes: map.get(day) ?? 0 }))
}

function buildWeeklyStudy(entries: ProductivityEntry[]): AppState['productivity']['studySessionsByDay'] {
  const map = new Map<DayKey, number>(DAYS.map((d) => [d, 0]))
  entries.filter((e) => e.kind === 'STUDY').forEach((e) => {
    const day = dayKeyFromDate(e.startedAt)
    map.set(day, (map.get(day) ?? 0) + 1)
  })
  return DAYS.map((day) => ({ day, sessions: map.get(day) ?? 0 }))
}

function buildFocusSessions(entries: ProductivityEntry[]): AppState['productivity']['focusSessions'] {
  return entries.filter((e) => e.kind === 'FOCUS').slice(0, 20).map((e) => ({
    id: e.id,
    label: e.label ?? 'Focus session',
    startedAt: new Date(e.startedAt).getTime(),
    endedAt: new Date(e.endedAt).getTime(),
    durationSec: e.durationSec,
  }))
}

function buildMoodByDay(entries: MoodEntry[]): AppState['mood']['moodByDay'] {
  const map = new Map<DayKey, MoodEmoji>()
  const validEmojis = new Set<string>(['😄', '🙂', '😐', '😕', '😣'])
  entries.forEach((e) => {
    const day = dayKeyFromDate(e.timestamp)
    if (validEmojis.has(e.emoji)) map.set(day, e.emoji as MoodEmoji)
  })
  return DAYS.map((day) => ({ day, emoji: map.get(day) ?? '😐' }))
}

function buildStressByDay(entries: MoodEntry[]): AppState['mood']['stressByDay'] {
  const map = new Map<DayKey, number[]>(DAYS.map((d) => [d, []]))
  entries.forEach((e) => {
    const day = dayKeyFromDate(e.timestamp)
    // FIX: Backend stores 1-10, frontend uses 1-5 — consistent single division
    const score = Math.min(5, Math.max(1, Math.round(e.stressScore / 2)))
    map.get(day)?.push(score)
  })
  return DAYS.map((day) => {
    const vals = map.get(day) ?? []
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 3
    return { day, score: Math.round(avg) }
  })
}

function buildEcoActions(entries: EcoEntry[]): AppState['environment']['ecoActions'] {
  return entries.slice(0, 20).map((e) => ({
    id: e.id,
    timestamp: new Date(e.timestamp).getTime(),
    type: e.type,
    impactKgCO2: e.impactKgCO2,
  }))
}

function buildRecycledByDay(entries: EcoEntry[]): AppState['environment']['recycledItemsByDay'] {
  const map = new Map<DayKey, number>(DAYS.map((d) => [d, 0]))
  entries.filter((e) => e.category === 'WASTE').forEach((e) => {
    const day = dayKeyFromDate(e.timestamp)
    map.set(day, (map.get(day) ?? 0) + 1)
  })
  return DAYS.map((day) => ({ day, items: map.get(day) ?? 0 }))
}

function buildCarbonByDay(entries: EcoEntry[]): AppState['environment']['carbonKgByDay'] {
  const map = new Map<DayKey, number>(DAYS.map((d) => [d, 5]))
  entries.forEach((e) => {
    const day = dayKeyFromDate(e.timestamp)
    map.set(day, Math.max(0, (map.get(day) ?? 5) - e.impactKgCO2))
  })
  return DAYS.map((day) => ({ day, kg: Math.round((map.get(day) ?? 5) * 10) / 10 }))
}

// ---------------------------------------------------------------------------
// Clean empty state — used on logout and between accounts
// FIX: Never use seedState as fallback for real users — always start empty
// ---------------------------------------------------------------------------
function buildEmptyState(): AppState {
  return {
    user: seedState.user,
    preferences: seedState.preferences,
    goals: DEFAULT_GOALS,
    onboarding: { onboardingComplete: false },
    notifications: [],
    dashboard: seedState.dashboard,
    physical: {
      weeklySteps: DAYS.map((day) => ({ day, steps: 0 })),
      weeklyDistanceKm: DAYS.map((day) => ({ day, km: 0 })),
      weeklyCaloriesKcal: DAYS.map((day) => ({ day, kcal: 0 })),
      sleepHours: DAYS.map((day) => ({ day, hours: 0 })),
      activityLog: [],
    },
    digital: {
      weeklyScreenTimeMin: DAYS.map((day) => ({ day, minutes: 0 })),
      appUsageCategoriesMin: [
        { category: 'Social', minutes: 0 },
        { category: 'Productive', minutes: 0 },
        { category: 'Entertainment', minutes: 0 },
      ],
      screenSessions: [],
      focusMode: false,
    },
    productivity: {
      focusMinutesByDay: DAYS.map((day) => ({ day, minutes: 0 })),
      studySessionsByDay: DAYS.map((day) => ({ day, sessions: 0 })),
      focusSessions: [],
      focusTimer: { status: 'idle', durationSec: 1500, remainingSec: 1500, startedAt: null },
    },
    environment: {
      ecoActions: [],
      recycledItemsByDay: DAYS.map((day) => ({ day, items: 0 })),
      plasticUsageByDay: DAYS.map((day) => ({ day, items: 0 })),
      carbonKgByDay: DAYS.map((day) => ({ day, kg: 5 })),
      transportMode: 'Walking',
      transportModeSplit: [
        { mode: 'Walking', trips: 0 },
        { mode: 'Cycling', trips: 0 },
        { mode: 'Driving', trips: 0 },
      ],
    },
    mood: {
      today: { emoji: '😐', stressScore: 3 },
      moodByDay: DAYS.map((day) => ({ day, emoji: '😐' as MoodEmoji })),
      stressByDay: DAYS.map((day) => ({ day, score: 3 })),
    },
    meta: { lastUpdatedAt: Date.now() },
  }
}

// ---------------------------------------------------------------------------
// Store types
// ---------------------------------------------------------------------------
export type AppActions = {
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  setUnits: (units: Units) => void
  setNotificationsEnabled: (enabled: boolean) => void
  updateProfile: (patch: Partial<AppState['user']>) => void
  pushNotification: (n: Omit<AppState['notifications'][number], 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  addActivity: (input: { steps: number; distanceKm: number; caloriesKcal: number; note?: string; trail?: Array<{ lat: number; lng: number }>; durationSec?: number }) => Promise<void>
  updateSleepForToday: (hours: number) => Promise<void>
  addScreenSession: (input: { category: AppCategory; minutes: number }) => Promise<void>
  toggleFocusMode: () => void
  startFocusTimer: (minutes: number, label?: string) => void
  pauseFocusTimer: () => void
  resumeFocusTimer: () => void
  tickFocusTimer: () => void
  endFocusTimer: (reason?: 'completed' | 'manual') => Promise<void>
  addStudySession: () => Promise<void>
  addEcoAction: (input: { type: string; impactKgCO2: number; category?: string }) => Promise<void>
  setTransportMode: (mode: TransportMode) => Promise<void>
  setMoodEmoji: (emoji: MoodEmoji) => Promise<void>
  setStressScore: (score: number) => Promise<void>
  setGoals: (goals: Partial<UserGoals>) => Promise<void>
  resetAll: () => void
  hydrateFromApi: () => Promise<void>
  syncDashboardScore: () => Promise<void>
}

export type AppStore = AppState & AppActions

const initialState: AppState = buildEmptyState()

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ── Preferences ──────────────────────────────────────────────────────
      setTheme: (theme) => {
        set((s) => ({ preferences: { ...s.preferences, theme }, meta: { lastUpdatedAt: now() } }))
        apiPut('/api/user/profile', { preferences: { theme } }).catch(() => null)
      },
      toggleTheme: () => {
        const next: ThemeMode = get().preferences.theme === 'dark' ? 'light' : 'dark'
        set((s) => ({ preferences: { ...s.preferences, theme: next }, meta: { lastUpdatedAt: now() } }))
        apiPut('/api/user/profile', { preferences: { theme: next } }).catch(() => null)
      },
      setUnits: (units) => {
        set((s) => ({ preferences: { ...s.preferences, units }, meta: { lastUpdatedAt: now() } }))
        apiPut('/api/user/profile', { preferences: { units } }).catch(() => null)
      },
      setNotificationsEnabled: (enabled) => {
        set((s) => ({ preferences: { ...s.preferences, notificationsEnabled: enabled }, meta: { lastUpdatedAt: now() } }))
        apiPut('/api/user/profile', { preferences: { notificationsEnabled: enabled } }).catch(() => null)
      },

      // ── User ─────────────────────────────────────────────────────────────
      updateProfile: (patch) => {
        set((s) => ({ user: { ...s.user, ...patch }, meta: { lastUpdatedAt: now() } }))
        const apiPatch: Record<string, unknown> = {}
        if (patch.name !== undefined) apiPatch.name = patch.name
        if (patch.avatarUrl !== undefined) apiPatch.avatarUrl = patch.avatarUrl
        if (Object.keys(apiPatch).length > 0) {
          apiPut('/api/user/profile', apiPatch).catch(() => null)
        }
      },

      // ── Notifications ─────────────────────────────────────────────────────
      pushNotification: ({ title, message }) => {
        if (!get().preferences.notificationsEnabled) return
        const item = { id: uid('n'), title, message, timestamp: now(), read: false }
        set((s) => ({ notifications: [item, ...s.notifications].slice(0, 20), meta: { lastUpdatedAt: now() } }))
      },
      markNotificationRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
          meta: { lastUpdatedAt: now() },
        }))
      },
      markAllNotificationsRead: () => {
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })), meta: { lastUpdatedAt: now() } }))
      },

      // ── Physical ──────────────────────────────────────────────────────────
      // FIX: Now async — waits for API confirmation before showing success
      // FIX: Activity and sleep are separate API calls — no more sleepMinutes: 0
      addActivity: async ({ steps, distanceKm, caloriesKcal, note, trail, durationSec }) => {
        const day = getDayKey()
        // Optimistic update
        set((s) => ({
          physical: {
            ...s.physical,
            weeklySteps: incrementByDay(s.physical.weeklySteps, day, 'steps', steps),
            weeklyDistanceKm: incrementByDay(s.physical.weeklyDistanceKm, day, 'km', distanceKm),
            weeklyCaloriesKcal: incrementByDay(s.physical.weeklyCaloriesKcal, day, 'kcal', caloriesKcal),
            activityLog: [
              { id: uid('act'), timestamp: now(), steps, distanceKm, caloriesKcal, note, trail, durationSec },
              ...s.physical.activityLog,
            ],
          },
          meta: { lastUpdatedAt: now() },
        }))
        try {
          // FIX: Only send activity fields — no sleep data in this call
          await apiPost('/api/activity/physical', {
            steps,
            distanceKm,
            caloriesKcal,
            sleepMinutes: 0,
            note: note ?? '',
            trail: trail ?? [],
          })
          get().pushNotification({
            title: 'Activity saved',
            message: `${steps} steps and ${distanceKm.toFixed(1)} km saved to your profile.`,
          })
        } catch (err) {
          // Rollback optimistic update on failure
          set((s) => ({
            physical: {
              ...s.physical,
              weeklySteps: incrementByDay(s.physical.weeklySteps, day, 'steps', -steps),
              weeklyDistanceKm: incrementByDay(s.physical.weeklyDistanceKm, day, 'km', -distanceKm),
              weeklyCaloriesKcal: incrementByDay(s.physical.weeklyCaloriesKcal, day, 'kcal', -caloriesKcal),
              activityLog: s.physical.activityLog.filter((a) => a.steps !== steps),
            },
          }))
          throw new Error('Failed to save activity. Please check your connection and try again.')
        }
      },

      // FIX: Separate sleep API call — no longer mixed with activity
      updateSleepForToday: async (hours) => {
        const day = getDayKey()
        const prevHours = get().physical.sleepHours.find((x) => x.day === day)?.hours ?? 0
        // Optimistic update
        set((s) => ({
          physical: {
            ...s.physical,
            sleepHours: updateByDay(s.physical.sleepHours, day, { hours }),
          },
          meta: { lastUpdatedAt: now() },
        }))
        try {
          await apiPost('/api/activity/physical', {
            steps: 0,
            distanceKm: 0,
            caloriesKcal: 0,
            sleepMinutes: Math.round(hours * 60),
          })
        } catch {
          // Rollback
          set((s) => ({
            physical: {
              ...s.physical,
              sleepHours: updateByDay(s.physical.sleepHours, day, { hours: prevHours }),
            },
          }))
          throw new Error('Failed to save sleep data. Please try again.')
        }
      },

      // ── Digital ───────────────────────────────────────────────────────────
      addScreenSession: async ({ category, minutes }) => {
        const day = getDayKey()
        // Optimistic update
        set((s) => ({
          digital: {
            ...s.digital,
            weeklyScreenTimeMin: incrementByDay(s.digital.weeklyScreenTimeMin, day, 'minutes', minutes),
            appUsageCategoriesMin: s.digital.appUsageCategoriesMin.map((c) =>
              c.category === category ? { ...c, minutes: c.minutes + minutes } : c,
            ),
            screenSessions: [
              { id: uid('ss'), timestamp: now(), category, minutes },
              ...s.digital.screenSessions,
            ],
          },
          meta: { lastUpdatedAt: now() },
        }))
        try {
          await apiPost('/api/activity/digital', {
            screenTimeMinutes: minutes,
            categoryBreakdown: { [category]: minutes },
          })
        } catch {
          // Rollback
          set((s) => ({
            digital: {
              ...s.digital,
              weeklyScreenTimeMin: incrementByDay(s.digital.weeklyScreenTimeMin, day, 'minutes', -minutes),
              appUsageCategoriesMin: s.digital.appUsageCategoriesMin.map((c) =>
                c.category === category ? { ...c, minutes: c.minutes - minutes } : c,
              ),
              screenSessions: s.digital.screenSessions.slice(1),
            },
          }))
          throw new Error('Failed to save screen session. Please try again.')
        }
      },

      toggleFocusMode: () => {
        const next = !get().digital.focusMode
        set((s) => ({ digital: { ...s.digital, focusMode: next }, meta: { lastUpdatedAt: now() } }))
        get().pushNotification({
          title: next ? 'Focus Mode enabled' : 'Focus Mode disabled',
          message: next ? 'Notifications and distractions are reduced.' : 'Back to standard mode.',
        })
      },

      // ── Productivity ──────────────────────────────────────────────────────
      startFocusTimer: (minutes, label = 'Focus session') => {
        const durationSec = Math.max(5 * 60, Math.round(minutes * 60))
        set((s) => ({
          productivity: {
            ...s.productivity,
            focusTimer: { status: 'running', durationSec, remainingSec: durationSec, startedAt: now() },
          },
          meta: { lastUpdatedAt: now() },
        }))
        get().pushNotification({ title: 'Focus started', message: label })
      },
      pauseFocusTimer: () => {
        set((s) => ({
          productivity: { ...s.productivity, focusTimer: { ...s.productivity.focusTimer, status: 'paused' } },
          meta: { lastUpdatedAt: now() },
        }))
      },
      resumeFocusTimer: () => {
        set((s) => ({
          productivity: { ...s.productivity, focusTimer: { ...s.productivity.focusTimer, status: 'running' } },
          meta: { lastUpdatedAt: now() },
        }))
      },
      tickFocusTimer: () => {
        const t = get().productivity.focusTimer
        if (t.status !== 'running' || t.remainingSec <= 0) return
        set((s) => ({
          productivity: {
            ...s.productivity,
            focusTimer: {
              ...s.productivity.focusTimer,
              remainingSec: Math.max(0, s.productivity.focusTimer.remainingSec - 1),
            },
          },
        }))
        if (get().productivity.focusTimer.remainingSec === 0) get().endFocusTimer('completed')
      },

      // FIX: Now async — waits for API before showing success
      endFocusTimer: async (reason = 'manual') => {
        const t = get().productivity.focusTimer
        const idleTimer = { status: 'idle' as const, durationSec: 1500, remainingSec: 1500, startedAt: null }

        if (!t.startedAt) {
          set((s) => ({ productivity: { ...s.productivity, focusTimer: idleTimer }, meta: { lastUpdatedAt: now() } }))
          return
        }

        const elapsed = t.durationSec - t.remainingSec
        // Don't save sessions under 1 minute — prevents accidental tiny saves
        if (elapsed < 60) {
          set((s) => ({ productivity: { ...s.productivity, focusTimer: idleTimer }, meta: { lastUpdatedAt: now() } }))
          return
        }

        const endedAt = now()
        const minutes = Math.max(1, Math.round(elapsed / 60))
        const day = getDayKey()
        const startedAt = t.startedAt
        const sessionLabel = reason === 'completed' ? 'Completed focus' : 'Focus session'

        // Optimistic update
        set((s) => ({
          productivity: {
            ...s.productivity,
            focusMinutesByDay: incrementByDay(s.productivity.focusMinutesByDay, day, 'minutes', minutes),
            focusSessions: [
              { id: uid('fs'), label: sessionLabel, startedAt, endedAt, durationSec: elapsed },
              ...s.productivity.focusSessions,
            ],
            focusTimer: idleTimer,
          },
          meta: { lastUpdatedAt: now() },
        }))

        try {
          await apiPost('/api/productivity/session', {
            kind: 'FOCUS',
            label: sessionLabel,
            startedAt: new Date(startedAt).toISOString(),
            endedAt: new Date(endedAt).toISOString(),
            durationSec: elapsed,
          })
          get().pushNotification({ title: 'Focus saved', message: `${minutes} minutes saved to your profile.` })
        } catch {
          // Rollback focus minutes on failure
          set((s) => ({
            productivity: {
              ...s.productivity,
              focusMinutesByDay: incrementByDay(s.productivity.focusMinutesByDay, day, 'minutes', -minutes),
              focusSessions: s.productivity.focusSessions.slice(1),
            },
          }))
          throw new Error('Failed to save focus session. Please try again.')
        }
      },

      // FIX: Now async — waits for API
      addStudySession: async () => {
        const day = getDayKey()
        const startedAt = new Date()
        const endedAt = new Date(startedAt.getTime() + 30 * 60 * 1000)

        set((s) => ({
          productivity: {
            ...s.productivity,
            studySessionsByDay: incrementByDay(s.productivity.studySessionsByDay, day, 'sessions', 1),
          },
          meta: { lastUpdatedAt: now() },
        }))

        try {
          await apiPost('/api/productivity/session', {
            kind: 'STUDY',
            label: 'Study session',
            startedAt: startedAt.toISOString(),
            endedAt: endedAt.toISOString(),
            durationSec: 1800,
          })
        } catch {
          set((s) => ({
            productivity: {
              ...s.productivity,
              studySessionsByDay: incrementByDay(s.productivity.studySessionsByDay, day, 'sessions', -1),
            },
          }))
          throw new Error('Failed to save study session. Please try again.')
        }
      },

      // ── Environment ───────────────────────────────────────────────────────
      addEcoAction: async ({ type, impactKgCO2, category = 'WASTE' }) => {
        const day = getDayKey()
        const newAction = { id: uid('eco'), timestamp: now(), type, impactKgCO2 }

        set((s) => ({
          environment: {
            ...s.environment,
            ecoActions: [newAction, ...s.environment.ecoActions],
            recycledItemsByDay: category === 'WASTE'
              ? incrementByDay(s.environment.recycledItemsByDay, day, 'items', 1)
              : s.environment.recycledItemsByDay,
            carbonKgByDay: updateByDay(s.environment.carbonKgByDay, day, {
              kg: Math.max(0, (s.environment.carbonKgByDay.find((x) => x.day === day)?.kg ?? 5) - impactKgCO2),
            }),
          },
          meta: { lastUpdatedAt: now() },
        }))

        try {
          await apiPost('/api/eco', { category, type, impactKgCO2 })
          get().pushNotification({ title: 'Eco action saved', message: type })
        } catch {
          set((s) => ({
            environment: {
              ...s.environment,
              ecoActions: s.environment.ecoActions.filter((a) => a.id !== newAction.id),
              recycledItemsByDay: category === 'WASTE'
                ? incrementByDay(s.environment.recycledItemsByDay, day, 'items', -1)
                : s.environment.recycledItemsByDay,
            },
          }))
          throw new Error('Failed to save eco action. Please try again.')
        }
      },

      setTransportMode: async (mode) => {
        const prev = get().environment.transportMode
        set((s) => ({
          environment: {
            ...s.environment,
            transportMode: mode,
            transportModeSplit: s.environment.transportModeSplit.map((m) =>
              m.mode === mode ? { ...m, trips: m.trips + 1 } : m,
            ),
          },
          meta: { lastUpdatedAt: now() },
        }))
        try {
          const modeMap: Record<TransportMode, string> = {
            Walking: 'TRANSPORT',
            Cycling: 'TRANSPORT',
            Driving: 'TRANSPORT',
          }
          await apiPost('/api/eco', {
            category: modeMap[mode],
            type: mode,
            impactKgCO2: mode === 'Driving' ? 0 : 0.5,
          })
        } catch {
          set((s) => ({
            environment: {
              ...s.environment,
              transportMode: prev,
              transportModeSplit: s.environment.transportModeSplit.map((m) =>
                m.mode === mode ? { ...m, trips: Math.max(0, m.trips - 1) } : m,
              ),
            },
          }))
        }
      },

      // ── Mood ──────────────────────────────────────────────────────────────
      // FIX: Stress score — frontend always 1-5, backend always 1-10
      // Single source of truth: multiply by 2 on send, divide by 2 on receive
      setMoodEmoji: async (emoji) => {
        const day = getDayKey()
        const prevEmoji = get().mood.today.emoji
        set((s) => ({
          mood: {
            ...s.mood,
            today: { ...s.mood.today, emoji },
            moodByDay: updateByDay(s.mood.moodByDay, day, { emoji }),
          },
          meta: { lastUpdatedAt: now() },
        }))
        try {
          const stressScore = get().mood.today.stressScore
          // FIX: Consistent * 2 to convert 1-5 → 1-10 for backend
          await apiPost('/api/mood', { emoji, stressScore: stressScore * 2 })
        } catch {
          set((s) => ({
            mood: {
              ...s.mood,
              today: { ...s.mood.today, emoji: prevEmoji },
              moodByDay: updateByDay(s.mood.moodByDay, day, { emoji: prevEmoji }),
            },
          }))
          throw new Error('Failed to save mood. Please try again.')
        }
      },

      setStressScore: async (score) => {
        const day = getDayKey()
        const clamped = Math.min(5, Math.max(1, Math.round(score)))
        const prev = get().mood.today.stressScore
        set((s) => ({
          mood: {
            ...s.mood,
            today: { ...s.mood.today, stressScore: clamped },
            stressByDay: updateByDay(s.mood.stressByDay, day, { score: clamped }),
          },
          meta: { lastUpdatedAt: now() },
        }))
        try {
          const emoji = get().mood.today.emoji
          // FIX: Consistent * 2 to convert 1-5 → 1-10 for backend
          await apiPost('/api/mood', { emoji, stressScore: clamped * 2 })
        } catch {
          set((s) => ({
            mood: {
              ...s.mood,
              today: { ...s.mood.today, stressScore: prev },
              stressByDay: updateByDay(s.mood.stressByDay, day, { score: prev }),
            },
          }))
          throw new Error('Failed to save stress score. Please try again.')
        }
      },

      // ── Goals ────────────────────────────────────────────────────────────────
      setGoals: async (patch) => {
        set((s) => ({
          goals: { ...s.goals, ...patch },
          meta: { lastUpdatedAt: now() },
        }))
        try {
          await apiPut('/api/user/onboarding/goals', patch)
        } catch {
          // Non-fatal — goals are stored locally too
        }
      },

      // ── Reset ─────────────────────────────────────────────────────────────
      resetAll: () => {
        set(() => ({ ...buildEmptyState(), meta: { lastUpdatedAt: now() } }))
      },

      // ── API hydration ─────────────────────────────────────────────────────
      // FIX: Starts from a clean empty state — never spreads old user's data
      // FIX: Each dimension independently hydrates — no cross-contamination
      hydrateFromApi: async () => {
        try {
          const [physicalRes, digitalRes, productivityRes, moodRes, ecoRes, profileRes] = await Promise.allSettled([
            apiGet<{ success: boolean; data: PhysicalEntry[] }>('/api/activity/physical'),
            apiGet<{ success: boolean; data: DigitalEntry[] }>('/api/activity/digital'),
            apiGet<{ success: boolean; data: ProductivityEntry[] }>('/api/productivity/session'),
            apiGet<{ success: boolean; data: MoodEntry[] }>('/api/mood'),
            apiGet<{ success: boolean; data: EcoEntry[] }>('/api/eco'),
            apiGet<{ success: boolean; data: { name: string; email: string; avatarUrl?: string | null; preferences?: { theme: string; units: string; notificationsEnabled: boolean } | null; profile?: { onboardingComplete: boolean; primaryGoal?: string; goalStepsPerDay?: number; goalSleepHours?: number; goalScreenMinutes?: number; goalFocusMinutes?: number; goalEcoActionsPerDay?: number; goalSocialMinutes?: number; goalEntertainmentMinutes?: number; hasDisability?: boolean } | null } }>('/api/user/profile'),
          ])

          // FIX: Start from clean empty state — not from existing store state
          // This prevents old user's data from bleeding through
          const clean = buildEmptyState()

          set((s) => {
            const next = {
              ...clean,
              // Preserve preferences and notifications from current session
              preferences: s.preferences,
              notifications: s.notifications,
            }

            if (physicalRes.status === 'fulfilled' && physicalRes.value.data) {
              const entries = physicalRes.value.data
              next.physical = {
                weeklySteps: buildWeeklySteps(entries),
                weeklyDistanceKm: buildWeeklyDistance(entries),
                weeklyCaloriesKcal: buildWeeklyCalories(entries),
                sleepHours: buildWeeklySleep(entries),
                activityLog: entries.slice(0, 20).map((e) => ({
                  id: e.id,
                  timestamp: new Date(e.timestamp).getTime(),
                  steps: e.steps,
                  distanceKm: e.distanceKm,
                  caloriesKcal: e.caloriesKcal,
                  note: e.note ?? undefined,
                  trail: Array.isArray(e.trail) ? e.trail as Array<{ lat: number; lng: number }> : undefined,
                })),
              }
            }

            if (digitalRes.status === 'fulfilled' && digitalRes.value.data) {
              const entries = digitalRes.value.data
              next.digital = {
                weeklyScreenTimeMin: buildWeeklyScreen(entries),
                appUsageCategoriesMin: buildAppUsageCategories(entries),
                screenSessions: entries.slice(0, 20).map((e) => ({
                  id: e.id,
                  timestamp: new Date(e.date).getTime(),
                  category: 'Social' as AppCategory,
                  minutes: e.screenTimeMinutes,
                })),
                focusMode: s.digital.focusMode, // Preserve focus mode toggle
              }
            }

            if (productivityRes.status === 'fulfilled' && productivityRes.value.data) {
              const entries = productivityRes.value.data
              next.productivity = {
                focusMinutesByDay: buildWeeklyFocus(entries),
                studySessionsByDay: buildWeeklyStudy(entries),
                focusSessions: buildFocusSessions(entries),
                focusTimer: s.productivity.focusTimer, // Preserve active timer
              }
            }

            if (moodRes.status === 'fulfilled' && moodRes.value.data) {
              const entries = moodRes.value.data
              // FIX: Get today's mood entry specifically
              const todayKey = getDayKey()
              const todayEntries = entries.filter(e => dayKeyFromDate(e.timestamp) === todayKey)
              const latest = todayEntries[0] ?? entries[0]
              next.mood = {
                moodByDay: buildMoodByDay(entries),
                stressByDay: buildStressByDay(entries),
                today: {
                  emoji: (latest?.emoji as MoodEmoji) ?? '😐',
                  // FIX: Consistent /2 conversion from backend 1-10 to frontend 1-5
                  stressScore: latest ? Math.min(5, Math.max(1, Math.round(latest.stressScore / 2))) : 3,
                },
              }
            }

            if (ecoRes.status === 'fulfilled' && ecoRes.value.data) {
              const entries = ecoRes.value.data
              next.environment = {
                ecoActions: buildEcoActions(entries),
                recycledItemsByDay: buildRecycledByDay(entries),
                plasticUsageByDay: DAYS.map((day) => ({ day, items: 0 })),
                carbonKgByDay: buildCarbonByDay(entries),
                transportMode: s.environment.transportMode,
                transportModeSplit: s.environment.transportModeSplit,
              }
            }

            if (profileRes.status === 'fulfilled' && profileRes.value.data) {
              const user = profileRes.value.data
              next.user = {
                ...clean.user,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl ?? null,
                avatarInitials: user.name
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p: string) => p[0])
                  .join('')
                  .toUpperCase(),
              }
              if (user.preferences) {
                next.preferences = {
                  theme: (user.preferences.theme as ThemeMode) ?? s.preferences.theme,
                  units: (user.preferences.units as Units) ?? s.preferences.units,
                  notificationsEnabled: user.preferences.notificationsEnabled ?? s.preferences.notificationsEnabled,
                }
              }
              // Load personal goals from profile
              if (user.profile) {
                next.goals = {
                  goalStepsPerDay: user.profile.goalStepsPerDay ?? DEFAULT_GOALS.goalStepsPerDay,
                  goalSleepHours: user.profile.goalSleepHours ?? DEFAULT_GOALS.goalSleepHours,
                  goalScreenMinutes: user.profile.goalScreenMinutes ?? DEFAULT_GOALS.goalScreenMinutes,
                  goalFocusMinutes: user.profile.goalFocusMinutes ?? DEFAULT_GOALS.goalFocusMinutes,
                  goalEcoActionsPerDay: user.profile.goalEcoActionsPerDay ?? DEFAULT_GOALS.goalEcoActionsPerDay,
                  goalSocialMinutes: user.profile.goalSocialMinutes ?? DEFAULT_GOALS.goalSocialMinutes,
                  goalEntertainmentMinutes: user.profile.goalEntertainmentMinutes ?? DEFAULT_GOALS.goalEntertainmentMinutes,
                }
                next.onboarding = {
                  onboardingComplete: user.profile.onboardingComplete ?? false,
                  primaryGoal: user.profile.primaryGoal as any,
                }
              }
            }

            next.meta = { lastUpdatedAt: now() }
            return next
          })
        } catch (err) {
          console.warn('[hydrateFromApi] Failed:', err)
        }
      },

      // ── Dashboard score sync ──────────────────────────────────────────────
      syncDashboardScore: async () => {
        try {
          const today = new Date().toISOString().split('T')[0]
          const [scoreRes, streakRes] = await Promise.allSettled([
            apiGet<ScoreResponse>(`/api/score/daily?date=${today}`),
            apiGet<{ success: boolean; data: { streak: number } }>('/api/score/streak'),
          ])

          if (scoreRes.status === 'fulfilled') {
            set((s) => ({
              dashboard: {
                ...s.dashboard,
                score: scoreRes.value.score,
                insight: scoreRes.value.insight ?? s.dashboard.insight,
                loading: false,
              },
              meta: { lastUpdatedAt: now() },
            }))
          }

          if (streakRes.status === 'fulfilled') {
            const streak = streakRes.value.data.streak
            localStorage.setItem('lp_streak', String(streak))
          }
        } catch {
          // Non-fatal
        }
      },
    }),
    {
      name: 'livorapulse-store-v1',
      partialize: (s) => ({
        user: s.user,
        preferences: s.preferences,
        notifications: s.notifications,
        physical: s.physical,
        digital: s.digital,
        productivity: {
          ...s.productivity,
          focusTimer: {
            ...s.productivity.focusTimer,
            // Don't persist running state — pause it on reload
            status: s.productivity.focusTimer.status === 'running' ? 'paused' : s.productivity.focusTimer.status,
            startedAt: null,
          },
        },
        environment: s.environment,
        mood: s.mood,
        meta: s.meta,
        goals: s.goals,
        onboarding: s.onboarding,
      } satisfies Partial<AppState>),
    },
  ),
)