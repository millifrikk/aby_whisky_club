const { Whisky, Rating, User, Distillery } = require('../models');
const { Op } = require('sequelize');

class WhiskyController {
  // Get all whiskies with filtering and pagination
  static async getAllWhiskies(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        region,
        type,
        min_age,
        max_age,
        min_abv,
        max_abv,
        sort_by = 'name',
        sort_order = 'ASC',
        available_only = false
      } = req.query;

      // Build where clause
      const where = {};
      
      if (available_only === 'true') {
        where.is_available = true;
      }

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { distillery: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (region) {
        where.region = { [Op.iLike]: `%${region}%` };
      }

      if (type) {
        where.type = type;
      }

      if (min_age || max_age) {
        where.age = {};
        if (min_age) where.age[Op.gte] = parseInt(min_age);
        if (max_age) where.age[Op.lte] = parseInt(max_age);
      }

      if (min_abv || max_abv) {
        where.abv = {};
        if (min_abv) where.abv[Op.gte] = parseFloat(min_abv);
        if (max_abv) where.abv[Op.lte] = parseFloat(max_abv);
      }

      // Build order clause
      const validSortFields = ['name', 'distillery', 'age', 'abv', 'rating_average', 'created_at'];
      const orderField = validSortFields.includes(sort_by) ? sort_by : 'name';
      const orderDirection = sort_order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      // Calculate pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: whiskies } = await Whisky.findAndCountAll({
        where,
        order: [['name', 'ASC']], // Use simple, known column
        limit: parseInt(limit),
        offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        whiskies,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: count,
          limit: parseInt(limit),
          has_next: parseInt(page) < totalPages,
          has_prev: parseInt(page) > 1
        },
        filters: {
          search,
          region,
          type,
          min_age,
          max_age,
          min_abv,
          max_abv,
          available_only
        }
      });

    } catch (error) {
      console.error('Get all whiskies error:', error);
      console.error('Error details:', error.stack);
      res.status(500).json({
        error: 'Failed to fetch whiskies',
        message: error.message
      });
    }
  }

  // Get single whisky by ID
  static async getWhiskyById(req, res) {
    try {
      const { id } = req.params;

      const whisky = await Whisky.findByPk(id, {
        include: [
          {
            model: Rating,
            as: 'ratings',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'first_name', 'last_name']
              }
            ],
            order: [['created_at', 'DESC']]
          }
          // Distillery association disabled - no foreign key column exists
          // {
          //   model: Distillery,
          //   as: 'distilleryInfo',
          //   attributes: ['id', 'name', 'slug', 'country', 'region', 'description', 'founded_year', 'website', 'image_url']
          // }
        ]
      });

      if (!whisky) {
        return res.status(404).json({
          error: 'Whisky not found',
          message: 'The requested whisky could not be found'
        });
      }

      res.json({ whisky });

    } catch (error) {
      console.error('Get whisky by ID error:', error);
      res.status(500).json({
        error: 'Failed to fetch whisky',
        message: 'An error occurred while fetching whisky details'
      });
    }
  }

  // Create new whisky (Admin only)
  static async createWhisky(req, res) {
    try {
      const whiskyData = req.body;

      const whisky = await Whisky.create(whiskyData);

      res.status(201).json({
        message: 'Whisky created successfully',
        whisky
      });

    } catch (error) {
      console.error('Create whisky error:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      res.status(500).json({
        error: 'Failed to create whisky',
        message: 'An error occurred while creating the whisky'
      });
    }
  }

  // Update whisky (Admin only)
  static async updateWhisky(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const whisky = await Whisky.findByPk(id);

      if (!whisky) {
        return res.status(404).json({
          error: 'Whisky not found',
          message: 'The requested whisky could not be found'
        });
      }

      const updatedWhisky = await whisky.update(updateData);

      res.json({
        message: 'Whisky updated successfully',
        whisky: updatedWhisky
      });

    } catch (error) {
      console.error('Update whisky error:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      res.status(500).json({
        error: 'Failed to update whisky',
        message: 'An error occurred while updating the whisky'
      });
    }
  }

  // Delete whisky (Admin only)
  static async deleteWhisky(req, res) {
    try {
      const { id } = req.params;

      const whisky = await Whisky.findByPk(id);

      if (!whisky) {
        return res.status(404).json({
          error: 'Whisky not found',
          message: 'The requested whisky could not be found'
        });
      }

      // Soft delete (paranoid mode)
      await whisky.destroy();

      res.json({
        message: 'Whisky deleted successfully'
      });

    } catch (error) {
      console.error('Delete whisky error:', error);
      res.status(500).json({
        error: 'Failed to delete whisky',
        message: 'An error occurred while deleting the whisky'
      });
    }
  }

  // Get featured whiskies
  static async getFeaturedWhiskies(req, res) {
    try {
      const { limit = 6 } = req.query;

      // Try the most basic query first
      const whiskies = await Whisky.findAll({
        where: {
          is_featured: true
        },
        limit: parseInt(limit)
      });

      res.json({ whiskies });

    } catch (error) {
      console.error('Get featured whiskies error:', error);
      console.error('Error details:', error.stack);
      res.status(500).json({
        error: 'Failed to fetch featured whiskies',
        message: error.message
      });
    }
  }

  // Get whisky statistics
  static async getWhiskyStats(req, res) {
    try {
      const stats = await Promise.all([
        Whisky.count({ where: { is_available: true } }),
        Whisky.count({ where: { type: 'single_malt' } }),
        Whisky.findOne({
          attributes: [
            [Whisky.sequelize.fn('AVG', Whisky.sequelize.col('age')), 'avg_age'],
            [Whisky.sequelize.fn('AVG', Whisky.sequelize.col('abv')), 'avg_abv'],
            [Whisky.sequelize.fn('COUNT', Whisky.sequelize.fn('DISTINCT', Whisky.sequelize.col('distillery'))), 'distillery_count']
          ],
          raw: true
        }),
        Whisky.findAll({
          attributes: ['region', [Whisky.sequelize.fn('COUNT', Whisky.sequelize.col('id')), 'count']],
          group: ['region'],
          order: [[Whisky.sequelize.literal('count'), 'DESC']],
          limit: 5,
          raw: true
        })
      ]);

      const [totalWhiskies, singleMaltCount, averages, topRegions] = stats;

      res.json({
        total_whiskies: totalWhiskies,
        single_malt_count: singleMaltCount,
        average_age: averages?.avg_age ? parseFloat(averages.avg_age).toFixed(1) : null,
        average_abv: averages?.avg_abv ? parseFloat(averages.avg_abv).toFixed(1) : null,
        total_distilleries: averages?.distillery_count || 0,
        top_regions: topRegions
      });

    } catch (error) {
      console.error('Get whisky stats error:', error);
      res.status(500).json({
        error: 'Failed to fetch statistics',
        message: 'An error occurred while fetching whisky statistics'
      });
    }
  }
}

module.exports = WhiskyController;
