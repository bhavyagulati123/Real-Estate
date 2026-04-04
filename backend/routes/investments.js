const express    = require('express')
const { Investment, WealthEntry } = require('../models/index')
const Property   = require('../models/Property')
const { auth }   = require('../middleware/auth')

const router = express.Router()

// GET /api/investments
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const filter = {}
    if (status) filter.status = status

    const total       = await Investment.countDocuments(filter)
    const investments = await Investment.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('propertyId', 'title location block ownershipStatus')

    res.json({
      success: true,
      data: investments,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// GET /api/investments/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id).populate('propertyId')
    if (!investment) return res.status(404).json({ success: false, error: 'Investment not found', code: 404 })
    res.json({ success: true, data: investment })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// POST /api/investments
router.post('/', auth, async (req, res) => {
  try {
    const { propertyId, purchasePrice, purchaseDate, mySharePercent } = req.body
    if (!propertyId || !purchasePrice || !purchaseDate || !mySharePercent) {
      return res.status(400).json({
        success: false,
        error: 'propertyId, purchasePrice, purchaseDate and mySharePercent are required',
        code: 400,
      })
    }

    const investment = await Investment.create(req.body)
    // Mark property as owner-owned
    await Property.findByIdAndUpdate(propertyId, { ownershipStatus: 'ownerOwned' })

    const populated = await Investment.findById(investment._id).populate('propertyId', 'title location')
    res.status(201).json({ success: true, data: populated, message: 'Investment recorded' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// PUT /api/investments/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const investment = await Investment.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('propertyId', 'title location')
    if (!investment) return res.status(404).json({ success: false, error: 'Investment not found', code: 404 })
    res.json({ success: true, data: investment })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// PUT /api/investments/:id/sell
router.put('/:id/sell', auth, async (req, res) => {
  try {
    const { actualSalePrice, saleDate } = req.body
    if (!actualSalePrice) {
      return res.status(400).json({ success: false, error: 'actualSalePrice is required', code: 400 })
    }

    const investment = await Investment.findById(req.params.id).populate('propertyId', 'title')
    if (!investment) return res.status(404).json({ success: false, error: 'Investment not found', code: 404 })
    if (investment.status === 'sold') {
      return res.status(400).json({ success: false, error: 'Investment already sold', code: 400 })
    }

    // Profit calculation
    const grossMyProceeds      = actualSalePrice * (investment.mySharePercent / 100)
    const myHoldingShare       = (investment.holdingCosts || 0) * (investment.mySharePercent / 100)
    const myProfit             = Math.round(grossMyProceeds - investment.myAmount - myHoldingShare)

    const profitBreakdown = {
      grossMyProceeds:       Math.round(grossMyProceeds),
      lessOriginalInvestment: investment.myAmount,
      lessHoldingCosts:       Math.round(myHoldingShare),
      netProfit:              myProfit,
    }

    investment.actualSalePrice = actualSalePrice
    investment.saleDate        = saleDate ? new Date(saleDate) : new Date()
    investment.myProfit        = myProfit
    investment.status          = 'sold'

    // Create WealthEntry for investment profit
    const property = investment.propertyId
    const wealthEntry = await WealthEntry.create({
      type:        'income',
      category:    'investmentProfit',
      amount:      myProfit,
      date:        investment.saleDate,
      description: `Investment profit — ${property?.title || 'Property'}`,
    })

    await Promise.all([
      investment.save(),
      Property.findByIdAndUpdate(investment.propertyId, { ownershipStatus: 'sold' }),
    ])

    res.json({ success: true, data: { investment, wealthEntry, profitBreakdown }, message: 'Investment sold' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

module.exports = router
