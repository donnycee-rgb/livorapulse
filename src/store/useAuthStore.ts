import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiGet, apiPost } from '../api/client'

export type AuthUser = {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
  preferences?: {
    theme: 'light' | 'dark'
    units: 'metric' | 'imperial'
    notificationsEnabled: boolean
    focusMode: boolean
  } | null
  profile?: {
    onboardingComplete: boolean
    primaryGoal?: string
    goalStepsPerDay?: number
    goalSleepHours?: number
    goalScreenMinutes?: number
    goalFocusMinutes?: number
    goalEcoActionsPerDay?: number
    goalSocialMinutes?: number
    goalEntertainmentMinutes?: number
    hasDisability?: boolean
    gender?: string
    dateOfBirth?: string
  } | null
}

type AuthState = {
  accessToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  onboardingComplete: boolean
  status: 'idle' | 'loading'
  lastAssessmentAt: number | null

  setToken: (token: string | null) => void
  setLastAssessmentAt: (ts: number) => void
  setOnboardingComplete: (val: boolean) => void
  logout: () => void
  register: (input: { name: string; email: string; password: string }) => Promise<void>
  login: (input: { email: string; password: string }) => Promise<void>
  loginWithGoogle: () => void
  handleGoogleCallback: () => boolean
  forgotPassword: (email: string) => Promise<void>
  loadMe: () => Promise<void>
  hydrateFromApi: () => Promise<void>
}

const STORAGE_KEY = 'livorapulse-auth-v1'
const TOKEN_KEY = 'lp_access_token'
const APP_STORE_KEY = 'livorapulse-store-v1'

function clearAppStore() {
  localStorage.removeItem(APP_STORE_KEY)
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      onboardingComplete: false,
      status: 'idle',
      lastAssessmentAt: null,

      setToken: (token) => {
        if (token) localStorage.setItem(TOKEN_KEY, token)
        else localStorage.removeItem(TOKEN_KEY)
        set({ accessToken: token, isAuthenticated: token !== null })
      },

      setOnboardingComplete: (val) => set({ onboardingComplete: val }),

      logout: () => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(STORAGE_KEY)
        clearAppStore()
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
          onboardingComplete: false,
          status: 'idle',
        })
        window.location.href = '/login'
      },

      setLastAssessmentAt: (ts) => set({ lastAssessmentAt: ts }),
      hydrateFromApi: async () => {},

      loginWithGoogle: () => {
        const apiBase = import.meta.env.VITE_API_URL ?? ''
        window.location.href = `${apiBase}/api/auth/google`
      },

      handleGoogleCallback: () => {
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')
        const error = params.get('error')

        if (error) {
          window.history.replaceState({}, '', window.location.pathname)
          return false
        }
        if (!token) return false

        get().setToken(token)
        window.history.replaceState({}, '', '/dashboard')
        get().loadMe().catch(() => null)
        return true
      },

      register: async ({ name, email, password }) => {
        set({ status: 'loading' })
        clearAppStore()
        try {
          const res = await apiPost<{
            success: boolean
            accessToken: string
            refreshToken: string
            user: AuthUser
          }>('/api/auth/register', { name, email, password }, false)
          get().setToken(res.accessToken)
          set({ user: res.user, status: 'idle', isAuthenticated: true, onboardingComplete: false })
          // Load full profile immediately after register
          get().loadMe().catch(() => null)
        } catch (e) {
          set({ status: 'idle' })
          throw e
        }
      },

      login: async ({ email, password }) => {
        set({ status: 'loading' })
        clearAppStore()
        try {
          const res = await apiPost<{
            success: boolean
            accessToken: string
            refreshToken: string
            user: AuthUser
          }>('/api/auth/login', { email, password }, false)
          get().setToken(res.accessToken)
          const onboardingComplete = res.user.profile?.onboardingComplete ?? false
          set({ user: res.user, status: 'idle', isAuthenticated: true, onboardingComplete })
          // Load full profile (includes gender, goals etc.) immediately after login
          get().loadMe().catch(() => null)
        } catch (e) {
          set({ status: 'idle' })
          throw e
        }
      },

      forgotPassword: async (email) => {
        set({ status: 'loading' })
        try {
          await apiPost('/api/auth/forgot-password', { email }, false)
          set({ status: 'idle' })
        } catch (e) {
          set({ status: 'idle' })
          throw e
        }
      },

      loadMe: async () => {
        if (!get().accessToken && !localStorage.getItem(TOKEN_KEY)) return
        set({ status: 'loading' })
        try {
          const res = await apiGet<{ success: boolean; data: AuthUser }>('/api/auth/me')
          const onboardingComplete = res.data.profile?.onboardingComplete ?? false
          set({ user: res.data, status: 'idle', isAuthenticated: true, onboardingComplete })
        } catch {
          get().logout()
          set({ status: 'idle' })
        }
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        accessToken: s.accessToken,
        user: s.user,
        isAuthenticated: s.isAuthenticated,
        onboardingComplete: s.onboardingComplete,
        lastAssessmentAt: s.lastAssessmentAt,
      }),
    },
  ),
)