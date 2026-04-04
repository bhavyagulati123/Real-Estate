const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const leadController = require('../controllers/leadController');

router.get('/', propertyController.getProperties);
router.post('/', propertyController.createProperty);
router.get('/:id', propertyController.getProperty);
router.put('/:id', propertyController.updateProperty);
router.delete('/:id', propertyController.deleteProperty);

// Get matching buyers for a property
router.get('/:propertyId/matches', leadController.getMatchingBuyers);

module.exports = router;
