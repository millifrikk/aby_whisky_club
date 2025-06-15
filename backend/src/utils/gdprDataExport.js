const { Op } = require('sequelize');
const { SystemSetting } = require('../models');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');

/**
 * GDPR compliance data export system
 * Allows users to export all their personal data
 */

/**
 * Check if data export is enabled
 */
async function isDataExportEnabled() {
  try {
    const setting = await SystemSetting.findOne({
      where: { key: 'export_user_data_enabled' }
    });
    return setting ? setting.value === 'true' : true; // Default enabled
  } catch (error) {
    console.error('Error checking data export setting:', error);
    return true; // Default to enabled for GDPR compliance
  }
}

/**
 * Generate comprehensive user data export
 */
async function generateUserDataExport(userId) {
  try {
    if (!await isDataExportEnabled()) {
      throw new Error('Data export is currently disabled');
    }

    const { User, Whisky, Review, Rating, NewsEvent, EventRSVP, UserActivity } = require('../models');
    
    // Get user data
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash', 'two_factor_secret'] }
    });
    
    if (!user) {
      throw new Error('User not found');
    }

    const exportData = {
      export_info: {
        generated_at: new Date().toISOString(),
        user_id: userId,
        export_type: 'GDPR_COMPLETE_DATA_EXPORT',
        version: '1.0'
      },
      
      personal_information: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_image_url: user.profile_image_url,
        bio: user.bio,
        location: user.location,
        website: user.website,
        phone: user.phone,
        date_of_birth: user.date_of_birth,
        preferred_language: user.preferred_language,
        timezone: user.timezone,
        role: user.role,
        account_status: user.account_status,
        email_verified: user.email_verified,
        email_verified_at: user.email_verified_at,
        last_login: user.last_login,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    };

    // Get user's whiskies
    try {
      const whiskies = await Whisky.findAll({
        where: { created_by: userId },
        include: [
          {
            model: Rating,
            as: 'ratings',
            where: { user_id: userId },
            required: false
          }
        ]
      });
      
      exportData.whiskies = whiskies.map(whisky => ({
        id: whisky.id,
        name: whisky.name,
        distillery: whisky.distillery,
        region: whisky.region,
        country: whisky.country,
        type: whisky.type,
        age: whisky.age,
        abv: whisky.abv,
        description: whisky.description,
        tasting_notes: whisky.tasting_notes,
        finish: whisky.finish,
        color: whisky.color,
        nose: whisky.nose,
        palate: whisky.palate,
        bottle_size: whisky.bottle_size,
        purchase_price: whisky.purchase_price,
        current_price: whisky.current_price,
        purchase_date: whisky.purchase_date,
        purchase_location: whisky.purchase_location,
        image_url: whisky.image_url,
        is_featured: whisky.is_featured,
        is_published: whisky.is_published,
        created_at: whisky.created_at,
        updated_at: whisky.updated_at,
        my_ratings: whisky.ratings || []
      }));
    } catch (error) {
      console.warn('Error fetching whiskies:', error);
      exportData.whiskies = [];
    }

    // Get user's reviews
    try {
      const reviews = await Review.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Whisky,
            as: 'whisky',
            attributes: ['id', 'name', 'distillery']
          }
        ]
      });
      
      exportData.reviews = reviews.map(review => ({
        id: review.id,
        whisky: review.whisky ? {
          id: review.whisky.id,
          name: review.whisky.name,
          distillery: review.whisky.distillery
        } : null,
        content: review.content,
        rating: review.rating,
        is_published: review.is_published,
        created_at: review.created_at,
        updated_at: review.updated_at
      }));
    } catch (error) {
      console.warn('Error fetching reviews:', error);
      exportData.reviews = [];
    }

    // Get user's ratings
    try {
      const ratings = await Rating.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Whisky,
            as: 'whisky',
            attributes: ['id', 'name', 'distillery']
          }
        ]
      });
      
      exportData.ratings = ratings.map(rating => ({
        id: rating.id,
        whisky: rating.whisky ? {
          id: rating.whisky.id,
          name: rating.whisky.name,
          distillery: rating.whisky.distillery
        } : null,
        overall_rating: rating.overall_rating,
        nose_rating: rating.nose_rating,
        taste_rating: rating.taste_rating,
        finish_rating: rating.finish_rating,
        notes: rating.notes,
        created_at: rating.created_at,
        updated_at: rating.updated_at
      }));
    } catch (error) {
      console.warn('Error fetching ratings:', error);
      exportData.ratings = [];
    }

    // Get user's event RSVPs
    try {
      const rsvps = await EventRSVP.findAll({
        where: { user_id: userId },
        include: [
          {
            model: NewsEvent,
            as: 'event',
            attributes: ['id', 'title', 'date', 'location']
          }
        ]
      });
      
      exportData.event_rsvps = rsvps.map(rsvp => ({
        id: rsvp.id,
        event: rsvp.event ? {
          id: rsvp.event.id,
          title: rsvp.event.title,
          date: rsvp.event.date,
          location: rsvp.event.location
        } : null,
        status: rsvp.status,
        guests_count: rsvp.guests_count,
        dietary_requirements: rsvp.dietary_requirements,
        special_requests: rsvp.special_requests,
        created_at: rsvp.created_at,
        updated_at: rsvp.updated_at
      }));
    } catch (error) {
      console.warn('Error fetching event RSVPs:', error);
      exportData.event_rsvps = [];
    }

    // Get user's activity logs (last 90 days for privacy)
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const activities = await UserActivity.findAll({
        where: { 
          user_id: userId,
          created_at: { [Op.gte]: ninetyDaysAgo }
        },
        order: [['created_at', 'DESC']],
        limit: 1000 // Limit to prevent huge exports
      });
      
      exportData.recent_activity = activities.map(activity => ({
        id: activity.id,
        action: activity.action,
        description: activity.description,
        ip_address: activity.ip_address ? 'XXX.XXX.XXX.XXX' : null, // Anonymized
        user_agent: activity.user_agent,
        created_at: activity.created_at
      }));
    } catch (error) {
      console.warn('Error fetching user activity:', error);
      exportData.recent_activity = [];
    }

    // Add data processing information
    exportData.data_processing_info = {
      categories_of_data: [
        'Personal identification information',
        'Account information',
        'User-generated content (reviews, ratings)',
        'Activity logs and usage data',
        'Event participation data'
      ],
      purposes_of_processing: [
        'Providing whisky club services',
        'User account management',
        'Content moderation',
        'Service improvement',
        'Communication about events and updates'
      ],
      retention_periods: {
        account_data: 'Until account deletion',
        activity_logs: 'Maximum 1 year',
        user_content: 'Until user requests deletion',
        system_logs: 'Maximum 30 days'
      },
      data_sharing: {
        third_parties: 'None',
        international_transfers: 'None',
        data_processors: 'Hosting service providers only'
      }
    };

    return exportData;
  } catch (error) {
    console.error('Error generating user data export:', error);
    throw error;
  }
}

