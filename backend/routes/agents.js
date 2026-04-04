const express = require('express')
const { Agent } = require('../models/index')
const { auth }  = require('../middleware/auth')

const router = express.Router()

// GET /api/agents
router.get('/', auth, async (req, res) => {
  try {
    const filter = {}
    if (req.query.type) filter.type = req.query.type

    const agents = await Agent.find(filter).sort({ totalDeals: -1 })
    res.json({ success: true, data: agents })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// GET /api/agents/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id)
    if (!agent) return res.status(404).json({ success: false, error: 'Agent not found', code: 404 })
    res.json({ success: true, data: agent })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// POST /api/agents
router.post('/', auth, async (req, res) => {
  try {
    const { name, type } = req.body
    if (!name || !type) {
      return res.status(400).json({ success: false, error: 'name and type are required', code: 400 })
    }
    const agent = await Agent.create(req.body)
    res.status(201).json({ success: true, data: agent, message: 'Agent added' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// PUT /api/agents/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const agent = await Agent.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!agent) return res.status(404).json({ success: false, error: 'Agent not found', code: 404 })
    res.json({ success: true, data: agent })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

module.exports = router
