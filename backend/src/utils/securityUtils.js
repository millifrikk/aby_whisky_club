/**
 * Security utilities for authentication and session management
 */

const { SystemSetting } = require('../models');

/**
 * Get security settings with fallbacks
 */
async function getSecuritySettings() {
  const settings = {};

  try {
    // Get all security-related settings
    const securitySettings = await SystemSetting.findAll({
      where: {
        key: [
          'login_attempt_limit',
          'account_lockout_duration', 
          'session_timeout_hours',
          'idle_timeout_minutes',
          'require_email_verification',
          'enable_two_factor_auth',
          'password_complexity_rules'
        ]
      }
    });

    // Parse settings into object
    securitySettings.forEach(setting => {
      let value = setting.value;
      
      // Parse JSON settings
      if (setting.data_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          console.warn(`Failed to parse JSON setting ${setting.key}:`, e.message);
          value = null;
        }
      }
      
      // Parse boolean settings
      if (setting.data_type === 'boolean') {
        value = value === 'true' || value === true;
      }
      
      // Parse number settings
      if (setting.data_type === 'number') {
        value = parseInt(value) || 0;
      }
      
      settings[setting.key] = value;
    });

    // Apply defaults for missing settings
    return {
      loginAttemptLimit: settings.login_attempt_limit || 5,
      accountLockoutDuration: settings.account_lockout_duration || 30, // minutes
      sessionTimeoutHours: settings.session_timeout_hours || 24,
      idleTimeoutMinutes: settings.idle_timeout_minutes || 120,
      requireEmailVerification: settings.require_email_verification || false,
      enableTwoFactorAuth: settings.enable_two_factor_auth || false,
      passwordComplexity: settings.password_complexity_rules || null
    };
  } catch (error) {
    console.error('Error loading security settings:', error);
    
    // Return safe defaults
    return {
      loginAttemptLimit: 5,
      accountLockoutDuration: 30,
      sessionTimeoutHours: 24,
      idleTimeoutMinutes: 120,
      requireEmailVerification: false,
      enableTwoFactorAuth: false,
      passwordComplexity: null
    };
  }
}

/**
 * Check if account should be locked based on failed attempts
 */
function shouldLockAccount(failedAttempts, maxAttempts) {
  return failedAttempts >= maxAttempts;
}

/**
 * Calculate account unlock time
 */
function calculateUnlockTime(lockoutDurationMinutes) {
  return new Date(Date.now() + (lockoutDurationMinutes * 60 * 1000));
}

/**
 * Check if account is currently locked
 */
function isAccountLocked(user, lockoutDurationMinutes) {
  if (!user.locked_until) return false;
  
  const now = new Date();
  const unlockTime = new Date(user.locked_until);
  
  return now < unlockTime;
}

/**
 * Check if session has expired
 */
function isSessionExpired(sessionCreatedAt, sessionTimeoutHours) {
  const now = new Date();
  const sessionStart = new Date(sessionCreatedAt);
  const maxSessionTime = sessionTimeoutHours * 60 * 60 * 1000; // Convert to milliseconds
  
  return (now - sessionStart) > maxSessionTime;
}

/**
 * Check if session is idle
 */
function isSessionIdle(lastActivityAt, idleTimeoutMinutes) {
  if (!lastActivityAt) return false;
  
  const now = new Date();
  const lastActivity = new Date(lastActivityAt);
  const maxIdleTime = idleTimeoutMinutes * 60 * 1000; // Convert to milliseconds
  
  return (now - lastActivity) > maxIdleTime;
}

/**
 * Generate secure random token
 */
function generateSecureToken(length = 32) {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash token for storage
 */
function hashToken(token) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Validate IP address format
 */
function isValidIP(ip) {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Get client IP address from request
 */
function getClientIP(req) {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         '0.0.0.0';
}

/**
 * Get user agent from request
 */
function getUserAgent(req) {
  return req.get('User-Agent') || 'Unknown';
}

/**
 * Create session metadata
 */
function createSessionMetadata(req) {
  return {
    ip_address: getClientIP(req),
    user_agent: getUserAgent(req),
    created_at: new Date(),
    last_activity: new Date()
  };
}

/**
 * Check password strength score
 */
function getPasswordStrengthLevel(score) {
  if (score <= 1) return 'Very Weak';
  if (score === 2) return 'Weak';
  if (score === 3) return 'Fair';
  if (score === 4) return 'Good';
  return 'Strong';
}

/**
 * Rate limiting for sensitive operations
 */
const rateLimiters = new Map();

function checkRateLimit(identifier, maxAttempts = 5, windowMinutes = 15) {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  
  if (!rateLimiters.has(identifier)) {
    rateLimiters.set(identifier, { attempts: 1, firstAttempt: now });
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  
  const data = rateLimiters.get(identifier);
  
  // Reset if window has passed
  if (now - data.firstAttempt > windowMs) {
    rateLimiters.set(identifier, { attempts: 1, firstAttempt: now });
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  
  // Check if limit exceeded
  if (data.attempts >= maxAttempts) {
    return { 
      allowed: false, 
      remaining: 0,
      resetTime: new Date(data.firstAttempt + windowMs)
    };
  }
  
  // Increment attempts
  data.attempts++;
  return { allowed: true, remaining: maxAttempts - data.attempts };
}

module.exports = {
  getSecuritySettings,
  shouldLockAccount,
  calculateUnlockTime,
  isAccountLocked,
  isSessionExpired,
  isSessionIdle,
  generateSecureToken,
  hashToken,
  isValidIP,
  getClientIP,
  getUserAgent,
  createSessionMetadata,
  getPasswordStrengthLevel,
  checkRateLimit
};