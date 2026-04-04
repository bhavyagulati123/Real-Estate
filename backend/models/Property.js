const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  // Human-readable e.g. "2BHK Floor, Block C, Mohan Garden"

  location: { type: String, required: true },
  block: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E', 'F', 'other']
  },
  propertyType: {
    type: String,
    enum: ['residential', 'floor', 'office', 'rootFloor', 'fullBuilding', 'plot', 'commercial'],
    required: true
  },
  configuration: {
    type: String,
    enum: ['1BHK', '2BHK', '3BHK', '4BHK', 'villa', 'plot', 'NA'],
    default: 'NA'
  },
  size: { type: Number },
  buildingAge: { type: String },
  buildingCredibility: { type: Number, min: 1, max: 5 },

  // Pricing
  floorPrice: { type: Number },
  // Seller's actual minimum — PRIVATE
  askingPrice: { type: Number },
  // What seller is publicly asking
  listedPrice: { type: Number },
  // What Father shows buyers

  dealType: {
    type: String,
    enum: ['brokerage', 'inflated', 'coInvestment'],
    required: true
  },

  ownershipStatus: {
    type: String,
    enum: ['available', 'underNegotiation', 'sold', 'ownerOwned'],
    default: 'available'
  },

  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  sourceAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },

  images: [{ type: String }],
  documents: [{ type: String }],
  notes: { type: String },

  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Property', PropertySchema);
