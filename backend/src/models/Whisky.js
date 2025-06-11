const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Whisky = sequelize.define('Whisky', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255]
    }
  },
  distillery_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'distilleries',
      key: 'id'
    }
  },
  distillery: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: [1, 255]
    }
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Scotland'
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  abv: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  type: {
    type: DataTypes.ENUM(
      'single_malt',
      'blended_whisky',
      'blended_malt',
      'grain_whisky',
      'bourbon',
      'rye',
      'irish',
      'japanese',
      'other'
    ),
    allowNull: false,
    defaultValue: 'single_malt'
  },
  cask_type: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tasting_notes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      color: '',
      nose: '',
      palate: '',
      finish: ''
    }
  },
  purchase_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  purchase_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  current_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 0
    }
  },
  bottle_size: {
    type: DataTypes.INTEGER, // in ml
    allowNull: true,
    defaultValue: 700
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  rating_average: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 10
    }
  },
  rating_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'whiskies',
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['distillery']
    },
    {
      fields: ['region']
    },
    {
      fields: ['type']
    },
    {
      fields: ['is_available']
    },
    {
      fields: ['is_featured']
    },
    {
      fields: ['rating_average']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Instance methods
Whisky.prototype.updateRatingStats = async function() {
  const Rating = require('./Rating');
  
  const stats = await Rating.findOne({
    where: { whisky_id: this.id },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('overall_score')), 'average'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    raw: true
  });

  this.rating_average = stats.average ? parseFloat(stats.average).toFixed(2) : 0;
  this.rating_count = parseInt(stats.count) || 0;
  
  await this.save();
};

// Class methods
Whisky.associate = function(models) {
  Whisky.hasMany(models.Rating, {
    foreignKey: 'whisky_id',
    as: 'ratings'
  });
  
  // Distillery association
  Whisky.belongsTo(models.Distillery, {
    foreignKey: 'distillery_id',
    as: 'distilleryInfo'
  });
};

module.exports = Whisky;
