const { SystemSetting } = require('../models');

/**
 * Enhanced social media sharing system
 * Provides comprehensive sharing capabilities for club content
 */

/**
 * Check if social sharing is enabled
 */
async function isSocialSharingEnabled() {
  try {
    const setting = await SystemSetting.findOne({
      where: { key: 'enable_social_sharing' }
    });
    return setting ? setting.value === 'true' : true; // Default enabled
  } catch (error) {
    console.error('Error checking social sharing setting:', error);
    return true;
  }
}

/**
 * Supported social platforms and their configurations
 */
const SOCIAL_PLATFORMS = {
  facebook: {
    name: 'Facebook',
    shareUrl: 'https://www.facebook.com/sharer/sharer.php',
    params: {
      u: 'url',
      quote: 'text'
    },
    icon: 'fab fa-facebook-f',
    color: '#1877F2'
  },
  twitter: {
    name: 'Twitter',
    shareUrl: 'https://twitter.com/intent/tweet',
    params: {
      url: 'url',
      text: 'text',
      hashtags: 'hashtags'
    },
    icon: 'fab fa-twitter',
    color: '#1DA1F2'
  },
  linkedin: {
    name: 'LinkedIn',
    shareUrl: 'https://www.linkedin.com/sharing/share-offsite/',
    params: {
      url: 'url'
    },
    icon: 'fab fa-linkedin-in',
    color: '#0A66C2'
  },
  reddit: {
    name: 'Reddit',
    shareUrl: 'https://www.reddit.com/submit',
    params: {
      url: 'url',
      title: 'text'
    },
    icon: 'fab fa-reddit-alien',
    color: '#FF4500'
  },
  whatsapp: {
    name: 'WhatsApp',
    shareUrl: 'https://wa.me/',
    params: {
      text: 'text_with_url'
    },
    icon: 'fab fa-whatsapp',
    color: '#25D366'
  },
  telegram: {
    name: 'Telegram',
    shareUrl: 'https://t.me/share/url',
    params: {
      url: 'url',
      text: 'text'
    },
    icon: 'fab fa-telegram-plane',
    color: '#0088CC'
  },
  email: {
    name: 'Email',
    shareUrl: 'mailto:',
    params: {
      subject: 'text',
      body: 'text_with_url'
    },
    icon: 'fas fa-envelope',
    color: '#6C757D'
  },
  copy: {
    name: 'Copy Link',
    shareUrl: null, // Handled by JavaScript
    params: {},
    icon: 'fas fa-link',
    color: '#6C757D'
  }
};

/**
 * Generate sharing content for whisky
 */
function generateWhiskyShareContent(whisky, baseUrl = 'http://localhost:3000') {
  const url = `${baseUrl}/whiskies/${whisky.id}`;
  const rating = whisky.average_rating ? ` (${whisky.average_rating}★)` : '';
  
  return {
    url: url,
    text: `Check out this ${whisky.name} from ${whisky.distillery}${rating} on Åby Whisky Club!`,
    title: `${whisky.name} - ${whisky.distillery}`,
    description: whisky.description || `Discover this amazing whisky from ${whisky.region}`,
    hashtags: ['whisky', 'scotland', 'spirits', 'abywhiskyclub'],
    image: whisky.image_url || null
  };
}

/**
 * Generate sharing content for review
 */
function generateReviewShareContent(review, whisky, user, baseUrl = 'http://localhost:3000') {
  const url = `${baseUrl}/whiskies/${whisky.id}/reviews/${review.id}`;
  const rating = review.rating ? ` ${review.rating}★` : '';
  
  return {
    url: url,
    text: `${user.username} reviewed ${whisky.name}:${rating} "${review.content.substring(0, 100)}..." on Åby Whisky Club`,
    title: `Review: ${whisky.name} by ${user.username}`,
    description: review.content.substring(0, 200),
    hashtags: ['whiskyreview', 'whisky', 'tasting', 'abywhiskyclub'],
    image: whisky.image_url || null
  };
}

/**
 * Generate sharing content for event
 */
function generateEventShareContent(event, baseUrl = 'http://localhost:3000') {
  const url = `${baseUrl}/events/${event.id}`;
  const eventDate = new Date(event.date).toLocaleDateString();
  
  return {
    url: url,
    text: `Join us for "${event.title}" on ${eventDate} at Åby Whisky Club!`,
    title: event.title,
    description: event.description || `Whisky club event on ${eventDate}`,
    hashtags: ['whiskyevent', 'whisky', 'tasting', 'abywhiskyclub'],
    image: event.image_url || null
  };
}

/**
 * Generate sharing content for user profile
 */
function generateProfileShareContent(user, baseUrl = 'http://localhost:3000') {
  const url = `${baseUrl}/members/${user.id}`;
  
  return {
    url: url,
    text: `Check out ${user.username}'s whisky collection and reviews on Åby Whisky Club!`,
    title: `${user.username} - Åby Whisky Club Member`,
    description: user.bio || `Whisky enthusiast and club member`,
    hashtags: ['whisky', 'member', 'collection', 'abywhiskyclub'],
    image: user.profile_image_url || null
  };
}

/**
 * Generate sharing URLs for all platforms
 */
