const { User, Whisky, Rating, NewsEvent, EventRSVP, SystemSetting } = require('../models');
const { Op } = require('sequelize');

class AdminController {
  // Get comprehensive dashboard statistics
  static async getDashboardStats(req, res) {
    try {
      // Use simple, reliable queries
      const [
        userCount,
        whiskyCount,
        ratingCount,
        eventCount,
        userStats,
        whiskyAvailableCount
      ] = await Promise.all([
        User.count(),
        Whisky.count(),
        Rating.count(),
        NewsEvent.count(),
        User.findAll({
          attributes: [
            'role',
            [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
          ],
          group: ['role'],
          raw: true
        }),
        Whisky.count({ where: { is_available: true } })
      ]);

      // Process user statistics
      const userStatsObj = userStats.reduce((acc, stat) => {
        acc[stat.role] = parseInt(stat.count);
        return acc;
      }, {});

      // Calculate additional stats
      const avgRating = ratingCount > 0 ? await Rating.findOne({
        attributes: [[Rating.sequelize.fn('AVG', Rating.sequelize.col('overall_score')), 'avg_rating']],
        raw: true
      }) : null;

      const distinctDistilleries = await Whisky.count({
        distinct: true,
        col: 'distillery'
      });

      // Get events breakdown
      const eventTypes = await NewsEvent.findAll({
        attributes: [
          'type',
          [NewsEvent.sequelize.fn('COUNT', NewsEvent.sequelize.col('id')), 'count']
        ],
        group: ['type'],
        raw: true
      });

      const publishedCount = await NewsEvent.count({ where: { is_published: true } });

      // Process event types
      const eventBreakdown = eventTypes.reduce((acc, event) => {
        acc[event.type] = parseInt(event.count);
        return acc;
      }, {});

      res.json({
        users: {
          total_members: userCount,
          admins: userStatsObj.admin || 0,
          members: userStatsObj.member || 0
        },
        whiskies: {
          total_whiskies: whiskyCount,
          available_whiskies: whiskyAvailableCount,
          total_distilleries: distinctDistilleries,
          total_countries: distinctDistilleries // Using distilleries as proxy for regions
        },
        ratings: {
          total_ratings: ratingCount,
          average_rating: avgRating?.avg_rating ? parseFloat(avgRating.avg_rating).toFixed(1) : null,
          active_raters: ratingCount > 0 ? await Rating.count({ distinct: true, col: 'user_id' }) : 0
        },
        events: {
          total_events: eventCount,
          events_count: eventBreakdown.event || 0,
          news_count: eventBreakdown.news || 0,
          published_count: publishedCount
        },
        charts: {
          monthly_registrations: [],
          regional_breakdown: []
        }
      });

    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        error: 'Failed to fetch dashboard statistics',
        message: 'An error occurred while fetching dashboard data'
      });
    }
  }

  // Get all users with filtering and pagination
  static async getAllUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        role,
        status,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      // Build where clause
      const where = {};

      if (search) {
        where[Op.or] = [
          { username: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (role && role !== 'all') {
        where.role = role;
      }

      if (status === 'active') {
        where.is_active = true;
      } else if (status === 'inactive') {
        where.is_active = false;
      }

      // Build order clause
      const validSortFields = ['username', 'email', 'first_name', 'last_name', 'role', 'created_at', 'last_login'];
      const orderField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
      const orderDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Calculate pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: users } = await User.findAndCountAll({
        where,
        order: [[orderField, orderDirection]],
        limit: parseInt(limit),
        offset,
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            model: Rating,
            as: 'ratings',
            attributes: ['id'],
            required: false
          }
        ]
      });

      // Add rating count to each user
      const usersWithStats = users.map(user => ({
        ...user.toJSON(),
        rating_count: user.ratings ? user.ratings.length : 0
      }));

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        users: usersWithStats,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: count,
          limit: parseInt(limit),
          has_next: parseInt(page) < totalPages,
          has_prev: parseInt(page) > 1
        },
        filters: {
          search,
          role,
          status
        }
      });

    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        error: 'Failed to fetch users',
        message: 'An error occurred while fetching users'
      });
    }
  }

  // Update user role or status
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { role, is_active } = req.body;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'The requested user could not be found'
        });
      }

      // Prevent admin from deactivating themselves
      if (req.user.id === id && is_active === false) {
        return res.status(400).json({
          error: 'Invalid operation',
          message: 'You cannot deactivate your own account'
        });
      }

      // Prevent admin from demoting themselves
      if (req.user.id === id && role && role !== 'admin') {
        return res.status(400).json({
          error: 'Invalid operation',
          message: 'You cannot change your own role'
        });
      }

      const updateData = {};
      if (role !== undefined) updateData.role = role;
      if (is_active !== undefined) updateData.is_active = is_active;

      const updatedUser = await user.update(updateData);

      res.json({
        message: 'User updated successfully',
        user: updatedUser.toSafeObject()
      });

    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        error: 'Failed to update user',
        message: 'An error occurred while updating the user'
      });
    }
  }

  // Get recent activity across the platform
  static async getRecentActivity(req, res) {
    try {
      const { limit = 20 } = req.query;

      const [recentRatings, recentUsers, recentEvents] = await Promise.all([
        // Recent ratings
        Rating.findAll({
          limit: parseInt(limit / 3),
          order: [['created_at', 'DESC']],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'first_name', 'last_name']
            },
            {
              model: Whisky,
              as: 'whisky',
              attributes: ['id', 'name', 'distillery']
            }
          ]
        }),

        // Recent user registrations
        User.findAll({
          limit: parseInt(limit / 3),
          order: [['created_at', 'DESC']],
          attributes: ['id', 'username', 'first_name', 'last_name', 'created_at', 'role']
        }),

        // Recent events/news
        NewsEvent.findAll({
          limit: parseInt(limit / 3),
          order: [['created_at', 'DESC']],
          attributes: ['id', 'title', 'type', 'created_at', 'is_published'],
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'first_name', 'last_name']
            }
          ]
        })
      ]);

      // Combine and sort all activities
      const activities = [
        ...recentRatings.map(rating => ({
          type: 'rating',
          id: rating.id,
          timestamp: rating.created_at,
          data: rating.toJSON()
        })),
        ...recentUsers.map(user => ({
          type: 'user_registration',
          id: user.id,
          timestamp: user.created_at,
          data: user.toJSON()
        })),
        ...recentEvents.map(event => ({
          type: 'content_creation',
          id: event.id,
          timestamp: event.created_at,
          data: event.toJSON()
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
       .slice(0, parseInt(limit));

      res.json({
        activities,
        total_count: activities.length
      });

    } catch (error) {
      console.error('Get recent activity error:', error);
      res.status(500).json({
        error: 'Failed to fetch recent activity',
        message: 'An error occurred while fetching recent activity'
      });
    }
  }

  // Get content requiring moderation
  static async getContentForModeration(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        content_type = 'all', // 'ratings', 'events', 'all'
        status = 'all', // 'flagged', 'pending', 'approved', 'all'
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      let contentItems = [];

      // Get ratings with potential moderation issues
      if (content_type === 'all' || content_type === 'ratings') {
        const ratings = await Rating.findAll({
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'first_name', 'last_name']
            },
            {
              model: Whisky,
              as: 'whisky',
              attributes: ['id', 'name', 'distillery']
            }
          ],
          order: [['created_at', 'DESC']],
          limit: content_type === 'ratings' ? parseInt(limit) : Math.floor(parseInt(limit) / 2)
        });

        contentItems.push(...ratings.map(rating => ({
          type: 'rating',
          id: rating.id,
          content: rating.review_text || 'No review text',
          author: rating.user,
          related_item: rating.whisky,
          created_at: rating.created_at,
          score: rating.overall_score,
          status: 'published', // Default status for ratings
          flagged: false // Could add flagging system later
        })));
      }

      // Get news/events
      if (content_type === 'all' || content_type === 'events') {
        const newsEvents = await NewsEvent.findAll({
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'first_name', 'last_name']
            }
          ],
          order: [['created_at', 'DESC']],
          limit: content_type === 'events' ? parseInt(limit) : Math.floor(parseInt(limit) / 2)
        });

        contentItems.push(...newsEvents.map(event => ({
          type: 'news_event',
          id: event.id,
          content: event.content.substring(0, 200) + '...',
          title: event.title,
          author: event.author,
          created_at: event.created_at,
          event_type: event.type,
          status: event.is_published ? 'published' : 'draft',
          flagged: false
        })));
      }

      // Sort combined results
      contentItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Apply pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const paginatedItems = contentItems.slice(offset, offset + parseInt(limit));
      const totalCount = contentItems.length;
      const totalPages = Math.ceil(totalCount / parseInt(limit));

      res.json({
        content: paginatedItems,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: totalCount,
          limit: parseInt(limit),
          has_next: parseInt(page) < totalPages,
          has_prev: parseInt(page) > 1
        },
        filters: {
          content_type,
          status
        }
      });

    } catch (error) {
      console.error('Get content for moderation error:', error);
      res.status(500).json({
        error: 'Failed to fetch content for moderation',
        message: 'An error occurred while fetching content'
      });
    }
  }

  // Moderate content (approve, reject, flag)
  static async moderateContent(req, res) {
    try {
      const { content_type, content_id } = req.params;
      const { action, reason } = req.body; // action: 'approve', 'reject', 'flag', 'delete'

      let result;
      
      if (content_type === 'rating') {
        const rating = await Rating.findByPk(content_id);
        if (!rating) {
          return res.status(404).json({
            error: 'Rating not found',
            message: 'The specified rating could not be found'
          });
        }

        switch (action) {
          case 'delete':
            await rating.destroy();
            result = { message: 'Rating deleted successfully' };
            break;
          case 'flag':
            // Could add a flagged field to rating model
            result = { message: 'Rating flagged for review' };
            break;
          default:
            result = { message: 'Rating status updated' };
        }
      } else if (content_type === 'news_event') {
        const newsEvent = await NewsEvent.findByPk(content_id);
        if (!newsEvent) {
          return res.status(404).json({
            error: 'News/Event not found',
            message: 'The specified news/event could not be found'
          });
        }

        switch (action) {
          case 'approve':
            await newsEvent.update({ is_published: true });
            result = { message: 'Content published successfully' };
            break;
          case 'reject':
            await newsEvent.update({ is_published: false });
            result = { message: 'Content unpublished successfully' };
            break;
          case 'delete':
            await newsEvent.destroy();
            result = { message: 'Content deleted successfully' };
            break;
          default:
            result = { message: 'Content status updated' };
        }
      } else {
        return res.status(400).json({
          error: 'Invalid content type',
          message: 'Content type must be rating or news_event'
        });
      }

      res.json({
        ...result,
        action,
        content_type,
        content_id,
        moderated_by: req.user.id,
        moderated_at: new Date()
      });

    } catch (error) {
      console.error('Moderate content error:', error);
      res.status(500).json({
        error: 'Failed to moderate content',
        message: 'An error occurred while moderating content'
      });
    }
  }

  // Get system health and performance metrics
  static async getSystemMetrics(req, res) {
    try {
      const [
        dbMetrics,
        contentMetrics,
        userEngagement
      ] = await Promise.all([
        // Database size metrics (simplified)
        User.sequelize.query(`
          SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
          FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        `, { type: User.sequelize.QueryTypes.SELECT }),

        // Content metrics
        Promise.resolve({
          published_content: await NewsEvent.count({ where: { is_published: true } }),
          draft_content: await NewsEvent.count({ where: { is_published: false } }),
          total_ratings: await Rating.count(),
          available_whiskies: await Whisky.count({ where: { is_available: true } })
        }),

        // User engagement metrics (last 30 days)
        User.sequelize.query(`
          SELECT 
            COUNT(DISTINCT user_id) as active_users,
            COUNT(*) as total_ratings
          FROM ratings 
          WHERE created_at >= NOW() - INTERVAL '30 days'
        `, { type: User.sequelize.QueryTypes.SELECT })
      ]);

      res.json({
        database: {
          tables: dbMetrics
        },
        content: contentMetrics,
        engagement: {
          active_users_30d: userEngagement[0]?.active_users || 0,
          ratings_30d: userEngagement[0]?.total_ratings || 0
        }
      });

    } catch (error) {
      console.error('Get system metrics error:', error);
      res.status(500).json({
        error: 'Failed to fetch system metrics',
        message: 'An error occurred while fetching system metrics'
      });
    }
  }

  // System Settings Management

  // Get all system settings
  static async getSystemSettings(req, res) {
    try {
      const { category } = req.query;

      let where = {};
      if (category && category !== 'all') {
        where.category = category;
      }

      const settings = await SystemSetting.findAll({
        where,
        order: [['category', 'ASC'], ['key', 'ASC']]
      });

      // Group settings by category
      const settingsByCategory = settings.reduce((acc, setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = [];
        }
        
        acc[setting.category].push({
          id: setting.id,
          key: setting.key,
          value: setting.getParsedValue(),
          data_type: setting.data_type,
          description: setting.description,
          is_readonly: setting.is_readonly,
          validation_rules: setting.validation_rules
        });
        
        return acc;
      }, {});

      res.json({
        settings_by_category: settingsByCategory,
        total_count: settings.length
      });

    } catch (error) {
      console.error('Get system settings error:', error);
      res.status(500).json({
        error: 'Failed to fetch system settings',
        message: 'An error occurred while fetching system settings'
      });
    }
  }

  // Get enhanced system settings with search metadata
  static async getEnhancedSystemSettings(req, res) {
    try {
      const { category } = req.query;

      let where = {};
      if (category && category !== 'all') {
        where.category = category;
      }

      const settings = await SystemSetting.findAll({
        where,
        order: [['category', 'ASC'], ['key', 'ASC']]
      });

      // Add search metadata to each setting
      const enhancedSettings = settings.map(setting => {
        const searchMetadata = AdminController.getSearchMetadata(setting.key);
        return {
          id: setting.id,
          key: setting.key,
          value: setting.getParsedValue(),
          data_type: setting.data_type,
          category: setting.category,
          description: setting.description,
          is_readonly: setting.is_readonly,
          validation_rules: setting.validation_rules,
          search: searchMetadata
        };
      });

      // Group by category for easier frontend handling
      const settingsByCategory = enhancedSettings.reduce((acc, setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = [];
        }
        acc[setting.category].push(setting);
        return acc;
      }, {});

      res.json({
        settings: enhancedSettings,
        settings_by_category: settingsByCategory,
        categories: Object.keys(settingsByCategory).sort(),
        total_count: enhancedSettings.length
      });

    } catch (error) {
      console.error('Get enhanced system settings error:', error);
      res.status(500).json({
        error: 'Failed to fetch enhanced system settings',
        message: 'An error occurred while fetching enhanced system settings'
      });
    }
  }

  // Get search metadata for a setting
  static getSearchMetadata(settingKey) {
    const searchData = {
      // General Settings
      'site_name': {
        title: 'Site Name',
        keywords: ['name', 'title', 'club', 'brand', 'site'],
        synonyms: ['website name', 'club name', 'title', 'brand name'],
        weight: 'high',
        related: ['site_description', 'club_motto']
      },
      'site_description': {
        title: 'Site Description',
        keywords: ['description', 'about', 'tagline', 'summary'],
        synonyms: ['about us', 'site summary', 'club description'],
        weight: 'high',
        related: ['site_name', 'club_motto']
      },
      'allow_registration': {
        title: 'Allow Registration',
        keywords: ['registration', 'signup', 'join', 'new users', 'members'],
        synonyms: ['sign up', 'new members', 'user registration', 'join club'],
        weight: 'high',
        related: ['require_email_verification', 'registration_approval_required']
      },
      'require_email_verification': {
        title: 'Email Verification Required',
        keywords: ['email', 'verification', 'confirm', 'validate', 'activate'],
        synonyms: ['email confirmation', 'account activation', 'verify email'],
        weight: 'high',
        related: ['allow_registration', 'admin_email']
      },

      // Email Settings
      'email_notifications_enabled': {
        title: 'Email Notifications',
        keywords: ['email', 'notifications', 'alerts', 'messages'],
        synonyms: ['email alerts', 'notification emails', 'email messages'],
        weight: 'high',
        related: ['admin_email', 'smtp_enabled']
      },
      'admin_email': {
        title: 'Admin Email',
        keywords: ['admin', 'email', 'administrator', 'contact'],
        synonyms: ['administrator email', 'admin contact', 'system email'],
        weight: 'medium',
        related: ['email_notifications_enabled']
      },
      'smtp_enabled': {
        title: 'SMTP Email System',
        keywords: ['smtp', 'email', 'mail', 'sending', 'server'],
        synonyms: ['email server', 'mail server', 'email sending'],
        weight: 'medium',
        related: ['smtp_host', 'smtp_port', 'smtp_username']
      },
      'smtp_host': {
        title: 'SMTP Server Host',
        keywords: ['smtp', 'host', 'server', 'mail server', 'email'],
        synonyms: ['mail server', 'email host', 'smtp server'],
        weight: 'low',
        related: ['smtp_enabled', 'smtp_port']
      },
      'smtp_port': {
        title: 'SMTP Port',
        keywords: ['smtp', 'port', 'email', 'mail', 'connection'],
        synonyms: ['mail port', 'email port', 'smtp connection'],
        weight: 'low',
        related: ['smtp_host', 'smtp_enabled']
      },

      // Security Settings
      'enable_two_factor_auth': {
        title: 'Two-Factor Authentication',
        keywords: ['2FA', 'two factor', 'authentication', 'security', 'TOTP', 'MFA'],
        synonyms: ['2FA', 'dual authentication', 'multi-factor auth', 'security code'],
        weight: 'high',
        related: ['login_attempt_limit', 'account_lockout_duration']
      },
      'password_complexity_rules': {
        title: 'Password Complexity Rules',
        keywords: ['password', 'complexity', 'rules', 'requirements', 'security', 'strength'],
        synonyms: ['password rules', 'password requirements', 'password strength'],
        weight: 'high',
        related: ['enable_two_factor_auth', 'login_attempt_limit']
      },
      'login_attempt_limit': {
        title: 'Login Attempt Limit',
        keywords: ['login', 'attempts', 'limit', 'security', 'lockout', 'brute force'],
        synonyms: ['failed logins', 'login limit', 'attempt limit', 'security limit'],
        weight: 'medium',
        related: ['account_lockout_duration', 'enable_two_factor_auth']
      },
      'account_lockout_duration': {
        title: 'Account Lockout Duration',
        keywords: ['lockout', 'duration', 'timeout', 'lock', 'security', 'minutes'],
        synonyms: ['lock duration', 'lockout time', 'account lock'],
        weight: 'medium',
        related: ['login_attempt_limit']
      },
      'session_timeout_hours': {
        title: 'Session Timeout',
        keywords: ['session', 'timeout', 'hours', 'logout', 'auto logout'],
        synonyms: ['session duration', 'auto logout', 'session expiry'],
        weight: 'medium',
        related: ['idle_timeout_minutes']
      },
      'idle_timeout_minutes': {
        title: 'Idle Timeout',
        keywords: ['idle', 'timeout', 'minutes', 'inactivity', 'auto logout'],
        synonyms: ['inactivity timeout', 'idle time', 'inactive logout'],
        weight: 'medium',
        related: ['session_timeout_hours']
      },

      // Appearance Settings
      'site_logo_url': {
        title: 'Site Logo',
        keywords: ['logo', 'image', 'brand', 'header', 'navigation'],
        synonyms: ['club logo', 'brand image', 'header logo'],
        weight: 'high',
        related: ['site_favicon_url', 'primary_color']
      },
      'site_favicon_url': {
        title: 'Site Favicon',
        keywords: ['favicon', 'icon', 'browser', 'tab', 'bookmark'],
        synonyms: ['browser icon', 'tab icon', 'site icon'],
        weight: 'low',
        related: ['site_logo_url']
      },
      'primary_color': {
        title: 'Primary Brand Color',
        keywords: ['color', 'primary', 'brand', 'theme', 'design'],
        synonyms: ['main color', 'brand color', 'theme color'],
        weight: 'medium',
        related: ['secondary_color', 'site_logo_url']
      },
      'secondary_color': {
        title: 'Secondary Brand Color',
        keywords: ['color', 'secondary', 'accent', 'theme', 'design'],
        synonyms: ['accent color', 'secondary theme', 'second color'],
        weight: 'medium',
        related: ['primary_color']
      },
      'enable_dark_mode': {
        title: 'Dark Mode',
        keywords: ['dark', 'mode', 'theme', 'night', 'appearance'],
        synonyms: ['dark theme', 'night mode', 'dark appearance'],
        weight: 'high',
        related: ['primary_color', 'secondary_color']
      },
      'club_motto': {
        title: 'Club Motto',
        keywords: ['motto', 'tagline', 'slogan', 'message'],
        synonyms: ['club slogan', 'tagline', 'club message'],
        weight: 'low',
        related: ['site_name', 'site_description']
      },

      // Social Features
      'enable_user_messaging': {
        title: 'User Messaging',
        keywords: ['messaging', 'chat', 'direct message', 'DM', 'communication'],
        synonyms: ['direct messages', 'user chat', 'private messages'],
        weight: 'medium',
        related: ['enable_user_follows', 'enable_social_sharing']
      },
      'enable_social_sharing': {
        title: 'Social Sharing',
        keywords: ['social', 'sharing', 'share', 'facebook', 'twitter', 'media'],
        synonyms: ['social media', 'share buttons', 'social networks'],
        weight: 'medium',
        related: ['enable_user_messaging', 'enable_user_follows']
      },
      'enable_user_follows': {
        title: 'User Following',
        keywords: ['follow', 'friends', 'connections', 'social', 'network'],
        synonyms: ['user friends', 'follow users', 'social connections'],
        weight: 'medium',
        related: ['enable_user_messaging', 'enable_social_sharing']
      },
      'enable_whisky_tags': {
        title: 'Whisky Tags',
        keywords: ['tags', 'tagging', 'labels', 'categories', 'classification'],
        synonyms: ['whisky labels', 'whisky categories', 'tagging system'],
        weight: 'medium',
        related: ['auto_approve_whiskies']
      },
      'auto_approve_whiskies': {
        title: 'Auto-Approve Whiskies',
        keywords: ['auto', 'approve', 'approval', 'automatic', 'whiskies', 'moderation'],
        synonyms: ['automatic approval', 'auto moderation', 'whisky approval'],
        weight: 'medium',
        related: ['enable_whisky_tags', 'whisky_submission_guidelines']
      },
      'whisky_submission_guidelines': {
        title: 'Whisky Submission Guidelines',
        keywords: ['guidelines', 'submission', 'rules', 'instructions', 'whiskies'],
        synonyms: ['submission rules', 'whisky rules', 'posting guidelines'],
        weight: 'low',
        related: ['auto_approve_whiskies']
      },

      // Content Settings
      'max_whiskies_per_page': {
        title: 'Whiskies Per Page',
        keywords: ['pagination', 'page', 'limit', 'whiskies', 'display'],
        synonyms: ['page size', 'display limit', 'pagination limit'],
        weight: 'low',
        related: ['allow_guest_ratings']
      },
      'allow_guest_ratings': {
        title: 'Guest Ratings',
        keywords: ['guest', 'ratings', 'anonymous', 'public', 'view'],
        synonyms: ['public ratings', 'anonymous ratings', 'guest access'],
        weight: 'medium',
        related: ['max_whiskies_per_page', 'rating_submission_enabled']
      },
      'default_whisky_image': {
        title: 'Default Whisky Image',
        keywords: ['default', 'image', 'whisky', 'placeholder', 'fallback'],
        synonyms: ['placeholder image', 'fallback image', 'default picture'],
        weight: 'low',
        related: ['site_logo_url']
      }
    };

    // Default fallback for any unmapped settings
    return searchData[settingKey] || {
      title: settingKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      keywords: settingKey.split('_'),
      synonyms: [],
      weight: 'low',
      related: []
    };
  }

  // Update system setting
  static async updateSystemSetting(req, res) {
    try {
      const { key } = req.params;
      const { value } = req.body;

      const setting = await SystemSetting.findOne({ where: { key } });

      if (!setting) {
        return res.status(404).json({
          error: 'Setting not found',
          message: 'The requested setting could not be found'
        });
      }

      if (setting.is_readonly) {
        return res.status(400).json({
          error: 'Setting is read-only',
          message: 'This setting cannot be modified through the interface'
        });
      }

      // Validate value against validation rules if they exist
      if (setting.validation_rules) {
        const validation = this.validateSettingValue(value, setting.validation_rules, setting.data_type);
        if (!validation.valid) {
          return res.status(400).json({
            error: 'Invalid value',
            message: validation.message
          });
        }
      }

      setting.setParsedValue(value);
      await setting.save();

      res.json({
        message: 'Setting updated successfully',
        setting: {
          key: setting.key,
          value: setting.getParsedValue(),
          data_type: setting.data_type
        }
      });

    } catch (error) {
      console.error('Update system setting error:', error);
      res.status(500).json({
        error: 'Failed to update setting',
        message: 'An error occurred while updating the setting'
      });
    }
  }

  // Create new system setting
  static async createSystemSetting(req, res) {
    try {
      const {
        key,
        value,
        data_type = 'string',
        category = 'general',
        description,
        is_public = false,
        is_readonly = false,
        validation_rules
      } = req.body;

      // Check if setting already exists
      const existingSetting = await SystemSetting.findOne({ where: { key } });
      if (existingSetting) {
        return res.status(400).json({
          error: 'Setting already exists',
          message: 'A setting with this key already exists'
        });
      }

      const setting = await SystemSetting.create({
        key,
        data_type,
        category,
        description,
        is_public,
        is_readonly,
        validation_rules
      });

      setting.setParsedValue(value);
      await setting.save();

      res.status(201).json({
        message: 'Setting created successfully',
        setting: {
          id: setting.id,
          key: setting.key,
          value: setting.getParsedValue(),
          data_type: setting.data_type,
          category: setting.category
        }
      });

    } catch (error) {
      console.error('Create system setting error:', error);
      res.status(500).json({
        error: 'Failed to create setting',
        message: 'An error occurred while creating the setting'
      });
    }
  }

  // Delete system setting
  static async deleteSystemSetting(req, res) {
    try {
      const { key } = req.params;

      const setting = await SystemSetting.findOne({ where: { key } });

      if (!setting) {
        return res.status(404).json({
          error: 'Setting not found',
          message: 'The requested setting could not be found'
        });
      }

      if (setting.is_readonly) {
        return res.status(400).json({
          error: 'Setting is read-only',
          message: 'This setting cannot be deleted'
        });
      }

      await setting.destroy();

      res.json({
        message: 'Setting deleted successfully',
        key: setting.key
      });

    } catch (error) {
      console.error('Delete system setting error:', error);
      res.status(500).json({
        error: 'Failed to delete setting',
        message: 'An error occurred while deleting the setting'
      });
    }
  }

  // Initialize default system settings (route handler)
  static async initializeDefaultSettings(req, res) {
    try {
      await AdminController.runDefaultSettingsInitialization();
      res.json({
        message: 'Default system settings initialized successfully',
        status: 'success'
      });
    } catch (error) {
      console.error('Error initializing default settings:', error);
      res.status(500).json({
        error: 'Failed to initialize settings',
        message: 'An error occurred while initializing default settings'
      });
    }
  }

  // Initialize default system settings (utility method)
  static async runDefaultSettingsInitialization() {
    try {
      const defaultSettings = [
        // General settings
        {
          key: 'site_name',
          value: 'Åby Whisky Club',
          data_type: 'string',
          category: 'general',
          description: 'Name of the whisky club',
          is_public: true
        },
        {
          key: 'site_description',
          value: 'A community for whisky enthusiasts',
          data_type: 'string',
          category: 'general',
          description: 'Description of the whisky club',
          is_public: true
        },
        {
          key: 'allow_registration',
          value: true,
          data_type: 'boolean',
          category: 'general',
          description: 'Allow new user registrations',
          is_public: false
        },
        {
          key: 'require_email_verification',
          value: false,
          data_type: 'boolean',
          category: 'general',
          description: 'Require email verification for new accounts',
          is_public: false
        },

        // Email settings
        {
          key: 'email_notifications_enabled',
          value: false,
          data_type: 'boolean',
          category: 'email',
          description: 'Enable email notifications',
          is_public: false
        },
        {
          key: 'admin_email',
          value: 'admin@abywhiskyclub.com',
          data_type: 'string',
          category: 'email',
          description: 'Administrator email address',
          is_public: false
        },

        // Security settings
        {
          key: 'session_timeout',
          value: 24,
          data_type: 'number',
          category: 'security',
          description: 'Session timeout in hours',
          is_public: false
        },
        {
          key: 'max_login_attempts',
          value: 5,
          data_type: 'number',
          category: 'security',
          description: 'Maximum login attempts before lockout',
          is_public: false
        },

        // Content settings
        {
          key: 'max_whiskies_per_page',
          value: 20,
          data_type: 'number',
          category: 'content',
          description: 'Maximum whiskies to display per page',
          is_public: true
        },
        {
          key: 'allow_guest_ratings',
          value: false,
          data_type: 'boolean',
          category: 'content',
          description: 'Allow guest users to view ratings',
          is_public: true
        },
        {
          key: 'default_whisky_image',
          value: '/images/aby_whisky_club_header01.png',
          data_type: 'string',
          category: 'content',
          description: 'Default image URL for whiskies without images',
          is_public: true,
          validation_rules: {
            pattern: '^(https?://|/)',
            patternMessage: 'Must be a valid URL or relative path starting with /'
          }
        },

        // Phase 10: Appearance & Branding Settings
        {
          key: 'site_logo_url',
          value: '',
          data_type: 'string',
          category: 'appearance',
          description: 'Club logo URL for navigation header',
          is_public: true,
          validation_rules: {
            pattern: '^(https?://|/|$)',
            patternMessage: 'Must be a valid URL or relative path starting with /'
          }
        },
        {
          key: 'site_favicon_url',
          value: '',
          data_type: 'string',
          category: 'appearance',
          description: 'Custom favicon URL for browser tabs',
          is_public: true,
          validation_rules: {
            pattern: '^(https?://|/|$)',
            patternMessage: 'Must be a valid URL or relative path starting with /'
          }
        },
        {
          key: 'primary_color',
          value: '#d97706',
          data_type: 'string',
          category: 'appearance',
          description: 'Primary brand color (hex code)',
          is_public: true,
          validation_rules: {
            pattern: '^#[0-9A-Fa-f]{6}$',
            patternMessage: 'Must be a valid hex color code (e.g., #d97706)'
          }
        },
        {
          key: 'secondary_color',
          value: '#f59e0b',
          data_type: 'string',
          category: 'appearance',
          description: 'Secondary brand color (hex code)',
          is_public: true,
          validation_rules: {
            pattern: '^#[0-9A-Fa-f]{6}$',
            patternMessage: 'Must be a valid hex color code (e.g., #f59e0b)'
          }
        },
        {
          key: 'hero_background_image',
          value: '',
          data_type: 'string',
          category: 'appearance',
          description: 'Homepage hero section background image URL',
          is_public: true,
          validation_rules: {
            pattern: '^(https?://|/|$)',
            patternMessage: 'Must be a valid URL or relative path starting with /'
          }
        },
        {
          key: 'club_motto',
          value: 'Discover exceptional whiskies together',
          data_type: 'string',
          category: 'appearance',
          description: 'Club tagline displayed on homepage',
          is_public: true,
          validation_rules: {
            maxLength: 200,
            maxLengthMessage: 'Motto cannot exceed 200 characters'
          }
        },
        {
          key: 'footer_text',
          value: '© 2025 Åby Whisky Club. All rights reserved.',
          data_type: 'string',
          category: 'appearance',
          description: 'Custom footer content and copyright',
          is_public: true,
          validation_rules: {
            maxLength: 500,
            maxLengthMessage: 'Footer text cannot exceed 500 characters'
          }
        },

        // Email & Notification Settings
        {
          key: 'smtp_host',
          value: '',
          data_type: 'string',
          category: 'email',
          description: 'SMTP server hostname',
          is_public: false
        },
        {
          key: 'smtp_port',
          value: 587,
          data_type: 'number',
          category: 'email',
          description: 'SMTP server port',
          is_public: false,
          validation_rules: {
            min: 1,
            max: 65535,
            minMessage: 'Port must be between 1 and 65535'
          }
        },
        {
          key: 'smtp_username',
          value: '',
          data_type: 'string',
          category: 'email',
          description: 'SMTP authentication username',
          is_public: false
        },
        {
          key: 'smtp_password',
          value: '',
          data_type: 'string',
          category: 'email',
          description: 'SMTP authentication password',
          is_public: false
        },
        {
          key: 'welcome_email_template',
          value: 'Welcome to Åby Whisky Club! We\'re excited to have you join our community of whisky enthusiasts.',
          data_type: 'string',
          category: 'email',
          description: 'Custom welcome message for new members',
          is_public: false,
          validation_rules: {
            maxLength: 1000,
            maxLengthMessage: 'Welcome email template cannot exceed 1000 characters'
          }
        },
        {
          key: 'event_reminder_days',
          value: 3,
          data_type: 'number',
          category: 'email',
          description: 'Days before events to send reminders',
          is_public: false,
          validation_rules: {
            min: 1,
            max: 30,
            minMessage: 'Must be between 1 and 30 days'
          }
        },
        {
          key: 'rating_notification_enabled',
          value: true,
          data_type: 'boolean',
          category: 'email',
          description: 'Notify users when someone rates their whisky',
          is_public: false
        },
        {
          key: 'weekly_digest_enabled',
          value: false,
          data_type: 'boolean',
          category: 'email',
          description: 'Send weekly summary emails to members',
          is_public: false
        },
        {
          key: 'email_signature',
          value: 'Best regards,\nÅby Whisky Club Team',
          data_type: 'string',
          category: 'email',
          description: 'Standard signature for outgoing emails',
          is_public: false,
          validation_rules: {
            maxLength: 500,
            maxLengthMessage: 'Email signature cannot exceed 500 characters'
          }
        },

        // User Management & Privacy Settings
        {
          key: 'allow_public_profiles',
          value: true,
          data_type: 'boolean',
          category: 'privacy',
          description: 'Users can view each other\'s profiles and ratings',
          is_public: false
        },
        {
          key: 'require_real_names',
          value: false,
          data_type: 'boolean',
          category: 'privacy',
          description: 'Force first/last name during registration',
          is_public: false
        },
        {
          key: 'min_password_length',
          value: 8,
          data_type: 'number',
          category: 'privacy',
          description: 'Minimum password length requirement',
          is_public: false,
          validation_rules: {
            min: 6,
            max: 50,
            minMessage: 'Minimum password length must be between 6 and 50'
          }
        },
        {
          key: 'password_complexity_required',
          value: true,
          data_type: 'boolean',
          category: 'privacy',
          description: 'Require special characters and numbers in passwords',
          is_public: false
        },
        {
          key: 'password_complexity_rules',
          value: JSON.stringify({
            min_length: 8,
            require_uppercase: true,
            require_lowercase: true,
            require_numbers: true,
            require_special_chars: true,
            allowed_special_chars: '@$!%*?&#+\\-_.,~',
            prevent_common_passwords: true,
            prevent_username_in_password: true,
            max_length: 128
          }),
          data_type: 'json',
          category: 'security',
          description: 'Detailed password complexity requirements',
          is_public: false,
          validation_rules: {
            required: ['min_length', 'max_length'],
            minMessage: 'Password complexity rules are required'
          }
        },
        {
          key: 'login_attempt_limit',
          value: 5,
          data_type: 'number',
          category: 'security',
          description: 'Maximum failed login attempts before lockout',
          is_public: false,
          validation_rules: {
            min: 3,
            max: 20,
            minMessage: 'Login attempt limit must be between 3 and 20'
          }
        },
        {
          key: 'account_lockout_duration',
          value: 30,
          data_type: 'number',
          category: 'security',
          description: 'Account lockout duration in minutes',
          is_public: false,
          validation_rules: {
            min: 5,
            max: 1440,
            minMessage: 'Lockout duration must be between 5 and 1440 minutes (24 hours)'
          }
        },
        {
          key: 'session_timeout_hours',
          value: 24,
          data_type: 'number',
          category: 'security',
          description: 'Maximum session duration in hours',
          is_public: false,
          validation_rules: {
            min: 1,
            max: 168,
            minMessage: 'Session timeout must be between 1 and 168 hours (1 week)'
          }
        },
        {
          key: 'idle_timeout_minutes',
          value: 120,
          data_type: 'number',
          category: 'security',
          description: 'Session idle timeout in minutes',
          is_public: false,
          validation_rules: {
            min: 15,
            max: 480,
            minMessage: 'Idle timeout must be between 15 and 480 minutes (8 hours)'
          }
        },
        {
          key: 'require_email_verification',
          value: false,
          data_type: 'boolean',
          category: 'security',
          description: 'Require email verification for new accounts',
          is_public: false
        },
        {
          key: 'enable_two_factor_auth',
          value: false,
          data_type: 'boolean',
          category: 'security',
          description: 'Enable two-factor authentication site-wide',
          is_public: false
        },
        {
          key: 'max_login_attempts',
          value: 5,
          data_type: 'number',
          category: 'security',
          description: 'Maximum login attempts (deprecated - use login_attempt_limit)',
          is_public: false,
          validation_rules: {
            min: 3,
            max: 20,
            minMessage: 'Max login attempts must be between 3 and 20'
          }
        },
        {
          key: 'enable_user_avatars',
          value: true,
          data_type: 'boolean',
          category: 'privacy',
          description: 'Allow profile picture uploads',
          is_public: false
        },
        {
          key: 'member_directory_visible',
          value: true,
          data_type: 'boolean',
          category: 'privacy',
          description: 'Show member list to logged-in users',
          is_public: false
        },
        {
          key: 'allow_guest_browsing',
          value: true,
          data_type: 'boolean',
          category: 'privacy',
          description: 'Non-members can browse whiskies (read-only)',
          is_public: true
        },
        {
          key: 'registration_approval_required',
          value: false,
          data_type: 'boolean',
          category: 'privacy',
          description: 'Admin must approve new registrations',
          is_public: false
        },

        // Events & Social Settings
        {
          key: 'max_event_attendees_default',
          value: 50,
          data_type: 'number',
          category: 'events',
          description: 'Default capacity for new events',
          is_public: false,
          validation_rules: {
            min: 1,
            max: 1000,
            minMessage: 'Event capacity must be between 1 and 1000'
          }
        },
        {
          key: 'enable_event_waitlist',
          value: true,
          data_type: 'boolean',
          category: 'events',
          description: 'Allow waitlist when events are full',
          is_public: false
        },
        {
          key: 'rsvp_deadline_hours',
          value: 24,
          data_type: 'number',
          category: 'events',
          description: 'Hours before event when RSVP closes',
          is_public: false,
          validation_rules: {
            min: 1,
            max: 168,
            minMessage: 'RSVP deadline must be between 1 and 168 hours (1 week)'
          }
        },
        {
          key: 'enable_event_photos',
          value: true,
          data_type: 'boolean',
          category: 'events',
          description: 'Allow photo uploads at events',
          is_public: false
        },
        {
          key: 'social_sharing_enabled',
          value: true,
          data_type: 'boolean',
          category: 'events',
          description: 'Share whiskies/events on social media',
          is_public: false
        },
        {
          key: 'enable_event_comments',
          value: true,
          data_type: 'boolean',
          category: 'events',
          description: 'Allow comments on events',
          is_public: false
        },
        {
          key: 'event_cancellation_notice_hours',
          value: 48,
          data_type: 'number',
          category: 'events',
          description: 'Minimum notice for event cancellations (hours)',
          is_public: false,
          validation_rules: {
            min: 1,
            max: 168,
            minMessage: 'Cancellation notice must be between 1 and 168 hours'
          }
        },

        // Analytics & Performance Settings
        {
          key: 'enable_google_analytics',
          value: '',
          data_type: 'string',
          category: 'analytics',
          description: 'Google Analytics tracking ID (leave empty to disable)',
          is_public: false,
          validation_rules: {
            pattern: '^(GA-[A-Z0-9-]+|G-[A-Z0-9]+|$)',
            patternMessage: 'Must be a valid Google Analytics ID (GA-XXXXXX or G-XXXXXX) or empty'
          }
        },
        {
          key: 'stats_public',
          value: true,
          data_type: 'boolean',
          category: 'analytics',
          description: 'Show basic statistics on homepage',
          is_public: true
        },
        {
          key: 'leaderboard_enabled',
          value: true,
          data_type: 'boolean',
          category: 'analytics',
          description: 'Show top raters/reviewers leaderboard',
          is_public: false
        },
        {
          key: 'export_backup_schedule',
          value: 'weekly',
          data_type: 'string',
          category: 'analytics',
          description: 'Automated backup frequency',
          is_public: false,
          validation_rules: {
            enum: ['daily', 'weekly', 'monthly', 'disabled'],
            enumMessage: 'Must be one of: daily, weekly, monthly, disabled'
          }
        },
        {
          key: 'maintenance_mode',
          value: false,
          data_type: 'boolean',
          category: 'analytics',
          description: 'Site-wide maintenance mode toggle',
          is_public: false
        },
        {
          key: 'maintenance_message',
          value: 'The site is currently under maintenance. Please check back soon.',
          data_type: 'string',
          category: 'analytics',
          description: 'Message shown during maintenance mode',
          is_public: true,
          validation_rules: {
            maxLength: 500,
            maxLengthMessage: 'Maintenance message cannot exceed 500 characters'
          }
        },
        {
          key: 'enable_usage_tracking',
          value: true,
          data_type: 'boolean',
          category: 'analytics',
          description: 'Track user activity for analytics',
          is_public: false
        },
        {
          key: 'performance_monitoring',
          value: true,
          data_type: 'boolean',
          category: 'analytics',
          description: 'Monitor site performance metrics',
          is_public: false
        },

        // Features & Functionality Settings
        {
          key: 'require_admin_approval_whiskies',
          value: false,
          data_type: 'boolean',
          category: 'features',
          description: 'New whiskies need admin approval before publishing',
          is_public: false
        },
        {
          key: 'default_whisky_bottle_size',
          value: 700,
          data_type: 'number',
          category: 'features',
          description: 'Default bottle size in ml for new entries',
          is_public: true,
          validation_rules: {
            min: 50,
            max: 3000,
            minMessage: 'Bottle size must be between 50ml and 3000ml'
          }
        },
        {
          key: 'enable_whisky_reviews',
          value: true,
          data_type: 'boolean',
          category: 'features',
          description: 'Allow detailed text reviews vs just numerical ratings',
          is_public: true
        },
        {
          key: 'max_rating_scale',
          value: 10,
          data_type: 'number',
          category: 'features',
          description: 'Rating scale maximum (5, 10, or 100)',
          is_public: true,
          validation_rules: {
            enum: [5, 10, 100],
            enumMessage: 'Rating scale must be 5, 10, or 100'
          }
        },
        {
          key: 'featured_whiskies_count',
          value: 6,
          data_type: 'number',
          category: 'features',
          description: 'Number of featured whiskies on homepage',
          is_public: false,
          validation_rules: {
            min: 1,
            max: 20,
            minMessage: 'Featured whiskies count must be between 1 and 20'
          }
        },
        {
          key: 'enable_whisky_comparison',
          value: true,
          data_type: 'boolean',
          category: 'features',
          description: 'Allow side-by-side whisky comparisons',
          is_public: false
        },
        {
          key: 'tasting_notes_required',
          value: false,
          data_type: 'boolean',
          category: 'features',
          description: 'Require tasting notes with ratings',
          is_public: false
        },
        {
          key: 'enable_whisky_wishlist',
          value: true,
          data_type: 'boolean',
          category: 'features',
          description: 'Allow members to save whiskies they want to try',
          is_public: false
        },

        // Localization & Regional Settings
        {
          key: 'default_language',
          value: 'en',
          data_type: 'string',
          category: 'localization',
          description: 'Site default language code',
          is_public: true,
          validation_rules: {
            enum: ['en', 'sv'],
            enumMessage: 'Must be a supported language code (en, sv)'
          }
        },
        {
          key: 'available_languages',
          value: 'en,sv',
          data_type: 'string',
          category: 'localization',
          description: 'Comma-separated list of enabled languages',
          is_public: true,
          validation_rules: {
            pattern: '^[a-z]{2}(,[a-z]{2})*$',
            patternMessage: 'Must be comma-separated language codes (e.g., en,sv,no)'
          }
        },
        {
          key: 'currency_symbol',
          value: '$',
          data_type: 'string',
          category: 'localization',
          description: 'Currency symbol for pricing displays',
          is_public: true,
          validation_rules: {
            maxLength: 5,
            maxLengthMessage: 'Currency symbol cannot exceed 5 characters'
          }
        },
        {
          key: 'currency_code',
          value: 'USD',
          data_type: 'string',
          category: 'localization',
          description: 'ISO currency code',
          is_public: true,
          validation_rules: {
            pattern: '^[A-Z]{3}$',
            patternMessage: 'Must be a valid 3-letter ISO currency code (e.g., USD, SEK, EUR)'
          }
        },
        {
          key: 'exchange_rate_usd',
          value: 1.0,
          data_type: 'number',
          category: 'localization',
          description: 'Exchange rate: 1 USD = X USD (base rate)',
          is_public: false,
          validation_rules: {
            min: 0.01,
            max: 1000,
            minMessage: 'Exchange rate must be between 0.01 and 1000'
          }
        },
        {
          key: 'exchange_rate_sek',
          value: 10.5,
          data_type: 'number',
          category: 'localization',
          description: 'Exchange rate: 1 USD = X SEK',
          is_public: false,
          validation_rules: {
            min: 0.01,
            max: 1000,
            minMessage: 'Exchange rate must be between 0.01 and 1000'
          }
        },
        {
          key: 'exchange_rate_eur',
          value: 0.85,
          data_type: 'number',
          category: 'localization',
          description: 'Exchange rate: 1 USD = X EUR',
          is_public: false,
          validation_rules: {
            min: 0.01,
            max: 1000,
            minMessage: 'Exchange rate must be between 0.01 and 1000'
          }
        },
        {
          key: 'exchange_rate_gbp',
          value: 0.75,
          data_type: 'number',
          category: 'localization',
          description: 'Exchange rate: 1 USD = X GBP',
          is_public: false,
          validation_rules: {
            min: 0.01,
            max: 1000,
            minMessage: 'Exchange rate must be between 0.01 and 1000'
          }
        },
        {
          key: 'date_format',
          value: 'MM/DD/YYYY',
          data_type: 'string',
          category: 'localization',
          description: 'Regional date format preference',
          is_public: true,
          validation_rules: {
            enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
            enumMessage: 'Must be one of: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD'
          }
        },
        {
          key: 'timezone',
          value: 'America/New_York',
          data_type: 'string',
          category: 'localization',
          description: 'Club\'s primary timezone for events',
          is_public: false,
          validation_rules: {
            pattern: '^[A-Za-z_]+/[A-Za-z_]+$',
            patternMessage: 'Must be a valid timezone (e.g., America/New_York, Europe/Stockholm)'
          }
        },
        {
          key: 'volume_unit',
          value: 'ml',
          data_type: 'string',
          category: 'localization',
          description: 'Unit of measurement for volume',
          is_public: true,
          validation_rules: {
            enum: ['ml', 'cl', 'l', 'fl oz', 'pt', 'qt', 'gal'],
            enumMessage: 'Must be one of: ml, cl, l, fl oz, pt, qt, gal'
          }
        },
        {
          key: 'weight_unit',
          value: 'kg',
          data_type: 'string',
          category: 'localization',
          description: 'Unit of measurement for weight',
          is_public: true,
          validation_rules: {
            enum: ['g', 'kg', 'oz', 'lb'],
            enumMessage: 'Must be one of: g, kg, oz, lb'
          }
        },
        {
          key: 'temperature_unit',
          value: '°C',
          data_type: 'string',
          category: 'localization',
          description: 'Unit of measurement for temperature',
          is_public: true,
          validation_rules: {
            enum: ['°C', '°F'],
            enumMessage: 'Must be one of: °C, °F'
          }
        },
        {
          key: 'distance_unit',
          value: 'km',
          data_type: 'string',
          category: 'localization',
          description: 'Unit of measurement for distance',
          is_public: true,
          validation_rules: {
            enum: ['km', 'mi', 'm', 'ft'],
            enumMessage: 'Must be one of: km, mi, m, ft'
          }
        },
        {
          key: 'enable_auto_translation',
          value: false,
          data_type: 'boolean',
          category: 'localization',
          description: 'Auto-detect user language preference',
          is_public: false
        },
        // Additional localization settings
        {
          key: 'number_format',
          value: 'US',
          data_type: 'string',
          category: 'localization',
          description: 'Regional number formatting preference',
          is_public: true,
          validation_rules: {
            enum: ['US', 'EU', 'IN'],
            enumMessage: 'Must be one of: US (1,234.56), EU (1.234,56), IN (1,23,456.78)'
          }
        },
        {
          key: 'decimal_separator',
          value: '.',
          data_type: 'string',
          category: 'localization',
          description: 'Character used for decimal point',
          is_public: true,
          validation_rules: {
            enum: ['.', ','],
            enumMessage: 'Must be one of: . (dot), , (comma)'
          }
        },
        {
          key: 'thousands_separator',
          value: ',',
          data_type: 'string',
          category: 'localization',
          description: 'Character used for thousands grouping',
          is_public: true,
          validation_rules: {
            enum: [',', '.', ' ', ''],
            enumMessage: 'Must be one of: , (comma), . (dot), (space), (none)'
          }
        },
        {
          key: 'time_format',
          value: '12h',
          data_type: 'string',
          category: 'localization',
          description: '12-hour vs 24-hour time display format',
          is_public: true,
          validation_rules: {
            enum: ['12h', '24h'],
            enumMessage: 'Must be one of: 12h (12-hour), 24h (24-hour)'
          }
        },
        {
          key: 'first_day_of_week',
          value: 0,
          data_type: 'number',
          category: 'localization',
          description: 'First day of week for calendar display',
          is_public: true,
          validation_rules: {
            min: 0,
            max: 6,
            enum: [0, 1],
            enumMessage: 'Must be: 0 (Sunday) or 1 (Monday)'
          }
        },
        {
          key: 'week_numbering',
          value: 'iso',
          data_type: 'string',
          category: 'localization',
          description: 'Week numbering system for calendar',
          is_public: true,
          validation_rules: {
            enum: ['iso', 'us'],
            enumMessage: 'Must be one of: iso (ISO 8601), us (US system)'
          }
        },
        // API & Integration settings
        {
          key: 'api_rate_limit',
          value: 100,
          data_type: 'number',
          category: 'api_integration',
          description: 'API requests per minute per user/IP',
          is_public: false,
          validation_rules: {
            min: 10,
            max: 10000,
            minMessage: 'Rate limit must be at least 10 requests per minute',
            maxMessage: 'Rate limit cannot exceed 10,000 requests per minute'
          }
        },
        {
          key: 'enable_webhook_notifications',
          value: false,
          data_type: 'boolean',
          category: 'api_integration',
          description: 'Enable webhook notifications for external integrations',
          is_public: false
        },
        {
          key: 'third_party_integrations',
          value: '',
          data_type: 'string',
          category: 'api_integration',
          description: 'Comma-separated list of enabled third-party integrations',
          is_public: false,
          validation_rules: {
            pattern: '^[a-zA-Z0-9,_-]*$',
            patternMessage: 'Integration names can only contain letters, numbers, commas, underscores, and hyphens'
          }
        },
        {
          key: 'enable_advanced_analytics',
          value: false,
          data_type: 'boolean',
          category: 'api_integration',
          description: 'Enable advanced analytics dashboard and tracking',
          is_public: false
        },
        {
          key: 'data_retention_days',
          value: 365,
          data_type: 'number',
          category: 'api_integration',
          description: 'Days to retain user activity and analytics data',
          is_public: false,
          validation_rules: {
            min: 30,
            max: 2555,
            minMessage: 'Data retention must be at least 30 days',
            maxMessage: 'Data retention cannot exceed 7 years (2555 days)'
          }
        },
        {
          key: 'export_user_data_enabled',
          value: true,
          data_type: 'boolean',
          category: 'api_integration',
          description: 'Enable GDPR compliance user data export functionality',
          is_public: false
        },
        // Social Features settings
        {
          key: 'enable_user_messaging',
          value: false,
          data_type: 'boolean',
          category: 'social_features',
          description: 'Enable direct messaging system between users',
          is_public: true
        },
        {
          key: 'enable_social_sharing',
          value: true,
          data_type: 'boolean',
          category: 'social_features',
          description: 'Enable enhanced social media sharing capabilities',
          is_public: true
        },
        {
          key: 'enable_user_follows',
          value: false,
          data_type: 'boolean',
          category: 'social_features',
          description: 'Enable user following/friend relationship system',
          is_public: true
        },
        {
          key: 'enable_dark_mode',
          value: true,
          data_type: 'boolean',
          category: 'social_features',
          description: 'Enable dark theme support and switching',
          is_public: true
        },
        {
          key: 'enable_whisky_tags',
          value: true,
          data_type: 'boolean',
          category: 'social_features',
          description: 'Enable user-generated tagging system for whiskies',
          is_public: true
        },
        {
          key: 'auto_approve_whiskies',
          value: false,
          data_type: 'boolean',
          category: 'social_features',
          description: 'Automatically approve whisky submissions without admin review',
          is_public: false
        },
        {
          key: 'whisky_submission_guidelines',
          value: 'Please ensure all whisky information is accurate and complete. Include detailed tasting notes and proper distillery information.',
          data_type: 'string',
          category: 'social_features',
          description: 'Guidelines text displayed to users when submitting whiskies',
          is_public: true,
          validation_rules: {
            maxLength: 1000,
            maxLengthMessage: 'Guidelines text cannot exceed 1000 characters'
          }
        }
      ];

      for (const settingData of defaultSettings) {
        await SystemSetting.setSetting(
          settingData.key,
          settingData.value,
          {
            data_type: settingData.data_type,
            category: settingData.category,
            description: settingData.description,
            is_public: settingData.is_public
          }
        );
      }

      console.log('✅ Default system settings initialized');
    } catch (error) {
      console.error('❌ Error initializing default settings:', error);
    }
  }

  // Helper method to validate setting values
  static validateSettingValue(value, validationRules, dataType) {
    try {
      // Basic type validation
      switch (dataType) {
        case 'boolean':
          if (typeof value !== 'boolean') {
            return { valid: false, message: 'Value must be a boolean' };
          }
          break;
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            return { valid: false, message: 'Value must be a valid number' };
          }
          break;
        case 'string':
          if (typeof value !== 'string') {
            return { valid: false, message: 'Value must be a string' };
          }
          break;
      }

      // Custom validation rules
      if (validationRules) {
        // Enum validation (for both strings and numbers)
        if (validationRules.enum !== undefined) {
          if (!validationRules.enum.includes(value)) {
            return { 
              valid: false, 
              message: validationRules.enumMessage || `Value must be one of: ${validationRules.enum.join(', ')}` 
            };
          }
        }

        // Numeric range validation
        if (validationRules.min !== undefined && value < validationRules.min) {
          return { 
            valid: false, 
            message: validationRules.minMessage || `Value must be at least ${validationRules.min}` 
          };
        }
        if (validationRules.max !== undefined && value > validationRules.max) {
          return { 
            valid: false, 
            message: validationRules.maxMessage || `Value must be at most ${validationRules.max}` 
          };
        }

        // String length validation
        if (dataType === 'string') {
          if (validationRules.minLength !== undefined && value.length < validationRules.minLength) {
            return { 
              valid: false, 
              message: validationRules.minLengthMessage || `Value must be at least ${validationRules.minLength} characters` 
            };
          }
          if (validationRules.maxLength !== undefined && value.length > validationRules.maxLength) {
            return { 
              valid: false, 
              message: validationRules.maxLengthMessage || `Value must be at most ${validationRules.maxLength} characters` 
            };
          }

          // Pattern validation (regex)
          if (validationRules.pattern && !new RegExp(validationRules.pattern).test(value)) {
            return { 
              valid: false, 
              message: validationRules.patternMessage || 'Value does not match required pattern' 
            };
          }
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, message: 'Validation error occurred' };
    }
  }

  // Data Export/Import functionality

  // Export data to CSV/JSON
  static async exportData(req, res) {
    try {
      console.log('Export request received:', req.query);
      
      const { 
        format = 'json', // 'json' or 'csv'
        type = 'all', // 'whiskies', 'users', 'ratings', 'events', 'all'
        include_deleted = false 
      } = req.query;

      console.log('Export params:', { format, type, include_deleted });

      let exportData = {};

      // Export whiskies
      if (type === 'all' || type === 'whiskies') {
        const whiskies = await Whisky.findAll({
          include: [
            {
              model: Rating,
              as: 'ratings',
              include: [{
                model: User,
                as: 'user',
                attributes: ['username', 'first_name', 'last_name']
              }]
            }
          ],
          ...(include_deleted === 'false' && { where: { is_available: true } })
        });
        exportData.whiskies = whiskies;
      }

      // Export users (exclude sensitive data)
      if (type === 'all' || type === 'users') {
        const users = await User.findAll({
          attributes: { exclude: ['password_hash'] },
          ...(include_deleted === 'false' && { where: { is_active: true } })
        });
        exportData.users = users;
      }

      // Export ratings
      if (type === 'all' || type === 'ratings') {
        const ratings = await Rating.findAll({
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['username', 'first_name', 'last_name']
            },
            {
              model: Whisky,
              as: 'whisky',
              attributes: ['name', 'distillery']
            }
          ]
        });
        exportData.ratings = ratings;
      }

      // Export events
      if (type === 'all' || type === 'events') {
        const events = await NewsEvent.findAll({
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['username', 'first_name', 'last_name']
            },
            {
              model: EventRSVP,
              as: 'rsvps',
              include: [{
                model: User,
                as: 'user',
                attributes: ['username', 'first_name', 'last_name']
              }]
            }
          ]
        });
        exportData.events = events;
      }

      // Format response based on requested format
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      console.log('Export data collected:', Object.keys(exportData));

      if (format === 'csv') {
        // For CSV, we'll export each type separately
        console.log('Converting to CSV format...');
        const csvData = AdminController.convertToCSV(exportData, type);
        console.log('CSV data length:', csvData.length);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="aby_whisky_club_${type}_${timestamp}.csv"`);
        res.send(csvData);
      } else {
        // JSON format
        console.log('Sending JSON format...');
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="aby_whisky_club_${type}_${timestamp}.json"`);
        res.json({
          exported_at: new Date().toISOString(),
          export_type: type,
          format: format,
          data: exportData
        });
      }

    } catch (error) {
      console.error('Export data error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        error: 'Failed to export data',
        message: 'An error occurred while exporting data',
        details: error.message
      });
    }
  }

  // Helper method to convert data to CSV format
  static convertToCSV(data, type) {
    const getNestedValue = (obj, path) => {
      return path.split('.').reduce((current, key) => current && current[key], obj);
    };

    const convertArrayToCSV = (array, headers) => {
      const csvHeaders = headers.join(',');
      const csvRows = array.map(item => {
        return headers.map(header => {
          const value = getNestedValue(item, header);
          return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',');
      });
      return [csvHeaders, ...csvRows].join('\n');
    };

    // Handle specific data types first
    if (type === 'whiskies' && data.whiskies) {
      const headers = ['id', 'name', 'distillery', 'region', 'age', 'abv', 'type', 'description', 'is_available'];
      return convertArrayToCSV(data.whiskies, headers);
    } else if (type === 'users' && data.users) {
      const headers = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at'];
      return convertArrayToCSV(data.users, headers);
    } else if (type === 'ratings' && data.ratings) {
      const headers = ['id', 'user.username', 'whisky.name', 'overall_score', 'nose_score', 'taste_score', 'finish_score', 'review_text', 'created_at'];
      return convertArrayToCSV(data.ratings, headers);
    } else if (type === 'events' && data.events) {
      const headers = ['id', 'title', 'type', 'content', 'event_date', 'location', 'max_attendees', 'is_published', 'author.username', 'created_at'];
      return convertArrayToCSV(data.events, headers);
    }

    // For 'all' type, create a combined export with multiple sections
    if (type === 'all') {
      let csvSections = [];
      
      if (data.whiskies && data.whiskies.length > 0) {
        const whiskyHeaders = ['id', 'name', 'distillery', 'region', 'age', 'abv', 'type', 'description', 'is_available'];
        csvSections.push('WHISKIES');
        csvSections.push(convertArrayToCSV(data.whiskies, whiskyHeaders));
        csvSections.push(''); // Empty line
      }
      
      if (data.users && data.users.length > 0) {
        const userHeaders = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at'];
        csvSections.push('USERS');
        csvSections.push(convertArrayToCSV(data.users, userHeaders));
        csvSections.push(''); // Empty line
      }
      
      if (data.ratings && data.ratings.length > 0) {
        const ratingHeaders = ['id', 'user.username', 'whisky.name', 'overall_score', 'nose_score', 'taste_score', 'finish_score', 'review_text', 'created_at'];
        csvSections.push('RATINGS');
        csvSections.push(convertArrayToCSV(data.ratings, ratingHeaders));
        csvSections.push(''); // Empty line
      }
      
      if (data.events && data.events.length > 0) {
        const eventHeaders = ['id', 'title', 'type', 'content', 'event_date', 'location', 'max_attendees', 'is_published', 'author.username', 'created_at'];
        csvSections.push('EVENTS');
        csvSections.push(convertArrayToCSV(data.events, eventHeaders));
      }
      
      return csvSections.join('\n');
    }
    
    return 'No data available for CSV export';
  }

  // Helper method to get nested object values
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  // Data Import functionality
  static async importData(req, res) {
    try {
      const { type, data, options = {} } = req.body;
      const { overwrite = false, validate = true } = options;

      if (!type || !data || !Array.isArray(data)) {
        return res.status(400).json({
          error: 'Invalid import data',
          message: 'Type and data array are required'
        });
      }

      let importResults = {
        total: data.length,
        success: 0,
        errors: 0,
        warnings: [],
        imported_items: []
      };

      switch (type) {
        case 'whiskies':
          importResults = await this.importWhiskies(data, { overwrite, validate });
          break;
        case 'users':
          importResults = await this.importUsers(data, { overwrite, validate });
          break;
        default:
          return res.status(400).json({
            error: 'Unsupported import type',
            message: 'Supported types: whiskies, users'
          });
      }

      const statusCode = importResults.errors > 0 ? 207 : 200; // 207 Multi-Status for partial success

      res.status(statusCode).json({
        message: `Import completed: ${importResults.success} successful, ${importResults.errors} failed`,
        results: importResults
      });

    } catch (error) {
      console.error('Import data error:', error);
      res.status(500).json({
        error: 'Failed to import data',
        message: 'An error occurred while importing data'
      });
    }
  }

  // Import whiskies from data array
  static async importWhiskies(data, options = {}) {
    const { overwrite = false, validate = true } = options;
    const results = {
      total: data.length,
      success: 0,
      errors: 0,
      warnings: [],
      imported_items: []
    };

    for (const item of data) {
      try {
        // Basic validation
        if (validate) {
          if (!item.name || !item.distillery) {
            results.errors++;
            results.warnings.push(`Skipped item: Missing required fields (name, distillery)`);
            continue;
          }
        }

        // Check if whisky already exists
        const existingWhisky = await Whisky.findOne({
          where: {
            name: item.name,
            distillery: item.distillery
          }
        });

        if (existingWhisky && !overwrite) {
          results.warnings.push(`Skipped ${item.name}: Already exists`);
          continue;
        }

        const whiskyData = {
          name: item.name,
          distillery: item.distillery,
          region: item.region || null,
          age: item.age ? parseInt(item.age) : null,
          abv: item.abv ? parseFloat(item.abv) : null,
          type: item.type || 'single_malt',
          description: item.description || null,
          image_url: item.image_url || null,
          is_available: item.is_available !== undefined ? Boolean(item.is_available) : true
        };

        let whisky;
        if (existingWhisky && overwrite) {
          whisky = await existingWhisky.update(whiskyData);
        } else {
          whisky = await Whisky.create(whiskyData);
        }

        results.success++;
        results.imported_items.push({
          id: whisky.id,
          name: whisky.name,
          action: existingWhisky ? 'updated' : 'created'
        });

      } catch (error) {
        results.errors++;
        results.warnings.push(`Error importing ${item.name || 'unknown'}: ${error.message}`);
      }
    }

    return results;
  }

  // Get pending user registrations
  static async getPendingRegistrations(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: users } = await User.findAndCountAll({
        where: { approval_status: 'pending' },
        order: [['created_at', 'ASC']], // Oldest first
        limit: parseInt(limit),
        offset,
        attributes: { exclude: ['password_hash'] }
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        users,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: count,
          limit: parseInt(limit),
          has_next: parseInt(page) < totalPages,
          has_prev: parseInt(page) > 1
        }
      });
    } catch (error) {
      console.error('Get pending registrations error:', error);
      res.status(500).json({
        error: 'Failed to fetch pending registrations',
        message: 'An error occurred while fetching pending registrations'
      });
    }
  }

  // Approve or reject user registration
  static async moderateUserRegistration(req, res) {
    try {
      const { userId } = req.params;
      const { action, notes } = req.body; // action: 'approve' or 'reject'

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'The specified user could not be found'
        });
      }

      if (user.approval_status !== 'pending') {
        return res.status(400).json({
          error: 'Invalid operation',
          message: 'User registration is not pending approval'
        });
      }

      const updateData = {
        approval_status: action === 'approve' ? 'approved' : 'rejected',
        approval_date: new Date(),
        approved_by: req.user.id,
        approval_notes: notes || null
      };

      await user.update(updateData);

      res.json({
        message: `User registration ${action}d successfully`,
        user: user.toSafeObject(),
        action,
        approved_by: req.user.username
      });
    } catch (error) {
      console.error('Moderate user registration error:', error);
      res.status(500).json({
        error: 'Failed to moderate user registration',
        message: 'An error occurred while moderating the user registration'
      });
    }
  }

  // Whisky Approval Management

  // Get all pending whiskies awaiting approval
  static async getPendingWhiskies(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      // Build order clause
      const validSortFields = ['name', 'distillery', 'created_at', 'approval_status'];
      const orderField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
      const orderDirection = sort_order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      // Calculate pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: whiskies } = await Whisky.findAndCountAll({
        where: {
          approval_status: 'pending'
        },
        order: [[orderField, orderDirection]],
        limit: parseInt(limit),
        offset,
        include: [{
          model: require('../models').Distillery,
          as: 'distilleryInfo',
          required: false,
          attributes: ['id', 'name', 'country', 'region']
        }]
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        whiskies,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: count,
          per_page: parseInt(limit),
          has_next: parseInt(page) < totalPages,
          has_previous: parseInt(page) > 1
        }
      });

    } catch (error) {
      console.error('Get pending whiskies error:', error);
      res.status(500).json({
        error: 'Failed to fetch pending whiskies',
        message: 'An error occurred while fetching pending whiskies'
      });
    }
  }

  // Approve a specific whisky
  static async approveWhisky(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const whisky = await Whisky.findByPk(id);
      if (!whisky) {
        return res.status(404).json({
          error: 'Whisky not found',
          message: 'The specified whisky does not exist'
        });
      }

      if (whisky.approval_status !== 'pending') {
        return res.status(400).json({
          error: 'Invalid status',
          message: 'Only pending whiskies can be approved'
        });
      }

      await whisky.approve(req.user.id, notes);

      // Fetch updated whisky with relationships
      const updatedWhisky = await Whisky.findByPk(id, {
        include: [{
          model: User,
          as: 'approvedBy',
          attributes: ['id', 'username', 'email']
        }, {
          model: require('../models').Distillery,
          as: 'distilleryInfo',
          required: false,
          attributes: ['id', 'name', 'country', 'region']
        }]
      });

      res.json({
        message: 'Whisky approved successfully',
        whisky: updatedWhisky
      });

    } catch (error) {
      console.error('Approve whisky error:', error);
      res.status(500).json({
        error: 'Failed to approve whisky',
        message: 'An error occurred while approving the whisky'
      });
    }
  }

  // Reject a specific whisky
  static async rejectWhisky(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const whisky = await Whisky.findByPk(id);
      if (!whisky) {
        return res.status(404).json({
          error: 'Whisky not found',
          message: 'The specified whisky does not exist'
        });
      }

      if (whisky.approval_status !== 'pending') {
        return res.status(400).json({
          error: 'Invalid status',
          message: 'Only pending whiskies can be rejected'
        });
      }

      await whisky.reject(req.user.id, notes);

      // Fetch updated whisky with relationships
      const updatedWhisky = await Whisky.findByPk(id, {
        include: [{
          model: User,
          as: 'approvedBy',
          attributes: ['id', 'username', 'email']
        }, {
          model: require('../models').Distillery,
          as: 'distilleryInfo',
          required: false,
          attributes: ['id', 'name', 'country', 'region']
        }]
      });

      res.json({
        message: 'Whisky rejected',
        whisky: updatedWhisky
      });

    } catch (error) {
      console.error('Reject whisky error:', error);
      res.status(500).json({
        error: 'Failed to reject whisky',
        message: 'An error occurred while rejecting the whisky'
      });
    }
  }

  // Import users from data array
  static async importUsers(data, options = {}) {
    const { overwrite = false, validate = true } = options;
    const results = {
      total: data.length,
      success: 0,
      errors: 0,
      warnings: [],
      imported_items: []
    };

    for (const item of data) {
      try {
        // Basic validation
        if (validate) {
          if (!item.username || !item.email) {
            results.errors++;
            results.warnings.push(`Skipped item: Missing required fields (username, email)`);
            continue;
          }
        }

        // Check if user already exists
        const existingUser = await User.findOne({
          where: {
            [Op.or]: [
              { username: item.username },
              { email: item.email }
            ]
          }
        });

        if (existingUser && !overwrite) {
          results.warnings.push(`Skipped ${item.username}: User already exists`);
          continue;
        }

        // For security, we don't import passwords - users will need to reset
        const userData = {
          username: item.username,
          email: item.email,
          first_name: item.first_name || null,
          last_name: item.last_name || null,
          role: item.role === 'admin' ? 'admin' : 'member', // Default to member for security
          is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
          password_hash: existingUser ? existingUser.password_hash : 'IMPORT_TEMP_PASSWORD' // Temp placeholder
        };

        let user;
        if (existingUser && overwrite) {
          // Don't overwrite password or sensitive fields
          delete userData.password_hash;
          user = await existingUser.update(userData);
        } else if (!existingUser) {
          user = await User.create(userData);
        }

        if (user) {
          results.success++;
          results.imported_items.push({
            id: user.id,
            username: user.username,
            action: existingUser ? 'updated' : 'created'
          });

          if (!existingUser) {
            results.warnings.push(`User ${item.username} imported - password reset required`);
          }
        }

      } catch (error) {
        results.errors++;
        results.warnings.push(`Error importing ${item.username || 'unknown'}: ${error.message}`);
      }
    }

    return results;
  }
}

module.exports = AdminController;