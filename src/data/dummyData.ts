// Dummy JSON data (frontend-only MVP).
// Everything is hardcoded here and then copied into local state in AppDataContext.

export type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'

export type MoodEmoji = '😄' | '🙂' | '😐' | '😕' | '😣'

export type FocusSession = {
  id: string
  day: DayKey
  // 0-24 (hours). Used for a simple timeline visualization.
  startHour: number
  durationHours: number
}

export type TransportMode = 'Walking' | 'Cycling' | 'Driving'

export type LivoraData = {
  user: {
    name: string
    avatarInitials: string
  }
  dashboard: {
    lifeFootprintScore: number // 0-100
    dailySummary: string
    highlights: Array<{ label: string; value: string; tone: 'good' | 'neutral' | 'alert' }>
  }
  physical: {
    weeklySteps: Array<{ day: DayKey; steps: number }>
    weeklyDistanceKm: Array<{ day: DayKey; km: number }>
    sleepHours: Array<{ day: DayKey; hours: number }>
    today: {
      steps: number
      distanceKm: number
      caloriesKcal: number
      sleepHours: number
    }
  }
  digital: {
    weeklyScreenTimeMin: Array<{ day: DayKey; minutes: number }>
    appUsageCategoriesMin: Array<{ category: 'Social' | 'Productive' | 'Entertainment'; minutes: number }>
    today: {
      screenTimeMin: number
      socialMin: number
      productiveMin: number
    }
  }
  productivity: {
    focusMinutesByDay: Array<{ day: DayKey; minutes: number }>
    studySessionsByDay: Array<{ day: DayKey; sessions: number }>
    focusTimeline: FocusSession[]
    today: {
      focusMin: number
      studySessions: number
    }
  }
  environment: {
    recycledItemsByDay: Array<{ day: DayKey; items: number }>
    plasticUsageByDay: Array<{ day: DayKey; items: number }>
    transportModeSplit: Array<{ mode: TransportMode; trips: number }>
    electricityKwhByDay: Array<{ day: DayKey; kwh: number }>
    today: {
      recycledItems: number
      transportMode: TransportMode
      electricityKwh: number
    }
  }
  mood: {
    moodByDay: Array<{ day: DayKey; emoji: MoodEmoji }>
    stressByDay: Array<{ day: DayKey; score: number }>
    today: {
      emoji: MoodEmoji
      stressScore: number // 1-5
    }
  }
}

