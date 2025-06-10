const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Rating = sequelize.define('Rating', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  whisky_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'whiskies',
      key: 'id'
    }
  },
  overall_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 10
    }
  },
  appearance_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10
    }
  },
  nose_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10
    }
  },
  palate_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10
    }
  },
  finish_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10
    }
  },
  review_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tasting_notes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      appearance: '',
      nose: '',
      palate: '',
      finish: '',
      overall: ''
    }
  },
  tasting_date: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  tasting_location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  serving_style: {
    type: DataTypes.ENUM('neat', 'rocks', 'splash', 'cocktail'),
    allowNull: true,
    defaultValue: 'neat'
  },
  bottle_age_when_opened: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  would_buy_again: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'ratings',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'whisky_id'],
      name: 'unique_user_whisky_rating'
    },
    {
      fields: ['overall_score']
    },
    {
      fields: ['tasting_date']
    },
    {
      fields: ['is_public']
    },
    {
      fields: ['is_featured']
    },
    {
      fields: ['whisky_id']
    },
    {
      fields: ['user_id']
    }
  ]
});

// Hooks
Rating.afterCreate(async (rating) => {
  const Whisky = require('./Whisky');
  const whisky = await Whisky.findByPk(rating.whisky_id);
  if (whisky) {
    await whisky.updateRatingStats();
  }
});

Rating.afterUpdate(async (rating) => {
  const Whisky = require('./Whisky');
  const whisky = await Whisky.findByPk(rating.whisky_id);
  if (whisky) {
    await whisky.updateRatingStats();
  }
});

Rating.afterDestroy(async (rating) => {
  const Whisky = require('./Whisky');
  const whisky = await Whisky.findByPk(rating.whisky_id);
  if (whisky) {
    await whisky.updateRatingStats();
  }
});

// Instance methods
Rating.prototype.getScoreBreakdown = function() {
  return {
    overall: this.overall_score,
    appearance: this.appearance_score,
    nose: this.nose_score,
    palate: this.palate_score,
    finish: this.finish_score,
    average_detailed: (
      (this.appearance_score || 0) + 
      (this.nose_score || 0) + 
      (this.palate_score || 0) + 
      (this.finish_score || 0)
    ) / 4
  };
};

// Class methods
Rating.associate = function(models) {
  Rating.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  Rating.belongsTo(models.Whisky, {
    foreignKey: 'whisky_id',
    as: 'whisky'
  });
};

module.exports = Rating;
