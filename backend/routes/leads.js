const express = require('express')

const { auth } = require('../middleware/auth')
const { failure, success } = require('../utils/respond')

const router = express.Router()

const mockLeads = [
  {
    _id: 'lead_1',
    name: 'Rahul Sharma',
    status: 'negotiation',
    leadType: 'buyer',
    followUpDate: new Date(),
    location: 'Mohan Garden'
  }
]

router.use(auth)

router.get('/', (req, res) => {
  return success(res, mockLeads, 'Leads fetched', {
    pagination: { page: 1, limit: 20, total: mockLeads.length, pages: 1 }
  })
})

router.post('/', (req, res) => {
  return success(res, req.body, 'Lead created')
})

router.patch('/:id', (req, res) => {
  const { followUpDate, status, note } = req.body

  if (status && status !== 'contacted' && !followUpDate) {
    return failure(res, 400, 'followUpDate is required before moving past contacted')
  }

  return success(
    res,
    {
      id: req.params.id,
      followUpDate,
      status,
      note
    },
    'Lead updated'
  )
})

router.put('/:id', (req, res) => {
  return success(res, { id: req.params.id, ...req.body }, 'Lead updated')
})

module.exports = router
