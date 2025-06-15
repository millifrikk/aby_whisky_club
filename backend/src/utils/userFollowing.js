const { Op, Sequelize } = require('sequelize');
const { SystemSetting } = require('../models');

/**
 * User following/friend system
 * Enables social connections between club members
 */

/**
 * Check if user following is enabled
 */
async function isUserFollowingEnabled() {
  try {
    const setting = await SystemSetting.findOne({
      where: { key: 'enable_user_follows' }
    });
    return setting ? setting.value === 'true' : false;
  } catch (error) {
    console.error('Error checking user following setting:', error);
    return false;
  }
}

/**
 * Follow a user
 */
async function followUser(followerId, followingId) {
  try {
    if (!await isUserFollowingEnabled()) {
      throw new Error('User following is currently disabled');
    }

    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    const { UserFollow, User } = require('../models');
    
    // Check if users exist
    const [follower, following] = await Promise.all([
      User.findByPk(followerId),
      User.findByPk(followingId)
    ]);
    
    if (!follower || !following) {
      throw new Error('One or both users not found');
    }
    
    // Check if already following
    const existingFollow = await UserFollow.findOne({
      where: {
        follower_id: followerId,
        following_id: followingId
      }
    });
    
    if (existingFollow) {
      return { success: false, message: 'Already following this user' };
    }
    
    // Check if user allows followers
    const canFollow = await canUserBeFollowed(followingId, followerId);
    if (!canFollow.allowed) {
      throw new Error(canFollow.reason);
    }
    
    // Create follow relationship
    await UserFollow.create({
      follower_id: followerId,
      following_id: followingId,
      followed_at: new Date()
    });
    
    // Update follower counts
    await Promise.all([
      User.increment('following_count', { where: { id: followerId } }),
      User.increment('followers_count', { where: { id: followingId } })
    ]);
    
    return { success: true, message: 'Successfully followed user' };
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
}

/**
 * Unfollow a user
 */
async function unfollowUser(followerId, followingId) {
  try {
    if (!await isUserFollowingEnabled()) {
      throw new Error('User following is currently disabled');
    }

    const { UserFollow, User } = require('../models');
    
    const result = await UserFollow.destroy({
      where: {
        follower_id: followerId,
        following_id: followingId
      }
    });
    
    if (result > 0) {
      // Update follower counts
      await Promise.all([
        User.decrement('following_count', { where: { id: followerId } }),
        User.decrement('followers_count', { where: { id: followingId } })
      ]);
      
      return { success: true, message: 'Successfully unfollowed user' };
    } else {
      return { success: false, message: 'Not following this user' };
    }
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
}

/**
 * Check if user can be followed
 */
async function canUserBeFollowed(userId, requesterId) {
  try {
    const { UserPrivacySetting, UserBlock } = require('../models');
    
    // Check if requester is blocked
    const isBlocked = await UserBlock.findOne({
      where: {
        blocker_id: userId,
        blocked_id: requesterId
      }
    });
    
    if (isBlocked) {
      return { allowed: false, reason: 'Cannot follow this user' };
    }
    
    // Check privacy settings
    const privacySettings = await UserPrivacySetting.findOne({
      where: { user_id: userId }
    });
    
    if (privacySettings && !privacySettings.allow_followers) {
      return { allowed: false, reason: 'User has disabled followers' };
    }
    
    return { allowed: true, reason: null };
  } catch (error) {
    console.error('Error checking follow permissions:', error);
    return { allowed: false, reason: 'Unable to verify permissions' };
  }
}

/**
 * Check if user A is following user B
 */
async function isFollowing(followerId, followingId) {
  try {
    if (!await isUserFollowingEnabled()) {
      return false;
    }

    const { UserFollow } = require('../models');
    
    const follow = await UserFollow.findOne({
      where: {
        follower_id: followerId,
        following_id: followingId
      }
    });
    
    return !!follow;
  } catch (error) {
    console.error('Error checking if following:', error);
    return false;
  }
}

/**
 * Get user's followers
 */
async function getUserFollowers(userId, page = 1, limit = 20) {
  try {
    if (!await isUserFollowingEnabled()) {
      return { error: 'User following is disabled' };
    }

    const { UserFollow, User } = require('../models');
    const offset = (page - 1) * limit;
    
    const followers = await UserFollow.findAndCountAll({
      where: { following_id: userId },
      include: [
        {
          model: User,
          as: 'follower',
          attributes: ['id', 'username', 'profile_image_url', 'bio', 'followers_count', 'following_count']
        }
      ],
      order: [['followed_at', 'DESC']],
      limit: limit,
      offset: offset
    });
    
    return {
      followers: followers.rows.map(follow => ({
        user: follow.follower,
        followed_at: follow.followed_at
      })),
      pagination: {
        page: page,
        limit: limit,
        total: followers.count,
        pages: Math.ceil(followers.count / limit)
      }
    };
  } catch (error) {
    console.error('Error getting followers:', error);
    throw error;
  }
}

/**
 * Get users that a user is following
 */
async function getUserFollowing(userId, page = 1, limit = 20) {
  try {
    if (!await isUserFollowingEnabled()) {
      return { error: 'User following is disabled' };
    }

    const { UserFollow, User } = require('../models');
    const offset = (page - 1) * limit;
    
    const following = await UserFollow.findAndCountAll({
      where: { follower_id: userId },
      include: [
        {
          model: User,
          as: 'following',
          attributes: ['id', 'username', 'profile_image_url', 'bio', 'followers_count', 'following_count']
        }
      ],
      order: [['followed_at', 'DESC']],
      limit: limit,
      offset: offset
    });
    
    return {
      following: following.rows.map(follow => ({
        user: follow.following,
        followed_at: follow.followed_at
      })),
      pagination: {
        page: page,
        limit: limit,
        total: following.count,
        pages: Math.ceil(following.count / limit)
      }
    };
  } catch (error) {
    console.error('Error getting following:', error);
    throw error;
  }
}

/**
 * Get mutual followers between two users
 */
async function getMutualFollowers(userId1, userId2) {
  try {
    if (!await isUserFollowingEnabled()) {
      return [];
    }

    const { UserFollow, User } = require('../models');
    
    // Get followers of both users and find intersection
    const mutualFollowers = await UserFollow.findAll({
      where: {
        following_id: userId1,
        follower_id: {
          [Op.in]: Sequelize.literal(`(
            SELECT follower_id FROM user_follows WHERE following_id = ${userId2}
          )`)
        }
      },
      include: [
        {
          model: User,
          as: 'follower',
          attributes: ['id', 'username', 'profile_image_url']
        }
      ],
      limit: 10 // Limit for performance
    });
    
    return mutualFollowers.map(follow => follow.follower);
  } catch (error) {
    console.error('Error getting mutual followers:', error);
    return [];
  }
}

/**
 * Get activity feed for user (posts from followed users)
 */
async function getFollowingActivityFeed(userId, page = 1, limit = 20) {
  try {
    if (!await isUserFollowingEnabled()) {
      return { error: 'User following is disabled' };
    }

    const { UserFollow, Review, Rating, Whisky, User } = require('../models');
    const offset = (page - 1) * limit;
    
    // Get list of users being followed
    const followingIds = await UserFollow.findAll({
      where: { follower_id: userId },
      attributes: ['following_id']
    });
    
    const followingUserIds = followingIds.map(f => f.following_id);
    
    if (followingUserIds.length === 0) {
      return {
        activities: [],
        pagination: { page, limit, total: 0, pages: 0 }
      };
    }
    
    // Get recent reviews from followed users
    const recentReviews = await Review.findAll({
      where: {
        user_id: { [Op.in]: followingUserIds },
        is_published: true
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'profile_image_url']
        },
        {
          model: Whisky,
          as: 'whisky',
          attributes: ['id', 'name', 'distillery', 'image_url']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: limit,
      offset: offset
    });
    
    // Get recent ratings from followed users
    const recentRatings = await Rating.findAll({
      where: {
        user_id: { [Op.in]: followingUserIds }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'profile_image_url']
        },
        {
          model: Whisky,
          as: 'whisky',
          attributes: ['id', 'name', 'distillery', 'image_url']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: limit,
      offset: offset
    });
    
    // Combine and sort activities
    const activities = [];
    
    recentReviews.forEach(review => {
      activities.push({
        type: 'review',
        id: review.id,
        user: review.user,
        whisky: review.whisky,
        content: review.content,
        rating: review.rating,
        created_at: review.created_at
      });
    });
    
    recentRatings.forEach(rating => {
      activities.push({
        type: 'rating',
        id: rating.id,
        user: rating.user,
        whisky: rating.whisky,
        overall_rating: rating.overall_rating,
        notes: rating.notes,
        created_at: rating.created_at
      });
    });
    
    // Sort by creation date
    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return {
      activities: activities.slice(0, limit),
      pagination: {
        page: page,
        limit: limit,
        total: activities.length,
        pages: Math.ceil(activities.length / limit)
      }
    };
  } catch (error) {
    console.error('Error getting activity feed:', error);
    throw error;
  }
}

/**
 * Get suggested users to follow
 */
async function getSuggestedFollows(userId, limit = 10) {
  try {
    if (!await isUserFollowingEnabled()) {
      return [];
    }

    const { User, UserFollow, Review, Rating } = require('../models');
    
    // Get users not currently followed
    const suggestedUsers = await User.findAll({
      where: {
        id: {
          [Op.ne]: userId,
          [Op.notIn]: Sequelize.literal(`(
            SELECT following_id FROM user_follows WHERE follower_id = ${userId}
          )`)
        },
        account_status: 'active'
      },
      attributes: [
        'id', 'username', 'profile_image_url', 'bio', 'followers_count',
        [Sequelize.literal('(SELECT COUNT(*) FROM reviews WHERE user_id = User.id)'), 'review_count'],
        [Sequelize.literal('(SELECT COUNT(*) FROM ratings WHERE user_id = User.id)'), 'rating_count']
      ],
      order: [
        [Sequelize.literal('review_count + rating_count'), 'DESC'],
        ['followers_count', 'DESC']
      ],
      limit: limit
    });
    
    return suggestedUsers.map(user => ({
      id: user.id,
      username: user.username,
      profile_image_url: user.profile_image_url,
      bio: user.bio,
      followers_count: user.followers_count,
      review_count: parseInt(user.get('review_count')),
      rating_count: parseInt(user.get('rating_count')),
      activity_score: parseInt(user.get('review_count')) + parseInt(user.get('rating_count'))
    }));
  } catch (error) {
    console.error('Error getting suggested follows:', error);
    return [];
  }
}

/**
 * Get user's following statistics
 */
async function getUserFollowingStats(userId) {
  try {
    const { User, UserFollow } = require('../models');
    
    const user = await User.findByPk(userId, {
      attributes: ['followers_count', 'following_count']
    });
    
    if (!user) {
      return { followers: 0, following: 0, ratio: 0 };
    }
    
    const ratio = user.following_count > 0 ? 
      (user.followers_count / user.following_count).toFixed(2) : 
      user.followers_count;
    
    return {
      followers: user.followers_count || 0,
      following: user.following_count || 0,
      ratio: parseFloat(ratio)
    };
  } catch (error) {
    console.error('Error getting following stats:', error);
    return { followers: 0, following: 0, ratio: 0 };
  }
}

module.exports = {
  isUserFollowingEnabled,
  followUser,
  unfollowUser,
  canUserBeFollowed,
  isFollowing,
  getUserFollowers,
  getUserFollowing,
  getMutualFollowers,
  getFollowingActivityFeed,
  getSuggestedFollows,
  getUserFollowingStats
};