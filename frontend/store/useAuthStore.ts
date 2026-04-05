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
  user:       User | null
  isLoading:  boolean
  error:      string | null
  login:      (phone: string, password: string) => Promise<void>
  logout:     () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user:      null,
      isLoading: false,
      error:     null,

      login: async (phone, password) => {
        set({ isLoading: true, error: null })
        try {
          const res = await api.post<{ success: boolean; data: { user: User } }>(
            '/api/auth/login',
            { phone, password }
          )
          // Cookie is set by the backend (HTTP-only) — just store user for UI
          set({ user: res.data.user, isLoading: false })
        } catch (err: unknown) {
          set({ isLoading: false, error: err instanceof Error ? err.message : 'Login failed' })
          throw err
        }
      },

      logout: async () => {
        try { await api.post('/api/auth/logout', {}) } catch { /* ignore */ }
        set({ user: null })
        window.location.href = '/login'
      },

      clearError: () => set({ error: null }),
    }),
    {
      name:       'sk-auth',
      partialize: (s) => ({ user: s.user }),
    }
  )
)
