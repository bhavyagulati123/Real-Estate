const Property = require('../models/Property');
const Lead = require('../models/Lead');

// Get all properties with filters
exports.getProperties = async (req, res) => {
  try {
    const { status, block, propertyType, dealType } = req.query;
    let query = { isDeleted: false };

    if (status) query.ownershipStatus = status;
    if (block) query.block = block;
    if (propertyType) query.propertyType = propertyType;
    if (dealType) query.dealType = dealType;

    const properties = await Property.find(query)
      .populate('sellerId', 'name phone')
      .populate('sourceAgentId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create a new property
exports.createProperty = async (req, res) => {
  try {
    const newProperty = new Property(req.body);
    const saved = await newProperty.save();
    const populated = await saved
      .populate('sellerId', 'name phone')
      .populate('sourceAgentId', 'name phone')
      .execPopulate();

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: populated
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get a single property by ID
exports.getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('sellerId', 'name phone')
      .populate('sourceAgentId', 'name phone');

    if (!property || property.isDeleted) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    res.json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update a property
exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if property is under negotiation
    if (updates.ownershipStatus && updates.ownershipStatus === 'underNegotiation') {
      const property = await Property.findById(id);
      if (property && property.ownershipStatus === 'underNegotiation') {
        return res.status(400).json({
          success: false,
          error: 'Property already under negotiation. Cannot link to new deal.'
        });
      }
    }

    const property = await Property.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('sellerId', 'name phone')
      .populate('sourceAgentId', 'name phone');

    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: property
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Soft delete a property
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Property deleted successfully',
      data: property
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
