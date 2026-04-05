const express      = require('express')
const Deal         = require('../models/Deal')
const Property     = require('../models/Property')
const Lead         = require('../models/Lead')
const { Agent, WealthEntry } = require('../models/index')
const { auth }     = require('../middleware/auth')

const router = express.Router()

// ─── GET /api/deals ───────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, stage, dealType, riskLevel } = req.query
    const filter = { isDeleted: false }

    if (stage)     filter.stage     = stage
    if (dealType)  filter.dealType  = dealType
    if (riskLevel) filter.riskLevel = riskLevel

    const total = await Deal.countDocuments(filter)
    const deals = await Deal.find(filter)
      .sort({ riskLevel: -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('propertyId', 'title location block')
      .populate('buyerLeadId', 'name phone')
      .populate('sellerLeadId', 'name phone')
      .populate('buyerAgentId', 'name phone')
      .populate('sellerAgentId', 'name phone')

    res.json({
      success: true,
      data: deals,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// ─── POST /api/deals ──────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { propertyId, buyerLeadId, sellerLeadId, agreedPrice, commissionRate, dealType } = req.body

    if (!propertyId || !buyerLeadId || !sellerLeadId || !agreedPrice || !dealType) {
      return res.status(400).json({
        success: false,
        error: 'propertyId, buyerLeadId, sellerLeadId, agreedPrice and dealType are required',
        code: 400,
      })
    }

    // Guard: property must be available
    const property = await Property.findById(propertyId)
    if (!property) return res.status(404).json({ success: false, error: 'Property not found', code: 404 })

    if (property.ownershipStatus === 'underNegotiation') {
      return res.status(409).json({
        success: false,
        error: 'This property already has an active deal',
        code: 409,
      })
    }

    // Lock floorPrice at creation — never changes after this
    const floorPrice          = property.floorPrice || 0
    const margin              = agreedPrice - floorPrice
    const expectedCommission  = commissionRate ? Math.round(agreedPrice * commissionRate / 100) : 0

    const deal = await Deal.create({
      ...req.body,
      floorPrice,
      margin,
      expectedCommission,
      stage: 'negotiation',
      stageHistory: [{ stage: 'negotiation', date: new Date() }],
      totalPaid: 0,
      remainingAmount: agreedPrice,
    })

    // Side effects in parallel
    await Promise.all([
      Property.findByIdAndUpdate(propertyId, { ownershipStatus: 'underNegotiation' }),
      Lead.findByIdAndUpdate(buyerLeadId,  { status: 'negotiation', updatedAt: new Date() }),
      Lead.findByIdAndUpdate(sellerLeadId, { status: 'negotiation', updatedAt: new Date() }),
    ])

    const populated = await Deal.findById(deal._id)
      .populate('propertyId', 'title location block')
      .populate('buyerLeadId', 'name phone')
      .populate('sellerLeadId', 'name phone')

    res.status(201).json({ success: true, data: populated, message: 'Deal created' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// ─── GET /api/deals/:id ───────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const deal = await Deal.findOne({ _id: req.params.id, isDeleted: false })
      .populate('propertyId')
      .populate('buyerLeadId',  'name phone status interactionHistory')
      .populate('sellerLeadId', 'name phone status interactionHistory')
      .populate('buyerAgentId',  'name phone')
      .populate('sellerAgentId', 'name phone')
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found', code: 404 })
    res.json({ success: true, data: deal })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// ─── PATCH /api/deals/:id ─────────────────────────────────────────────────────
// General edit — agreedPrice, riskLevel, notes (blocked after bayana)
router.patch('/:id', auth, async (req, res) => {
  try {
    const deal = await Deal.findOne({ _id: req.params.id, isDeleted: false })
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found', code: 404 })

    const { agreedPrice, riskLevel, riskNotes, notes } = req.body

    // agreedPrice is LOCKED after bayana stage
    if (agreedPrice && ['bayana', 'papers', 'closed'].includes(deal.stage)) {
      return res.status(400).json({
        success: false,
        error: 'Agreed price cannot be changed after bayana is paid',
        code: 400,
      })
    }

    if (agreedPrice) {
      deal.agreedPrice       = agreedPrice
      deal.margin            = agreedPrice - (deal.floorPrice || 0)
      deal.expectedCommission= deal.commissionRate ? Math.round(agreedPrice * deal.commissionRate / 100) : 0
      deal.remainingAmount   = agreedPrice - deal.totalPaid
    }
    if (riskLevel)  deal.riskLevel  = riskLevel
    if (riskNotes)  deal.riskNotes  = riskNotes
    if (notes)      deal.notes      = notes

    await deal.save()
    res.json({ success: true, data: deal })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// ─── PUT /api/deals/:id/stage ─────────────────────────────────────────────────
router.put('/:id/stage', auth, async (req, res) => {
  try {
    const { stage, notes } = req.body
    if (!stage) return res.status(400).json({ success: false, error: 'stage is required', code: 400 })

    const deal = await Deal.findOne({ _id: req.params.id, isDeleted: false })
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found', code: 404 })

    const stageOrder = ['negotiation', 'bayana', 'papers', 'closed']
    const currentIdx = stageOrder.indexOf(deal.stage)
    const newIdx     = stageOrder.indexOf(stage)

    // Cannot go backward (except to lost which is always allowed)
    if (stage !== 'lost' && newIdx < currentIdx) {
      return res.status(400).json({ success: false, error: 'Cannot move deal to a previous stage', code: 400 })
    }

    deal.stage = stage
    deal.stageHistory.push({ stage, date: new Date(), notes })

    if (stage === 'papers') deal.papersDate = new Date()

    await deal.save()
    res.json({ success: true, data: deal })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// ─── POST /api/deals/:id/payments ────────────────────────────────────────────
router.post('/:id/payments', auth, async (req, res) => {
  try {
    const { type, amount, date, paidBy, receivedBy, notes, verified } = req.body

    if (!type || !amount || !date) {
      return res.status(400).json({ success: false, error: 'type, amount and date are required', code: 400 })
    }

    const deal = await Deal.findOne({ _id: req.params.id, isDeleted: false })
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found', code: 404 })

    deal.payments.push({ type, amount, date: new Date(date), paidBy, receivedBy, notes, verified: verified || false })

    // Auto-advance to bayana stage on bayana payment
    if (type === 'bayana' && deal.stage === 'negotiation') {
      deal.stage      = 'bayana'
      deal.bayanaDate = new Date(date)
      deal.stageHistory.push({ stage: 'bayana', date: new Date() })
    }

    // Track actual commission
    if (type === 'commission') {
      deal.actualCommission = (deal.actualCommission || 0) + amount

      // Auto-create WealthEntry when commission is verified
      if (verified) {
        const property = await Property.findById(deal.propertyId)
        await WealthEntry.create({
          type:        'income',
          category:    deal.dealType === 'inflated' ? 'margin' : 'commission',
          amount,
          date:        new Date(date),
          dealId:      deal._id,
          description: `Commission — ${property?.title || 'Property'}`,
        })
      }
    }

    // pre-save hook recalculates totalPaid + remainingAmount
    await deal.save()
    res.json({ success: true, data: deal, message: 'Payment recorded' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// ─── PUT /api/deals/:id/payments/:paymentId/verify ───────────────────────────
router.put('/:id/payments/:paymentId/verify', auth, async (req, res) => {
  try {
    const deal = await Deal.findOne({ _id: req.params.id, isDeleted: false })
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found', code: 404 })

    const payment = deal.payments.id(req.params.paymentId)
    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found', code: 404 })
    if (payment.verified) return res.status(400).json({ success: false, error: 'Payment already verified', code: 400 })

    payment.verified = true

    // Create WealthEntry if commission
    if (payment.type === 'commission') {
      const property = await Property.findById(deal.propertyId)
      await WealthEntry.create({
        type:        'income',
        category:    deal.dealType === 'inflated' ? 'margin' : 'commission',
        amount:      payment.amount,
        date:        payment.date,
        dealId:      deal._id,
        description: `Commission — ${property?.title || 'Property'}`,
      })
    }

    await deal.save()
    res.json({ success: true, data: deal })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// ─── PUT /api/deals/:id/close ─────────────────────────────────────────────────
router.put('/:id/close', auth, async (req, res) => {
  try {
    const { closedDate } = req.body
    const deal = await Deal.findOne({ _id: req.params.id, isDeleted: false })
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found', code: 404 })

    deal.stage      = 'closed'
    deal.closedDate = closedDate ? new Date(closedDate) : new Date()
    deal.stageHistory.push({ stage: 'closed', date: new Date() })

    // Side effects in parallel
    await Promise.all([
      deal.save(),
      Property.findByIdAndUpdate(deal.propertyId, { ownershipStatus: 'sold' }),
      Lead.findByIdAndUpdate(deal.buyerLeadId,  { status: 'closed' }),
      Lead.findByIdAndUpdate(deal.sellerLeadId, { status: 'closed' }),
      // Update agent stats — totalDeals + commission split
      ...(() => {
        const total  = deal.actualCommission || 0
        const split  = deal.commissionSplitPercent  // buyer agent's % share
        const buyerShare  = split != null ? Math.round(total * split / 100)         : total
        const sellerShare = split != null ? Math.round(total * (100 - split) / 100) : 0
        return [
          deal.buyerAgentId  && Agent.findByIdAndUpdate(deal.buyerAgentId,  { $inc: { totalDeals: 1, totalCommission: buyerShare  } }),
          deal.sellerAgentId && Agent.findByIdAndUpdate(deal.sellerAgentId, { $inc: { totalDeals: 1, totalCommission: sellerShare } }),
        ]
      })(),
    ])

    res.json({ success: true, data: deal, message: 'Deal closed' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

// ─── PUT /api/deals/:id/lost ──────────────────────────────────────────────────
router.put('/:id/lost', auth, async (req, res) => {
  try {
    const { lostReason } = req.body
    if (!lostReason) {
      return res.status(400).json({ success: false, error: 'lostReason is required', code: 400 })
    }

    const deal = await Deal.findOne({ _id: req.params.id, isDeleted: false })
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found', code: 404 })

    deal.stage      = 'lost'
    deal.lostDate   = new Date()
    deal.lostReason = lostReason
    deal.stageHistory.push({ stage: 'lost', date: new Date(), notes: lostReason })

    const lostNote = `Deal lost — ${lostReason}`

    await Promise.all([
      deal.save(),
      // Property goes back to available
      Property.findByIdAndUpdate(deal.propertyId, { ownershipStatus: 'available' }),
      // Buyer marked lost
      Lead.findOneAndUpdate(
        { _id: deal.buyerLeadId },
        { status: 'lost', $push: { interactionHistory: { note: lostNote, stage: 'lost', createdAt: new Date() } } }
      ),
      // Seller goes back to interested (property still exists)
      Lead.findOneAndUpdate(
        { _id: deal.sellerLeadId },
        { status: 'interested', $push: { interactionHistory: { note: lostNote, stage: 'interested', createdAt: new Date() } } }
      ),
    ])

    res.json({ success: true, data: deal, message: 'Deal marked as lost' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 500 })
  }
})

module.exports = router
