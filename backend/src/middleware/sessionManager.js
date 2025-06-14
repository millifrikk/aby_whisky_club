/**
 * Session management middleware with timeout and idle checking
 */

const jwt = require('jsonwebtoken');
const { getSecuritySettings } = require('../utils/securityUtils');

/**
 * Enhanced session middleware with timeout management
 */
const sessionManager = async (req, res, next) => {
  try {
    // Skip session management for certain routes
    if (shouldSkipSessionCheck(req.path)) {
      return next();
    }

    // Get security settings
    const securitySettings = await getSecuritySettings();

    // Extract token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Let other middleware handle authentication
    }

    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check session timeout
    const sessionCreatedAt = new Date(decoded.iat * 1000); // Convert from Unix timestamp
    const now = new Date();
    const sessionAge = (now - sessionCreatedAt) / (1000 * 60 * 60); // Hours

    if (sessionAge > securitySettings.sessionTimeoutHours) {
      return res.status(401).json({
        error: 'Session expired',
        message: `Session has expired after ${securitySettings.sessionTimeoutHours} hours. Please log in again.`,
        code: 'SESSION_TIMEOUT'
      });
    }

    // Check idle timeout (if lastActivity is available)
    if (decoded.lastActivity) {
      const lastActivity = new Date(decoded.lastActivity);
      const idleTime = (now - lastActivity) / (1000 * 60); // Minutes

      if (idleTime > securitySettings.idleTimeoutMinutes) {
        return res.status(401).json({
          error: 'Session idle timeout',
          message: `Session has been idle for ${Math.round(idleTime)} minutes. Please log in again.`,
          code: 'IDLE_TIMEOUT'
        });
      }
    }

    // Update last activity timestamp in response headers
    res.setHeader('X-Session-Updated', now.toISOString());
    
    // Add user info to request
    req.user = decoded;
    req.sessionAge = sessionAge;
    req.sessionTimeoutHours = securitySettings.sessionTimeoutHours;
    req.idleTimeoutMinutes = securitySettings.idleTimeoutMinutes;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Invalid authentication token. Please log in again.',
        code: 'INVALID_TOKEN'
      });
    }

    console.error('Session management error:', error);
    next(); // Continue without session management on error
  }
};

/**
 * Check if session management should be skipped for this route
 */
function shouldSkipSessionCheck(path) {
  const skipPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/password-requirements',
    '/api/settings/public',
    '/api/health',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email'
  ];

  return skipPaths.some(skipPath => path.startsWith(skipPath));
}

/**
 * Middleware to refresh user activity timestamp
 */
const updateLastActivity = (req, res, next) => {
  if (req.user) {
    req.user.lastActivity = new Date();
  }
  next();
};

/**
 * Generate enhanced JWT token with session metadata
 */
function generateEnhancedToken(user, sessionMetadata = {}) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    sessionId: require('crypto').randomBytes(16).toString('hex'),
    lastActivity: new Date(),
    ...sessionMetadata
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { 
    expiresIn: '7d' // JWT expiry (separate from session timeout)
  });
}

/**
 * Check if user session needs refresh warning
 */
function needsRefreshWarning(sessionAge, sessionTimeoutHours) {
  const warningThreshold = sessionTimeoutHours * 0.8; // Warn at 80% of timeout
  return sessionAge > warningThreshold;
}

/**
 * Get session info for client
 */
function getSessionInfo(req) {
  if (!req.user) return null;

  return {
    sessionAge: req.sessionAge,
    timeoutHours: req.sessionTimeoutHours,
    idleTimeoutMinutes: req.idleTimeoutMinutes,
    needsRefreshWarning: needsRefreshWarning(req.sessionAge, req.sessionTimeoutHours),
    lastActivity: req.user.lastActivity
  };
}

module.exports = {
  sessionManager,
  updateLastActivity,
  generateEnhancedToken,
  getSessionInfo,
  needsRefreshWarning
};