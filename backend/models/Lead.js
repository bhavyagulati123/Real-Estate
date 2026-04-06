const mongoose = require('mongoose')

const InteractionSchema = new mongoose.Schema({
  note:      { type: String, required: true },
  stage:     { type: String },
  createdAt: { type: Date, default: Date.now },
})

const LeadSchema = new mongoose.Schema({
  // Identity
  name:            { type: String, required: true, trim: true },
  phone:           { type: String, required: true, trim: true },
  alternatePhone:  { type: String, trim: true },
  source: {
    type: String,
    enum: ['call', 'whatsapp', 'agent', 'walkin', 'website', 'referral'],
    required: true,
  },
  leadType:      { type: String, enum: ['buyer', 'seller'], required: true },

  // Requirements
  budget:        { type: Number },
  location:      { type: String, trim: true },
  block:         { type: String, enum: ['A','B','C','D','E','F','other'] },
  propertyType: {
    type: String,
    enum: ['residential','floor','office','rootFloor','fullBuilding','plot','commercial'],
  },
  configuration: {
    type: String,
    enum: ['1BHK','2BHK','3BHK','4BHK','villa','plot','NA'],
  },
  size:        { type: Number },
  buildingAge: { type: String, trim: true },

  // Qualification
  credibilityScore: { type: Number, min: 1, max: 5 },

  // Pipeline
  status: {
    type: String,
    enum: ['new','contacted','interested','visit','negotiation','bayana','papers','closed','lost'],
    default: 'new',
  },

  // Follow-up engine
  followUpDate:  { type: Date },
  followUpNotes: { type: String, trim: true },

  // Interaction history (replaces notebook)
  interactionHistory: [InteractionSchema],

  notes: { type: String, trim: true },

  // Soft delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// Auto-update updatedAt
LeadSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

LeadSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
  this.set({ updatedAt: new Date() })
  next()
})

// Normalise phone on save
LeadSchema.pre('save', function (next) {
  if (this.phone) {
    const digits = this.phone.replace(/\D/g, '')
    if (digits.length === 10) this.phone = `+91${digits}`
    else if (digits.startsWith('91') && digits.length === 12) this.phone = `+${digits}`
  }
  next()
})

// Indexes for query performance
LeadSchema.index({ followUpDate: 1 })
LeadSchema.index({ status: 1 })
LeadSchema.index({ leadType: 1 })
LeadSchema.index({ location: 1 })
LeadSchema.index({ isDeleted: 1 })
LeadSchema.index({ phone: 1 })

module.exports = mongoose.model('Lead', LeadSchema)
