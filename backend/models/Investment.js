const mongoose = require('mongoose')

const CoInvestorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    amountInvested: { type: Number, required: true, min: 0 },
    sharePercent: { type: Number, required: true, min: 0, max: 100 },
    notes: { type: String, trim: true }
  },
  { _id: false }
)

const InvestmentSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  purchasePrice: { type: Number, required: true, min: 0 },
  purchaseDate: { type: Date, required: true },
  mySharePercent: { type: Number, required: true, min: 0, max: 100 },
  myAmount: { type: Number, min: 0 },
  coInvestors: [CoInvestorSchema],
  holdingCosts: { type: Number, default: 0, min: 0 },
  targetSalePrice: { type: Number, min: 0 },
  actualSalePrice: { type: Number, min: 0 },
  myProfit: { type: Number, min: 0 },
  status: { type: String, enum: ['holding', 'sold'], default: 'holding' },
  saleDate: { type: Date },
  notes: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
})

InvestmentSchema.pre('save', function computeInvestmentValues(next) {
  this.myAmount = Math.round((this.purchasePrice * this.mySharePercent) / 100)

  if (this.status === 'sold' && this.actualSalePrice) {
    const mySaleValue = Math.round((this.actualSalePrice * this.mySharePercent) / 100)
    const myHoldingCost = Math.round((this.holdingCosts * this.mySharePercent) / 100)
    this.myProfit = mySaleValue - this.myAmount - myHoldingCost
  }

  next()
})

module.exports = mongoose.models.Investment || mongoose.model('Investment', InvestmentSchema)
