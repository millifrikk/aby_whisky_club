const { Distillery, Whisky } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const populateDistilleries = require('../utils/populateDistilleries');

// Get all distilleries with optional filtering and pagination
const getAllDistilleries = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      country, 
      region,
      includeInactive = false,
      sortBy = 'name',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause
    const where = {};
    
    if (!includeInactive) {
      where.is_active = true;
    }
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (country) {
      where.country = country;
    }
    
    if (region) {
      where.region = region;
    }

    // Valid sort fields
    const validSortFields = ['name', 'country', 'region', 'whisky_count', 'created_at'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const orderDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const { rows: distilleries, count: total } = await Distillery.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[orderField, orderDirection]],
      include: [
        {
          model: Whisky,
          as: 'whiskies',
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        distilleries,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching distilleries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching distilleries',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single distillery by ID or slug
const getDistillery = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find by ID first, then by slug
    let distillery = await Distillery.findByPk(id, {
      include: [
        {
          model: Whisky,
          as: 'whiskies',
          where: { is_available: true },
          required: false,
          order: [['name', 'ASC']]
        }
      ]
    });
    
    if (!distillery) {
      distillery = await Distillery.findOne({
        where: { slug: id },
        include: [
          {
            model: Whisky,
            as: 'whiskies',
            where: { is_available: true },
            required: false,
            order: [['name', 'ASC']]
          }
        ]
      });
    }

    if (!distillery) {
      return res.status(404).json({
        success: false,
        message: 'Distillery not found'
      });
    }

    res.json({
      success: true,
      data: distillery
    });
  } catch (error) {
    console.error('Error fetching distillery:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching distillery',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new distillery (Admin only)
const createDistillery = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const distillery = await Distillery.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Distillery created successfully',
      data: distillery
    });
  } catch (error) {
    console.error('Error creating distillery:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Distillery with this name or slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating distillery',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update distillery (Admin only)
const updateDistillery = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const distillery = await Distillery.findByPk(id);

    if (!distillery) {
      return res.status(404).json({
        success: false,
        message: 'Distillery not found'
      });
    }

    await distillery.update(req.body);

    res.json({
      success: true,
      message: 'Distillery updated successfully',
      data: distillery
    });
  } catch (error) {
    console.error('Error updating distillery:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Distillery with this name or slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating distillery',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete distillery (Admin only)
const deleteDistillery = async (req, res) => {
  try {
    const { id } = req.params;
    const distillery = await Distillery.findByPk(id);

    if (!distillery) {
      return res.status(404).json({
        success: false,
        message: 'Distillery not found'
      });
    }

    // Check if distillery has associated whiskies
    const whiskyCount = await Whisky.count({
      where: { distillery_id: id }
    });

    if (whiskyCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete distillery with associated whiskies. Please reassign or delete the whiskies first.',
        whiskyCount
      });
    }

    await distillery.destroy();

    res.json({
      success: true,
      message: 'Distillery deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting distillery:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting distillery',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get distillery statistics
const getDistilleryStats = async (req, res) => {
  try {
    const stats = {
      total: await Distillery.count(),
      active: await Distillery.count({ where: { is_active: true } }),
      byCountry: await Distillery.findAll({
        attributes: [
          'country',
          [Distillery.sequelize.fn('COUNT', Distillery.sequelize.col('id')), 'count']
        ],
        group: ['country'],
        order: [[Distillery.sequelize.fn('COUNT', Distillery.sequelize.col('id')), 'DESC']]
      }),
      byRegion: await Distillery.findAll({
        attributes: [
          'region',
          [Distillery.sequelize.fn('COUNT', Distillery.sequelize.col('id')), 'count']
        ],
        where: { region: { [Op.not]: null } },
        group: ['region'],
        order: [[Distillery.sequelize.fn('COUNT', Distillery.sequelize.col('id')), 'DESC']]
      }),
      withWhiskies: await Distillery.count({ where: { whisky_count: { [Op.gt]: 0 } } })
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching distillery statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching distillery statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Populate distilleries from WhiskyHunter API (Admin only)
const populateFromAPI = async (req, res) => {
  try {
    await populateDistilleries();
    
    const total = await Distillery.count();
    
    res.json({
      success: true,
      message: 'Distilleries populated successfully from WhiskyHunter API',
      data: { totalDistilleries: total }
    });
  } catch (error) {
    console.error('Error populating distilleries:', error);
    res.status(500).json({
      success: false,
      message: 'Error populating distilleries from API',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update whisky counts for all distilleries
const updateWhiskyCounts = async (req, res) => {
  try {
    const distilleries = await Distillery.findAll();
    let updated = 0;

    for (const distillery of distilleries) {
      await distillery.updateWhiskyCount();
      updated++;
    }

    res.json({
      success: true,
      message: `Updated whisky counts for ${updated} distilleries`
    });
  } catch (error) {
    console.error('Error updating whisky counts:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating whisky counts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Search distilleries for autocomplete (optimized for whisky form)
const searchDistilleries = async (req, res) => {
  try {
    const { 
      search = '', 
      limit = 10 
    } = req.query;

    if (!search || search.trim().length < 2) {
      return res.json({
        success: true,
        data: {
          distilleries: []
        }
      });
    }

    const searchTerm = search.trim();
    
    const distilleries = await Distillery.findAll({
      where: {
        [Op.and]: [
          { is_active: true },
          {
            [Op.or]: [
              { name: { [Op.iLike]: `%${searchTerm}%` } },
              { slug: { [Op.iLike]: `%${searchTerm}%` } }
            ]
          }
        ]
      },
      attributes: ['id', 'name', 'country', 'region', 'slug'],
      order: [
        ['name', 'ASC']
      ],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        distilleries
      }
    });
  } catch (error) {
    console.error('Error searching distilleries:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching distilleries',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllDistilleries,
  getDistillery,
  createDistillery,
  updateDistillery,
  deleteDistillery,
  getDistilleryStats,
  populateFromAPI,
  updateWhiskyCounts,
  searchDistilleries
};
