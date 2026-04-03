const LEAD_SOURCES = ['call', 'whatsapp', 'agent', 'walkin', 'website', 'referral']
const LEAD_STATUSES = ['new', 'contacted', 'interested', 'visit', 'negotiation', 'bayana', 'papers', 'closed', 'lost']
const PROPERTY_TYPES = ['residential', 'floor', 'office', 'rootFloor', 'fullBuilding', 'plot', 'commercial']
const CONFIGURATIONS = ['1BHK', '2BHK', '3BHK', '4BHK', 'villa', 'plot', 'NA']
const BLOCKS = ['A', 'B', 'C', 'D', 'E', 'F', 'other']
const DEAL_TYPES = ['brokerage', 'inflated', 'coInvestment']
const DEAL_STAGES = ['negotiation', 'bayana', 'papers', 'closed', 'lost']
const PAYMENT_TYPES = ['token', 'bayana', 'partPayment', 'fullPayment', 'commission']
const OWNERSHIP_STATUS = ['available', 'underNegotiation', 'sold', 'ownerOwned']
const RISK_LEVELS = ['low', 'medium', 'high']
const WEALTH_CATEGORIES = ['commission', 'margin', 'investmentProfit', 'officeExpense', 'travelExpense', 'agentPayout', 'other']

module.exports = {
  BLOCKS,
  CONFIGURATIONS,
  DEAL_STAGES,
  DEAL_TYPES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  OWNERSHIP_STATUS,
  PAYMENT_TYPES,
  PROPERTY_TYPES,
  RISK_LEVELS,
  WEALTH_CATEGORIES
}
