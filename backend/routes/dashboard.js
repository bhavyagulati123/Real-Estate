const express    = require('express')
const Deal       = require('../models/Deal')
const { Investment, WealthEntry } = require('../models/index')
const { auth }   = require('../middleware/auth')
const { getFollowUpGroups } = require('../services/engines')

const router = express.Router()

// GET /api/dashboard
router.get('/', auth, async (req, res) => {
  try {
    const now        = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Run all queries in parallel for speed
    const [
      followUpGroups,
      activeDeals,
      investments,
      expectedCommission,
    ] = await Promise.all([
      getFollowUpGroups(),

      Deal.find({ stage: { $nin: ['closed', 'lost'] }, isDeleted: false })
        .sort({ riskLevel: -1, createdAt: -1 })
        .limit(10)
        .populate('propertyId', 'title location block')
        .populate('buyerLeadId',  'name phone')
        .populate('sellerLeadId', 'name phone'),

      Investment.find({ status: 'holding' })
        .select('purchasePrice myAmount targetSalePrice mySharePercent')
        .populate('propertyId', 'title location'),

      // Expected commission this month = sum of expectedCommission on deals closing this month
      Deal.aggregate([
        { $match: { stage: { $in: ['negotiation', 'bayana', 'papers'] }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$expectedCommission' } } },
      ]),
    ])

    // Deal stage counts
    const stageCounts = activeDeals.reduce((acc, d) => {
      acc[d.stage] = (acc[d.stage] || 0) + 1
      return acc
    }, {})

    // Investment holdings value
    const investmentsHoldingValue = investments.reduce((s, i) => s + (i.myAmount || 0), 0)

    res.json({
      success: true,
      data: {
        overdue:     followUpGroups.overdue,
        dueToday:    followUpGroups.dueToday,
        upcoming:    followUpGroups.upcoming,
        activeDeals,
        stats: {
          totalActiveLeads:             followUpGroups.overdue.length + followUpGroups.dueToday.length + followUpGroups.upcoming.length,
          overdueCount:                 followUpGroups.overdue.length,
          dealsInNegotiation:           stageCounts.negotiation || 0,
          dealsAtBayana:                stageCounts.bayana      || 0,
          dealsAtPapers:                stageCounts.papers      || 0,
          expectedCommissionThisMonth:  expectedCommission[0]?.total || 0,
          investmentsHolding:           investments.length,
          investmentsHoldingValue,
        },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

module.exports = router
