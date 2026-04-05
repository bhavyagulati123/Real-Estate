import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { Lead } from './useLeads'

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface Property {
  _id:                 string
  title:               string
  location:            string
  block?:              string
  propertyType:        string
  configuration?:      string
  size?:               number
  buildingAge?:        string
  buildingCredibility?:number
  floorPrice?:         number
  askingPrice?:        number
  listedPrice?:        number
  dealType:            'brokerage' | 'inflated' | 'coInvestment'
  ownershipStatus:     string
  sellerId?:           { _id: string; name: string; phone: string } | null
  sourceAgentId?:      { _id: string; name: string } | null
  images?:             string[]
  notes?:              string
  createdAt:           string
}

export interface Payment {
  _id:        string
  type:       string
  amount:     number
  date:       string
  paidBy?:    string
  receivedBy?:string
  notes?:     string
  verified:   boolean
}

export interface Deal {
  _id:                  string
  propertyId:           Property | string
  buyerLeadId:          Lead | string
  sellerLeadId:         Lead | string
  dealType:             string
  stage:                string
  stageHistory:         { stage: string; date: string; notes?: string }[]
  bayanaDate?:          string
  papersDate?:          string
  closedDate?:          string
  lostDate?:            string
  lostReason?:          string
  agreedPrice:          number
  floorPrice?:          number
  margin?:              number
  commissionRate?:      number
  expectedCommission?:  number
  actualCommission?:    number
  payments:             Payment[]
  totalPaid:            number
  remainingAmount?:     number
  buyerAgentId?:        { _id: string; name: string } | null
  sellerAgentId?:       { _id: string; name: string } | null
  commissionSplitPercent?: number
  riskLevel:            string
  riskNotes?:           string
  notes?:               string
  createdAt:            string
}

export interface Agent {
  _id:             string
  name:            string
  phone?:          string
  type:            'internal' | 'external'
  totalDeals:      number
  totalCommission: number
  notes?:          string
}

export interface Investment {
  _id:             string
  propertyId:      Property | string
  purchasePrice:   number
  purchaseDate:    string
  mySharePercent:  number
  myAmount:        number
  coInvestors:     { name: string; phone?: string; amountInvested: number; sharePercent: number }[]
  holdingCosts:    number
  targetSalePrice?:number
  actualSalePrice?:number
  myProfit?:       number
  status:          'holding' | 'sold'
  saleDate?:       string
  notes?:          string
}

interface ApiRes<T> {
  success: boolean; data: T; message?: string
  pagination?: { page: number; limit: number; total: number; pages: number }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROPERTIES
// ═══════════════════════════════════════════════════════════════════════════════
export function useProperties(filters: Record<string, unknown> = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)) })
  return useQuery({
    queryKey: queryKeys.properties(filters),
    queryFn:  () => api.get<ApiRes<Property[]>>(`/api/properties?${params}`),
  })
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: queryKeys.property(id),
    queryFn:  () => api.get<ApiRes<Property>>(`/api/properties/${id}`),
    enabled:  !!id,
  })
}

export function usePropertyMatches(id: string) {
  return useQuery({
    queryKey: queryKeys.propertyMatches(id),
    queryFn:  () => api.get<ApiRes<{ matches: Lead[]; count: number }>>(`/api/properties/${id}/matches`),
    enabled:  !!id,
  })
}

export function useAddProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: Partial<Property>) => api.post<ApiRes<Property>>('/api/properties', d),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['properties'] })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useEditProperty(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: Partial<Property>) => api.put<ApiRes<Property>>(`/api/properties/${id}`, d),
    onSuccess:  (res) => {
      qc.setQueryData(queryKeys.property(id), res)
      qc.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEALS
// ═══════════════════════════════════════════════════════════════════════════════
export function useDeals(filters: Record<string, unknown> = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)) })
  return useQuery({
    queryKey: queryKeys.deals(filters),
    queryFn:  () => api.get<ApiRes<Deal[]>>(`/api/deals?${params}`),
  })
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: queryKeys.deal(id),
    queryFn:  () => api.get<ApiRes<Deal>>(`/api/deals/${id}`),
    enabled:  !!id,
  })
}

