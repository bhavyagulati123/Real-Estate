'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'

interface User {
  _id:   string
  name:  string
  role:  string
  phone: string
}

interface AuthStore {
  user:          User | null
  token:         string | null
  refreshToken:  string | null
  isLoading:     boolean
  error:         string | null
  login:   (phone: string, password: string) => Promise<void>
  logout:  () => void
  clearError: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user:         null,
      token:        null,
      refreshToken: null,
      isLoading:    false,
      error:        null,

      login: async (phone, password) => {
        set({ isLoading: true, error: null })
        try {
          const res = await api.post<{ success: boolean; data: { token: string; refreshToken: string; user: User } }>(
            '/api/auth/login',
            { phone, password }
          )
          const { token, refreshToken, user } = res.data
          localStorage.setItem('sk_token', token)
          localStorage.setItem('sk_refresh_token', refreshToken)
          set({ user, token, refreshToken, isLoading: false })
        } catch (err: unknown) {
          set({ isLoading: false, error: err instanceof Error ? err.message : 'Login failed' })
          throw err
        }
      },

      logout: () => {
        localStorage.removeItem('sk_token')
        localStorage.removeItem('sk_refresh_token')
        set({ user: null, token: null, refreshToken: null })
        window.location.href = '/login'
      },

      clearError: () => set({ error: null }),
    }),
    {
      name:    'sk-auth',
      partialize: (s) => ({ user: s.user, token: s.token, refreshToken: s.refreshToken }),
    }
  )
)
