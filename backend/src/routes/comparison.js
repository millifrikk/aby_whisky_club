const express = require('express');
const router = express.Router();
const ComparisonController = require('../controllers/comparisonController');
const { authenticateToken } = require('../middleware/auth');

// All comparison routes require authentication
router.use(authenticateToken);

// Get user's comparison sessions
router.get('/sessions/user/:userId', ComparisonController.getUserSessions);

// Create a new comparison session
router.post('/sessions', ComparisonController.createSession);

// Get session details with whiskies
router.get('/sessions/:id', ComparisonController.getSession);

// Update comparison session
router.put('/sessions/:id', ComparisonController.updateSession);

// Delete comparison session
router.delete('/sessions/:id', ComparisonController.deleteSession);

// Compare whiskies (no session save) - public comparison
router.get('/compare', ComparisonController.compareWhiskies);

module.exports = router;