const Lead = require('../models/Lead')

// ─── MATCHING ENGINE ──────────────────────────────────────────────────────────
// Find buyer leads that match a given property
async function findMatchingBuyers(property) {
  const query = {
    leadType: 'buyer',
    status: { $nin: ['closed', 'lost'] },
    isDeleted: false,
    location: property.location,
    propertyType: property.propertyType,
  }

  // Budget: buyer's max budget >= 90% of floor price
  if (property.floorPrice) {
    query.budget = { $gte: property.floorPrice * 0.9 }
  }

  // Configuration match for residential only
  if (property.configuration && property.configuration !== 'NA') {
    query.configuration = property.configuration
  }

  // Block: match buyer's preferred block OR buyer has no block preference
  if (property.block) {
    query.$or = [
      { block: property.block },
      { block: { $exists: false } },
      { block: null },
    ]
  }

  return Lead.find(query)
    .sort({ credibilityScore: -1 }) // highest credibility first
    .limit(10)
}

// ─── FOLLOW-UP ENGINE ─────────────────────────────────────────────────────────
// Returns leads grouped by urgency for the dashboard
async function getFollowUpGroups() {
  const now = new Date()

  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const twoDaysOut = new Date(todayEnd.getTime() + 2 * 24 * 60 * 60 * 1000)

  const baseQuery = { status: { $nin: ['closed', 'lost'] }, isDeleted: false }

  const [overdue, dueToday, upcoming] = await Promise.all([
    Lead.find({ ...baseQuery, followUpDate: { $lt: todayStart } })
      .sort({ followUpDate: 1 }),

    Lead.find({ ...baseQuery, followUpDate: { $gte: todayStart, $lte: todayEnd } })
      .sort({ followUpDate: 1 }),

    Lead.find({ ...baseQuery, followUpDate: { $gt: todayEnd, $lte: twoDaysOut } })
      .sort({ followUpDate: 1 }),

  ])

  return { overdue, dueToday, upcoming }
}

module.exports = { findMatchingBuyers, getFollowUpGroups }
