const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// User validation rules
const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .isAlphanumeric()
    .withMessage('Username must contain only letters and numbers'),
    
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
  body('first_name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('First name must be less than 100 characters'),
    
  body('last_name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Last name must be less than 100 characters'),
    
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
    
  handleValidationErrors
];

// Whisky validation rules
const validateWhiskyCreation = [
  body('name')
    .notEmpty()
    .withMessage('Whisky name is required')
    .isLength({ max: 255 })
    .withMessage('Whisky name must be less than 255 characters'),
    
  body('distillery')
    .notEmpty()
    .withMessage('Distillery is required')
    .isLength({ max: 255 })
    .withMessage('Distillery name must be less than 255 characters'),
    
  body('region')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Region must be less than 100 characters'),
    
  body('age')
    .optional({ nullable: true })
    .isInt({ min: 0, max: 100 })
    .withMessage('Age must be between 0 and 100 years'),
    
  body('abv')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 100 })
    .withMessage('ABV must be between 0 and 100'),
    
  body('type')
    .isIn(['single_malt', 'blended_whisky', 'blended_malt', 'grain_whisky', 'bourbon', 'rye', 'irish', 'japanese', 'other'])
    .withMessage('Invalid whisky type'),
    
  body('quantity')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
    
  body('purchase_price')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be non-negative'),
    
  handleValidationErrors
];

// Rating validation rules
const validateRating = [
  body('whisky_id')
    .isUUID()
    .withMessage('Valid whisky ID is required'),
    
  body('overall_score')
    .isFloat({ min: 0, max: 10 })
    .withMessage('Overall score must be between 0 and 10'),
    
  body('appearance_score')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Appearance score must be between 0 and 10'),
    
  body('nose_score')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Nose score must be between 0 and 10'),
    
  body('palate_score')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Palate score must be between 0 and 10'),
    
  body('finish_score')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Finish score must be between 0 and 10'),
    
  body('review_text')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Review text must be less than 2000 characters'),
    
  body('tasting_date')
    .optional()
    .isISO8601()
    .withMessage('Tasting date must be a valid date'),
    
  handleValidationErrors
];

// News/Event validation rules
const validateNewsEvent = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),
    
  body('content')
    .notEmpty()
    .withMessage('Content is required'),
    
  body('type')
    .isIn(['news', 'event', 'tasting', 'meeting', 'announcement'])
    .withMessage('Invalid type'),
    
  body('event_date')
    .optional()
    .isISO8601()
    .withMessage('Event date must be a valid date'),
    
  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer'),
    
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be non-negative'),
    
  handleValidationErrors
];

// Parameter validation
const validateUUIDParam = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`Invalid ${paramName}`),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateWhiskyCreation,
  validateRating,
  validateNewsEvent,
  validateUUIDParam,
  validatePagination
};
