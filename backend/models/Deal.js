const mongoose = require('mongoose')

const { DEAL_STAGES, DEAL_TYPES, PAYMENT_TYPES, RISK_LEVELS } = require('../utils/constants')

const PaymentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: PAYMENT_TYPES, required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    paidBy: { type: String, trim: true },
    receivedBy: { type: String, trim: true },
    notes: { type: String, trim: true },
    verified: { type: Boolean, default: false }
  },
  { _id: true }
)

const StageHistorySchema = new mongoose.Schema(
  {
    stage: { type: String, enum: DEAL_STAGES },
    date: { type: Date, default: Date.now },
    notes: { type: String, trim: true }
  },
  { _id: false }
)

const DealSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  buyerLeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  sellerLeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  dealType: { type: String, enum: DEAL_TYPES, required: true },
  stage: { type: String, enum: DEAL_STAGES, default: 'negotiation' },
  stageHistory: [StageHistorySchema],
  bayanaDate: { type: Date },
  papersDate: { type: Date },
  closedDate: { type: Date },
  lostDate: { type: Date },
  lostReason: { type: String, trim: true },
  agreedPrice: { type: Number, required: true, min: 0 },
  floorPrice: { type: Number, min: 0 },
  margin: { type: Number, min: 0 },
  commissionRate: { type: Number, min: 0 },
  expectedCommission: { type: Number, min: 0 },
  actualCommission: { type: Number, min: 0 },
  payments: [PaymentSchema],
  totalPaid: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  buyerAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  sellerAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  commissionSplitPercent: { type: Number, min: 0, max: 100 },
  riskLevel: { type: String, enum: RISK_LEVELS, default: 'low' },
  riskNotes: { type: String, trim: true },
  notes: { type: String, trim: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

DealSchema.pre('save', function computeTotals(next) {
  const nonCommissionPayments = this.payments.filter((payment) => payment.type !== 'commission')
  this.totalPaid = nonCommissionPayments.reduce((total, payment) => total + payment.amount, 0)
  this.remainingAmount = Math.max((this.agreedPrice || 0) - this.totalPaid, 0)

  if (this.floorPrice && this.stage !== 'bayana' && this.stage !== 'papers' && this.stage !== 'closed') {
    this.margin = Math.max((this.agreedPrice || 0) - this.floorPrice, 0)
  }

  this.updatedAt = new Date()
  next()
})

DealSchema.index({ stage: 1, dealType: 1, isDeleted: 1 })

module.exports = mongoose.models.Deal || mongoose.model('Deal', DealSchema)
