const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

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

module.exports = router;