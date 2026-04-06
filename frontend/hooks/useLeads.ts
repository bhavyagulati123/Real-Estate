import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface InteractionEntry {
  _id:       string
  note:      string
  stage:     string
  createdAt: string
}

export interface Lead {
  _id:                string
  name:               string
  phone:              string
  alternatePhone?:    string
  source:             string
  leadType:           'buyer' | 'seller'
  budget?:            number
  location?:          string
  block?:             string
  propertyType?:      string
  configuration?:     string
  size?:              number
  buildingAge?:       string
  credibilityScore?:  number
  status:             string
  followUpDate?:      string
  followUpNotes?:     string
  interactionHistory: InteractionEntry[]
  notes?:             string
  createdAt:          string
  updatedAt:          string
}

interface ApiResponse<T> {
  success: boolean
  data:    T
  message?: string
  pagination?: { page: number; limit: number; total: number; pages: number }
}

interface LeadsFilter {
  page?:         number
  limit?:        number
  leadType?:     string
  status?:       string
  overdueOnly?:  boolean
  location?:     string
  block?:        string
  search?:       string
  propertyType?: string
}

// ─── READ ─────────────────────────────────────────────────────────────────────
export function useLeads(filters: LeadsFilter = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== false) params.set(k, String(v))
  })
  return useQuery({
    queryKey: queryKeys.leads(filters as Record<string, unknown>),
    queryFn:  () => api.get<ApiResponse<Lead[]>>(`/api/leads?${params}`),
  })
}

export function useLead(id: string) {
  return useQuery({
    queryKey: queryKeys.lead(id),
    queryFn:  () => api.get<ApiResponse<Lead>>(`/api/leads/${id}`),
    enabled:  !!id,
  })
}

// ─── WRITE ────────────────────────────────────────────────────────────────────
export function useAddLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Lead>) =>
      api.post<ApiResponse<Lead>>('/api/leads', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useUpdateLead(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { followUpDate?: string; status?: string; note?: string }) =>
      api.patch<ApiResponse<Lead>>(`/api/leads/${id}`, data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: queryKeys.lead(id) })
      const previous = qc.getQueryData(queryKeys.lead(id))
      qc.setQueryData(queryKeys.lead(id), (old: ApiResponse<Lead> | undefined) => {
        if (!old) return old
        return {
          ...old,
          data: {
            ...old.data,
            ...(data.followUpDate && { followUpDate: data.followUpDate }),
            ...(data.status       && { status:       data.status       }),
            ...(data.note && {
              interactionHistory: [
                { note: data.note, stage: data.status || old.data.status, createdAt: new Date().toISOString(), _id: 'temp' },
                ...(old.data.interactionHistory || []),
              ],
            }),
          },
        }
      })
      return { previous }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.lead(id), ctx.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.lead(id) })
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useEditLead(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Lead>) =>
      api.put<ApiResponse<Lead>>(`/api/leads/${id}`, data),
    onSuccess: (res) => {
      qc.setQueryData(queryKeys.lead(id), res)
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

export function useDeleteLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<ApiResponse<null>>(`/api/leads/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}
