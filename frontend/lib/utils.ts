// lib/format.ts
export function formatRupees(amount?: number | null): string {
  if (!amount && amount !== 0) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date?: string | Date | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateShort(date?: string | Date | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+91 ${digits.slice(0,5)} ${digits.slice(5)}`
  if (digits.startsWith('91') && digits.length === 12) return `+91 ${digits.slice(2,7)} ${digits.slice(7)}`
  return phone
}

export function getFollowUpStatus(followUpDate?: string | null) {
  if (!followUpDate) return null
  const diffDays = Math.floor((new Date(followUpDate).getTime() - Date.now()) / 86400000)
  if (diffDays < 0)   return { label: `Overdue ${Math.abs(diffDays)}d`, color: 'red'   as const }
  if (diffDays === 0) return { label: 'Due today',                      color: 'amber' as const }
  if (diffDays <= 2)  return { label: `Due in ${diffDays}d`,            color: 'blue'  as const }
  return null
}

export function getPresetDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// lib/constants.ts
export const LEAD_SOURCES    = ['call','whatsapp','agent','walkin','website','referral'] as const
export const LEAD_STATUSES   = ['new','contacted','interested','visit','negotiation','bayana','papers','closed','lost'] as const
export const PROPERTY_TYPES  = ['residential','floor','office','rootFloor','fullBuilding','plot','commercial'] as const
export const CONFIGURATIONS  = ['1BHK','2BHK','3BHK','4BHK','villa','plot','NA'] as const
export const BLOCKS          = ['A','B','C','D','E','F','other'] as const
export const DEAL_TYPES      = ['brokerage','inflated','coInvestment'] as const
export const DEAL_STAGES     = ['negotiation','bayana','papers','closed','lost'] as const
export const PAYMENT_TYPES   = ['token','bayana','partPayment','fullPayment','commission'] as const
export const RISK_LEVELS     = ['low','medium','high'] as const

export const FOLLOWUP_PRESETS = [
  { label: 'Today',      days: 0  },
  { label: 'Tomorrow',   days: 1  },
  { label: '3 days',     days: 3  },
  { label: 'Next week',  days: 7  },
  { label: 'Next month', days: 30 },
] as const
