const mongoose = require('mongoose');

const AgentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  type: { type: String, enum: ['internal', 'external'], required: true },
  // internal = has system login, external = record only, no login

  totalDeals: { type: Number, default: 0 },
  totalCommission: { type: Number, default: 0 },
  // Auto-updated when deals close

  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Agent', AgentSchema);
