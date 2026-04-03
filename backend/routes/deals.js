const express = require('express')

const { auth } = require('../middleware/auth')
const { buildCommissionWealthEntry } = require('../services/wealthTrigger')
const { failure, success } = require('../utils/respond')

const router = express.Router()

router.use(auth)

router.get('/', (req, res) => {
  return success(res, [], 'Deals fetched', {
    pagination: { page: 1, limit: 20, total: 0, pages: 0 }
  })
})

router.post('/', (req, res) => {
  return success(res, req.body, 'Deal created')
})

router.put('/:id/stage', (req, res) => {
  const { stage, lostReason } = req.body

  if (stage === 'lost' && !lostReason) {
    return failure(res, 400, 'lostReason is required when moving a deal to lost')
  }

  return success(res, { id: req.params.id, stage, lostReason }, 'Deal stage updated')
})

router.post('/:id/payments', (req, res) => {
  return success(res, { id: req.params.id, payment: req.body }, 'Payment added')
})

router.put('/:id/payments/:paymentId/verify', (req, res) => {
  const wealthEntry = buildCommissionWealthEntry({
    dealId: req.params.id,
    amount: req.body.amount || 0,
    description: req.body.description || 'Commission payment verified',
    date: new Date()
  })

  return success(
    res,
    {
      id: req.params.id,
      paymentId: req.params.paymentId,
      verified: true,
      wealthEntry
    },
    'Payment verified'
  )
})

module.exports = router
