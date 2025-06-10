const express = require('express');
const router = express.Router();
const WhiskyController = require('../controllers/whiskyController');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { 
  validateWhiskyCreation, 
  validateUUIDParam,
  validatePagination 
} = require('../middleware/validation');

// @route   GET /api/whiskies
// @desc    Get all whiskies with filtering and pagination
// @access  Public
router.get('/', 
  validatePagination,
  optionalAuth,
  WhiskyController.getAllWhiskies
);

// @route   GET /api/whiskies/featured
// @desc    Get featured whiskies
// @access  Public
router.get('/featured', WhiskyController.getFeaturedWhiskies);

// @route   GET /api/whiskies/stats
// @desc    Get whisky statistics
// @access  Public
router.get('/stats', WhiskyController.getWhiskyStats);

// @route   GET /api/whiskies/debug
// @desc    Debug endpoint to test basic query
// @access  Public
router.get('/debug', async (req, res) => {
  try {
    const { Whisky } = require('../models');
    const count = await Whisky.count();
    const first = await Whisky.findOne();
    
    res.json({
      debug: true,
      total_count: count,
      sample_whisky: first,
      table_name: Whisky.tableName
    });
  } catch (error) {
    res.status(500).json({
      debug: true,
      error: error.message,
      stack: error.stack
    });
  }
});

// @route   GET /api/whiskies/:id
// @desc    Get single whisky by ID
// @access  Public
router.get('/:id', 
  validateUUIDParam('id'),
  optionalAuth,
  WhiskyController.getWhiskyById
);

// @route   POST /api/whiskies
// @desc    Create new whisky
// @access  Private (Admin only)
router.post('/', 
  authenticateToken,
  requireAdmin,
  validateWhiskyCreation,
  WhiskyController.createWhisky
);

// @route   PUT /api/whiskies/:id
// @desc    Update whisky
// @access  Private (Admin only)
router.put('/:id',
  authenticateToken,
  requireAdmin,
  validateUUIDParam('id'),
  validateWhiskyCreation,
  WhiskyController.updateWhisky
);

// @route   DELETE /api/whiskies/:id
// @desc    Delete whisky
// @access  Private (Admin only)
router.delete('/:id',
  authenticateToken,
  requireAdmin,
  validateUUIDParam('id'),
  WhiskyController.deleteWhisky
);

module.exports = router;
