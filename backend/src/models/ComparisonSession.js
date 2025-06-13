const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ComparisonSession = sequelize.define('ComparisonSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    whisky_ids: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    }
  }, {
    tableName: 'comparison_sessions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      }
    ]
  });

  // Define associations
  ComparisonSession.associate = (models) => {
    // Belongs to User
    ComparisonSession.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  // Instance methods
  ComparisonSession.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    return values;
  };

  ComparisonSession.prototype.addWhisky = async function(whiskyId) {
    if (!this.whisky_ids.includes(whiskyId)) {
      this.whisky_ids = [...this.whisky_ids, whiskyId];
      await this.save();
    }
    return this;
  };

  ComparisonSession.prototype.removeWhisky = async function(whiskyId) {
    this.whisky_ids = this.whisky_ids.filter(id => id !== whiskyId);
    await this.save();
    return this;
  };

  ComparisonSession.prototype.getWhiskies = async function() {
    const { Whisky, Distillery } = sequelize.models;
    
    if (!this.whisky_ids || this.whisky_ids.length === 0) {
      return [];
    }

    return Whisky.findAll({
      where: {
        id: this.whisky_ids
      },
      include: [
        {
          model: Distillery,
          as: 'distilleryInfo',
          required: false
        }
      ],
      order: [
        // Maintain the order from whisky_ids array
        sequelize.literal(`ARRAY_POSITION(ARRAY[${this.whisky_ids.map(id => `'${id}'`).join(',')}]::uuid[], "Whisky"."id")`)
      ]
    });
  };

  // Static methods
  ComparisonSession.getUserSessions = async function(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      orderBy = 'created_at',
      orderDirection = 'DESC'
    } = options;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    return this.findAndCountAll({
      where: { user_id: userId },
      order: [[orderBy, orderDirection]],
      limit: parseInt(limit),
      offset
    });
  };

  ComparisonSession.createSession = async function(userId, whiskyIds, name = null) {
    if (!Array.isArray(whiskyIds) || whiskyIds.length < 2) {
      throw new Error('At least 2 whiskies are required for comparison');
    }

    if (whiskyIds.length > 10) {
      throw new Error('Maximum 10 whiskies can be compared at once');
    }

    return this.create({
      user_id: userId,
      name: name || `Comparison ${new Date().toLocaleDateString()}`,
      whisky_ids: whiskyIds
    });
  };

  ComparisonSession.compareWhiskies = async function(whiskyIds) {
    const { Whisky, Distillery, Rating, User } = sequelize.models;

    if (!Array.isArray(whiskyIds) || whiskyIds.length < 2) {
      throw new Error('At least 2 whiskies are required for comparison');
    }

    const whiskies = await Whisky.findAll({
      where: {
        id: whiskyIds
      },
      include: [
        {
          model: Distillery,
          as: 'distilleryInfo',
          required: false
        },
        {
          model: Rating,
          as: 'ratings',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'first_name', 'last_name']
            }
          ]
        }
      ],
      order: [
        // Maintain the order from whisky_ids array
        sequelize.literal(`ARRAY_POSITION(ARRAY[${whiskyIds.map(id => `'${id}'`).join(',')}]::uuid[], "Whisky"."id")`)
      ]
    });

    // Add comparison metadata
    const comparison = {
      whiskies,
      comparison_date: new Date(),
      comparison_count: whiskies.length,
      metadata: {
        age_range: {
          min: Math.min(...whiskies.filter(w => w.age).map(w => w.age)),
          max: Math.max(...whiskies.filter(w => w.age).map(w => w.age))
        },
        abv_range: {
          min: Math.min(...whiskies.filter(w => w.abv).map(w => w.abv)),
          max: Math.max(...whiskies.filter(w => w.abv).map(w => w.abv))
        },
        regions: [...new Set(whiskies.filter(w => w.region).map(w => w.region))],
        countries: [...new Set(whiskies.filter(w => w.country).map(w => w.country))],
        types: [...new Set(whiskies.filter(w => w.type).map(w => w.type))]
      }
    };

    return comparison;
  };

module.exports = ComparisonSession;