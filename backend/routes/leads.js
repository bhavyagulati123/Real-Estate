const express = require('express')
const Lead    = require('../models/Lead')
const { auth } = require('../middleware/auth')

const router = express.Router()

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function paginate(query, page, limit) {
  return query.skip((page - 1) * limit).limit(limit)
}

// ─── GET /api/leads ───────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1, limit = 20,
      leadType, status, overdueOnly,
      location, block, search,
      propertyType, configuration,
    } = req.query

    const filter = { isDeleted: false }

    if (leadType)     filter.leadType     = leadType
    if (status)       filter.status       = status
    if (location)     filter.location     = new RegExp(location, 'i')
    if (block)        filter.block        = block
    if (propertyType) filter.propertyType = propertyType
    if (configuration)filter.configuration= configuration

    if (overdueOnly === 'true') {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      filter.followUpDate = { $lt: todayStart }
      filter.status = { $nin: ['closed', 'lost'] }
    }

    if (search) {
      filter.$or = [
        { name:  new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ]
    }

    const total = await Lead.countDocuments(filter)
    const leads = await paginate(
      Lead.find(filter).sort({ followUpDate: 1, createdAt: -1 }),
      Number(page), Number(limit)
    )

    res.json({
      success: true,
      data: leads,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// ─── POST /api/leads ──────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { name, phone, leadType, source } = req.body
    if (!name || !phone || !leadType || !source) {
      return res.status(400).json({ success: false, error: 'name, phone, leadType and source are required', code: 400 })
    }

    // Default followUpDate to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)

    const lead = await Lead.create({
      ...req.body,
      followUpDate: req.body.followUpDate || tomorrow,
    })

    res.status(201).json({ success: true, data: lead, message: 'Lead added' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// ─── GET /api/leads/:id ───────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, isDeleted: false })
          if (!lead) return res.status(404).json({ success: false, error: 'Lead not found', code: 404 })
    res.json({ success: true, data: lead })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// ─── PATCH /api/leads/:id ─────────────────────────────────────────────────────
// Quick update: followUpDate + status + note (lead card interaction)
router.patch('/:id', auth, async (req, res) => {
  try {
    const { followUpDate, status, note } = req.body
    const lead = await Lead.findOne({ _id: req.params.id, isDeleted: false })
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found', code: 404 })

    if (followUpDate) lead.followUpDate = new Date(followUpDate)
    if (status)       lead.status       = status

    if (note && note.trim()) {
      lead.interactionHistory.unshift({
        note:      note.trim(),
        stage:     status || lead.status,
        createdAt: new Date(),
      })
    }

    await lead.save()
    res.json({ success: true, data: lead, message: 'Lead updated' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// ─── PUT /api/leads/:id ───────────────────────────────────────────────────────
// Full edit from lead edit form
router.put('/:id', auth, async (req, res) => {
  try {
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found', code: 404 })
    res.json({ success: true, data: lead, message: 'Lead updated' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// ─── DELETE /api/leads/:id ────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check for active deals
    const Deal = require('../models/Deal')
    const activeDeal = await Deal.findOne({
      $or: [{ buyerLeadId: req.params.id }, { sellerLeadId: req.params.id }],
      stage: { $nin: ['closed', 'lost'] },
      isDeleted: false,
    })
    if (activeDeal) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete lead with active deals. Mark deal as lost first.',
        code: 400,
      })
    }

    await Lead.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: true, deletedAt: new Date() }
    )
    res.json({ success: true, message: 'Lead deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

module.exports = router
