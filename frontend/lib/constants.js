export const LEAD_SOURCES = ['call', 'whatsapp', 'agent', 'walkin', 'website', 'referral']

export const LEAD_TYPES = ['buyer', 'seller']

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'interested',
  'visit',
  'negotiation',
  'bayana',
  'papers',
  'closed',
  'lost'
]

export const PROPERTY_TYPES = [
  'residential',
  'floor',
  'office',
  'rootFloor',
  'fullBuilding',
  'plot',
  'commercial'
]

export const CONFIGURATIONS = ['1BHK', '2BHK', '3BHK', '4BHK', 'villa', 'plot', 'NA']

export const BLOCKS = ['A', 'B', 'C', 'D', 'E', 'F', 'other']

export const DEAL_TYPES = ['brokerage', 'inflated', 'coInvestment']

export const DEAL_STAGES = ['negotiation', 'bayana', 'papers', 'closed', 'lost']

export const PAYMENT_TYPES = ['token', 'bayana', 'partPayment', 'fullPayment', 'commission']

export const OWNERSHIP_STATUS = ['available', 'underNegotiation', 'sold', 'ownerOwned']

export const FOLLOWUP_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: '3 days', days: 3 },
  { label: 'Next week', days: 7 },
  { label: 'Next month', days: 30 }
]
