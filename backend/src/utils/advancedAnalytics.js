const { Op, Sequelize } = require('sequelize');
const { SystemSetting } = require('../models');

/**
 * Advanced analytics system for deep insights
 * Provides comprehensive analytics beyond basic statistics
 */

/**
 * Check if advanced analytics is enabled
 */
async function isAdvancedAnalyticsEnabled() {
  try {
    const setting = await SystemSetting.findOne({
      where: { key: 'enable_advanced_analytics' }
    });
    return setting ? setting.value === 'true' : false;
  } catch (error) {
    console.error('Error checking advanced analytics setting:', error);
    return false;
  }
}

/**
 * Get user engagement analytics
 */
async function getUserEngagementAnalytics(days = 30) {
  try {
    if (!await isAdvancedAnalyticsEnabled()) {
      return { error: 'Advanced analytics is disabled' };
    }

    const { User, Review, Rating, UserActivity } = require('../models');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Active users by day
    const dailyActiveUsers = await UserActivity.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('user_id'))), 'active_users']
      ],
      where: {
        created_at: { [Op.gte]: startDate }
      },
      group: [Sequelize.fn('DATE', Sequelize.col('created_at'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('created_at')), 'ASC']]
    });

    // User retention analysis
    const totalUsers = await User.count();
    const activeUsers = await UserActivity.count({
      distinct: true,
      col: 'user_id',
      where: {
        created_at: { [Op.gte]: startDate }
      }
    });

    // Content creation trends
    const reviewTrends = await Review.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'reviews_count']
      ],
      where: {
        created_at: { [Op.gte]: startDate }
      },
      group: [Sequelize.fn('DATE', Sequelize.col('created_at'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('created_at')), 'ASC']]
    });

    const ratingTrends = await Rating.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'ratings_count']
      ],
      where: {
        created_at: { [Op.gte]: startDate }
      },
      group: [Sequelize.fn('DATE', Sequelize.col('created_at'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('created_at')), 'ASC']]
    });

    // User engagement scoring
    const userEngagementScores = await User.findAll({
      attributes: [
        'id',
        'username',
        [Sequelize.literal('(SELECT COUNT(*) FROM reviews WHERE user_id = User.id)'), 'review_count'],
        [Sequelize.literal('(SELECT COUNT(*) FROM ratings WHERE user_id = User.id)'), 'rating_count'],
        [Sequelize.literal('(SELECT COUNT(DISTINCT DATE(created_at)) FROM user_activities WHERE user_id = User.id AND created_at >= ?)'), 'active_days']
      ],
      replacements: [startDate],
      order: [[Sequelize.literal('review_count + rating_count + active_days'), 'DESC']],
      limit: 10
    });

    return {
      period_days: days,
      daily_active_users: dailyActiveUsers.map(row => ({
        date: row.get('date'),
        active_users: parseInt(row.get('active_users'))
      })),
      user_retention: {
        total_users: totalUsers,
        active_users: activeUsers,
        retention_rate: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(2) : 0
      },
      content_trends: {
        reviews: reviewTrends.map(row => ({
          date: row.get('date'),
          count: parseInt(row.get('reviews_count'))
        })),
        ratings: ratingTrends.map(row => ({
          date: row.get('date'),
          count: parseInt(row.get('ratings_count'))
        }))
      },
      top_engaged_users: userEngagementScores.map(user => ({
        id: user.id,
        username: user.username,
        review_count: parseInt(user.get('review_count')),
        rating_count: parseInt(user.get('rating_count')),
        active_days: parseInt(user.get('active_days')),
        engagement_score: parseInt(user.get('review_count')) + parseInt(user.get('rating_count')) + parseInt(user.get('active_days'))
      }))
    };
  } catch (error) {
    console.error('Error getting user engagement analytics:', error);
    throw error;
  }
}

/**
 * Get whisky popularity analytics
 */
