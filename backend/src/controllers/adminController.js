const { User, Whisky, Rating, NewsEvent, EventRSVP } = require('../models');
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
}

module.exports = AdminController;