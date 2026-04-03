const mongoose = require('mongoose')

const AgentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  type: { type: String, enum: ['internal', 'external'], required: true },
  totalDeals: { type: Number, default: 0 },
  totalCommission: { type: Number, default: 0 },
  notes: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.models.Agent || mongoose.model('Agent', AgentSchema)
