const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PerformanceMetric = sequelize.define('PerformanceMetric', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    metric_type: {
      type: DataTypes.ENUM(
        'page_load_time',
        'api_response_time',
        'database_query_time',
        'memory_usage',
        'cpu_usage',
        'error_rate',
        'uptime',
        'concurrent_users',
        'cache_hit_rate',
        'search_performance'
      ),
      allowNull: false
    },
    endpoint: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    value: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'ms'
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
    device_type: {
      type: DataTypes.ENUM('desktop', 'tablet', 'mobile', 'unknown'),
      allowNull: true,
      defaultValue: 'unknown'
    },
    browser: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'performance_metrics',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // No updates for metrics
    indexes: [
      {
        fields: ['metric_type', 'created_at']
      },
      {
        fields: ['endpoint', 'created_at']
      },
      {
        fields: ['user_id', 'created_at']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Define associations
  PerformanceMetric.associate = (models) => {
    // Belongs to User (optional)
    PerformanceMetric.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  // Static methods for performance tracking
  PerformanceMetric.recordMetric = async function(metricData) {
    try {
      const {
        metricType,
        endpoint,
        value,
        unit = 'ms',
        userId,
        sessionId,
        deviceType,
        browser,
        metadata = {}
      } = metricData;

      const metric = await this.create({
        metric_type: metricType,
        endpoint,
        value: parseFloat(value),
        unit,
        user_id: userId || null,
        session_id: sessionId,
        device_type: deviceType || 'unknown',
        browser,
        metadata
      });

      return metric;
    } catch (error) {
      console.error('Error recording performance metric:', error);
      // Don't throw - performance tracking shouldn't break the app
      return null;
    }
  };

  // Get performance analytics
  PerformanceMetric.getPerformanceAnalytics = async function(options = {}) {
    const {
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      endDate = new Date(),
      metricTypes = null,
      endpoints = null,
      groupBy = 'hour'
    } = options;

    const whereClause = {
      created_at: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    };

    if (metricTypes) whereClause.metric_type = { [sequelize.Sequelize.Op.in]: metricTypes };
    if (endpoints) whereClause.endpoint = { [sequelize.Sequelize.Op.in]: endpoints };

    const metrics = await this.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', groupBy, sequelize.col('created_at')), 'period'],
        'metric_type',
        'endpoint',
        [sequelize.fn('AVG', sequelize.col('value')), 'avg_value'],
        [sequelize.fn('MIN', sequelize.col('value')), 'min_value'],
        [sequelize.fn('MAX', sequelize.col('value')), 'max_value'],
        [sequelize.fn('COUNT', '*'), 'count']
      ],
      where: whereClause,
      group: [
        sequelize.fn('DATE_TRUNC', groupBy, sequelize.col('created_at')),
        'metric_type',
        'endpoint'
      ],
      order: [[sequelize.fn('DATE_TRUNC', groupBy, sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    return metrics;
  };

  // Get slow endpoints
  PerformanceMetric.getSlowEndpoints = async function(options = {}) {
    const {
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate = new Date(),
      limit = 10,
      threshold = 1000 // ms
    } = options;

    return this.findAll({
      attributes: [
        'endpoint',
        [sequelize.fn('AVG', sequelize.col('value')), 'avg_response_time'],
        [sequelize.fn('MAX', sequelize.col('value')), 'max_response_time'],
        [sequelize.fn('COUNT', '*'), 'request_count']
      ],
      where: {
        metric_type: 'api_response_time',
        value: { [sequelize.Sequelize.Op.gte]: threshold },
        created_at: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      group: ['endpoint'],
      order: [[sequelize.fn('AVG', sequelize.col('value')), 'DESC']],
      limit: parseInt(limit),
      raw: true
    });
  };

  // Get system health overview
  PerformanceMetric.getSystemHealth = async function(options = {}) {
    const {
      startDate = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    } = options;

    const healthMetrics = await this.findAll({
      attributes: [
        'metric_type',
        [sequelize.fn('AVG', sequelize.col('value')), 'avg_value'],
        [sequelize.fn('MAX', sequelize.col('value')), 'max_value'],
        [sequelize.fn('COUNT', '*'), 'sample_count']
      ],
      where: {
        metric_type: {
          [sequelize.Sequelize.Op.in]: [
            'api_response_time',
            'database_query_time',
            'memory_usage',
            'cpu_usage',
            'error_rate'
          ]
        },
        created_at: {
          [sequelize.Sequelize.Op.gte]: startDate
        }
      },
      group: ['metric_type'],
      raw: true
    });

    // Calculate health scores
    const health = {
      overall_score: 100,
      metrics: {},
      status: 'healthy'
    };

    healthMetrics.forEach(metric => {
      const type = metric.metric_type;
      const avgValue = parseFloat(metric.avg_value);
      
      let score = 100;
      let status = 'healthy';

      // Define thresholds for different metrics
      switch (type) {
        case 'api_response_time':
          if (avgValue > 2000) { score = 30; status = 'critical'; }
          else if (avgValue > 1000) { score = 60; status = 'warning'; }
          else if (avgValue > 500) { score = 80; status = 'good'; }
          break;
        case 'database_query_time':
          if (avgValue > 1000) { score = 30; status = 'critical'; }
          else if (avgValue > 500) { score = 60; status = 'warning'; }
          else if (avgValue > 200) { score = 80; status = 'good'; }
          break;
        case 'memory_usage':
          if (avgValue > 90) { score = 30; status = 'critical'; }
          else if (avgValue > 80) { score = 60; status = 'warning'; }
          else if (avgValue > 70) { score = 80; status = 'good'; }
          break;
        case 'cpu_usage':
          if (avgValue > 90) { score = 30; status = 'critical'; }
          else if (avgValue > 80) { score = 60; status = 'warning'; }
          else if (avgValue > 60) { score = 80; status = 'good'; }
          break;
        case 'error_rate':
          if (avgValue > 5) { score = 30; status = 'critical'; }
          else if (avgValue > 2) { score = 60; status = 'warning'; }
          else if (avgValue > 1) { score = 80; status = 'good'; }
          break;
      }

      health.metrics[type] = {
        value: avgValue,
        score,
        status,
        sample_count: parseInt(metric.sample_count)
      };

      // Update overall score (weighted average)
      health.overall_score = Math.min(health.overall_score, score);
    });

    // Set overall status
    if (health.overall_score >= 80) health.status = 'healthy';
    else if (health.overall_score >= 60) health.status = 'warning';
    else health.status = 'critical';

    return health;
  };

  // Clean old metrics (data retention)
  PerformanceMetric.cleanOldMetrics = async function(retentionDays = 30) {
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

module.exports = PerformanceMetric;