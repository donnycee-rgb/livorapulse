// Types used by the assessment flow in AuthPage.tsx
// initialDummyData has been removed — app now starts with clean zeros

export type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
export type MoodEmoji = '😄' | '🙂' | '😐' | '😕' | '😣'
export type TransportMode = 'Walking' | 'Cycling' | 'Driving'

export type FocusSession = {
  id: string
  day: DayKey
  startHour: number
  durationHours: number
}

export type LivoraData = {
  user: { name: string; avatarInitials: string }
  dashboard: {
    lifeFootprintScore: number
    dailySummary: string
    highlights: Array<{ label: string; value: string; tone: 'good' | 'neutral' | 'alert' }>
  }
  physical: {
    weeklySteps: Array<{ day: DayKey; steps: number }>
    weeklyDistanceKm: Array<{ day: DayKey; km: number }>
    sleepHours: Array<{ day: DayKey; hours: number }>
    today: { steps: number; distanceKm: number; caloriesKcal: number; sleepHours: number }
  }
  digital: {
    weeklyScreenTimeMin: Array<{ day: DayKey; minutes: number }>
    appUsageCategoriesMin: Array<{ category: 'Social' | 'Productive' | 'Entertainment'; minutes: number }>
    today: { screenTimeMin: number; socialMin: number; productiveMin: number }
  }
  productivity: {
    focusMinutesByDay: Array<{ day: DayKey; minutes: number }>
    studySessionsByDay: Array<{ day: DayKey; sessions: number }>
    focusTimeline: FocusSession[]
    today: { focusMin: number; studySessions: number }
  }
  environment: {
    recycledItemsByDay: Array<{ day: DayKey; items: number }>
    plasticUsageByDay: Array<{ day: DayKey; items: number }>
    transportModeSplit: Array<{ mode: TransportMode; trips: number }>
    electricityKwhByDay: Array<{ day: DayKey; kwh: number }>
    today: { recycledItems: number; transportMode: TransportMode; electricityKwh: number }
  }
  mood: {
    moodByDay: Array<{ day: DayKey; emoji: MoodEmoji }>
    stressByDay: Array<{ day: DayKey; score: number }>
    today: { emoji: MoodEmoji; stressScore: number }
  }
}