const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateUserRegistration, 
  validateUserLogin,
  handleValidationErrors 
} = require('../middleware/validation');
const { body } = require('express-validator');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateUserRegistration, AuthController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, AuthController.login);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, AuthController.logout);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, AuthController.getProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', 
  authenticateToken,
  [
    body('first_name')
      .optional()
      .isLength({ max: 100 })
      .withMessage('First name must be less than 100 characters'),
    
    body('last_name')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Last name must be less than 100 characters'),
    
    body('bio')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Bio must be less than 1000 characters'),
    
    body('whisky_preferences')
      .optional()
      .isObject()
      .withMessage('Whisky preferences must be an object'),
    
    handleValidationErrors
  ],
  AuthController.updateProfile
);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password',
  authenticateToken,
  [
    body('current_password')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('new_password')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    handleValidationErrors
  ],
  AuthController.changePassword
);

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', authenticateToken, AuthController.refreshToken);

// @route   GET /api/auth/verify
// @desc    Verify token validity
// @access  Private
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user.toSafeObject()
  });
});

// @route   GET /api/auth/users/directory
// @desc    Get member directory
// @access  Private
router.get('/users/directory', authenticateToken, AuthController.getMemberDirectory);

// @route   POST /api/auth/request-password-reset
// @desc    Request password reset
// @access  Public
router.post('/request-password-reset',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    
    handleValidationErrors
  ],
  AuthController.requestPasswordReset
);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    
    body('new_password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    handleValidationErrors
  ],
  AuthController.resetPassword
);

// @route   POST /api/auth/verify-email
// @desc    Verify email address
// @access  Public
router.post('/verify-email',
  [
    body('token')
      .notEmpty()
      .withMessage('Verification token is required'),
    
    handleValidationErrors
  ],
  AuthController.verifyEmail
);

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification
// @access  Public
router.post('/resend-verification',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    
    handleValidationErrors
  ],
  AuthController.resendEmailVerification
);

// @route   PUT /api/auth/notification-preferences
// @desc    Update notification preferences
// @access  Private
router.put('/notification-preferences',
  authenticateToken,
  [
    body('email_notifications_enabled')
      .isBoolean()
      .withMessage('Email notifications enabled must be a boolean'),
    
    handleValidationErrors
  ],
  AuthController.updateNotificationPreferences
);

module.exports = router;
