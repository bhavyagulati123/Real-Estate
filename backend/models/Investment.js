const mongoose = require('mongoose');

const CoInvestorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  amountInvested: { type: Number, required: true },
  sharePercent: { type: Number, required: true },
  notes: { type: String }
});

const InvestmentSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },

  purchasePrice: { type: Number, required: true },
  purchaseDate: { type: Date, required: true },
  mySharePercent: { type: Number, required: true },
  myAmount: { type: Number },
  // Auto-calculated: purchasePrice x mySharePercent / 100

  coInvestors: [CoInvestorSchema],

  holdingCosts: { type: Number, default: 0 },
  // Maintenance, tax, loan interest while holding

  targetSalePrice: { type: Number },
  actualSalePrice: { type: Number },

  myProfit: { type: Number },
  // Auto-calculated on sale

  status: { type: String, enum: ['holding', 'sold'], default: 'holding' },
  saleDate: { type: Date },

  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Investment', InvestmentSchema);
