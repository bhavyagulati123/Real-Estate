const mongoose = require('mongoose')

const PropertySchema = new mongoose.Schema({
  title:    { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  block: {
    type: String,
    enum: ['A','B','C','D','E','F','other'],
  },
  propertyType: {
    type: String,
    enum: ['residential','floor','office','rootFloor','fullBuilding','plot','commercial'],
    required: true,
  },
  configuration: {
    type: String,
    enum: ['1BHK','2BHK','3BHK','4BHK','villa','plot','NA'],
  },
  size:               { type: Number },
  buildingAge:        { type: String, trim: true },
  buildingCredibility:{ type: Number, min: 1, max: 5 },

  // Three price fields — all serve different purposes
  floorPrice:   { type: Number }, // seller's actual minimum — PRIVATE
  askingPrice:  { type: Number }, // seller's public ask
  listedPrice:  { type: Number }, // what Father shows buyers (inflated in Type B deals)

  dealType: {
    type: String,
    enum: ['brokerage','inflated','coInvestment'],
    required: true,
  },

  ownershipStatus: {
    type: String,
    enum: ['available','underNegotiation','sold','ownerOwned'],
    default: 'available',
  },

  sellerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  sourceAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },

  images:    [{ type: String }],
  documents: [{ type: String }],
  notes:     { type: String, trim: true },

  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

PropertySchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

PropertySchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
  this.set({ updatedAt: new Date() })
  next()
})

PropertySchema.index({ ownershipStatus: 1 })
PropertySchema.index({ location: 1 })
PropertySchema.index({ propertyType: 1 })
PropertySchema.index({ isDeleted: 1 })

module.exports = mongoose.model('Property', PropertySchema)
