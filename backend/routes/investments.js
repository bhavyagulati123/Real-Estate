const express = require('express')

const { auth } = require('../middleware/auth')
const { success } = require('../utils/respond')

const router = express.Router()

router.use(auth)

router.post('/', (req, res) => {
  return success(res, req.body, 'Investment created')
})

router.put('/:id', (req, res) => {
  return success(res, { id: req.params.id, ...req.body }, 'Investment updated')
})

router.put('/:id/sell', (req, res) => {
  return success(res, { id: req.params.id, ...req.body, status: 'sold' }, 'Investment marked sold')
})

module.exports = router
