const express = require('express');
const router = express.Router();
const TwoFactorController = require('../controllers/twoFactorController');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// @route   GET /api/2fa/status
// @desc    Get 2FA status for current user
// @access  Private
router.get('/status', authenticateToken, TwoFactorController.getStatus);

// @route   POST /api/2fa/setup/init
// @desc    Initialize 2FA setup (generate secret and QR code)
// @access  Private
router.post('/setup/init', authenticateToken, TwoFactorController.setupInit);

// @route   POST /api/2fa/setup/verify
// @desc    Verify and enable 2FA
// @access  Private
router.post('/setup/verify', 
  authenticateToken,
  [
    body('token')
      .isLength({ min: 6, max: 8 })
      .withMessage('Token must be 6-8 characters')
      .matches(/^[A-F0-9-]+$/i)
      .withMessage('Invalid token format'),
    
    body('secret')
      .notEmpty()
      .withMessage('Secret is required'),
    
    handleValidationErrors
  ],
  TwoFactorController.setupVerify
);

// @route   POST /api/2fa/disable
// @desc    Disable 2FA for user
// @access  Private
router.post('/disable',
  authenticateToken,
  [
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    
    body('token')
      .optional()
      .isLength({ min: 6, max: 8 })
      .withMessage('Token must be 6-8 characters'),
    
    handleValidationErrors
  ],
  TwoFactorController.disable
);

// @route   POST /api/2fa/regenerate-codes
// @desc    Regenerate backup codes
// @access  Private
router.post('/regenerate-codes',
  authenticateToken,
  [
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    
    body('token')
      .isLength({ min: 6, max: 8 })
      .withMessage('2FA token is required'),
    
    handleValidationErrors
  ],
  TwoFactorController.regenerateBackupCodes
);

// @route   POST /api/2fa/verify
// @desc    Verify 2FA token
// @access  Private
router.post('/verify',
  authenticateToken,
  [
    body('token')
      .notEmpty()
      .withMessage('Token is required')
      .isLength({ min: 6, max: 8 })
      .withMessage('Token must be 6-8 characters'),
    
    handleValidationErrors
  ],
  TwoFactorController.verifyToken
);

module.exports = router;