const mongoose = require('mongoose')

const { BLOCKS, CONFIGURATIONS, LEAD_SOURCES, LEAD_STATUSES, PROPERTY_TYPES } = require('../utils/constants')

const InteractionSchema = new mongoose.Schema(
  {
    note: { type: String, required: true },
    stage: { type: String },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
)

const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  alternatePhone: { type: String, trim: true },
  source: { type: String, enum: LEAD_SOURCES, required: true },
  sourceAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  leadType: { type: String, enum: ['buyer', 'seller'], required: true },
  budget: { type: Number, min: 0 },
  location: { type: String, trim: true },
  block: { type: String, enum: BLOCKS },
  propertyType: { type: String, enum: PROPERTY_TYPES },
  configuration: { type: String, enum: CONFIGURATIONS, default: 'NA' },
  size: { type: Number, min: 0 },
  buildingAge: { type: String, trim: true },
  credibilityScore: { type: Number, min: 1, max: 5 },
  status: { type: String, enum: LEAD_STATUSES, default: 'new' },
  followUpDate: { type: Date },
  followUpNotes: { type: String, trim: true },
  notes: { type: String, trim: true },
  interactionHistory: [InteractionSchema],
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

LeadSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date()
  next()
})

LeadSchema.index({ followUpDate: 1, status: 1, isDeleted: 1 })
LeadSchema.index({ location: 1, leadType: 1, propertyType: 1 })

module.exports = mongoose.models.Lead || mongoose.model('Lead', LeadSchema)
