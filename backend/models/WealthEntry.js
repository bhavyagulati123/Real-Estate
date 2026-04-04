const mongoose = require('mongoose');

const WealthEntrySchema = new mongoose.Schema({
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: {
    type: String,
    enum: ['commission', 'margin', 'investmentProfit', 'officeExpense', 'travelExpense', 'agentPayout', 'other']
  },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
  // Every income entry traces back to its source deal
  description: { type: String },
  // Auto-populated: "Commission — Block C Floor, Mohan Garden"

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WealthEntry', WealthEntrySchema);
