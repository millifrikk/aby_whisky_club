const express = require('express');
const router = express.Router();
const RatingController = require('../controllers/ratingController');
const { authenticateToken, requireMember, optionalAuth } = require('../middleware/auth');
const { 
  validateRating, 
  validateUUIDParam,
  validatePagination 
} = require('../middleware/validation');

// @route   GET /api/ratings/whisky/:whisky_id
// @desc    Get all ratings for a specific whisky
// @access  Public
router.get('/whisky/:whisky_id', 
  validateUUIDParam('whisky_id'),
  validatePagination,
  optionalAuth,
  RatingController.getWhiskyRatings
);

// @route   GET /api/ratings/user/:user_id
// @desc    Get all ratings by a specific user
// @access  Public (private ratings only visible to owner/admin)
router.get('/user/:user_id',
  validateUUIDParam('user_id'),
  validatePagination,
  optionalAuth,
  RatingController.getUserRatings
);

// @route   GET /api/ratings/top-whiskies
// @desc    Get top-rated whiskies
// @access  Public
router.get('/top-whiskies', RatingController.getTopRatedWhiskies);

// @route   GET /api/ratings/recent
// @desc    Get recent public ratings
// @access  Public
router.get('/recent', RatingController.getRecentRatings);

// @route   GET /api/ratings/:id
// @desc    Get a specific rating by ID
// @access  Public (private ratings only visible to owner/admin)
router.get('/:id',
  validateUUIDParam('id'),
  optionalAuth,
  RatingController.getRating
);

// @route   POST /api/ratings
// @desc    Create or update a rating
// @access  Private (Members only)
router.post('/',
  authenticateToken,
  requireMember,
  validateRating,
  RatingController.createOrUpdateRating
);

// @route   DELETE /api/ratings/:id
// @desc    Delete a rating
// @access  Private (Owner or Admin only)
router.delete('/:id',
  authenticateToken,
  requireMember,
  validateUUIDParam('id'),
  RatingController.deleteRating
);

module.exports = router;
