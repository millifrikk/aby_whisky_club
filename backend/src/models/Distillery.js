const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Distillery = sequelize.define('Distillery', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 255]
    }
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 255]
    }
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  founded_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1700,
      max: new Date().getFullYear()
    }
  },
  website: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  location: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      latitude: null,
      longitude: null,
      address: ''
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  whisky_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'distilleries',
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['slug']
    },
    {
      fields: ['country']
    },
    {
      fields: ['region']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Instance methods
Distillery.prototype.updateWhiskyCount = async function() {
  const Whisky = require('./Whisky');
  
  // Use distillery name instead of foreign key since column doesn't exist
  const count = await Whisky.count({
    where: { distillery: this.name }
  });

  this.whisky_count = count;
  await this.save();
};

// Class methods
Distillery.associate = function(models) {
  // Association disabled - no foreign key column exists
  // Whiskies use 'distillery' text field instead of distillery_id foreign key
  // Distillery.hasMany(models.Whisky, {
  //   foreignKey: 'distillery_id',
  //   as: 'whiskies'
  // });
};

// Static methods
Distillery.findBySlug = function(slug) {
  return this.findOne({ where: { slug } });
};

Distillery.findByCountry = function(country) {
  return this.findAll({ 
    where: { country },
    order: [['name', 'ASC']]
  });
};

Distillery.getActiveDistilleries = function() {
  return this.findAll({ 
    where: { is_active: true },
    order: [['name', 'ASC']]
  });
};

module.exports = Distillery;
