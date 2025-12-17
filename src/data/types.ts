export type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'

export type ThemeMode = 'light' | 'dark'
export type Units = 'metric' | 'imperial'

export type MoodEmoji = '😄' | '🙂' | '😐' | '😕' | '😣'

export type NotificationItem = {
  id: string
  title: string
  message: string
  timestamp: number
  read: boolean
}

export type WeeklySteps = Array<{ day: DayKey; steps: number }>
export type WeeklyDistance = Array<{ day: DayKey; km: number }>
export type WeeklyCalories = Array<{ day: DayKey; kcal: number }>
export type WeeklySleep = Array<{ day: DayKey; hours: number }>

export type WeeklyScreenTime = Array<{ day: DayKey; minutes: number }>
export type AppCategory = 'Social' | 'Productive' | 'Entertainment'
export type AppUsageCategories = Array<{ category: AppCategory; minutes: number }>

export type FocusTimerStatus = 'idle' | 'running' | 'paused'

export type FocusTimerState = {
  status: FocusTimerStatus
  durationSec: number
  remainingSec: number
  startedAt: number | null
}

export type FocusSession = {
  id: string
  label: string
  startedAt: number
  endedAt: number
  durationSec: number
}

export type TransportMode = 'Walking' | 'Cycling' | 'Driving'

export type AppState = {
  user: {
    id?: string
    name: string
    email: string
    avatarInitials: string
  }

  dashboard: {
    score: number
    insight: string
    loading: boolean
  }
  preferences: {
    theme: ThemeMode
    units: Units
    notificationsEnabled: boolean
  }
  notifications: NotificationItem[]
  physical: {
    weeklySteps: WeeklySteps
    weeklyDistanceKm: WeeklyDistance
    weeklyCaloriesKcal: WeeklyCalories
    sleepHours: WeeklySleep
    activityLog: Array<{
      id: string
      timestamp: number
      steps: number
      distanceKm: number
      caloriesKcal: number
      note?: string
    }>
  }
  digital: {
    weeklyScreenTimeMin: WeeklyScreenTime
    appUsageCategoriesMin: AppUsageCategories
    focusMode: boolean
    screenSessions: Array<{
      id: string
      timestamp: number
      category: AppCategory
      minutes: number
    }>
  }
  productivity: {
    focusMinutesByDay: Array<{ day: DayKey; minutes: number }>
    studySessionsByDay: Array<{ day: DayKey; sessions: number }>
    focusTimer: FocusTimerState
    focusSessions: FocusSession[]
  }
  environment: {
    ecoActions: Array<{
      id: string
      timestamp: number
      type: string
      impactKgCO2: number
    }>
    recycledItemsByDay: Array<{ day: DayKey; items: number }>
    plasticUsageByDay: Array<{ day: DayKey; items: number }>
    transportMode: TransportMode
    transportModeSplit: Array<{ mode: TransportMode; trips: number }>
    carbonKgByDay: Array<{ day: DayKey; kg: number }>
  }
  mood: {
    moodByDay: Array<{ day: DayKey; emoji: MoodEmoji }>
    stressByDay: Array<{ day: DayKey; score: number }>
    today: {
      emoji: MoodEmoji
      stressScore: number
    }
  }

  meta: {
    lastUpdatedAt: number
  }
}
