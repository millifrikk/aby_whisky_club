const express = require('express');
const { body } = require('express-validator');
const distilleryController = require('../controllers/distilleryController');
const auth = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const distilleryValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  
  body('slug')
    .trim()
    .isLength({ min: 1, max: 255 })
    .matches(/^[a-z0-9_-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, underscores, and hyphens'),
  
  body('country')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Country must be between 1 and 100 characters'),
  
  body('region')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Region must be less than 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters'),
  
  body('founded_year')
    .optional({ nullable: true })
    .custom((value) => {
      if (!value || value === '' || value === null) return true;
      const year = parseInt(value);
      if (isNaN(year)) throw new Error('Founded year must be a number');
      if (year < 1700 || year > new Date().getFullYear()) {
        throw new Error(`Founded year must be between 1700 and ${new Date().getFullYear()}`);
      }
      return true;
    }),
  
  body('website')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      try {
        new URL(value);
        return true;
      } catch (error) {
        throw new Error('Website must be a valid URL');
      }
    }),
  
  body('image_url')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      try {
        new URL(value);
        return true;
      } catch (error) {
        throw new Error('Image URL must be a valid URL');
      }
    }),
  
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('location.address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  
  handleValidationErrors
];

const updateDistilleryValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .matches(/^[a-z0-9_-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, underscores, and hyphens'),
  
  body('country')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Country must be between 1 and 100 characters'),
  
  body('region')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Region must be less than 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters'),
  
  body('founded_year')
    .optional({ nullable: true })
    .custom((value) => {
      if (!value || value === '' || value === null) return true;
      const year = parseInt(value);
      if (isNaN(year)) throw new Error('Founded year must be a number');
      if (year < 1700 || year > new Date().getFullYear()) {
        throw new Error(`Founded year must be between 1700 and ${new Date().getFullYear()}`);
      }
      return true;
    }),
  
  body('website')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      try {
        new URL(value);
        return true;
      } catch (error) {
        throw new Error('Website must be a valid URL');
      }
    }),
  
  body('image_url')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      try {
        new URL(value);
        return true;
      } catch (error) {
        throw new Error('Image URL must be a valid URL');
      }
    }),
  
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('location.address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  
  handleValidationErrors
];

// Public routes
router.get('/', distilleryController.getAllDistilleries);
router.get('/search', distilleryController.searchDistilleries);
router.get('/stats', distilleryController.getDistilleryStats);
router.get('/:id', distilleryController.getDistillery);

// Protected routes (Admin only)
router.post('/', 
  auth.authenticateToken, 
  auth.requireAdmin, 
  distilleryValidation, 
  distilleryController.createDistillery
);

router.put('/:id', 
  auth.authenticateToken, 
  auth.requireAdmin, 
  updateDistilleryValidation, 
  distilleryController.updateDistillery
);

router.delete('/:id', 
  auth.authenticateToken, 
  auth.requireAdmin, 
  distilleryController.deleteDistillery
);

// Admin utility routes
router.post('/populate/api', 
  auth.authenticateToken, 
  auth.requireAdmin, 
  distilleryController.populateFromAPI
);

router.post('/update-counts', 
  auth.authenticateToken, 
  auth.requireAdmin, 
  distilleryController.updateWhiskyCounts
);

module.exports = router;
