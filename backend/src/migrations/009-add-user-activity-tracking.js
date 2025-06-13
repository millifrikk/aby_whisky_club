'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    // Create user_activities table for tracking user actions
    await queryInterface.createTable('user_activities', {
      id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true, // Allow null for anonymous/guest activities
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      session_id: {
        type: DataTypes.STRING(128),
        allowNull: true, // Session identifier for anonymous users
        comment: 'Session identifier for tracking anonymous user activities'
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
        allowNull: false,
        comment: 'Type of activity performed by the user'
      },
      entity_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Type of entity the activity relates to (whisky, event, user, etc.)'
      },
      entity_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'ID of the specific entity the activity relates to'
      },
      page_url: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'URL of the page where activity occurred'
      },
      page_title: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Title of the page where activity occurred'
      },
      referrer_url: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'URL the user came from'
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Browser user agent string'
      },
      ip_address: {
        type: DataTypes.INET,
        allowNull: true,
        comment: 'IP address of the user (hashed for privacy)'
      },
      device_type: {
        type: DataTypes.ENUM('desktop', 'tablet', 'mobile', 'unknown'),
        allowNull: true,
        defaultValue: 'unknown',
        comment: 'Type of device used'
      },
      browser: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Browser name and version'
      },
      os: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Operating system'
      },
      country: {
        type: DataTypes.STRING(2),
        allowNull: true,
        comment: 'Country code from IP geolocation'
      },
      duration_ms: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Duration of activity in milliseconds (for timed activities)'
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Additional activity-specific data'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create performance_metrics table for tracking system performance
    await queryInterface.createTable('performance_metrics', {
      id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
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
        allowNull: false,
        comment: 'Type of performance metric'
      },
      endpoint: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'API endpoint or page route'
      },
      value: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
        comment: 'Metric value (time in ms, percentage, count, etc.)'
      },
      unit: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: 'ms',
        comment: 'Unit of measurement (ms, %, count, bytes, etc.)'
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      session_id: {
        type: DataTypes.STRING(128),
        allowNull: true,
        comment: 'Session identifier'
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
        defaultValue: {},
        comment: 'Additional metric-specific data'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('user_activities', ['user_id', 'created_at']);
    await queryInterface.addIndex('user_activities', ['activity_type', 'created_at']);
    await queryInterface.addIndex('user_activities', ['session_id', 'created_at']);
    await queryInterface.addIndex('user_activities', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('user_activities', ['created_at']);

    await queryInterface.addIndex('performance_metrics', ['metric_type', 'created_at']);
    await queryInterface.addIndex('performance_metrics', ['endpoint', 'created_at']);
    await queryInterface.addIndex('performance_metrics', ['user_id', 'created_at']);
    await queryInterface.addIndex('performance_metrics', ['created_at']);

    console.log('✅ User activity tracking and performance metrics tables created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('performance_metrics');
    await queryInterface.dropTable('user_activities');
    console.log('✅ User activity tracking and performance metrics tables dropped');
  }
};