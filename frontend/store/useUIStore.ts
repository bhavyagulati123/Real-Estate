'use client'
import { create } from 'zustand'

interface LeadsFilter {
  leadType?: 'buyer' | 'seller'
  status?: string
  overdueOnly?: boolean
  search?: string
  block?: string
}

interface PropertiesFilter {
  ownershipStatus?: string
  dealType?: string
  block?: string
  search?: string
}

interface UIStore {
  // ── Sheets / modals ──────────────────────────────────────────────────────
  addLeadOpen: boolean
  openAddLead:  () => void
  closeAddLead: () => void

  editLeadId: string | null
  openEditLead:  (id: string) => void
  closeEditLead: () => void

  addPropertyOpen: boolean
  openAddProperty:  () => void
  closeAddProperty: () => void

  editPropertyId: string | null
  openEditProperty:  (id: string) => void
  closeEditProperty: () => void

  addDealOpen:        boolean
  addDealPropertyId:  string | null
  addDealBuyerLeadId: string | null
  openAddDeal:  (propertyId?: string, buyerLeadId?: string) => void
  closeAddDeal: () => void

  addAgentOpen: boolean
  openAddAgent:  () => void
  closeAddAgent: () => void

  addPaymentDealId: string | null
  openAddPayment:  (dealId: string) => void
  closeAddPayment: () => void

  // ── Filters ───────────────────────────────────────────────────────────────
  leadsFilter: LeadsFilter
  setLeadsFilter:   (f: Partial<LeadsFilter>) => void
  resetLeadsFilter: () => void

  propertiesFilter: PropertiesFilter
  setPropertiesFilter: (f: Partial<PropertiesFilter>) => void
}

export const useUIStore = create<UIStore>((set) => ({
  // Add Lead
  addLeadOpen:  false,
  openAddLead:  () => set({ addLeadOpen: true }),
  closeAddLead: () => set({ addLeadOpen: false }),

  // Edit Lead
  editLeadId:    null,
  openEditLead:  (id) => set({ editLeadId: id }),
  closeEditLead: () => set({ editLeadId: null }),

  // Add Property
  addPropertyOpen:  false,
  openAddProperty:  () => set({ addPropertyOpen: true }),
  closeAddProperty: () => set({ addPropertyOpen: false }),

  // Edit Property
  editPropertyId:    null,
  openEditProperty:  (id) => set({ editPropertyId: id }),
  closeEditProperty: () => set({ editPropertyId: null }),

  // Add Deal
  addDealOpen:        false,
  addDealPropertyId:  null,
  addDealBuyerLeadId: null,
  openAddDeal: (propertyId, buyerLeadId) => set({
    addDealOpen: true,
    addDealPropertyId:  propertyId  || null,
    addDealBuyerLeadId: buyerLeadId || null,
  }),
  closeAddDeal: () => set({ addDealOpen: false, addDealPropertyId: null, addDealBuyerLeadId: null }),

  // Add Agent
  addAgentOpen:  false,
  openAddAgent:  () => set({ addAgentOpen: true }),
  closeAddAgent: () => set({ addAgentOpen: false }),

  // Add Payment
  addPaymentDealId: null,
  openAddPayment:   (dealId) => set({ addPaymentDealId: dealId }),
  closeAddPayment:  () => set({ addPaymentDealId: null }),

  // Leads filter
  leadsFilter: {},
  setLeadsFilter:   (f) => set((s) => ({ leadsFilter: { ...s.leadsFilter, ...f } })),
  resetLeadsFilter: () => set({ leadsFilter: {} }),

  // Properties filter
  propertiesFilter: {},
  setPropertiesFilter: (f) => set((s) => ({ propertiesFilter: { ...s.propertiesFilter, ...f } })),
}))
