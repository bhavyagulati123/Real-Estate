const today = new Date()

function shiftDate(days) {
  const value = new Date(today)
  value.setDate(value.getDate() + days)
  return value.toISOString()
}

export const mockLeads = [
  {
    _id: 'lead_1',
    name: 'Rahul Sharma',
    phone: '+919811111111',
    leadType: 'buyer',
    budget: 4800000,
    location: 'Mohan Garden',
    block: 'C',
    propertyType: 'floor',
    configuration: '2BHK',
    credibilityScore: 4,
    status: 'negotiation',
    followUpDate: shiftDate(-2)
  },
  {
    _id: 'lead_2',
    name: 'Anita Arora',
    phone: '+919822222222',
    leadType: 'seller',
    budget: 4200000,
    location: 'Mohan Garden',
    block: 'B',
    propertyType: 'floor',
    configuration: '2BHK',
    credibilityScore: 5,
    status: 'contacted',
    followUpDate: shiftDate(0)
  },
  {
    _id: 'lead_3',
    name: 'Deepak Bansal',
    phone: '+919833333333',
    leadType: 'buyer',
    budget: 6200000,
    location: 'Mohan Garden',
    block: 'D',
    propertyType: 'floor',
    configuration: '3BHK',
    credibilityScore: 3,
    status: 'visit',
    followUpDate: shiftDate(1)
  }
]

export const mockProperties = [
  {
    _id: 'property_1',
    title: '2BHK Floor, Block C, Mohan Garden',
    location: 'Mohan Garden',
    block: 'C',
    propertyType: 'floor',
    configuration: '2BHK',
    floorPrice: 4500000,
    listedPrice: 4800000,
    dealType: 'inflated',
    ownershipStatus: 'available'
  },
  {
    _id: 'property_2',
    title: '3BHK Builder Floor, Block D',
    location: 'Mohan Garden',
    block: 'D',
    propertyType: 'floor',
    configuration: '3BHK',
    floorPrice: 5800000,
    listedPrice: 6100000,
    dealType: 'brokerage',
    ownershipStatus: 'underNegotiation'
  }
]

export const mockDashboard = {
  overdue: mockLeads.filter((lead) => new Date(lead.followUpDate) < today),
  dueToday: mockLeads.filter((lead) => {
    const date = new Date(lead.followUpDate)
    return date.toDateString() === today.toDateString()
  }),
  upcoming: mockLeads.filter((lead) => {
    const diffDays = Math.floor((new Date(lead.followUpDate) - today) / 86400000)
    return diffDays > 0 && diffDays <= 2
  }),
  activeDeals: [
    { _id: 'deal_1', stage: 'negotiation', riskLevel: 'medium' },
    { _id: 'deal_2', stage: 'bayana', riskLevel: 'high' }
  ],
  stats: {
    totalActiveLeads: 24,
    dealsInNegotiation: 3,
    dealsAtBayana: 1,
    expectedCommissionThisMonth: 125000
  }
}
