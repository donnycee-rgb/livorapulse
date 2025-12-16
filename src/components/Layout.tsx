import type { PropsWithChildren } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'

import AppHeader from './AppHeader'
import BottomNav from './BottomNav'
import ContextSidebar from './ContextSidebar'
import DashboardRightPanel from './DashboardRightPanel'
import SideNav from './SideNav'
import Skeleton from './ui/Skeleton'
import { useAppStore } from '../store/useAppStore'
import { getDayKey } from '../utils/date'
import { formatDistance, formatMinutesToHM, formatNumber } from '../utils/format'
import { useStoreHydration } from '../hooks/useStoreHydration'

export default function Layout({ children }: PropsWithChildren) {
  const hydrated = useStoreHydration()
  const location = useLocation()
  const navigate = useNavigate()

  const showRightPanel = location.pathname === '/dashboard'

  const sidebarConfig = useMemo(() => {
    const day = getDayKey()
    const physical = useAppStore.getState().physical
    const digital = useAppStore.getState().digital
    const mood = useAppStore.getState().mood
    const productivity = useAppStore.getState().productivity
    const environment = useAppStore.getState().environment

    switch (location.pathname) {
      case '/physical':
        const todaySteps = physical.weeklySteps.find((x) => x.day === day)?.steps ?? 0
        const todayDistance = physical.weeklyDistanceKm.find((x) => x.day === day)?.km ?? 0
        const todayCalories = physical.weeklyCaloriesKcal.find((x) => x.day === day)?.kcal ?? 0
        return {
          summaryTitle: "Today’s Overview",
          metrics: [
            { label: "Steps", value: formatNumber(todaySteps) },
            { label: "Distance", value: formatDistance(todayDistance, useAppStore.getState().preferences.units) },
            { label: "Calories", value: `${todayCalories} kcal` },
          ],
          insights: ["Your activity is highest mid-week"],
          actions: [{ label: "View detailed report", onClick: () => navigate('/physical') }],
        }
      case '/digital':
        const todayScreen = digital.weeklyScreenTimeMin.find((x) => x.day === day)?.minutes ?? 0
        const todayFocus = productivity.focusMinutesByDay.find((x) => x.day === day)?.minutes ?? 0
        return {
          summaryTitle: "Today’s Overview",
          metrics: [
            { label: "Screen Time", value: formatMinutesToHM(todayScreen) },
            { label: "Focus Time", value: `${todayFocus}m` },
          ],
          insights: ["Screen time dropped compared to last week"],
          actions: [{ label: "Adjust goals", onClick: () => navigate('/digital') }],
        }
      case '/productivity':
        const todayFocusProd = productivity.focusMinutesByDay.find((x) => x.day === day)?.minutes ?? 0
        const todaySessions = productivity.studySessionsByDay.find((x) => x.day === day)?.sessions ?? 0
        return {
          summaryTitle: "Today’s Overview",
          metrics: [
            { label: "Focus Time", value: `${todayFocusProd}m` },
            { label: "Study Sessions", value: formatNumber(todaySessions) },
          ],
          insights: ["Focus sessions are most productive in the morning"],
          actions: [{ label: "Start focus session", onClick: () => navigate('/productivity') }],
        }
      case '/environment':
        const todayCarbon = environment.carbonKgByDay.find((x) => x.day === day)?.kg ?? 0
        const todayRecycled = environment.recycledItemsByDay.find((x) => x.day === day)?.items ?? 0
        return {
          summaryTitle: "Today’s Overview",
          metrics: [
            { label: "Carbon Saved", value: `${todayCarbon.toFixed(1)} kg` },
            { label: "Items Recycled", value: formatNumber(todayRecycled) },
          ],
          insights: ["Your eco-actions are making a positive impact"],
          actions: [{ label: "Log eco-action", onClick: () => navigate('/environment') }],
        }
      case '/mood':
        const todayMood = mood.today.emoji
        const todayStress = mood.today.stressScore
        return {
          summaryTitle: "Today’s Overview",
          metrics: [
            { label: "Mood", value: todayMood },
            { label: "Stress", value: `${todayStress}/5` },
          ],
          insights: ["Stress levels are trending down"],
          actions: [{ label: "See trends", onClick: () => navigate('/mood') }],
        }
      default:
        return null
    }
  }, [location.pathname, navigate])

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <AppHeader />

      <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
        <div className="grid grid-cols-1 md:grid-cols-[72px_minmax(0,1fr)] lg:grid-cols-[72px_minmax(0,1fr)_320px] gap-6">
          <SideNav />

          {/* Main content */}
          <main className="min-w-0 pb-24 md:pb-0">
            {hydrated ? (
              children
            ) : (
              <div className="space-y-4">
                <Skeleton className="h-28" />
                <div className="grid md:grid-cols-2 gap-4">
                  <Skeleton className="h-64" />
                  <Skeleton className="h-64" />
                </div>
              </div>
            )}
          </main>

          {/* Right panel */}
          {showRightPanel ? (
            <aside className="hidden lg:block">
              <div className="sticky top-[92px]">
                <DashboardRightPanel />
              </div>
            </aside>
          ) : sidebarConfig ? (
            <aside className="hidden lg:block">
              <div className="sticky top-[92px]">
                <ContextSidebar {...sidebarConfig} />
              </div>
            </aside>
          ) : (
            <aside className="hidden lg:block" />
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
