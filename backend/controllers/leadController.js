const Lead = require('../models/Lead');
const Property = require('../models/Property');

// Get all leads with filters
exports.getLeads = async (req, res) => {
  try {
    const { status, leadType, searchOverdue } = req.query;
    let query = { isDeleted: false };

    if (status) query.status = status;
    if (leadType) query.leadType = leadType;

    if (searchOverdue === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.followUpDate = { $lte: today };
      query.status = { $nin: ['closed', 'lost'] };
    }

    const leads = await Lead.find(query)
      .populate('sourceAgentId', 'name phone')
      .sort({ followUpDate: 1, createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create a new lead
exports.createLead = async (req, res) => {
  try {
    const newLead = new Lead(req.body);
    const saved = await newLead.save();
    const populated = await saved
      .populate('sourceAgentId', 'name phone')
      .execPopulate();
    
    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: populated
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get a single lead by ID
exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('sourceAgentId', 'name phone');

    if (!lead || lead.isDeleted) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update a lead
exports.updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const lead = await Lead.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('sourceAgentId', 'name phone');

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: lead
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Soft delete a lead
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Lead deleted successfully',
      data: lead
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get matching buyers for a property
exports.getMatchingBuyers = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    const buyers = await Lead.find({
      leadType: 'buyer',
      status: { $nin: ['closed', 'lost'] },
      budget: { $gte: property.floorPrice * 0.9 },
      location: property.location,
      propertyType: property.propertyType,
      isDeleted: false,
      ...(property.configuration && property.configuration !== 'NA' && {
        configuration: property.configuration
      })
    })
      .populate('sourceAgentId', 'name phone')
      .sort({ credibilityScore: -1 });

    res.json({
      success: true,
      count: buyers.length,
      data: buyers
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
