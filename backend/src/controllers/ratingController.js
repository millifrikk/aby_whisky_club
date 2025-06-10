const { Rating, Whisky, User } = require('../models');
const { Op } = require('sequelize');

class RatingController {
  // Get ratings for a specific whisky
  static async getWhiskyRatings(req, res) {
    try {
      const { whisky_id } = req.params;
      const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'DESC' } = req.query;

      // Verify whisky exists
      const whisky = await Whisky.findByPk(whisky_id);
      if (!whisky) {
        return res.status(404).json({
          error: 'Whisky not found',
          message: 'The specified whisky could not be found'
        });
      }

      // Build order clause
      const validSortFields = ['overall_score', 'created_at', 'tasting_date'];
      const orderField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
      const orderDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Calculate pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: ratings } = await Rating.findAndCountAll({
        where: { 
          whisky_id,
          is_public: true 
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'first_name', 'last_name']
          }
        ],
        order: [[orderField, orderDirection]],
        limit: parseInt(limit),
        offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      // Calculate rating statistics
      const stats = await Rating.findOne({
        where: { whisky_id, is_public: true },
        attributes: [
          [Rating.sequelize.fn('AVG', Rating.sequelize.col('overall_score')), 'average_overall'],
          [Rating.sequelize.fn('AVG', Rating.sequelize.col('appearance_score')), 'average_appearance'],
          [Rating.sequelize.fn('AVG', Rating.sequelize.col('nose_score')), 'average_nose'],
          [Rating.sequelize.fn('AVG', Rating.sequelize.col('palate_score')), 'average_palate'],
          [Rating.sequelize.fn('AVG', Rating.sequelize.col('finish_score')), 'average_finish'],
          [Rating.sequelize.fn('COUNT', Rating.sequelize.col('id')), 'total_ratings']
        ],
        raw: true
      });

      res.json({
        ratings,
        whisky: {
          id: whisky.id,
          name: whisky.name,
          distillery: whisky.distillery
        },
        statistics: {
          average_overall: stats?.average_overall ? parseFloat(stats.average_overall).toFixed(2) : null,
          average_appearance: stats?.average_appearance ? parseFloat(stats.average_appearance).toFixed(2) : null,
          average_nose: stats?.average_nose ? parseFloat(stats.average_nose).toFixed(2) : null,
          average_palate: stats?.average_palate ? parseFloat(stats.average_palate).toFixed(2) : null,
          average_finish: stats?.average_finish ? parseFloat(stats.average_finish).toFixed(2) : null,
          total_ratings: parseInt(stats?.total_ratings) || 0
        },
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
      console.error('Get whisky ratings error:', error);
      res.status(500).json({
        error: 'Failed to fetch ratings',
        message: 'An error occurred while fetching whisky ratings'
      });
    }
  }

