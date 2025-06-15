const { Op } = require('sequelize');
const { SystemSetting } = require('../models');
const cron = require('node-cron');

/**
 * Data retention and cleanup system
 * Manages automatic data cleanup based on admin settings
 */

/**
 * Get data retention setting from database
 */
async function getDataRetentionDays() {
  try {
    const setting = await SystemSetting.findOne({
      where: { key: 'data_retention_days' }
    });
    return setting ? parseInt(setting.value, 10) : 365; // Default 1 year
  } catch (error) {
    console.error('Error fetching data retention setting:', error);
    return 365; // Fallback to 1 year
  }
}

/**
 * Calculate cutoff date based on retention policy
 */
function getCutoffDate(retentionDays) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  return cutoffDate;
}

/**
 * Clean up user activity logs
 */
async function cleanupUserActivityLogs(retentionDays) {
  try {
    const { UserActivity } = require('../models');
    const cutoffDate = getCutoffDate(retentionDays);
    
    const result = await UserActivity.destroy({
      where: {
        created_at: {
          [Op.lt]: cutoffDate
        }
      }
    });
    
    console.log(`🧹 Cleaned up ${result} user activity records older than ${retentionDays} days`);
    return { table: 'user_activity', deleted: result };
  } catch (error) {
    console.error('Error cleaning up user activity logs:', error);
    return { table: 'user_activity', deleted: 0, error: error.message };
  }
}

/**
 * Clean up session data
 */
async function cleanupSessionData(retentionDays) {
  try {
    const { UserSession } = require('../models');
    const cutoffDate = getCutoffDate(retentionDays);
    
    const result = await UserSession.destroy({
      where: {
        [Op.or]: [
          { last_activity: { [Op.lt]: cutoffDate } },
          { expires_at: { [Op.lt]: new Date() } } // Also clean expired sessions
        ]
      }
    });
    
    console.log(`🧹 Cleaned up ${result} session records older than ${retentionDays} days`);
    return { table: 'user_sessions', deleted: result };
  } catch (error) {
    console.error('Error cleaning up session data:', error);
    return { table: 'user_sessions', deleted: 0, error: error.message };
  }
}

/**
 * Clean up email verification tokens
 */
async function cleanupEmailTokens(retentionDays) {
  try {
    const { EmailVerificationToken } = require('../models');
    const cutoffDate = getCutoffDate(retentionDays);
    
    const result = await EmailVerificationToken.destroy({
      where: {
        [Op.or]: [
          { created_at: { [Op.lt]: cutoffDate } },
          { expires_at: { [Op.lt]: new Date() } } // Also clean expired tokens
        ]
      }
    });
    
    console.log(`🧹 Cleaned up ${result} email verification tokens older than ${retentionDays} days`);
    return { table: 'email_verification_tokens', deleted: result };
  } catch (error) {
    console.error('Error cleaning up email tokens:', error);
    return { table: 'email_verification_tokens', deleted: 0, error: error.message };
  }
}

/**
 * Clean up password reset tokens
 */
async function cleanupPasswordResetTokens(retentionDays) {
  try {
    const { PasswordResetToken } = require('../models');
    const cutoffDate = getCutoffDate(retentionDays);
    
    const result = await PasswordResetToken.destroy({
      where: {
        [Op.or]: [
          { created_at: { [Op.lt]: cutoffDate } },
          { expires_at: { [Op.lt]: new Date() } } // Also clean expired tokens
        ]
      }
    });
    
    console.log(`🧹 Cleaned up ${result} password reset tokens older than ${retentionDays} days`);
    return { table: 'password_reset_tokens', deleted: result };
  } catch (error) {
    console.error('Error cleaning up password reset tokens:', error);
    return { table: 'password_reset_tokens', deleted: 0, error: error.message };
  }
}

/**
 * Clean up audit logs (keep security-related logs longer)
 */
async function cleanupAuditLogs(retentionDays) {
  try {
    const { AuditLog } = require('../models');
    const cutoffDate = getCutoffDate(retentionDays);
    
    // Keep security-related logs for longer (2x retention period)
    const securityCutoffDate = getCutoffDate(retentionDays * 2);
    
    const result = await AuditLog.destroy({
      where: {
        created_at: {
          [Op.lt]: cutoffDate
        },
        action: {
          [Op.notIn]: ['login', 'logout', 'failed_login', 'password_change', 'account_locked']
        }
      }
    });
    
    // Clean old security logs with longer retention
    const securityResult = await AuditLog.destroy({
      where: {
        created_at: {
          [Op.lt]: securityCutoffDate
        },
        action: {
          [Op.in]: ['login', 'logout', 'failed_login', 'password_change', 'account_locked']
        }
      }
    });
    
    const totalDeleted = result + securityResult;
    console.log(`🧹 Cleaned up ${totalDeleted} audit log records (${result} general + ${securityResult} security)`);
    return { table: 'audit_logs', deleted: totalDeleted };
  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
    return { table: 'audit_logs', deleted: 0, error: error.message };
  }
}

/**
 * Clean up temporary files and uploads
 */
async function cleanupTemporaryFiles(retentionDays) {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const tempDir = path.join(__dirname, '../../uploads/temp');
    const cutoffDate = getCutoffDate(retentionDays);
    let deletedCount = 0;
    
    try {
      const files = await fs.readdir(tempDir);
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile() && stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
    } catch (dirError) {
      // Directory might not exist, which is fine
      if (dirError.code !== 'ENOENT') {
        throw dirError;
      }
    }
    
    console.log(`🧹 Cleaned up ${deletedCount} temporary files older than ${retentionDays} days`);
    return { table: 'temporary_files', deleted: deletedCount };
  } catch (error) {
    console.error('Error cleaning up temporary files:', error);
    return { table: 'temporary_files', deleted: 0, error: error.message };
  }
}

