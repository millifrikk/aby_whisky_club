/**
 * Enhanced password validation middleware using admin settings
 */

const { body, validationResult } = require('express-validator');
const { validatePasswordComplexity, getPasswordRequirementsMessage } = require('../utils/passwordValidator');
const { SystemSetting } = require('../models');

/**
 * Create dynamic password validation middleware
 */
const createPasswordValidator = (fieldName = 'password') => {
  return async (req, res, next) => {
    try {
      // Get password complexity rules from settings
      const passwordRulesSetting = await SystemSetting.findOne({
        where: { key: 'password_complexity_rules' }
      });

      const passwordRequiredSetting = await SystemSetting.findOne({
        where: { key: 'password_complexity_required' }
      });

      const minLengthSetting = await SystemSetting.findOne({
        where: { key: 'min_password_length' }
      });

      // Parse rules
      let complexityRules = null;
      try {
        complexityRules = passwordRulesSetting ? JSON.parse(passwordRulesSetting.value) : null;
      } catch (e) {
        console.warn('Invalid password_complexity_rules in settings:', e.message);
      }

      const isComplexityRequired = passwordRequiredSetting ? 
        (passwordRequiredSetting.value === 'true' || passwordRequiredSetting.value === true) : true;

      const minLength = minLengthSetting ? parseInt(minLengthSetting.value) : 8;

      // Get password from request
      const password = req.body[fieldName];
      
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required',
          errors: ['Password is required']
        });
      }

      // Basic length check (always enforced)
      if (password.length < minLength) {
        return res.status(400).json({
          success: false,
          message: `Password must be at least ${minLength} characters long`,
          errors: [`Password must be at least ${minLength} characters long`]
        });
      }

      // Advanced complexity validation (if enabled)
      if (isComplexityRequired && complexityRules) {
        const username = req.body.username || req.body.email?.split('@')[0];
        const email = req.body.email;

        const validation = validatePasswordComplexity(password, complexityRules, username, email);

        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            message: 'Password does not meet complexity requirements',
            errors: validation.errors,
            requirements: getPasswordRequirementsMessage(complexityRules),
            strength: validation.strength
          });
        }

        // Add strength to request for logging/analytics
        req.passwordStrength = validation.strength;
      }

      next();
    } catch (error) {
      console.error('Password validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during password validation'
      });
    }
  };
};

/**
 * Registration password validation
 */
const validateRegistrationPassword = createPasswordValidator('password');

/**
 * Change password validation
 */
const validateNewPassword = createPasswordValidator('new_password');

/**
 * Password reset validation
 */
const validateResetPassword = createPasswordValidator('password');

/**
 * Get password requirements for frontend display
 */
const getPasswordRequirements = async (req, res, next) => {
  try {
    const passwordRulesSetting = await SystemSetting.findOne({
      where: { key: 'password_complexity_rules' }
    });

    const passwordRequiredSetting = await SystemSetting.findOne({
      where: { key: 'password_complexity_required' }
    });

    const minLengthSetting = await SystemSetting.findOne({
      where: { key: 'min_password_length' }
    });

    let complexityRules = null;
    try {
      complexityRules = passwordRulesSetting ? JSON.parse(passwordRulesSetting.value) : null;
    } catch (e) {
      console.warn('Invalid password_complexity_rules in settings:', e.message);
    }

    const isComplexityRequired = passwordRequiredSetting ? 
      (passwordRequiredSetting.value === 'true' || passwordRequiredSetting.value === true) : true;

    const minLength = minLengthSetting ? parseInt(minLengthSetting.value) : 8;

    req.passwordRequirements = {
      minLength,
      complexityRequired: isComplexityRequired,
      rules: complexityRules,
      message: complexityRules ? getPasswordRequirementsMessage(complexityRules) : null
    };

    next();
  } catch (error) {
    console.error('Error getting password requirements:', error);
    // Continue with defaults
    req.passwordRequirements = {
      minLength: 8,
      complexityRequired: true,
      rules: null,
      message: 'Password must be at least 8 characters long'
    };
    next();
  }
};

/**
 * Legacy validation fallback for existing endpoints
 */
const legacyPasswordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_.,~])[A-Za-z\d@$!%*?&#+\-_.,~]/)
    .withMessage('Password must contain at least one uppercase letter, lowercase letter, number, and special character'),
];

module.exports = {
  createPasswordValidator,
  validateRegistrationPassword,
  validateNewPassword,
  validateResetPassword,
  getPasswordRequirements,
  legacyPasswordValidation
};