  // Get user's ratings
  static async getUserRatings(req, res) {
    try {
      const { user_id } = req.params;
      const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'DESC' } = req.query;

      // Check if user is viewing their own ratings or is admin
      const canViewPrivate = req.user && (req.user.id === user_id || req.user.role === 'admin');

      // Build where clause
      const where = { user_id };
      if (!canViewPrivate) {
        where.is_public = true;
      }

      // Build order clause
      const validSortFields = ['overall_score', 'created_at', 'tasting_date'];
      const orderField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
      const orderDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Calculate pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: ratings } = await Rating.findAndCountAll({
        where,
        include: [
          {
            model: Whisky,
            as: 'whisky',
            attributes: ['id', 'name', 'distillery', 'region', 'age', 'type']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'first_name', 'last_name']
          }
        ],
        order: [[orderField, orderDirection]],
        limit: parseInt(limit),
        offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      // Get user rating statistics
      const stats = await Rating.findOne({
        where: { user_id },
        attributes: [
          [Rating.sequelize.fn('AVG', Rating.sequelize.col('overall_score')), 'average_rating'],
          [Rating.sequelize.fn('COUNT', Rating.sequelize.col('id')), 'total_ratings'],
          [Rating.sequelize.fn('MAX', Rating.sequelize.col('overall_score')), 'highest_rating'],
          [Rating.sequelize.fn('MIN', Rating.sequelize.col('overall_score')), 'lowest_rating']
        ],
        raw: true
      });

      res.json({
        ratings,
        statistics: {
          average_rating: stats?.average_rating ? parseFloat(stats.average_rating).toFixed(2) : null,
          total_ratings: parseInt(stats?.total_ratings) || 0,
          highest_rating: stats?.highest_rating ? parseFloat(stats.highest_rating) : null,
          lowest_rating: stats?.lowest_rating ? parseFloat(stats.lowest_rating) : null
        },
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
      console.error('Get user ratings error:', error);
      res.status(500).json({
        error: 'Failed to fetch user ratings',
        message: 'An error occurred while fetching user ratings'
      });
    }
  }

  // Create or update a rating
  static async createOrUpdateRating(req, res) {
    try {
      const ratingData = {
        ...req.body,
        user_id: req.user.id
      };

      // Verify whisky exists
      const whisky = await Whisky.findByPk(ratingData.whisky_id);
      if (!whisky) {
        return res.status(404).json({
          error: 'Whisky not found',
          message: 'The specified whisky could not be found'
        });
      }

      // Check if user has already rated this whisky
      const existingRating = await Rating.findOne({
        where: {
          user_id: req.user.id,
          whisky_id: ratingData.whisky_id
        }
      });

      let rating;
      let isUpdate = false;

      if (existingRating) {
        // Update existing rating
        rating = await existingRating.update(ratingData);
        isUpdate = true;
      } else {
        // Create new rating
        rating = await Rating.create(ratingData);
      }

      // Fetch the complete rating with associations
      const completeRating = await Rating.findByPk(rating.id, {
        include: [
          {
            model: Whisky,
            as: 'whisky',
            attributes: ['id', 'name', 'distillery', 'region']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'first_name', 'last_name']
          }
        ]
      });

      res.status(isUpdate ? 200 : 201).json({
        message: isUpdate ? 'Rating updated successfully' : 'Rating created successfully',
        rating: completeRating
      });

    } catch (error) {
      console.error('Create/update rating error:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      res.status(500).json({
        error: 'Failed to save rating',
        message: 'An error occurred while saving the rating'
      });
    }
  }

  // Get a specific rating
  static async getRating(req, res) {
    try {
      const { id } = req.params;

      const rating = await Rating.findByPk(id, {
        include: [
          {
            model: Whisky,
            as: 'whisky',
            attributes: ['id', 'name', 'distillery', 'region', 'age', 'type']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'first_name', 'last_name']
          }
        ]
      });

      if (!rating) {
        return res.status(404).json({
          error: 'Rating not found',
          message: 'The specified rating could not be found'
        });
      }

      // Check if rating is public or user owns it or user is admin
      const canView = rating.is_public || 
                     (req.user && req.user.id === rating.user_id) || 
                     (req.user && req.user.role === 'admin');

      if (!canView) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have permission to view this rating'
        });
      }

      res.json({ rating });

    } catch (error) {
      console.error('Get rating error:', error);
      res.status(500).json({
        error: 'Failed to fetch rating',
        message: 'An error occurred while fetching the rating'
      });
    }
  }

  // Delete a rating
  static async deleteRating(req, res) {
    try {
      const { id } = req.params;

      const rating = await Rating.findByPk(id);

      if (!rating) {
        return res.status(404).json({
          error: 'Rating not found',
          message: 'The specified rating could not be found'
        });
      }

      // Check if user owns the rating or is admin
      if (rating.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have permission to delete this rating'
        });
      }

      await rating.destroy();

      res.json({
        message: 'Rating deleted successfully'
      });

    } catch (error) {
      console.error('Delete rating error:', error);
      res.status(500).json({
        error: 'Failed to delete rating',
        message: 'An error occurred while deleting the rating'
      });
    }
  }

  // Get top-rated whiskies
  static async getTopRatedWhiskies(req, res) {
    try {
      const { limit = 10, min_ratings = 0 } = req.query;

      const topWhiskies = await Whisky.findAll({
        where: {
          rating_count: { [Op.gte]: parseInt(min_ratings) },
          is_available: true
        },
        order: [
          ['rating_average', 'DESC'],
          ['rating_count', 'DESC']
        ],
        limit: parseInt(limit)
      });

      res.json({
        whiskies: topWhiskies,
        criteria: {
          minimum_ratings: parseInt(min_ratings),
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Get top rated whiskies error:', error);
      res.status(500).json({
        error: 'Failed to fetch top rated whiskies',
        message: 'An error occurred while fetching top rated whiskies'
      });
    }
  }

  // Get recent ratings
  static async getRecentRatings(req, res) {
    try {
      const { limit = 10 } = req.query;

      const recentRatings = await Rating.findAll({
        where: { is_public: true },
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        include: [
          {
            model: Whisky,
            as: 'whisky',
            attributes: ['id', 'name', 'distillery', 'region']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'first_name', 'last_name']
          }
        ]
      });

      res.json({ ratings: recentRatings });

    } catch (error) {
      console.error('Get recent ratings error:', error);
      res.status(500).json({
        error: 'Failed to fetch recent ratings',
        message: 'An error occurred while fetching recent ratings'
      });
    }
  }
}

module.exports = RatingController;
