const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public analytics endpoints (with optional authentication)
router.post('/activity', authenticateToken, AnalyticsController.trackActivity);
router.post('/performance', authenticateToken, AnalyticsController.recordPerformanceMetric);

// Admin-only analytics endpoints
router.get('/activity/analytics', requireAdmin, AnalyticsController.getActivityAnalytics);
router.get('/performance/analytics', requireAdmin, AnalyticsController.getPerformanceAnalytics);
router.get('/top-entities', requireAdmin, AnalyticsController.getTopEntities);
router.get('/system-health', requireAdmin, AnalyticsController.getSystemHealth);
router.get('/slow-endpoints', requireAdmin, AnalyticsController.getSlowEndpoints);
router.post('/cleanup', requireAdmin, AnalyticsController.cleanOldData);

module.exports = router;