const express = require('express')
const { WealthEntry } = require('../models/index')
const { auth } = require('../middleware/auth')

const router = express.Router()

// GET /api/wealth
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, from, to } = req.query
    const filter = {}

    if (type)     filter.type     = type
    if (category) filter.category = category
    if (from || to) {
      filter.date = {}
      if (from) filter.date.$gte = new Date(from)
      if (to)   filter.date.$lte = new Date(to)
    }

    const total   = await WealthEntry.countDocuments(filter)
    const entries = await WealthEntry.find(filter)
      .sort({ date: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('dealId', 'agreedPrice dealType')

    // Summary for filtered range
    const allInRange = await WealthEntry.find(filter).select('type amount')
    const totalIncome  = allInRange.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0)
    const totalExpense = allInRange.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)

    res.json({
      success: true,
      data: {
        entries,
        summary: { totalIncome, totalExpense, net: totalIncome - totalExpense },
      },
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// POST /api/wealth  (manual entry)
router.post('/', auth, async (req, res) => {
  try {
    const { type, category, amount, date } = req.body
    if (!type || !amount || !date) {
      return res.status(400).json({ success: false, error: 'type, amount and date are required', code: 400 })
    }
    const entry = await WealthEntry.create(req.body)
    res.status(201).json({ success: true, data: entry })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

module.exports = router
