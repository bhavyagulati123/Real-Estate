const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  // Identity
  name: { type: String, required: true },
  phone: { type: String, required: true },
  // String not Number — preserve +91, leading zeros
  alternatePhone: { type: String },
  source: {
    type: String,
    enum: ['call', 'whatsapp', 'agent', 'walkin', 'website', 'referral'],
    required: true
  },
  sourceAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  // Which external agent brought this lead to us

  leadType: { type: String, enum: ['buyer', 'seller'], required: true },

  // What they want (buyer) / What they have (seller)
  budget: { type: Number },
  // In rupees — max budget for buyer, minimum acceptable for seller
  location: { type: String },
  // Area or lane in Mohan Garden
  block: { type: String, enum: ['A', 'B', 'C', 'D', 'E', 'F', 'other'] },
  // Block preference — price varies significantly by block
  propertyType: {
    type: String,
    enum: ['residential', 'floor', 'office', 'rootFloor', 'fullBuilding', 'plot', 'commercial']
  },
  configuration: {
    type: String,
    enum: ['1BHK', '2BHK', '3BHK', '4BHK', 'villa', 'plot', 'NA'],
    default: 'NA'
  },
  size: { type: Number },
  // Square yards
  buildingAge: { type: String },
  // e.g. "5 years", "new construction", "15+ years"

  // Qualification
  credibilityScore: { type: Number, min: 1, max: 5 },
  // Father's gut judgment — 1=very doubtful, 3=seems genuine, 5=highly credible

  // Pipeline
  status: {
    type: String,
    enum: [
      'new',
      'contacted',
      'interested',
      'visit',
      'negotiation',
      'bayana',
      'papers',
      'closed',
      'lost'
    ],
    default: 'new'
  },

  // Follow-up engine
  followUpDate: { type: Date },
  // System queries this daily
  followUpNotes: { type: String },
  // What to discuss on next call

  notes: { type: String },
  // General notes

  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', LeadSchema);
