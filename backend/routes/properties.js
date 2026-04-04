const express  = require('express')
const Property = require('../models/Property')
const { auth } = require('../middleware/auth')
const { findMatchingBuyers } = require('../services/engines')

const router = express.Router()

// ─── GET /api/properties ──────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, ownershipStatus, dealType, block, propertyType, search } = req.query
    const filter = { isDeleted: false }

    if (ownershipStatus) filter.ownershipStatus = ownershipStatus
    if (dealType)        filter.dealType        = dealType
    if (block)           filter.block           = block
    if (propertyType)    filter.propertyType    = propertyType
    if (search) {
      filter.$or = [
        { title:    new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') },
      ]
    }

    const total      = await Property.countDocuments(filter)
    const properties = await Property.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('sellerId', 'name phone')
      .populate('sourceAgentId', 'name phone')

    res.json({
      success: true,
      data: properties,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// ─── POST /api/properties ─────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { title, location, propertyType, dealType } = req.body
    if (!title || !location || !propertyType || !dealType) {
      return res.status(400).json({
        success: false,
        error: 'title, location, propertyType and dealType are required',
        code: 400,
      })
    }
    const property = await Property.create(req.body)
    res.status(201).json({ success: true, data: property, message: 'Property added' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// ─── GET /api/properties/:id ──────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, isDeleted: false })
      .populate('sellerId', 'name phone status')
      .populate('sourceAgentId', 'name phone')
    if (!property) return res.status(404).json({ success: false, error: 'Property not found', code: 404 })
    res.json({ success: true, data: property })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// ─── GET /api/properties/:id/matches ─────────────────────────────────────────
router.get('/:id/matches', auth, async (req, res) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, isDeleted: false })
    if (!property) return res.status(404).json({ success: false, error: 'Property not found', code: 404 })

    const matches = await findMatchingBuyers(property)
    res.json({ success: true, data: { matches, count: matches.length } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// ─── PUT /api/properties/:id ──────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    if (!property) return res.status(404).json({ success: false, error: 'Property not found', code: 404 })
    res.json({ success: true, data: property })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// ─── DELETE /api/properties/:id ───────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const Deal = require('../models/Deal')
    const activeDeal = await Deal.findOne({
      propertyId: req.params.id,
      stage: { $nin: ['closed', 'lost'] },
      isDeleted: false,
    })
    if (activeDeal) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete property with active deals',
        code: 400,
      })
    }
    await Property.findOneAndUpdate({ _id: req.params.id }, { isDeleted: true, deletedAt: new Date() })
    res.json({ success: true, message: 'Property deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

module.exports = router
