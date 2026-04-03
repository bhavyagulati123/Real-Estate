const mongoose = require('mongoose')

const { WEALTH_CATEGORIES } = require('../utils/constants')

const WealthEntrySchema = new mongoose.Schema({
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, enum: WEALTH_CATEGORIES, required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true },
  dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
  description: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.models.WealthEntry || mongoose.model('WealthEntry', WealthEntrySchema)
