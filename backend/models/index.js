const mongoose = require('mongoose')

// ─── CO-INVESTOR ──────────────────────────────────────────────────────────────
const CoInvestorSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  phone:           { type: String, trim: true },
  amountInvested:  { type: Number, required: true },
  sharePercent:    { type: Number, required: true },
  notes:           { type: String, trim: true },
})

// ─── INVESTMENT ───────────────────────────────────────────────────────────────
const InvestmentSchema = new mongoose.Schema({
  propertyId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  purchasePrice:  { type: Number, required: true },
  purchaseDate:   { type: Date, required: true },
  mySharePercent: { type: Number, required: true },
  myAmount:       { type: Number }, // auto: purchasePrice * mySharePercent / 100
  coInvestors:    [CoInvestorSchema],
  holdingCosts:   { type: Number, default: 0 },
  targetSalePrice:{ type: Number },
  actualSalePrice:{ type: Number },
  myProfit:       { type: Number },
  status:         { type: String, enum: ['holding','sold'], default: 'holding' },
  saleDate:       { type: Date },
  notes:          { type: String, trim: true },
  createdAt:      { type: Date, default: Date.now },
  updatedAt:      { type: Date, default: Date.now },
})

InvestmentSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  // Auto-calculate myAmount
  if (this.purchasePrice && this.mySharePercent) {
    this.myAmount = Math.round(this.purchasePrice * this.mySharePercent / 100)
  }
  next()
})

const Investment = mongoose.model('Investment', InvestmentSchema)

// ─── AGENT ────────────────────────────────────────────────────────────────────
const AgentSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  phone:           { type: String, trim: true },
  type:            { type: String, enum: ['internal','external'], required: true },
  totalDeals:      { type: Number, default: 0 },
  totalCommission: { type: Number, default: 0 },
  notes:           { type: String, trim: true },
  createdAt:       { type: Date, default: Date.now },
})

const Agent = mongoose.model('Agent', AgentSchema)

// ─── WEALTH ENTRY ─────────────────────────────────────────────────────────────
const WealthEntrySchema = new mongoose.Schema({
  type: { type: String, enum: ['income','expense'], required: true },
  category: {
    type: String,
    enum: ['commission','margin','investmentProfit','officeExpense','travelExpense','agentPayout','other'],
  },
  amount:      { type: Number, required: true },
  date:        { type: Date, required: true },
  dealId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
  description: { type: String, trim: true },
  createdAt:   { type: Date, default: Date.now },
})

WealthEntrySchema.index({ type: 1 })
WealthEntrySchema.index({ date: -1 })

const WealthEntry = mongoose.model('WealthEntry', WealthEntrySchema)

// ─── USER ─────────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  phone:     { type: String, required: true, unique: true, trim: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['admin','operator','agent'], default: 'operator' },
  agentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  createdAt: { type: Date, default: Date.now },
})

const User = mongoose.model('User', UserSchema)

module.exports = { Investment, Agent, WealthEntry, User }
