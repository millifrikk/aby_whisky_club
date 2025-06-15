const { Op, Sequelize } = require('sequelize');
const { SystemSetting } = require('../models');

/**
 * User-generated whisky tagging system
 * Allows community-driven categorization and discovery
 */

/**
 * Check if whisky tagging is enabled
 */
async function isWhiskyTaggingEnabled() {
  try {
    const setting = await SystemSetting.findOne({
      where: { key: 'enable_whisky_tags' }
    });
    return setting ? setting.value === 'true' : true; // Default enabled
  } catch (error) {
    console.error('Error checking whisky tagging setting:', error);
    return true;
  }
}

/**
 * Predefined tag categories for better organization
 */
const TAG_CATEGORIES = {
  flavor: {
    name: 'Flavor Profile',
    icon: '👅',
    color: '#FF6B6B',
    suggestions: ['smoky', 'peaty', 'sweet', 'spicy', 'fruity', 'nutty', 'vanilla', 'caramel', 'chocolate', 'honey']
  },
  character: {
    name: 'Character',
    icon: '⭐',
    color: '#4ECDC4',
    suggestions: ['smooth', 'bold', 'complex', 'balanced', 'intense', 'mellow', 'robust', 'delicate', 'elegant', 'powerful']
  },
  occasion: {
    name: 'Occasion',
    icon: '🎉',
    color: '#45B7D1',
    suggestions: ['everyday', 'special', 'winter', 'summer', 'celebration', 'relaxing', 'social', 'contemplative', 'gift-worthy']
  },
  experience: {
    name: 'Experience Level',
    icon: '🎓',
    color: '#96CEB4',
    suggestions: ['beginner-friendly', 'intermediate', 'expert', 'acquired-taste', 'crowd-pleaser', 'challenging']
  },
  value: {
    name: 'Value',
    icon: '💰',
    color: '#FFEAA7',
    suggestions: ['budget', 'mid-range', 'premium', 'luxury', 'value-for-money', 'splurge', 'daily-dram', 'special-occasion']
  },
  custom: {
    name: 'Custom',
    icon: '🏷️',
    color: '#DDA0DD',
    suggestions: []
  }
};

/**
 * Add tag to whisky
 */
async function addTagToWhisky(whiskyId, tagName, userId, category = 'custom') {
  try {
    if (!await isWhiskyTaggingEnabled()) {
      throw new Error('Whisky tagging is currently disabled');
    }

    const { WhiskyTag, Whisky, User } = require('../models');
    
    // Validate inputs
    if (!tagName || tagName.trim().length === 0) {
      throw new Error('Tag name cannot be empty');
    }
    
    if (tagName.length > 50) {
      throw new Error('Tag name cannot exceed 50 characters');
    }
    
    // Normalize tag name
    const normalizedTag = tagName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    // Validate category
    if (!TAG_CATEGORIES[category]) {
      category = 'custom';
    }
    
    // Check if whisky exists
    const whisky = await Whisky.findByPk(whiskyId);
    if (!whisky) {
      throw new Error('Whisky not found');
    }
    
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if tag already exists for this whisky by this user
    const existingTag = await WhiskyTag.findOne({
      where: {
        whisky_id: whiskyId,
        tag_name: normalizedTag,
        created_by: userId
      }
    });
    
    if (existingTag) {
      return { success: false, message: 'Tag already exists' };
    }
    
    // Create the tag
    const tag = await WhiskyTag.create({
      whisky_id: whiskyId,
      tag_name: normalizedTag,
      display_name: tagName.trim(),
      category: category,
      created_by: userId,
      votes: 1
    });
    
    return { 
      success: true, 
      tag: {
        id: tag.id,
        name: tag.tag_name,
        display_name: tag.display_name,
        category: tag.category,
        votes: tag.votes
      }
    };
  } catch (error) {
    console.error('Error adding tag to whisky:', error);
    throw error;
  }
}

/**
 * Vote on a tag (upvote/downvote)
 */
