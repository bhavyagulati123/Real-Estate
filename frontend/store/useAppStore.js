import { create } from 'zustand'

export const useAppStore = create((set) => ({
  authUser: null,
  filters: {
    leadStatus: 'all',
    propertyType: 'all'
  },
  setAuthUser: (authUser) => set({ authUser }),
  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value
      }
    }))
}))