export const initialDummyData: LivoraData = {
  user: {
    name: 'Dennis',
    avatarInitials: 'DP',
  },
  dashboard: {
    lifeFootprintScore: 78,
    dailySummary: 'Balanced day: High movement, moderate screen time',
    highlights: [
      { label: 'Steps', value: '6,500', tone: 'good' },
      { label: 'Screen Time', value: '2h 30m', tone: 'neutral' },
      { label: 'Stress', value: '2/5', tone: 'good' },
    ],
  },
  physical: {
    weeklySteps: [
      { day: 'Mon', steps: 5200 },
      { day: 'Tue', steps: 7100 },
      { day: 'Wed', steps: 6400 },
      { day: 'Thu', steps: 8200 },
      { day: 'Fri', steps: 6500 },
      { day: 'Sat', steps: 9300 },
      { day: 'Sun', steps: 4800 },
    ],
    weeklyDistanceKm: [
      { day: 'Mon', km: 3.4 },
      { day: 'Tue', km: 4.9 },
      { day: 'Wed', km: 4.2 },
      { day: 'Thu', km: 5.6 },
      { day: 'Fri', km: 4.2 },
      { day: 'Sat', km: 6.8 },
      { day: 'Sun', km: 3.1 },
    ],
    sleepHours: [
      { day: 'Mon', hours: 7.1 },
      { day: 'Tue', hours: 6.6 },
      { day: 'Wed', hours: 7.4 },
      { day: 'Thu', hours: 6.9 },
      { day: 'Fri', hours: 7.2 },
      { day: 'Sat', hours: 8.0 },
      { day: 'Sun', hours: 7.6 },
    ],
    today: {
      steps: 6500,
      distanceKm: 4.2,
      caloriesKcal: 210,
      sleepHours: 7.2,
    },
  },
  digital: {
    weeklyScreenTimeMin: [
      { day: 'Mon', minutes: 185 },
      { day: 'Tue', minutes: 160 },
      { day: 'Wed', minutes: 210 },
      { day: 'Thu', minutes: 150 },
      { day: 'Fri', minutes: 150 },
      { day: 'Sat', minutes: 240 },
      { day: 'Sun', minutes: 130 },
    ],
    appUsageCategoriesMin: [
      { category: 'Social', minutes: 75 },
      { category: 'Productive', minutes: 70 },
      { category: 'Entertainment', minutes: 35 },
    ],
    today: {
      screenTimeMin: 150,
      socialMin: 75,
      productiveMin: 70,
    },
  },
  productivity: {
    focusMinutesByDay: [
      { day: 'Mon', minutes: 55 },
      { day: 'Tue', minutes: 70 },
      { day: 'Wed', minutes: 45 },
      { day: 'Thu', minutes: 80 },
      { day: 'Fri', minutes: 65 },
      { day: 'Sat', minutes: 25 },
      { day: 'Sun', minutes: 30 },
    ],
    studySessionsByDay: [
      { day: 'Mon', sessions: 1 },
      { day: 'Tue', sessions: 2 },
      { day: 'Wed', sessions: 1 },
      { day: 'Thu', sessions: 2 },
      { day: 'Fri', sessions: 2 },
      { day: 'Sat', sessions: 0 },
      { day: 'Sun', sessions: 1 },
    ],
    focusTimeline: [
      { id: 'fs1', day: 'Mon', startHour: 9, durationHours: 1.0 },
      { id: 'fs2', day: 'Mon', startHour: 14, durationHours: 0.5 },
      { id: 'fs3', day: 'Tue', startHour: 10, durationHours: 1.25 },
      { id: 'fs4', day: 'Thu', startHour: 16, durationHours: 1.0 },
    ],
    today: {
      focusMin: 65,
      studySessions: 2,
    },
  },
  environment: {
    recycledItemsByDay: [
      { day: 'Mon', items: 2 },
      { day: 'Tue', items: 1 },
      { day: 'Wed', items: 3 },
      { day: 'Thu', items: 2 },
      { day: 'Fri', items: 2 },
      { day: 'Sat', items: 4 },
      { day: 'Sun', items: 1 },
    ],
    plasticUsageByDay: [
      { day: 'Mon', items: 2 },
      { day: 'Tue', items: 3 },
      { day: 'Wed', items: 1 },
      { day: 'Thu', items: 2 },
      { day: 'Fri', items: 2 },
      { day: 'Sat', items: 4 },
      { day: 'Sun', items: 1 },
    ],
    transportModeSplit: [
      { mode: 'Walking', trips: 7 },
      { mode: 'Cycling', trips: 3 },
      { mode: 'Driving', trips: 2 },
    ],
    electricityKwhByDay: [
      { day: 'Mon', kwh: 6.2 },
      { day: 'Tue', kwh: 5.8 },
      { day: 'Wed', kwh: 6.0 },
      { day: 'Thu', kwh: 6.6 },
      { day: 'Fri', kwh: 6.1 },
      { day: 'Sat', kwh: 7.3 },
      { day: 'Sun', kwh: 5.6 },
    ],
    today: {
      recycledItems: 2,
      transportMode: 'Walking',
      electricityKwh: 6.1,
    },
  },
  mood: {
    moodByDay: [
      { day: 'Mon', emoji: '🙂' },
      { day: 'Tue', emoji: '😄' },
      { day: 'Wed', emoji: '😐' },
      { day: 'Thu', emoji: '🙂' },
      { day: 'Fri', emoji: '🙂' },
      { day: 'Sat', emoji: '😄' },
      { day: 'Sun', emoji: '😕' },
    ],
    stressByDay: [
      { day: 'Mon', score: 2 },
      { day: 'Tue', score: 2 },
      { day: 'Wed', score: 3 },
      { day: 'Thu', score: 2 },
      { day: 'Fri', score: 2 },
      { day: 'Sat', score: 1 },
      { day: 'Sun', score: 3 },
    ],
    today: {
      emoji: '🙂',
      stressScore: 2,
    },
  },
}
