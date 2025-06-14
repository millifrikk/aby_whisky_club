const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const EmailController = require('../controllers/emailController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');
const { body } = require('express-validator');

// All admin routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// @route   GET /api/admin/dashboard/stats
// @desc    Get comprehensive dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard/stats', AdminController.getDashboardStats);

// @route   GET /api/admin/users
// @desc    Get all users with filtering and pagination
// @access  Private (Admin only)
router.get('/users', 
  validatePagination,
  AdminController.getAllUsers
);

// @route   PUT /api/admin/users/:id
// @desc    Update user role or status
// @access  Private (Admin only)
router.put('/users/:id', AdminController.updateUser);

// @route   GET /api/admin/users/pending
// @desc    Get pending user registrations
// @access  Private (Admin only)
router.get('/users/pending', 
  validatePagination,
  AdminController.getPendingRegistrations
);

// @route   POST /api/admin/users/:userId/moderate
// @desc    Approve or reject user registration
// @access  Private (Admin only)
router.post('/users/:userId/moderate', AdminController.moderateUserRegistration);

// @route   GET /api/admin/activity
// @desc    Get recent platform activity
// @access  Private (Admin only)
router.get('/activity', AdminController.getRecentActivity);

// @route   GET /api/admin/metrics
// @desc    Get system health and performance metrics
// @access  Private (Admin only)
router.get('/metrics', AdminController.getSystemMetrics);

// @route   GET /api/admin/content/moderation
// @desc    Get content requiring moderation
// @access  Private (Admin only)
router.get('/content/moderation', AdminController.getContentForModeration);

// @route   POST /api/admin/content/:content_type/:content_id/moderate
// @desc    Moderate content (approve, reject, flag, delete)
// @access  Private (Admin only)
router.post('/content/:content_type/:content_id/moderate', AdminController.moderateContent);

// Whisky Approval Routes

// @route   GET /api/admin/whiskies/pending
// @desc    Get all pending whiskies awaiting approval
// @access  Private (Admin only)
router.get('/whiskies/pending', 
  validatePagination,
  AdminController.getPendingWhiskies
);

// @route   POST /api/admin/whiskies/:id/approve
// @desc    Approve a specific whisky
// @access  Private (Admin only)
router.post('/whiskies/:id/approve', AdminController.approveWhisky);

// @route   POST /api/admin/whiskies/:id/reject
// @desc    Reject a specific whisky
// @access  Private (Admin only)
router.post('/whiskies/:id/reject', AdminController.rejectWhisky);

// System Settings Routes

// @route   GET /api/admin/settings
// @desc    Get all system settings
// @access  Private (Admin only)
router.get('/settings', AdminController.getSystemSettings);

// @route   GET /api/admin/settings/enhanced
// @desc    Get all system settings with search metadata
// @access  Private (Admin only)
router.get('/settings/enhanced', AdminController.getEnhancedSystemSettings);

// @route   PUT /api/admin/settings/:key
// @desc    Update system setting
// @access  Private (Admin only)
router.put('/settings/:key', AdminController.updateSystemSetting);

// @route   POST /api/admin/settings
// @desc    Create new system setting
// @access  Private (Admin only)
router.post('/settings', AdminController.createSystemSetting);

// @route   DELETE /api/admin/settings/:key
// @desc    Delete system setting
// @access  Private (Admin only)
router.delete('/settings/:key', AdminController.deleteSystemSetting);

// @route   POST /api/admin/settings/initialize
// @desc    Initialize default system settings
// @access  Private (Admin only)
router.post('/settings/initialize', AdminController.initializeDefaultSettings);

// Data Export/Import Routes

// @route   GET /api/admin/export
// @desc    Export data to CSV/JSON
// @access  Private (Admin only)
router.get('/export', AdminController.exportData);

// @route   POST /api/admin/import
// @desc    Import data from JSON
// @access  Private (Admin only)
router.post('/import', AdminController.importData);

// Email Management Routes

// @route   GET /api/admin/email/status
// @desc    Get email service status and configuration
// @access  Private (Admin only)
router.get('/email/status', EmailController.getEmailStatus);

// @route   POST /api/admin/email/test
// @desc    Test email configuration
// @access  Private (Admin only)
router.post('/email/test', EmailController.testEmailConfiguration);

// @route   POST /api/admin/email/reconfigure
// @desc    Reconfigure email service
// @access  Private (Admin only)
router.post('/email/reconfigure', EmailController.reconfigureEmailService);

// @route   GET /api/admin/email/settings
// @desc    Get all email settings
// @access  Private (Admin only)
router.get('/email/settings', EmailController.getEmailSettings);

// @route   POST /api/admin/email/test/welcome
// @desc    Send test welcome email
// @access  Private (Admin only)
router.post('/email/test/welcome',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    
    body('name')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Name must be less than 100 characters')
  ],
  EmailController.sendTestWelcomeEmail
);

// @route   POST /api/admin/email/test/event-reminder
// @desc    Send test event reminder email
// @access  Private (Admin only)
router.post('/email/test/event-reminder',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    
    body('name')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Name must be less than 100 characters'),
    
    body('eventTitle')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Event title must be less than 200 characters'),
    
    body('eventDate')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Event date must be less than 50 characters')
  ],
  EmailController.sendTestEventReminder
);

// @route   POST /api/admin/email/test/rating-notification
// @desc    Send test rating notification email
// @access  Private (Admin only)
router.post('/email/test/rating-notification',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    
    body('userName')
      .optional()
      .isLength({ max: 100 })
      .withMessage('User name must be less than 100 characters'),
    
    body('whiskyName')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Whisky name must be less than 200 characters'),
    
    body('raterName')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Rater name must be less than 100 characters')
  ],
  EmailController.sendTestRatingNotification
);

// @route   GET /api/admin/email/reminders/status
// @desc    Get event reminder service status
// @access  Private (Admin only)
router.get('/email/reminders/status', EmailController.getEventReminderStatus);

// @route   POST /api/admin/email/reminders/event/:eventId
// @desc    Send manual event reminder
// @access  Private (Admin only)
router.post('/email/reminders/event/:eventId', EmailController.sendManualEventReminder);

// @route   POST /api/admin/email/weekly-digest
// @desc    Send weekly digest manually
// @access  Private (Admin only)
router.post('/email/weekly-digest', EmailController.sendWeeklyDigest);

module.exports = router;