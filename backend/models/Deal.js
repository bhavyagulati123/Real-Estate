const mongoose = require('mongoose')

const PaymentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['token','bayana','partPayment','fullPayment','commission'],
    required: true,
  },
  amount:     { type: Number, required: true },
  date:       { type: Date, required: true },
  paidBy:     { type: String, trim: true },
  receivedBy: { type: String, trim: true },
  notes:      { type: String, trim: true },
  verified:   { type: Boolean, default: false },
  createdAt:  { type: Date, default: Date.now },
})

const StageHistorySchema = new mongoose.Schema({
  stage:     { type: String, required: true },
  date:      { type: Date, default: Date.now },
  notes:     { type: String, trim: true },
})

const DealSchema = new mongoose.Schema({
  // Core connections
  propertyId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  buyerLeadId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  sellerLeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },

  dealType: {
    type: String,
    enum: ['brokerage','inflated','coInvestment'],
    required: true,
    // LOCKED at creation — never changes
  },

  // Pipeline
  stage: {
    type: String,
    enum: ['negotiation','bayana','papers','closed','lost'],
    default: 'negotiation',
  },
  stageHistory: [StageHistorySchema],

  // Key dates
  bayanaDate: { type: Date },
  papersDate: { type: Date },
  closedDate: { type: Date },
  lostDate:   { type: Date },
  lostReason: { type: String, trim: true },

  // Money
  agreedPrice:          { type: Number, required: true },
  floorPrice:           { type: Number }, // LOCKED at creation from property.floorPrice
  margin:               { type: Number }, // auto: agreedPrice - floorPrice
  commissionRate:       { type: Number }, // percentage, usually 1
  expectedCommission:   { type: Number }, // agreedPrice * commissionRate / 100
  actualCommission:     { type: Number, default: 0 },

  // Payment flow tracker
  payments:        [PaymentSchema],
  totalPaid:       { type: Number, default: 0 },
  remainingAmount: { type: Number },

  // Risk
  riskLevel: { type: String, enum: ['low','medium','high'], default: 'low' },
  riskNotes: { type: String, trim: true },

  notes: { type: String, trim: true },

  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

DealSchema.pre('save', function (next) {
  this.updatedAt = new Date()

  // Recalculate derived fields
  if (this.agreedPrice && this.floorPrice) {
    this.margin = this.agreedPrice - this.floorPrice
  }
  if (this.agreedPrice && this.commissionRate) {
    this.expectedCommission = Math.round(this.agreedPrice * this.commissionRate / 100)
  }

  // Recalculate totalPaid from payments array (exclude commission)
  const nonCommission = this.payments.filter(p => p.type !== 'commission')
  this.totalPaid = nonCommission.reduce((sum, p) => sum + p.amount, 0)
  this.remainingAmount = this.agreedPrice - this.totalPaid

  next()
})

DealSchema.index({ stage: 1 })
DealSchema.index({ riskLevel: 1 })
DealSchema.index({ isDeleted: 1 })

module.exports = mongoose.model('Deal', DealSchema)