function generateSharingUrls(content) {
  const urls = {};
  
  Object.keys(SOCIAL_PLATFORMS).forEach(platform => {
    const config = SOCIAL_PLATFORMS[platform];
    
    if (platform === 'copy') {
      urls[platform] = {
        url: content.url,
        platform: config.name,
        icon: config.icon,
        color: config.color
      };
      return;
    }
    
    if (platform === 'whatsapp') {
      const text = encodeURIComponent(`${content.text} ${content.url}`);
      urls[platform] = {
        url: `${config.shareUrl}?text=${text}`,
        platform: config.name,
        icon: config.icon,
        color: config.color
      };
      return;
    }
    
    const params = new URLSearchParams();
    
    Object.keys(config.params).forEach(paramKey => {
      const contentKey = config.params[paramKey];
      
      switch (contentKey) {
        case 'url':
          params.append(paramKey, content.url);
          break;
        case 'text':
          params.append(paramKey, content.text);
          break;
        case 'hashtags':
          if (content.hashtags && content.hashtags.length > 0) {
            params.append(paramKey, content.hashtags.join(','));
          }
          break;
        case 'text_with_url':
          params.append(paramKey, `${content.text} ${content.url}`);
          break;
      }
    });
    
    urls[platform] = {
      url: `${config.shareUrl}?${params.toString()}`,
      platform: config.name,
      icon: config.icon,
      color: config.color
    };
  });
  
  return urls;
}

/**
 * Generate comprehensive sharing data
 */
async function generateSharingData(type, item, user = null, baseUrl = 'http://localhost:3000') {
  try {
    if (!await isSocialSharingEnabled()) {
      return { error: 'Social sharing is disabled' };
    }

    let content;
    
    switch (type) {
      case 'whisky':
        content = generateWhiskyShareContent(item, baseUrl);
        break;
      case 'review':
        const { whisky } = item;
        content = generateReviewShareContent(item, whisky, user, baseUrl);
        break;
      case 'event':
        content = generateEventShareContent(item, baseUrl);
        break;
      case 'profile':
        content = generateProfileShareContent(item, baseUrl);
        break;
      default:
        throw new Error(`Unsupported sharing type: ${type}`);
    }
    
    const sharingUrls = generateSharingUrls(content);
    
    // Generate Open Graph meta tags
    const openGraph = {
      'og:title': content.title,
      'og:description': content.description,
      'og:url': content.url,
      'og:type': type === 'event' ? 'event' : 'article',
      'og:site_name': 'Åby Whisky Club',
      'og:locale': 'en_US'
    };
    
    if (content.image) {
      openGraph['og:image'] = content.image;
      openGraph['og:image:alt'] = content.title;
    }
    
    // Generate Twitter Card meta tags
    const twitterCard = {
      'twitter:card': content.image ? 'summary_large_image' : 'summary',
      'twitter:title': content.title,
      'twitter:description': content.description,
      'twitter:url': content.url
    };
    
    if (content.image) {
      twitterCard['twitter:image'] = content.image;
    }
    
    return {
      content: content,
      sharing_urls: sharingUrls,
      meta_tags: {
        open_graph: openGraph,
        twitter_card: twitterCard
      },
      platforms: Object.keys(SOCIAL_PLATFORMS)
    };
  } catch (error) {
    console.error('Error generating sharing data:', error);
    throw error;
  }
}

/**
 * Track sharing analytics
 */
async function trackSharingEvent(userId, contentType, contentId, platform) {
  try {
    const { SharingAnalytics } = require('../models');
    
    await SharingAnalytics.create({
      user_id: userId,
      content_type: contentType,
      content_id: contentId,
      platform: platform,
      shared_at: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error tracking sharing event:', error);
    return false;
  }
}

/**
 * Get sharing statistics
 */
async function getSharingStats(contentType = null, days = 30) {
  try {
    const { SharingAnalytics } = require('../models');
    const { Op, Sequelize } = require('sequelize');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const whereClause = {
      shared_at: { [Op.gte]: startDate }
    };
    
    if (contentType) {
      whereClause.content_type = contentType;
    }
    
    // Platform breakdown
    const platformStats = await SharingAnalytics.findAll({
      attributes: [
        'platform',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'share_count']
      ],
      where: whereClause,
      group: ['platform'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']]
    });
    
    // Content type breakdown
    const contentTypeStats = await SharingAnalytics.findAll({
      attributes: [
        'content_type',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'share_count']
      ],
      where: whereClause,
      group: ['content_type'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']]
    });
    
    // Daily sharing trends
    const dailyStats = await SharingAnalytics.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('shared_at')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'share_count']
      ],
      where: whereClause,
      group: [Sequelize.fn('DATE', Sequelize.col('shared_at'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('shared_at')), 'ASC']]
    });
    
    return {
      period_days: days,
      platform_breakdown: platformStats.map(stat => ({
        platform: stat.platform,
        shares: parseInt(stat.get('share_count'))
      })),
      content_type_breakdown: contentTypeStats.map(stat => ({
        content_type: stat.content_type,
        shares: parseInt(stat.get('share_count'))
      })),
      daily_trends: dailyStats.map(stat => ({
        date: stat.get('date'),
        shares: parseInt(stat.get('share_count'))
      })),
      total_shares: platformStats.reduce((sum, stat) => sum + parseInt(stat.get('share_count')), 0)
    };
  } catch (error) {
    console.error('Error getting sharing stats:', error);
    return { error: error.message };
  }
}

module.exports = {
  isSocialSharingEnabled,
  SOCIAL_PLATFORMS,
  generateSharingData,
  generateWhiskyShareContent,
  generateReviewShareContent,
  generateEventShareContent,
  generateProfileShareContent,
  generateSharingUrls,
  trackSharingEvent,
  getSharingStats
};