async function getWhiskyPopularityAnalytics() {
  try {
    if (!await isAdvancedAnalyticsEnabled()) {
      return { error: 'Advanced analytics is disabled' };
    }

    const { Whisky, Rating, Review } = require('../models');

    // Most rated whiskies
    const mostRatedWhiskies = await Whisky.findAll({
      attributes: [
        'id', 'name', 'distillery', 'region',
        [Sequelize.fn('COUNT', Sequelize.col('ratings.id')), 'rating_count'],
        [Sequelize.fn('AVG', Sequelize.col('ratings.overall_rating')), 'avg_rating']
      ],
      include: [
        {
          model: Rating,
          as: 'ratings',
          attributes: []
        }
      ],
      group: ['Whisky.id'],
      having: Sequelize.literal('COUNT(ratings.id) > 0'),
      order: [[Sequelize.fn('COUNT', Sequelize.col('ratings.id')), 'DESC']],
      limit: 20
    });

    // Regional popularity
    const regionalPopularity = await Whisky.findAll({
      attributes: [
        'region',
        [Sequelize.fn('COUNT', Sequelize.col('ratings.id')), 'total_ratings'],
        [Sequelize.fn('AVG', Sequelize.col('ratings.overall_rating')), 'avg_rating']
      ],
      include: [
        {
          model: Rating,
          as: 'ratings',
          attributes: []
        }
      ],
      group: ['region'],
      having: Sequelize.literal('COUNT(ratings.id) > 0'),
      order: [[Sequelize.fn('COUNT', Sequelize.col('ratings.id')), 'DESC']]
    });

    // Distillery popularity
    const distilleryPopularity = await Whisky.findAll({
      attributes: [
        'distillery',
        [Sequelize.fn('COUNT', Sequelize.col('ratings.id')), 'total_ratings'],
        [Sequelize.fn('AVG', Sequelize.col('ratings.overall_rating')), 'avg_rating'],
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('Whisky.id'))), 'whisky_count']
      ],
      include: [
        {
          model: Rating,
          as: 'ratings',
          attributes: []
        }
      ],
      group: ['distillery'],
      having: Sequelize.literal('COUNT(ratings.id) > 0'),
      order: [[Sequelize.fn('COUNT', Sequelize.col('ratings.id')), 'DESC']],
      limit: 15
    });

    // Rating distribution analysis
    const ratingDistribution = await Rating.findAll({
      attributes: [
        [Sequelize.fn('FLOOR', Sequelize.col('overall_rating')), 'rating_floor'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: [Sequelize.fn('FLOOR', Sequelize.col('overall_rating'))],
      order: [[Sequelize.fn('FLOOR', Sequelize.col('overall_rating')), 'ASC']]
    });

    // Age vs Rating correlation
    const ageRatingCorrelation = await Whisky.findAll({
      attributes: [
        'age',
        [Sequelize.fn('COUNT', Sequelize.col('ratings.id')), 'rating_count'],
        [Sequelize.fn('AVG', Sequelize.col('ratings.overall_rating')), 'avg_rating']
      ],
      include: [
        {
          model: Rating,
          as: 'ratings',
          attributes: []
        }
      ],
      where: {
        age: { [Op.ne]: null }
      },
      group: ['age'],
      having: Sequelize.literal('COUNT(ratings.id) >= 3'),
      order: [['age', 'ASC']]
    });

    return {
      most_rated_whiskies: mostRatedWhiskies.map(whisky => ({
        id: whisky.id,
        name: whisky.name,
        distillery: whisky.distillery,
        region: whisky.region,
        rating_count: parseInt(whisky.get('rating_count')),
        avg_rating: parseFloat(whisky.get('avg_rating')).toFixed(2)
      })),
      regional_popularity: regionalPopularity.map(region => ({
        region: region.region,
        total_ratings: parseInt(region.get('total_ratings')),
        avg_rating: parseFloat(region.get('avg_rating')).toFixed(2)
      })),
      distillery_popularity: distilleryPopularity.map(distillery => ({
        distillery: distillery.distillery,
        total_ratings: parseInt(distillery.get('total_ratings')),
        avg_rating: parseFloat(distillery.get('avg_rating')).toFixed(2),
        whisky_count: parseInt(distillery.get('whisky_count'))
      })),
      rating_distribution: ratingDistribution.map(rating => ({
        rating_range: `${rating.get('rating_floor')}-${parseInt(rating.get('rating_floor')) + 1}`,
        count: parseInt(rating.get('count'))
      })),
      age_rating_correlation: ageRatingCorrelation.map(item => ({
        age: item.age,
        rating_count: parseInt(item.get('rating_count')),
        avg_rating: parseFloat(item.get('avg_rating')).toFixed(2)
      }))
    };
  } catch (error) {
    console.error('Error getting whisky popularity analytics:', error);
    throw error;
  }
}

/**
 * Get user behavior analytics
 */
