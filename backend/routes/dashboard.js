const express = require('express')

const { auth } = require('../middleware/auth')
const { splitFollowUps } = require('../services/followUpEngine')
const { success } = require('../utils/respond')

const router = express.Router()

router.use(auth)

router.get('/', (req, res) => {
  const leads = [
    { _id: 'lead_1', name: 'Rahul Sharma', followUpDate: new Date(Date.now() - 86400000 * 2) },
    { _id: 'lead_2', name: 'Anita Arora', followUpDate: new Date() },
    { _id: 'lead_3', name: 'Deepak Bansal', followUpDate: new Date(Date.now() + 86400000) }
  ]

  const buckets = splitFollowUps(leads)

  return success(
    res,
    {
      ...buckets,
      activeDeals: [],
      stats: {
        totalActiveLeads: 24,
        dealsInNegotiation: 3,
        dealsAtBayana: 1,
        expectedCommissionThisMonth: 125000
      }
    },
    'Dashboard fetched'
  )
})

module.exports = router
