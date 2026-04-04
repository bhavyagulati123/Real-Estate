const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['token', 'bayana', 'partPayment', 'fullPayment', 'commission'],
    required: true
  },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  paidBy: { type: String },
  receivedBy: { type: String },
  notes: { type: String },
  verified: { type: Boolean, default: false }
});

const DealSchema = new mongoose.Schema({
  // Core connections
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  buyerLeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  sellerLeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },

  dealType: {
    type: String,
    enum: ['brokerage', 'inflated', 'coInvestment'],
    required: true
  },

  // Pipeline
  stage: {
    type: String,
    enum: ['negotiation', 'bayana', 'papers', 'closed', 'lost'],
    default: 'negotiation'
  },
  stageHistory: [{
    stage: String,
    date: { type: Date, default: Date.now },
    notes: String
  }],

  // Key dates
  bayanaDate: { type: Date },
  papersDate: { type: Date },
  closedDate: { type: Date },
  lostDate: { type: Date },
  lostReason: { type: String },

  // Money flow
  agreedPrice: { type: Number, required: true },
  floorPrice: { type: Number },
  margin: { type: Number },
  // Auto-calculated: agreedPrice - floorPrice

  commissionRate: { type: Number },
  expectedCommission: { type: Number },
  actualCommission: { type: Number },

  // Payment tracking
  payments: [PaymentSchema],
  totalPaid: { type: Number, default: 0 },
  remainingAmount: { type: Number },

  // Agent splits
  buyerAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  sellerAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  commissionSplitPercent: { type: Number },

  // Risk
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  riskNotes: { type: String },

  notes: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Deal', DealSchema);
