const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserActivity = sequelize.define('UserActivity', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    session_id: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    activity_type: {
      type: DataTypes.ENUM(
        'page_view',
        'whisky_view',
        'rating_create',
        'rating_update',
        'rating_delete',
        'search',
        'filter_apply',
        'wishlist_add',
        'wishlist_remove',
        'comparison_add',
        'comparison_remove',
        'comparison_view',
        'event_view',
        'event_rsvp',
        'profile_view',
        'profile_update',
        'login',
        'logout',
        'register',
        'admin_action',
        'api_call',
        'error'
      ),
      allowNull: false
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    entity_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    page_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    page_title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    referrer_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: true
    },
    device_type: {
      type: DataTypes.ENUM('desktop', 'tablet', 'mobile', 'unknown'),
      allowNull: true,
      defaultValue: 'unknown'
    },
    browser: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    os: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(2),
      allowNull: true
    },
    duration_ms: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'user_activities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // No updates for activity logs
    indexes: [
      {
        fields: ['user_id', 'created_at']
      },
      {
        fields: ['activity_type', 'created_at']
      },
      {
        fields: ['session_id', 'created_at']
      },
      {
        fields: ['entity_type', 'entity_id']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Define associations
  UserActivity.associate = (models) => {
    // Belongs to User (optional for anonymous activities)
    UserActivity.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  // Static methods for activity tracking
  UserActivity.trackActivity = async function(activityData) {
    try {
      // Extract and sanitize data
      const {
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
        metadata = {}
      } = activityData;

      // Parse user agent for device info (basic parsing)
      const deviceInfo = this.parseUserAgent(userAgent);

      const activity = await this.create({
        user_id: userId || null,
        session_id: sessionId,
        activity_type: activityType,
        entity_type: entityType,
        entity_id: entityId,
        page_url: pageUrl,
        page_title: pageTitle,
        referrer_url: referrerUrl,
        user_agent: userAgent,
        ip_address: ipAddress ? this.hashIP(ipAddress) : null, // Hash IP for privacy
        device_type: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        duration_ms: duration,
        metadata
      });

      return activity;
    } catch (error) {
      console.error('Error tracking activity:', error);
      // Don't throw - activity tracking shouldn't break the app
      return null;
    }
  };

  // Get activity analytics
  UserActivity.getActivityAnalytics = async function(options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date(),
      userId = null,
      activityTypes = null,
      groupBy = 'day'
    } = options;

    const whereClause = {
      created_at: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    };

    if (userId) whereClause.user_id = userId;
    if (activityTypes) whereClause.activity_type = { [sequelize.Sequelize.Op.in]: activityTypes };

    // Group by time period
    let dateFormat;
    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00:00';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%u'; // Year-week
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const activities = await this.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', groupBy, sequelize.col('created_at')), 'period'],
        'activity_type',
        'device_type',
        [sequelize.fn('COUNT', '*'), 'count']
      ],
      where: whereClause,
      group: [
        sequelize.fn('DATE_TRUNC', groupBy, sequelize.col('created_at')),
        'activity_type',
        'device_type'
      ],
      order: [[sequelize.fn('DATE_TRUNC', groupBy, sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    return activities;
  };

  // Get top pages/entities
  UserActivity.getTopEntities = async function(entityType, options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      limit = 10
    } = options;

    return this.findAll({
      attributes: [
        'entity_id',
        'entity_type',
        [sequelize.fn('COUNT', '*'), 'view_count'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('user_id'))), 'unique_users']
      ],
      where: {
        entity_type: entityType,
        entity_id: { [sequelize.Sequelize.Op.not]: null },
        created_at: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      group: ['entity_id', 'entity_type'],
      order: [[sequelize.fn('COUNT', '*'), 'DESC']],
      limit: parseInt(limit),
      raw: true
    });
  };

  // Helper method to parse user agent (basic)
  UserActivity.parseUserAgent = function(userAgent) {
    if (!userAgent) return { device: 'unknown', browser: null, os: null };

    const ua = userAgent.toLowerCase();
    
    // Device detection
    let device = 'desktop';
    if (/mobile|android|iphone|ipod|blackberry|iemobile/.test(ua)) {
      device = 'mobile';
    } else if (/tablet|ipad/.test(ua)) {
      device = 'tablet';
    }

    // Browser detection
    let browser = 'unknown';
    if (ua.includes('chrome/')) browser = 'Chrome';
    else if (ua.includes('firefox/')) browser = 'Firefox';
    else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';
    else if (ua.includes('edge/')) browser = 'Edge';

    // OS detection
    let os = 'unknown';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac os')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    return { device, browser, os };
  };

  // Helper method to hash IP addresses for privacy
  UserActivity.hashIP = function(ipAddress) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(ipAddress + process.env.IP_SALT || 'default_salt').digest('hex');
  };

  // Clean old activities (data retention)
  UserActivity.cleanOldActivities = async function(retentionDays = 90) {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    
    const deletedCount = await this.destroy({
      where: {
        created_at: {
          [sequelize.Sequelize.Op.lt]: cutoffDate
        }
      }
    });

    return deletedCount;
  };

module.exports = UserActivity;