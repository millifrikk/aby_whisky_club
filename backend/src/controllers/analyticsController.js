const { UserActivity, PerformanceMetric, SystemSetting } = require('../models');

class AnalyticsController {
  // Track user activity
  static async trackActivity(req, res) {
    try {
      // Check if usage tracking is enabled
      const usageTrackingEnabled = await SystemSetting.getSetting('enable_usage_tracking', true);
      if (!usageTrackingEnabled) {
        return res.status(200).json({
          message: 'Activity tracking is disabled'
        });
      }

      const {
        activityType,
        entityType,
        entityId,
        pageUrl,
        pageTitle,
        referrerUrl,
        duration,
        metadata = {}
      } = req.body;

      // Get user info if authenticated
      const userId = req.user?.id || null;
      
      // Get session info from headers or generate
      const sessionId = req.headers['x-session-id'] || req.sessionID || null;
      
      // Get request metadata
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.connection.remoteAddress;

      const activity = await UserActivity.trackActivity({
        userId,
        sessionId,
        activityType,
        entityType,
        entityId,
        pageUrl,
        pageTitle,
        referrerUrl,
        userAgent,
        ipAddress,
        duration,
        metadata
      });

      res.status(201).json({
        success: true,
        activityId: activity?.id,
        message: 'Activity tracked successfully'
      });

    } catch (error) {
      console.error('Track activity error:', error);
      // Don't fail requests due to tracking errors
      res.status(200).json({
        success: false,
        message: 'Activity tracking failed'
      });
    }
  }

  // Record performance metric
  static async recordPerformanceMetric(req, res) {
    try {
      // Check if performance monitoring is enabled
      const performanceMonitoringEnabled = await SystemSetting.getSetting('performance_monitoring', true);
      if (!performanceMonitoringEnabled) {
        return res.status(200).json({
          message: 'Performance monitoring is disabled'
        });
      }

      const {
        metricType,
        endpoint,
        value,
        unit = 'ms',
        metadata = {}
      } = req.body;

      // Get user info if authenticated
      const userId = req.user?.id || null;
      
      // Get session info
      const sessionId = req.headers['x-session-id'] || req.sessionID || null;
      
      // Parse user agent for device info
      const userAgent = req.headers['user-agent'];
      const deviceInfo = UserActivity.parseUserAgent(userAgent);

      const metric = await PerformanceMetric.recordMetric({
        metricType,
        endpoint,
        value,
        unit,
        userId,
        sessionId,
        deviceType: deviceInfo.device,
        browser: deviceInfo.browser,
        metadata
      });

      res.status(201).json({
        success: true,
        metricId: metric?.id,
        message: 'Performance metric recorded successfully'
      });

    } catch (error) {
      console.error('Record performance metric error:', error);
      // Don't fail requests due to monitoring errors
      res.status(200).json({
        success: false,
        message: 'Performance metric recording failed'
      });
    }
  }

  // Get activity analytics (admin only)
  static async getActivityAnalytics(req, res) {
    try {
      // Check if user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Admin access required'
        });
      }

      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate = new Date(),
        groupBy = 'day',
        activityTypes,
        userId
      } = req.query;

      const analytics = await UserActivity.getActivityAnalytics({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        groupBy,
        activityTypes: activityTypes ? activityTypes.split(',') : null,
        userId
      });

      res.json({
        analytics,
        period: {
          start: startDate,
          end: endDate,
          groupBy
        },
        generated_at: new Date()
      });

    } catch (error) {
      console.error('Get activity analytics error:', error);
      res.status(500).json({
        error: 'Failed to fetch activity analytics',
        message: 'An error occurred while fetching activity analytics'
      });
    }
  }

  // Get performance analytics (admin only)
  static async getPerformanceAnalytics(req, res) {
    try {
      // Check if user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Admin access required'
        });
      }

      const {
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        endDate = new Date(),
        groupBy = 'hour',
        metricTypes,
        endpoints
      } = req.query;

      const analytics = await PerformanceMetric.getPerformanceAnalytics({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        groupBy,
        metricTypes: metricTypes ? metricTypes.split(',') : null,
        endpoints: endpoints ? endpoints.split(',') : null
      });

      res.json({
        analytics,
        period: {
          start: startDate,
          end: endDate,
          groupBy
        },
        generated_at: new Date()
      });

    } catch (error) {
      console.error('Get performance analytics error:', error);
      res.status(500).json({
        error: 'Failed to fetch performance analytics',
        message: 'An error occurred while fetching performance analytics'
      });
    }
  }

  // Get top pages/entities (admin only)
  static async getTopEntities(req, res) {
    try {
      // Check if user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Admin access required'
        });
      }

      const {
        entityType = 'whisky',
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        limit = 10
      } = req.query;

      const topEntities = await UserActivity.getTopEntities(entityType, {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        limit
      });

      res.json({
        topEntities,
        entityType,
        period: {
          start: startDate,
          end: endDate
        },
        generated_at: new Date()
      });

    } catch (error) {
      console.error('Get top entities error:', error);
      res.status(500).json({
        error: 'Failed to fetch top entities',
        message: 'An error occurred while fetching top entities'
      });
    }
  }

  // Get system health overview (admin only)
  static async getSystemHealth(req, res) {
    try {
      // Check if user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Admin access required'
        });
      }

      const health = await PerformanceMetric.getSystemHealth();

      res.json({
        health,
        generated_at: new Date()
      });

    } catch (error) {
      console.error('Get system health error:', error);
      res.status(500).json({
        error: 'Failed to fetch system health',
        message: 'An error occurred while fetching system health'
      });
    }
  }

  // Get slow endpoints (admin only)
  static async getSlowEndpoints(req, res) {
    try {
      // Check if user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Admin access required'
        });
      }

      const {
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate = new Date(),
        limit = 10,
        threshold = 1000
      } = req.query;

      const slowEndpoints = await PerformanceMetric.getSlowEndpoints({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        limit,
        threshold
      });

      res.json({
        slowEndpoints,
        threshold: `${threshold}ms`,
        period: {
          start: startDate,
          end: endDate
        },
        generated_at: new Date()
      });

    } catch (error) {
      console.error('Get slow endpoints error:', error);
      res.status(500).json({
        error: 'Failed to fetch slow endpoints',
        message: 'An error occurred while fetching slow endpoints'
      });
    }
  }

  // Clean old analytics data (admin only)
  static async cleanOldData(req, res) {
    try {
      // Check if user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Admin access required'
        });
      }

      const {
        activityRetentionDays = 90,
        metricsRetentionDays = 30
      } = req.body;

      const [deletedActivities, deletedMetrics] = await Promise.all([
        UserActivity.cleanOldActivities(activityRetentionDays),
        PerformanceMetric.cleanOldMetrics(metricsRetentionDays)
      ]);

      res.json({
        message: 'Old analytics data cleaned successfully',
        deletedActivities,
        deletedMetrics,
        retentionPolicies: {
          activities: `${activityRetentionDays} days`,
          metrics: `${metricsRetentionDays} days`
        }
      });

    } catch (error) {
      console.error('Clean old data error:', error);
      res.status(500).json({
        error: 'Failed to clean old data',
        message: 'An error occurred while cleaning old analytics data'
      });
    }
  }
}

module.exports = AnalyticsController;