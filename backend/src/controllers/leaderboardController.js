const { User, Rating, Whisky, SystemSetting } = require('../models');
const { Op } = require('sequelize');

class LeaderboardController {
  // Get top raters leaderboard
  static async getTopRaters(req, res) {
    try {
      // Check if leaderboard is enabled
      const leaderboardEnabled = await SystemSetting.getSetting('leaderboard_enabled', true);
      if (!leaderboardEnabled) {
        return res.status(404).json({
          error: 'Feature not available',
          message: 'Leaderboard feature is currently disabled'
        });
      }

      const { limit = 10, timeframe = 'all' } = req.query;
      
      // Build date filter based on timeframe
      let dateFilter = {};
      if (timeframe !== 'all') {
        const now = new Date();
        const startDate = new Date();
        
        switch (timeframe) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            // 'all' - no date filter
            break;
        }
        
        if (timeframe !== 'all') {
          dateFilter = {
            created_at: {
              [Op.gte]: startDate
            }
          };
        }
      }

      const topRaters = await User.findAll({
        attributes: [
          'id', 
          'username', 
          'first_name', 
          'last_name',
          [User.sequelize.fn('COUNT', User.sequelize.col('ratings.id')), 'rating_count'],
          [User.sequelize.fn('AVG', User.sequelize.col('ratings.overall_score')), 'average_rating'],
          [User.sequelize.fn('MAX', User.sequelize.col('ratings.created_at')), 'last_rating_date']
        ],
        include: [
          {
            model: Rating,
            as: 'ratings',
            attributes: [],
            where: dateFilter,
            required: true
          }
        ],
        group: ['User.id'],
        having: User.sequelize.where(
          User.sequelize.fn('COUNT', User.sequelize.col('ratings.id')),
          Op.gt,
          0
        ),
        order: [
          [User.sequelize.fn('COUNT', User.sequelize.col('ratings.id')), 'DESC'],
          [User.sequelize.fn('AVG', User.sequelize.col('ratings.overall_score')), 'DESC']
        ],
        limit: parseInt(limit),
        subQuery: false
      });

      // Format the response with safe user data
      const formattedRaters = topRaters.map((user, index) => ({
        rank: index + 1,
        user: {
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          display_name: user.first_name || user.username || 'Member'
        },
        stats: {
          rating_count: parseInt(user.getDataValue('rating_count')),
          average_rating: parseFloat(user.getDataValue('average_rating')).toFixed(2),
          last_rating_date: user.getDataValue('last_rating_date')
        }
      }));

      res.json({
        leaderboard: formattedRaters,
        timeframe,
        total_raters: formattedRaters.length,
        generated_at: new Date()
      });

    } catch (error) {
      console.error('Get top raters error:', error);
      res.status(500).json({
        error: 'Failed to fetch leaderboard',
        message: 'An error occurred while fetching the top raters'
      });
    }
  }

  // Get top rated whiskies
  static async getTopWhiskies(req, res) {
    try {
      // Check if leaderboard is enabled
      const leaderboardEnabled = await SystemSetting.getSetting('leaderboard_enabled', true);
      if (!leaderboardEnabled) {
        return res.status(404).json({
          error: 'Feature not available',
          message: 'Leaderboard feature is currently disabled'
        });
      }

      const { limit = 10, min_ratings = 3 } = req.query;

      const topWhiskies = await Whisky.findAll({
        attributes: [
          'id',
          'name',
          'distillery',
          'region',
          'country',
          'age',
          'abv',
          'image_url',
          'rating_average',
          'rating_count'
        ],
        where: {
          rating_count: {
            [Op.gte]: parseInt(min_ratings)
          },
          rating_average: {
            [Op.gt]: 0
          }
        },
        order: [
          ['rating_average', 'DESC'],
          ['rating_count', 'DESC']
        ],
        limit: parseInt(limit)
      });

      const formattedWhiskies = topWhiskies.map((whisky, index) => ({
        rank: index + 1,
        whisky: {
          id: whisky.id,
          name: whisky.name,
          distillery: whisky.distillery,
          region: whisky.region,
          country: whisky.country,
          age: whisky.age,
          abv: whisky.abv,
          image_url: whisky.image_url
        },
        stats: {
          rating_average: parseFloat(whisky.rating_average).toFixed(2),
          rating_count: whisky.rating_count
        }
      }));

      res.json({
        leaderboard: formattedWhiskies,
        min_ratings: parseInt(min_ratings),
        total_whiskies: formattedWhiskies.length,
        generated_at: new Date()
      });

    } catch (error) {
      console.error('Get top whiskies error:', error);
      res.status(500).json({
        error: 'Failed to fetch whisky leaderboard',
        message: 'An error occurred while fetching the top whiskies'
      });
    }
  }

  // Get combined leaderboard stats
  static async getLeaderboardStats(req, res) {
    try {
      // Check if leaderboard is enabled
      const leaderboardEnabled = await SystemSetting.getSetting('leaderboard_enabled', true);
      if (!leaderboardEnabled) {
        return res.status(404).json({
          error: 'Feature not available',
          message: 'Leaderboard feature is currently disabled'
        });
      }

      // Get basic stats for leaderboard
      const [
        totalRaters,
        totalRatings,
        topRatedWhisky,
        mostActiveRater
      ] = await Promise.all([
        User.count({
          include: [{
            model: Rating,
            as: 'ratings',
            required: true
          }]
        }),
        Rating.count(),
        Whisky.findOne({
          where: { rating_count: { [Op.gte]: 3 } },
          order: [['rating_average', 'DESC']],
          attributes: ['name', 'rating_average', 'rating_count']
        }),
        User.findOne({
          attributes: [
            'username', 
            'first_name',
            [User.sequelize.fn('COUNT', User.sequelize.col('ratings.id')), 'rating_count']
          ],
          include: [{
            model: Rating,
            as: 'ratings',
            attributes: [],
            required: true
          }],
          group: ['User.id'],
          order: [[User.sequelize.fn('COUNT', User.sequelize.col('ratings.id')), 'DESC']],
          subQuery: false
        })
      ]);

      res.json({
        stats: {
          total_raters: totalRaters,
          total_ratings: totalRatings,
          top_rated_whisky: topRatedWhisky ? {
            name: topRatedWhisky.name,
            rating: parseFloat(topRatedWhisky.rating_average).toFixed(2),
            rating_count: topRatedWhisky.rating_count
          } : null,
          most_active_rater: mostActiveRater ? {
            name: mostActiveRater.first_name || mostActiveRater.username || 'Member',
            rating_count: parseInt(mostActiveRater.getDataValue('rating_count'))
          } : null
        },
        generated_at: new Date()
      });

    } catch (error) {
      console.error('Get leaderboard stats error:', error);
      res.status(500).json({
        error: 'Failed to fetch leaderboard stats',
        message: 'An error occurred while fetching leaderboard statistics'
      });
    }
  }
}

module.exports = LeaderboardController;