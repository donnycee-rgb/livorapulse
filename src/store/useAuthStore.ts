import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiGet, apiPost } from '../api/client'

export type AuthUser = {
  id: string
  name: string
  email: string
  avatarInitials: string
  preferences?: {
    theme: 'light' | 'dark'
    units: 'metric' | 'imperial'
    notificationsEnabled: boolean
    focusMode: boolean
  } | null
}

type AuthState = {
  accessToken: string | null
  user: AuthUser | null
  status: 'idle' | 'loading'

  setToken: (token: string | null) => void
  logout: () => void

  register: (input: { name: string; email: string; password: string }) => Promise<void>
  login: (input: { email: string; password: string }) => Promise<void>
  loadMe: () => Promise<void>
}

const STORAGE_KEY = 'livorapulse-auth-v1'
const TOKEN_KEY = 'lp_access_token'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      status: 'idle',

      setToken: (token) => {
        if (token) localStorage.setItem(TOKEN_KEY, token)
        else localStorage.removeItem(TOKEN_KEY)
        set({ accessToken: token })
      },

      logout: () => {
        localStorage.removeItem(TOKEN_KEY)
        set({ accessToken: null, user: null, status: 'idle' })
      },

      register: async ({ name, email, password }) => {
        set({ status: 'loading' })
        try {
          const res = await apiPost<{ accessToken: string; user: AuthUser }>(
            '/api/auth/register',
            { name, email, password },
            false,
          )
          get().setToken(res.accessToken)
          set({ user: res.user, status: 'idle' })
        } catch (e) {
          set({ status: 'idle' })
          throw e
        }
      },

      login: async ({ email, password }) => {
        set({ status: 'loading' })
        try {
          const res = await apiPost<{ accessToken: string; user: AuthUser }>(
            '/api/auth/login',
            { email, password },
            false,
          )
          get().setToken(res.accessToken)
          set({ user: res.user, status: 'idle' })
        } catch (e) {
          set({ status: 'idle' })
          throw e
        }
      },

      loadMe: async () => {
        if (!get().accessToken && !localStorage.getItem(TOKEN_KEY)) return
        set({ status: 'loading' })
        try {
          const res = await apiGet<{ user: AuthUser }>('/api/auth/me')
          set({ user: res.user, status: 'idle' })
        } catch (e) {
          get().logout()
          set({ status: 'idle' })
          throw e
        }
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({ accessToken: s.accessToken, user: s.user }),
    },
  ),
)
