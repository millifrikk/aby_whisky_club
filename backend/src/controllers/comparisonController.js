const { ComparisonSession, Whisky, Distillery, Rating, User, SystemSetting } = require('../models');

class ComparisonController {
  // Get user's comparison sessions
  static async getUserSessions(req, res) {
    try {
      const { userId } = req.params;
      const {
        page = 1,
        limit = 20,
        orderBy = 'created_at',
        orderDirection = 'DESC'
      } = req.query;

      // Check if user can access these sessions
      if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view your own comparison sessions'
        });
      }

      // Check if comparison feature is enabled
      const comparisonEnabled = await SystemSetting.getSetting('enable_whisky_comparison', false);
      if (!comparisonEnabled) {
        return res.status(404).json({
          error: 'Feature not available',
          message: 'Whisky comparison feature is currently disabled'
        });
      }

      const result = await ComparisonSession.getUserSessions(userId, {
        page,
        limit,
        orderBy,
        orderDirection
      });

      const totalPages = Math.ceil(result.count / parseInt(limit));

      res.json({
        sessions: result.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: result.count,
          limit: parseInt(limit),
          has_next: parseInt(page) < totalPages,
          has_prev: parseInt(page) > 1
        }
      });

    } catch (error) {
      console.error('Get user sessions error:', error);
      res.status(500).json({
        error: 'Failed to fetch comparison sessions',
        message: 'An error occurred while fetching comparison sessions'
      });
    }
  }

  // Create a new comparison session
  static async createSession(req, res) {
    try {
      const { whisky_ids, name } = req.body;
      const userId = req.user.id;

      // Check if comparison feature is enabled
      const comparisonEnabled = await SystemSetting.getSetting('enable_whisky_comparison', false);
      if (!comparisonEnabled) {
        return res.status(404).json({
          error: 'Feature not available',
          message: 'Whisky comparison feature is currently disabled'
        });
      }

      if (!Array.isArray(whisky_ids) || whisky_ids.length < 2) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'At least 2 whiskies are required for comparison'
        });
      }

      if (whisky_ids.length > 10) {
        return res.status(400).json({
          error: 'Too many whiskies',
          message: 'Maximum 10 whiskies can be compared at once'
        });
      }

      // Validate that all whiskies exist
      const whiskies = await Whisky.findAll({
        where: { id: whisky_ids },
        attributes: ['id', 'name']
      });

      if (whiskies.length !== whisky_ids.length) {
        return res.status(400).json({
          error: 'Invalid whiskies',
          message: 'One or more specified whiskies do not exist'
        });
      }

      const session = await ComparisonSession.createSession(userId, whisky_ids, name);

      res.status(201).json({
        message: 'Comparison session created',
        session
      });

    } catch (error) {
      console.error('Create comparison session error:', error);
      
      if (error.message.includes('At least 2 whiskies') || error.message.includes('Maximum 10 whiskies')) {
        return res.status(400).json({
          error: 'Invalid request',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Failed to create comparison session',
        message: 'An error occurred while creating the comparison session'
      });
    }
  }

  // Compare whiskies (no session save)
  static async compareWhiskies(req, res) {
    try {
      const { ids } = req.query;

      // Check if comparison feature is enabled
      const comparisonEnabled = await SystemSetting.getSetting('enable_whisky_comparison', false);
      if (!comparisonEnabled) {
        return res.status(404).json({
          error: 'Feature not available',
          message: 'Whisky comparison feature is currently disabled'
        });
      }

      if (!ids) {
        return res.status(400).json({
          error: 'Missing parameters',
          message: 'Whisky IDs are required'
        });
      }

      const whiskyIds = ids.split(',').filter(id => id.trim());
      
      if (whiskyIds.length < 2) {
        return res.status(400).json({
          error: 'Insufficient whiskies',
          message: 'At least 2 whiskies are required for comparison'
        });
      }

      if (whiskyIds.length > 10) {
        return res.status(400).json({
          error: 'Too many whiskies',
          message: 'Maximum 10 whiskies can be compared at once'
        });
      }

      const comparison = await ComparisonSession.compareWhiskies(whiskyIds);

      res.json(comparison);

    } catch (error) {
      console.error('Compare whiskies error:', error);
      
      if (error.message.includes('At least 2 whiskies')) {
        return res.status(400).json({
          error: 'Invalid request',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Failed to compare whiskies',
        message: 'An error occurred while comparing whiskies'
      });
    }
  }

  // Get session details with whiskies
  static async getSession(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if comparison feature is enabled
      const comparisonEnabled = await SystemSetting.getSetting('enable_whisky_comparison', false);
      if (!comparisonEnabled) {
        return res.status(404).json({
          error: 'Feature not available',
          message: 'Whisky comparison feature is currently disabled'
        });
      }

      const session = await ComparisonSession.findByPk(id);
      if (!session) {
        return res.status(404).json({
          error: 'Session not found',
          message: 'Comparison session not found'
        });
      }

      // Check if user can access this session
      if (session.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view your own comparison sessions'
        });
      }

      const whiskies = await session.getWhiskies();

      res.json({
        session: {
          ...session.toJSON(),
          whiskies
        }
      });

    } catch (error) {
      console.error('Get session error:', error);
      res.status(500).json({
        error: 'Failed to fetch session',
        message: 'An error occurred while fetching the comparison session'
      });
    }
  }

  // Update comparison session
  static async updateSession(req, res) {
    try {
      const { id } = req.params;
      const { name, whisky_ids } = req.body;
      const userId = req.user.id;

      // Check if comparison feature is enabled
      const comparisonEnabled = await SystemSetting.getSetting('enable_whisky_comparison', false);
      if (!comparisonEnabled) {
        return res.status(404).json({
          error: 'Feature not available',
          message: 'Whisky comparison feature is currently disabled'
        });
      }

      const session = await ComparisonSession.findByPk(id);
      if (!session) {
        return res.status(404).json({
          error: 'Session not found',
          message: 'Comparison session not found'
        });
      }

      // Check if user owns this session
      if (session.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own comparison sessions'
        });
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (whisky_ids !== undefined) {
        if (!Array.isArray(whisky_ids) || whisky_ids.length < 2) {
          return res.status(400).json({
            error: 'Invalid request',
            message: 'At least 2 whiskies are required for comparison'
          });
        }
        updateData.whisky_ids = whisky_ids;
      }

      await session.update(updateData);

      const whiskies = await session.getWhiskies();

      res.json({
        message: 'Comparison session updated',
        session: {
          ...session.toJSON(),
          whiskies
        }
      });

    } catch (error) {
      console.error('Update session error:', error);
      res.status(500).json({
        error: 'Failed to update session',
        message: 'An error occurred while updating the comparison session'
      });
    }
  }

  // Delete comparison session
  static async deleteSession(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if comparison feature is enabled
      const comparisonEnabled = await SystemSetting.getSetting('enable_whisky_comparison', false);
      if (!comparisonEnabled) {
        return res.status(404).json({
          error: 'Feature not available',
          message: 'Whisky comparison feature is currently disabled'
        });
      }

      const session = await ComparisonSession.findByPk(id);
      if (!session) {
        return res.status(404).json({
          error: 'Session not found',
          message: 'Comparison session not found'
        });
      }

      // Check if user owns this session
      if (session.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete your own comparison sessions'
        });
      }

      await session.destroy();

      res.json({
        message: 'Comparison session deleted'
      });

    } catch (error) {
      console.error('Delete session error:', error);
      res.status(500).json({
        error: 'Failed to delete session',
        message: 'An error occurred while deleting the comparison session'
      });
    }
  }
}

module.exports = ComparisonController;