const express = require('express');
const router = express.Router();
const NewsEventController = require('../controllers/newsEventController');
const { authenticateToken, requireAdmin, requireMember, optionalAuth } = require('../middleware/auth');
const { 
  validateNewsEvent, 
  validateUUIDParam,
  validatePagination,
  handleValidationErrors 
} = require('../middleware/validation');
const { body } = require('express-validator');

// @route   GET /api/news-events
// @desc    Get all news and events with filtering
// @access  Public
router.get('/', 
  validatePagination,
  optionalAuth,
  NewsEventController.getAllNewsEvents
);

// @route   GET /api/news-events/upcoming
// @desc    Get upcoming events
// @access  Public
router.get('/upcoming', NewsEventController.getUpcomingEvents);

// @route   GET /api/news-events/featured
// @desc    Get featured content
// @access  Public
router.get('/featured', NewsEventController.getFeaturedContent);

// @route   GET /api/news-events/:id
// @desc    Get single news/event by ID
// @access  Public (unpublished only visible to admin/author)
router.get('/:id', 
  validateUUIDParam('id'),
  optionalAuth,
  NewsEventController.getNewsEventById
);

// @route   POST /api/news-events
// @desc    Create new news/event
// @access  Private (Admin only)
router.post('/', 
  authenticateToken,
  requireAdmin,
  validateNewsEvent,
  NewsEventController.createNewsEvent
);

// @route   PUT /api/news-events/:id
// @desc    Update news/event
// @access  Private (Admin only)
router.put('/:id',
  authenticateToken,
  requireAdmin,
  validateUUIDParam('id'),
  validateNewsEvent,
  NewsEventController.updateNewsEvent
);

// @route   DELETE /api/news-events/:id
// @desc    Delete news/event
// @access  Private (Admin only)
router.delete('/:id',
  authenticateToken,
  requireAdmin,
  validateUUIDParam('id'),
  NewsEventController.deleteNewsEvent
);

// @route   POST /api/news-events/:event_id/rsvp
// @desc    RSVP to an event
// @access  Private (Members only)
router.post('/:event_id/rsvp',
  authenticateToken,
  requireMember,
  validateUUIDParam('event_id'),
  [
    body('status')
      .optional()
      .isIn(['attending', 'maybe', 'declined'])
      .withMessage('Status must be attending, maybe, or declined'),
    
    body('guests_count')
      .optional()
      .isInt({ min: 0, max: 10 })
      .withMessage('Guests count must be between 0 and 10'),
    
    body('dietary_requirements')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Dietary requirements must be less than 500 characters'),
    
    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes must be less than 1000 characters'),
    
    handleValidationErrors
  ],
  NewsEventController.rsvpToEvent
);

// @route   GET /api/news-events/:event_id/attendees
// @desc    Get event attendees
// @access  Public
router.get('/:event_id/attendees',
  validateUUIDParam('event_id'),
  NewsEventController.getEventAttendees
);

module.exports = router;
