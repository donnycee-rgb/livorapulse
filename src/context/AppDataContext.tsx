import React, { createContext, useContext, useMemo, useState } from 'react'
import { initialDummyData, type FocusSession, type LivoraData, type MoodEmoji } from '../data/dummyData'

type AppDataContextValue = {
  data: LivoraData

  // Interactions (frontend-only simulation)
  setTodayMood: (emoji: MoodEmoji) => void
  setTodayStress: (score: number) => void
  addFocusSession: (session: Omit<FocusSession, 'id'>) => void
  addRecycleItemToday: (count?: number) => void
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  // This is our "simulated local DB".
  const [data, setData] = useState<LivoraData>(initialDummyData)

  const value = useMemo<AppDataContextValue>(() => {
    return {
      data,

      setTodayMood: (emoji) => {
        setData((prev) => ({
          ...prev,
          mood: {
            ...prev.mood,
            today: { ...prev.mood.today, emoji },
          },
          dashboard: {
            ...prev.dashboard,
            highlights: prev.dashboard.highlights.map((h) =>
              h.label === 'Stress' ? h : h,
            ),
          },
        }))
      },

      setTodayStress: (score) => {
        const clamped = Math.min(5, Math.max(1, Math.round(score)))
        setData((prev) => ({
          ...prev,
          mood: {
            ...prev.mood,
            today: { ...prev.mood.today, stressScore: clamped },
          },
          dashboard: {
            ...prev.dashboard,
            highlights: prev.dashboard.highlights.map((h) =>
              h.label === 'Stress' ? { ...h, value: `${clamped}/5`, tone: clamped >= 4 ? 'alert' : 'good' } : h,
            ),
          },
        }))
      },

      addFocusSession: (session) => {
        setData((prev) => {
          const durationMin = Math.round(session.durationHours * 60)
          return {
            ...prev,
            productivity: {
              ...prev.productivity,
              focusTimeline: [
                ...prev.productivity.focusTimeline,
                { ...session, id: uid('focus') },
              ],
              today: {
                ...prev.productivity.today,
                focusMin: prev.productivity.today.focusMin + durationMin,
              },
            },
          }
        })
      },

      addRecycleItemToday: (count = 1) => {
        setData((prev) => ({
          ...prev,
          environment: {
            ...prev.environment,
            today: {
              ...prev.environment.today,
              recycledItems: prev.environment.today.recycledItems + count,
            },
          },
        }))
      },
    }
  }, [data])

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
