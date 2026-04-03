const mongoose = require('mongoose')

const { BLOCKS, CONFIGURATIONS, DEAL_TYPES, OWNERSHIP_STATUS, PROPERTY_TYPES } = require('../utils/constants')

const PropertySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  block: { type: String, enum: BLOCKS },
  propertyType: { type: String, enum: PROPERTY_TYPES, required: true },
  configuration: { type: String, enum: CONFIGURATIONS, default: 'NA' },
  size: { type: Number, min: 0 },
  buildingAge: { type: String, trim: true },
  buildingCredibility: { type: Number, min: 1, max: 5 },
  floorPrice: { type: Number, min: 0 },
  askingPrice: { type: Number, min: 0 },
  listedPrice: { type: Number, min: 0 },
  dealType: { type: String, enum: DEAL_TYPES, required: true },
  ownershipStatus: { type: String, enum: OWNERSHIP_STATUS, default: 'available' },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  sourceAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  images: [{ type: String }],
  documents: [{ type: String }],
  notes: { type: String, trim: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

PropertySchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date()
  next()
})

PropertySchema.index({ ownershipStatus: 1, location: 1, isDeleted: 1 })

module.exports = mongoose.models.Property || mongoose.model('Property', PropertySchema)
