const jwt = require('jsonwebtoken');
const { User, SystemSetting } = require('../models');

// Generate JWT token
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRE || '24h') => {
  // Enhanced payload with session metadata
  const enhancedPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    sessionId: require('crypto').randomBytes(16).toString('hex'),
    lastActivity: new Date(),
    ...payload // Allow additional fields
  };
  
  return jwt.sign(enhancedPayload, process.env.JWT_SECRET, { expiresIn });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Extract token from request
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check for token in cookies (for browser requests)
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  return null;
};

// Middleware to authenticate user
const authenticateToken = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'User not found'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Account is inactive'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'Invalid token'
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin privileges required'
    });
  }

  next();
};

// Middleware to check if user is admin or member
const requireMember = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'Authentication required'
    });
  }

  if (!['admin', 'member'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Member privileges required'
    });
  }

  next();
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password_hash'] }
      });

      if (user && user.is_active) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  
  next();
};

// Middleware to check guest browsing permissions
const checkGuestBrowsing = async (req, res, next) => {
  try {
    // If user is authenticated, allow access
    if (req.user) {
      return next();
    }

    // Check if guest browsing is allowed
    const allowGuestBrowsing = await SystemSetting.getSetting('allow_guest_browsing', true);
    
    if (allowGuestBrowsing) {
      return next();
    }

    // Guest browsing is disabled, require authentication
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to view this content'
    });
  } catch (error) {
    console.error('Error checking guest browsing permissions:', error);
    // Default to requiring authentication if there's an error
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to view this content'
    });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  extractToken,
  authenticateToken,
  requireAdmin,
  requireMember,
  optionalAuth,
  checkGuestBrowsing
};