/**
 * Clean up soft-deleted records (permanent deletion)
 */
async function cleanupSoftDeletedRecords(retentionDays) {
  try {
    const { User, Whisky, Review, NewsEvent } = require('../models');
    const cutoffDate = getCutoffDate(retentionDays);
    let totalDeleted = 0;
    
    // Permanently delete soft-deleted users
    const deletedUsers = await User.destroy({
      where: {
        deleted_at: {
          [Op.lt]: cutoffDate,
          [Op.ne]: null
        }
      },
      force: true // Permanent deletion
    });
    totalDeleted += deletedUsers;
    
    // Permanently delete soft-deleted whiskies
    const deletedWhiskies = await Whisky.destroy({
      where: {
        deleted_at: {
          [Op.lt]: cutoffDate,
          [Op.ne]: null
        }
      },
      force: true
    });
    totalDeleted += deletedWhiskies;
    
    // Permanently delete soft-deleted reviews
    const deletedReviews = await Review.destroy({
      where: {
        deleted_at: {
          [Op.lt]: cutoffDate,
          [Op.ne]: null
        }
      },
      force: true
    });
    totalDeleted += deletedReviews;
    
    // Permanently delete soft-deleted events
    const deletedEvents = await NewsEvent.destroy({
      where: {
        deleted_at: {
          [Op.lt]: cutoffDate,
          [Op.ne]: null
        }
      },
      force: true
    });
    totalDeleted += deletedEvents;
    
    console.log(`🧹 Permanently deleted ${totalDeleted} soft-deleted records older than ${retentionDays} days`);
    return { table: 'soft_deleted_records', deleted: totalDeleted };
  } catch (error) {
    console.error('Error cleaning up soft-deleted records:', error);
    return { table: 'soft_deleted_records', deleted: 0, error: error.message };
  }
}

/**
 * Run complete data retention cleanup
 */
async function runDataRetentionCleanup() {
  try {
    console.log('🧹 Starting data retention cleanup...');
    const retentionDays = await getDataRetentionDays();
    
    const results = await Promise.all([
      cleanupUserActivityLogs(retentionDays),
      cleanupSessionData(retentionDays),
      cleanupEmailTokens(retentionDays),
      cleanupPasswordResetTokens(retentionDays),
      cleanupAuditLogs(retentionDays),
      cleanupTemporaryFiles(retentionDays),
      cleanupSoftDeletedRecords(retentionDays)
    ]);
    
    const summary = {
      timestamp: new Date().toISOString(),
      retention_days: retentionDays,
      results: results,
      total_deleted: results.reduce((sum, result) => sum + result.deleted, 0)
    };
    
    console.log(`✅ Data retention cleanup completed. Total records cleaned: ${summary.total_deleted}`);
    return summary;
  } catch (error) {
    console.error('❌ Data retention cleanup failed:', error);
    return {
      timestamp: new Date().toISOString(),
      error: error.message,
      success: false
    };
  }
}

/**
 * Schedule automatic data retention cleanup
 */
function scheduleDataRetentionCleanup() {
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('🕐 Scheduled data retention cleanup starting...');
    await runDataRetentionCleanup();
  });
  
  console.log('📅 Data retention cleanup scheduled (daily at 2 AM)');
}

/**
 * Get data retention statistics
 */
async function getDataRetentionStats() {
  try {
    const retentionDays = await getDataRetentionDays();
    const cutoffDate = getCutoffDate(retentionDays);
    
    const { UserActivity, UserSession, EmailVerificationToken, PasswordResetToken } = require('../models');
    
    const stats = {
      retention_days: retentionDays,
      cutoff_date: cutoffDate,
      cleanable_records: {}
    };
    
    // Count records that would be cleaned up
    try {
      stats.cleanable_records.user_activity = await UserActivity.count({
        where: { created_at: { [Op.lt]: cutoffDate } }
      });
    } catch (e) { stats.cleanable_records.user_activity = 0; }
    
    try {
      stats.cleanable_records.sessions = await UserSession.count({
        where: { last_activity: { [Op.lt]: cutoffDate } }
      });
    } catch (e) { stats.cleanable_records.sessions = 0; }
    
    try {
      stats.cleanable_records.email_tokens = await EmailVerificationToken.count({
        where: { created_at: { [Op.lt]: cutoffDate } }
      });
    } catch (e) { stats.cleanable_records.email_tokens = 0; }
    
    try {
      stats.cleanable_records.password_tokens = await PasswordResetToken.count({
        where: { created_at: { [Op.lt]: cutoffDate } }
      });
    } catch (e) { stats.cleanable_records.password_tokens = 0; }
    
    stats.total_cleanable = Object.values(stats.cleanable_records).reduce((sum, count) => sum + count, 0);
    
    return stats;
  } catch (error) {
    console.error('Error getting data retention stats:', error);
    return { error: error.message };
  }
}

module.exports = {
  runDataRetentionCleanup,
  scheduleDataRetentionCleanup,
  getDataRetentionStats,
  getDataRetentionDays,
  
  // Individual cleanup functions
  cleanupUserActivityLogs,
  cleanupSessionData,
  cleanupEmailTokens,
  cleanupPasswordResetTokens,
  cleanupAuditLogs,
  cleanupTemporaryFiles,
  cleanupSoftDeletedRecords
};