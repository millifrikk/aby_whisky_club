const express = require('express');
const { SystemSetting } = require('../models');
const router = express.Router();

// Get public system settings
router.get('/public', async (req, res) => {
  try {
    const { category } = req.query;

    let where = { is_public: true };
    if (category && category !== 'all') {
      where.category = category;
    }

    const settings = await SystemSetting.findAll({
      where,
      order: [['category', 'ASC'], ['key', 'ASC']]
    });

    // Convert to key-value pairs for easier frontend consumption
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.getParsedValue();
      return acc;
    }, {});

    res.json({
      settings: settingsMap,
      total_count: settings.length
    });

  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({
      error: 'Failed to fetch public settings',
      message: 'An error occurred while fetching public settings'
    });
  }
});

module.exports = router;