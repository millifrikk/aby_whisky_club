const express = require('express');
const router = express.Router();
const LeaderboardController = require('../controllers/leaderboardController');

// Public leaderboard routes (no authentication required)
router.get('/raters', LeaderboardController.getTopRaters);
router.get('/whiskies', LeaderboardController.getTopWhiskies);
router.get('/stats', LeaderboardController.getLeaderboardStats);

module.exports = router;