/**
 * Create downloadable data export package
 */
async function createDataExportPackage(userId, outputDir = null) {
  try {
    const exportData = await generateUserDataExport(userId);
    
    // Create temporary directory if not provided
    if (!outputDir) {
      outputDir = path.join(__dirname, '../../exports');
      await fs.mkdir(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportId = `user-${userId}-${timestamp}`;
    const exportPath = path.join(outputDir, `${exportId}.zip`);
    
    // Create ZIP archive
    const output = require('fs').createWriteStream(exportPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Best compression
    });
    
    archive.pipe(output);
    
    // Add main data file
    archive.append(JSON.stringify(exportData, null, 2), {
      name: 'user_data.json'
    });
    
    // Add README file
    const readmeContent = `
# GDPR Data Export - Åby Whisky Club

This archive contains all personal data associated with your account.

## Files included:
- user_data.json: Complete export of your personal data in JSON format
- README.txt: This file

## Data categories included:
- Personal information
- Whiskies you've added
- Reviews you've written
- Ratings you've given
- Event RSVPs
- Recent account activity (last 90 days)

## Generated: ${new Date().toISOString()}
## Export ID: ${exportId}

For questions about this data export, please contact the club administrators.
    `.trim();
    
    archive.append(readmeContent, { name: 'README.txt' });
    
    await archive.finalize();
    
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        resolve({
          export_id: exportId,
          file_path: exportPath,
          file_size: archive.pointer(),
          generated_at: new Date().toISOString()
        });
      });
      
      archive.on('error', reject);
    });
  } catch (error) {
    console.error('Error creating data export package:', error);
    throw error;
  }
}

/**
 * Schedule cleanup of old export files
 */
async function cleanupOldExports(maxAgeHours = 24) {
  try {
    const exportDir = path.join(__dirname, '../../exports');
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    try {
      const files = await fs.readdir(exportDir);
      let deletedCount = 0;
      
      for (const file of files) {
        if (file.endsWith('.zip')) {
          const filePath = path.join(exportDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime.getTime() < cutoffTime) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      }
      
      console.log(`🧹 Cleaned up ${deletedCount} old data export files`);
      return deletedCount;
    } catch (dirError) {
      if (dirError.code !== 'ENOENT') {
        throw dirError;
      }
      return 0;
    }
  } catch (error) {
    console.error('Error cleaning up old exports:', error);
    return 0;
  }
}

/**
 * Generate data portability report (summary for users)
 */
async function generateDataPortabilityReport(userId) {
  try {
    const exportData = await generateUserDataExport(userId);
    
    const report = {
      user_id: userId,
      generated_at: new Date().toISOString(),
      data_summary: {
        whiskies_added: exportData.whiskies.length,
        reviews_written: exportData.reviews.length,
        ratings_given: exportData.ratings.length,
        events_attended: exportData.event_rsvps.filter(rsvp => rsvp.status === 'attending').length,
        account_age_days: Math.floor(
          (Date.now() - new Date(exportData.personal_information.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )
      },
      data_categories: Object.keys(exportData).filter(key => 
        !['export_info', 'data_processing_info'].includes(key)
      ),
      export_options: {
        full_export: 'Complete JSON data export',
        summary_report: 'Human-readable summary (this report)',
        specific_categories: 'Export selected data categories only'
      }
    };
    
    return report;
  } catch (error) {
    console.error('Error generating data portability report:', error);
    throw error;
  }
}

module.exports = {
  isDataExportEnabled,
  generateUserDataExport,
  createDataExportPackage,
  cleanupOldExports,
  generateDataPortabilityReport
};