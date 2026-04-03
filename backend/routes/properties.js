const express = require('express')

const { auth } = require('../middleware/auth')
const { buildMatchingQuery } = require('../services/matchingEngine')
const { success } = require('../utils/respond')

const router = express.Router()

const mockProperties = [
  {
    _id: 'property_1',
    title: '2BHK Floor, Block C, Mohan Garden',
    location: 'Mohan Garden',
    block: 'C',
    propertyType: 'floor',
    configuration: '2BHK',
    floorPrice: 4500000,
    dealType: 'inflated',
    ownershipStatus: 'available'
  }
]

router.use(auth)

router.get('/', (req, res) => {
  return success(res, mockProperties, 'Properties fetched', {
    pagination: { page: 1, limit: 20, total: mockProperties.length, pages: 1 }
  })
})

router.post('/', (req, res) => {
  return success(res, req.body, 'Property created')
})

router.put('/:id', (req, res) => {
  return success(res, { id: req.params.id, ...req.body }, 'Property updated')
})

router.get('/:id/matches', (req, res) => {
  const property = mockProperties[0]
  const query = buildMatchingQuery(property)

  return success(res, { propertyId: req.params.id, query }, 'Matching buyers prepared')
})

module.exports = router