async function getUserBehaviorAnalytics() {
  try {
    if (!await isAdvancedAnalyticsEnabled()) {
      return { error: 'Advanced analytics is disabled' };
    }

    const { UserActivity, User } = require('../models');

    // Activity patterns by hour
    const hourlyActivity = await UserActivity.findAll({
      attributes: [
        [Sequelize.fn('EXTRACT', Sequelize.literal('HOUR FROM created_at')), 'hour'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'activity_count']
      ],
      group: [Sequelize.fn('EXTRACT', Sequelize.literal('HOUR FROM created_at'))],
      order: [[Sequelize.fn('EXTRACT', Sequelize.literal('HOUR FROM created_at')), 'ASC']]
    });

    // Activity patterns by day of week
    const weeklyActivity = await UserActivity.findAll({
      attributes: [
        [Sequelize.fn('EXTRACT', Sequelize.literal('DOW FROM created_at')), 'day_of_week'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'activity_count']
      ],
      group: [Sequelize.fn('EXTRACT', Sequelize.literal('DOW FROM created_at'))],
      order: [[Sequelize.fn('EXTRACT', Sequelize.literal('DOW FROM created_at')), 'ASC']]
    });

    // Most common user actions
    const actionFrequency = await UserActivity.findAll({
      attributes: [
        'action',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'frequency']
      ],
      group: ['action'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
      limit: 10
    });

    // User session patterns
    const sessionAnalytics = await UserActivity.findAll({
      attributes: [
        'user_id',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_actions'],
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.fn('DATE', Sequelize.col('created_at')))), 'active_days']
      ],
      group: ['user_id'],
      having: Sequelize.literal('COUNT(id) > 10'),
      order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
      limit: 100
    });

    // Calculate average session length (approximate)
    const avgActionsPerSession = sessionAnalytics.reduce((sum, user) => {
      const actions = parseInt(user.get('total_actions'));
      const days = parseInt(user.get('active_days'));
      return sum + (actions / Math.max(days, 1));
    }, 0) / Math.max(sessionAnalytics.length, 1);

    return {
      hourly_activity: hourlyActivity.map(hour => ({
        hour: parseInt(hour.get('hour')),
        activity_count: parseInt(hour.get('activity_count'))
      })),
      weekly_activity: weeklyActivity.map(day => ({
        day_of_week: parseInt(day.get('day_of_week')),
        day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day.get('day_of_week')],
        activity_count: parseInt(day.get('activity_count'))
      })),
      action_frequency: actionFrequency.map(action => ({
        action: action.action,
        frequency: parseInt(action.get('frequency'))
      })),
      session_analytics: {
        avg_actions_per_session: avgActionsPerSession.toFixed(2),
        total_analyzed_users: sessionAnalytics.length,
        most_active_users: sessionAnalytics.slice(0, 10).map(user => ({
          user_id: user.user_id,
          total_actions: parseInt(user.get('total_actions')),
          active_days: parseInt(user.get('active_days')),
          avg_actions_per_day: (parseInt(user.get('total_actions')) / parseInt(user.get('active_days'))).toFixed(2)
        }))
      }
    };
  } catch (error) {
    console.error('Error getting user behavior analytics:', error);
    throw error;
  }
}

/**
 * Get comprehensive analytics dashboard data
 */
async function getAnalyticsDashboard() {
  try {
    if (!await isAdvancedAnalyticsEnabled()) {
      return { error: 'Advanced analytics is disabled' };
    }

    const [userEngagement, whiskyPopularity, userBehavior] = await Promise.all([
      getUserEngagementAnalytics(30),
      getWhiskyPopularityAnalytics(),
      getUserBehaviorAnalytics()
    ]);

    return {
      generated_at: new Date().toISOString(),
      user_engagement: userEngagement,
      whisky_popularity: whiskyPopularity,
      user_behavior: userBehavior
    };
  } catch (error) {
    console.error('Error getting analytics dashboard:', error);
    throw error;
  }
}

/**
 * Generate analytics report export
 */
async function generateAnalyticsReport(format = 'json') {
  try {
    const dashboard = await getAnalyticsDashboard();
    
    if (format === 'json') {
      return dashboard;
    }
    
    if (format === 'summary') {
      return {
        report_date: new Date().toISOString(),
        summary: {
          total_active_users: dashboard.user_engagement?.user_retention?.active_users || 0,
          retention_rate: dashboard.user_engagement?.user_retention?.retention_rate || 0,
          most_popular_region: dashboard.whisky_popularity?.regional_popularity?.[0]?.region || 'N/A',
          peak_activity_hour: dashboard.user_behavior?.hourly_activity?.reduce((max, hour) => 
            hour.activity_count > max.activity_count ? hour : max, { hour: 0, activity_count: 0 }).hour,
          avg_rating: dashboard.whisky_popularity?.most_rated_whiskies?.reduce((sum, whisky) => 
            sum + parseFloat(whisky.avg_rating), 0) / Math.max(dashboard.whisky_popularity?.most_rated_whiskies?.length, 1) || 0
        }
      };
    }
    
    throw new Error(`Unsupported format: ${format}`);
  } catch (error) {
    console.error('Error generating analytics report:', error);
    throw error;
  }
}

module.exports = {
  isAdvancedAnalyticsEnabled,
  getUserEngagementAnalytics,
  getWhiskyPopularityAnalytics,
  getUserBehaviorAnalytics,
  getAnalyticsDashboard,
  generateAnalyticsReport
};