async function voteOnTag(tagId, userId, voteType = 'up') {
  try {
    if (!await isWhiskyTaggingEnabled()) {
      throw new Error('Whisky tagging is currently disabled');
    }

    const { WhiskyTag, WhiskyTagVote } = require('../models');
    
    // Check if tag exists
    const tag = await WhiskyTag.findByPk(tagId);
    if (!tag) {
      throw new Error('Tag not found');
    }
    
    // Check if user already voted on this tag
    const existingVote = await WhiskyTagVote.findOne({
      where: {
        tag_id: tagId,
        user_id: userId
      }
    });
    
    const voteValue = voteType === 'up' ? 1 : -1;
    
    if (existingVote) {
      // Update existing vote
      const oldVoteValue = existingVote.vote_type === 'up' ? 1 : -1;
      const voteDiff = voteValue - oldVoteValue;
      
      if (voteDiff === 0) {
        return { success: false, message: 'Already voted this way' };
      }
      
      await existingVote.update({
        vote_type: voteType,
        voted_at: new Date()
      });
      
      // Update tag vote count
      await tag.increment('votes', { by: voteDiff });
    } else {
      // Create new vote
      await WhiskyTagVote.create({
        tag_id: tagId,
        user_id: userId,
        vote_type: voteType,
        voted_at: new Date()
      });
      
      // Update tag vote count
      await tag.increment('votes', { by: voteValue });
    }
    
    return { success: true, message: 'Vote recorded' };
  } catch (error) {
    console.error('Error voting on tag:', error);
    throw error;
  }
}

/**
 * Remove tag from whisky
 */
async function removeTagFromWhisky(tagId, userId, isAdmin = false) {
  try {
    const { WhiskyTag } = require('../models');
    
    const whereClause = { id: tagId };
    
    // Only allow creator or admin to remove tag
    if (!isAdmin) {
      whereClause.created_by = userId;
    }
    
    const result = await WhiskyTag.destroy({
      where: whereClause
    });
    
    if (result > 0) {
      return { success: true, message: 'Tag removed' };
    } else {
      return { success: false, message: 'Tag not found or not authorized' };
    }
  } catch (error) {
    console.error('Error removing tag:', error);
    throw error;
  }
}

/**
 * Get tags for a whisky
 */
async function getWhiskyTags(whiskyId, userId = null) {
  try {
    if (!await isWhiskyTaggingEnabled()) {
      return [];
    }

    const { WhiskyTag, WhiskyTagVote, User } = require('../models');
    
    const tags = await WhiskyTag.findAll({
      where: { whisky_id: whiskyId },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        },
        ...(userId ? [{
          model: WhiskyTagVote,
          as: 'userVote',
          where: { user_id: userId },
          required: false,
          attributes: ['vote_type']
        }] : [])
      ],
      order: [['votes', 'DESC'], ['created_at', 'ASC']]
    });
    
    // Group tags by category
    const tagsByCategory = {};
    
    tags.forEach(tag => {
      const category = tag.category || 'custom';
      
      if (!tagsByCategory[category]) {
        tagsByCategory[category] = {
          ...TAG_CATEGORIES[category],
          tags: []
        };
      }
      
      tagsByCategory[category].tags.push({
        id: tag.id,
        name: tag.tag_name,
        display_name: tag.display_name,
        votes: tag.votes,
        created_by: tag.creator,
        user_vote: userId && tag.userVote ? tag.userVote.vote_type : null,
        created_at: tag.created_at
      });
    });
    
    return tagsByCategory;
  } catch (error) {
    console.error('Error getting whisky tags:', error);
    return {};
  }
}

/**
 * Search whiskies by tags
 */
async function searchWhiskiesByTags(tagNames, limit = 20, offset = 0) {
  try {
    if (!await isWhiskyTaggingEnabled()) {
      return { whiskies: [], total: 0 };
    }

    const { Whisky, WhiskyTag } = require('../models');
    
    // Normalize tag names
    const normalizedTags = tagNames.map(tag => tag.toLowerCase().trim());
    
    const whiskies = await Whisky.findAndCountAll({
      include: [
        {
          model: WhiskyTag,
          as: 'tags',
          where: {
            tag_name: { [Op.in]: normalizedTags }
          },
          attributes: ['tag_name', 'display_name', 'votes']
        }
      ],
      group: ['Whisky.id'],
      having: Sequelize.literal(`COUNT(DISTINCT tags.tag_name) = ${normalizedTags.length}`),
      limit: limit,
      offset: offset,
      distinct: true
    });
    
    return {
      whiskies: whiskies.rows,
      total: whiskies.count.length || whiskies.count
    };
  } catch (error) {
    console.error('Error searching whiskies by tags:', error);
    return { whiskies: [], total: 0 };
  }
}

/**
 * Get popular tags
 */