export function useCreateDeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: unknown) => api.post<ApiRes<Deal>>('/api/deals', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] })
      qc.invalidateQueries({ queryKey: ['properties'] })
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useAddPayment(dealId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: unknown) => api.post<ApiRes<Deal>>(`/api/deals/${dealId}/payments`, p),
    onSuccess: (res) => {
      qc.setQueryData(queryKeys.deal(dealId), res)
      qc.invalidateQueries({ queryKey: ['deals'] })
      qc.invalidateQueries({ queryKey: ['wealth'] })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useAdvanceDealStage(dealId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: { stage: string; notes?: string }) =>
      api.put<ApiRes<Deal>>(`/api/deals/${dealId}/stage`, d),
    onSuccess: (res) => {
      qc.setQueryData(queryKeys.deal(dealId), res)
      qc.invalidateQueries({ queryKey: ['deals'] })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useCloseDeal(dealId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: { closedDate?: string }) =>
      api.put<ApiRes<Deal>>(`/api/deals/${dealId}/close`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] })
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['properties'] })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useLostDeal(dealId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: { lostReason: string }) =>
      api.put<ApiRes<Deal>>(`/api/deals/${dealId}/lost`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] })
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['properties'] })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENTS
// ═══════════════════════════════════════════════════════════════════════════════
export function useAgents(type?: 'internal' | 'external') {
  const url = type ? `/api/agents?type=${type}` : '/api/agents'
  return useQuery({
    queryKey: type ? [...queryKeys.agents, type] : queryKeys.agents,
    queryFn:  () => api.get<ApiRes<Agent[]>>(url),
    staleTime: 1000 * 60 * 10,
  })
}

export function useAddAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: { name: string; phone?: string; type: 'internal' | 'external'; notes?: string }) =>
      api.post<ApiRes<Agent>>('/api/agents', d),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.agents }),
  })
}

export function useEditAgent(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: Partial<Agent>) => api.put<ApiRes<Agent>>(`/api/agents/${id}`, d),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.agents }),
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVESTMENTS
// ═══════════════════════════════════════════════════════════════════════════════
export function useInvestment(id: string) {
  return useQuery({
    queryKey: queryKeys.investment(id),
    queryFn:  () => api.get<ApiRes<Investment>>(`/api/investments/${id}`),
    enabled:  !!id,
  })
}

export function useInvestments(filters: Record<string, unknown> = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)) })
  return useQuery({
    queryKey: queryKeys.investments(filters),
    queryFn:  () => api.get<ApiRes<Investment[]>>(`/api/investments?${params}`),
  })
}

export function useAddInvestment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: unknown) => api.post<ApiRes<Investment>>('/api/investments', d),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['investments'] })
      qc.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

export function useSellInvestment(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: { actualSalePrice: number; saleDate?: string }) =>
      api.put<ApiRes<unknown>>(`/api/investments/${id}/sell`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments'] })
      qc.invalidateQueries({ queryKey: ['properties'] })
      qc.invalidateQueries({ queryKey: ['wealth'] })
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export interface DashboardData {
  overdue:     Lead[]
  dueToday:    Lead[]
  upcoming:    Lead[]
  activeDeals: Deal[]
  stats: {
    totalActiveLeads:            number
    overdueCount:                number
    dealsInNegotiation:          number
    dealsAtBayana:               number
    dealsAtPapers:               number
    expectedCommissionThisMonth: number
    investmentsHolding:          number
    investmentsHoldingValue:     number
  }
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn:  () => api.get<ApiRes<DashboardData>>('/api/dashboard'),
    refetchInterval: 1000 * 60 * 5,
  })
}
