const rateLimit = require('express-rate-limit');
const { SystemSetting } = require('../models');

/**
 * Dynamic rate limiting middleware based on admin settings
 * Provides configurable API rate limiting with Redis store integration
 */

// In-memory store for development (Redis recommended for production)
const memoryStore = new Map();

/**
 * Get current rate limit setting from database
 */
async function getRateLimitSetting() {
  try {
    const setting = await SystemSetting.findOne({
      where: { key: 'api_rate_limit' }
    });
    return setting ? parseInt(setting.value, 10) : 100; // Default 100 requests per minute
  } catch (error) {
    console.error('Error fetching rate limit setting:', error);
    return 100; // Fallback to default
  }
}

/**
 * Custom rate limit store using memory (can be replaced with Redis)
 */
class DynamicMemoryStore {
  constructor() {
    this.store = new Map();
    this.resetTime = new Map();
  }

  async get(key) {
    const now = Date.now();
    const reset = this.resetTime.get(key);
    
    if (reset && now > reset) {
      // Reset window expired, clear the counter
      this.store.delete(key);
      this.resetTime.delete(key);
      return null;
    }
    
    return this.store.get(key) || null;
  }

  async set(key, value, windowMs) {
    const now = Date.now();
    this.store.set(key, value);
    this.resetTime.set(key, now + windowMs);
  }

  async increment(key, windowMs) {
    const current = await this.get(key);
    const newValue = (current || 0) + 1;
    await this.set(key, newValue, windowMs);
    return newValue;
  }

  async decrement(key) {
    const current = await this.get(key);
    if (current && current > 0) {
      const newValue = current - 1;
      this.store.set(key, newValue);
      return newValue;
    }
    return 0;
  }

  async resetKey(key) {
    this.store.delete(key);
    this.resetTime.delete(key);
  }
}

const dynamicStore = new DynamicMemoryStore();

/**
 * Generate rate limit key based on user or IP
 */
function generateKey(req) {
  // Prefer user ID if authenticated, fallback to IP
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }
  
  // Get real IP address (handle proxies)
  const ip = req.ip || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
             'unknown';
  
  return `ip:${ip}`;
}

/**
 * Create dynamic rate limiter that checks admin settings
 */
function createDynamicRateLimiter() {
  return async (req, res, next) => {
    try {
      // Skip rate limiting for health checks and static assets
      if (req.path === '/api/health' || 
          req.path.startsWith('/static/') ||
          req.path.startsWith('/assets/')) {
        return next();
      }

      // Get current rate limit from settings
      const maxRequests = await getRateLimitSetting();
      const windowMs = 60 * 1000; // 1 minute window
      
      const key = generateKey(req);
      const currentCount = await dynamicStore.increment(key, windowMs);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': Math.max(0, maxRequests - currentCount),
        'X-RateLimit-Reset': new Date(Date.now() + windowMs)
      });
      
      // Check if rate limit exceeded
      if (currentCount > maxRequests) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Maximum ${maxRequests} requests per minute allowed.`,
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
      
      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Don't block requests if rate limiting fails
      next();
    }
  };
}

/**
 * Rate limiter for authentication endpoints (stricter)
 */
function createAuthRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: {
      error: 'Too Many Authentication Attempts',
      message: 'Too many login attempts, please try again later.',
      retryAfter: 15 * 60 // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: generateKey,
    skip: (req) => {
      // Skip rate limiting for successful authenticated requests
      return req.user && req.method === 'GET';
    }
  });
}

/**
 * Rate limiter for password reset (very strict)
 */
function createPasswordResetRateLimiter() {
  return rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: {
      error: 'Too Many Password Reset Attempts',
      message: 'Too many password reset attempts, please try again later.',
      retryAfter: 60 * 60 // 1 hour in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: generateKey
  });
}

/**
 * Get rate limit status for a user/IP
 */
async function getRateLimitStatus(req) {
  try {
    const key = generateKey(req);
    const maxRequests = await getRateLimitSetting();
    const currentCount = await dynamicStore.get(key) || 0;
    
    return {
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - currentCount),
      reset: new Date(Date.now() + 60 * 1000), // 1 minute from now
      used: currentCount
    };
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return null;
  }
}

/**
 * Admin endpoint to reset rate limit for a specific user/IP
 */
async function resetRateLimit(identifier) {
  try {
    await dynamicStore.resetKey(identifier);
    return true;
  } catch (error) {
    console.error('Error resetting rate limit:', error);
    return false;
  }
}

module.exports = {
  createDynamicRateLimiter,
  createAuthRateLimiter,
  createPasswordResetRateLimiter,
  getRateLimitStatus,
  resetRateLimit,
  generateKey
};