async function getPopularTags(limit = 50, category = null) {
  try {
    if (!await isWhiskyTaggingEnabled()) {
      return [];
    }

    const { WhiskyTag } = require('../models');
    
    const whereClause = {};
    if (category && TAG_CATEGORIES[category]) {
      whereClause.category = category;
    }
    
    const tags = await WhiskyTag.findAll({
      attributes: [
        'tag_name',
        'display_name',
        'category',
        [Sequelize.fn('COUNT', Sequelize.col('whisky_id')), 'whisky_count'],
        [Sequelize.fn('SUM', Sequelize.col('votes')), 'total_votes']
      ],
      where: whereClause,
      group: ['tag_name', 'display_name', 'category'],
      order: [
        [Sequelize.fn('SUM', Sequelize.col('votes')), 'DESC'],
        [Sequelize.fn('COUNT', Sequelize.col('whisky_id')), 'DESC']
      ],
      limit: limit
    });
    
    return tags.map(tag => ({
      name: tag.tag_name,
      display_name: tag.display_name,
      category: tag.category,
      whisky_count: parseInt(tag.get('whisky_count')),
      total_votes: parseInt(tag.get('total_votes')),
      category_info: TAG_CATEGORIES[tag.category] || TAG_CATEGORIES.custom
    }));
  } catch (error) {
    console.error('Error getting popular tags:', error);
    return [];
  }
}

/**
 * Get tag suggestions based on partial input
 */
async function getTagSuggestions(partial, category = null, limit = 10) {
  try {
    if (!await isWhiskyTaggingEnabled()) {
      return [];
    }

    const suggestions = [];
    
    // Add predefined suggestions
    if (category && TAG_CATEGORIES[category]) {
      const categoryTags = TAG_CATEGORIES[category].suggestions || [];
      const matchingTags = categoryTags.filter(tag => 
        tag.toLowerCase().includes(partial.toLowerCase())
      );
      suggestions.push(...matchingTags.slice(0, limit));
    } else {
      // Search across all categories
      Object.values(TAG_CATEGORIES).forEach(cat => {
        const matchingTags = (cat.suggestions || []).filter(tag =>
          tag.toLowerCase().includes(partial.toLowerCase())
        );
        suggestions.push(...matchingTags);
      });
    }
    
    // Add existing tags from database
    const { WhiskyTag } = require('../models');
    
    const whereClause = {
      [Op.or]: [
        { tag_name: { [Op.iLike]: `%${partial}%` } },
        { display_name: { [Op.iLike]: `%${partial}%` } }
      ]
    };
    
    if (category) {
      whereClause.category = category;
    }
    
    const existingTags = await WhiskyTag.findAll({
      attributes: ['tag_name', 'display_name', 'category'],
      where: whereClause,
      group: ['tag_name', 'display_name', 'category'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
      limit: limit
    });
    
    existingTags.forEach(tag => {
      if (!suggestions.includes(tag.display_name)) {
        suggestions.push(tag.display_name);
      }
    });
    
    return suggestions.slice(0, limit);
  } catch (error) {
    console.error('Error getting tag suggestions:', error);
    return [];
  }
}

/**
 * Get tag statistics
 */
async function getTagStatistics() {
  try {
    if (!await isWhiskyTaggingEnabled()) {
      return {};
    }

    const { WhiskyTag } = require('../models');
    
    // Total tags and whiskies tagged
    const [totalTags, totalTaggedWhiskies, categoryStats] = await Promise.all([
      WhiskyTag.count(),
      WhiskyTag.count({ distinct: true, col: 'whisky_id' }),
      WhiskyTag.findAll({
        attributes: [
          'category',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'tag_count'],
          [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('whisky_id'))), 'whisky_count']
        ],
        group: ['category'],
        order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']]
      })
    ]);
    
    return {
      total_tags: totalTags,
      total_tagged_whiskies: totalTaggedWhiskies,
      category_breakdown: categoryStats.map(stat => ({
        category: stat.category,
        category_info: TAG_CATEGORIES[stat.category] || TAG_CATEGORIES.custom,
        tag_count: parseInt(stat.get('tag_count')),
        whisky_count: parseInt(stat.get('whisky_count'))
      }))
    };
  } catch (error) {
    console.error('Error getting tag statistics:', error);
    return {};
  }
}

module.exports = {
  isWhiskyTaggingEnabled,
  TAG_CATEGORIES,
  addTagToWhisky,
  voteOnTag,
  removeTagFromWhisky,
  getWhiskyTags,
  searchWhiskiesByTags,
  getPopularTags,
  getTagSuggestions,
  getTagStatistics
};