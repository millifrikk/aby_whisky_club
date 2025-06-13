const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Wishlist = sequelize.define('Wishlist', {
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
    whisky_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'whiskies',
        key: 'id'
      }
    },
    added_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 3
      }
    }
  }, {
    tableName: 'wishlists',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'whisky_id'],
        name: 'unique_user_whisky_wishlist'
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['whisky_id']
      }
    ]
  });

  // Define associations
  Wishlist.associate = (models) => {
    // Belongs to User
    Wishlist.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Belongs to Whisky
    Wishlist.belongsTo(models.Whisky, {
      foreignKey: 'whisky_id',
      as: 'whisky'
    });
  };

  // Instance methods
  Wishlist.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    return values;
  };

  // Static methods
  Wishlist.getUserWishlist = async function(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      orderBy = 'added_at',
      orderDirection = 'DESC'
    } = options;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    return this.findAndCountAll({
      where: { user_id: userId },
      order: [[orderBy, orderDirection]],
      limit: parseInt(limit),
      offset,
      include: [
        {
          model: sequelize.models.Whisky,
          as: 'whisky',
          include: [
            {
              model: sequelize.models.Distillery,
              as: 'distilleryInfo',
              required: false
            }
          ]
        }
      ]
    });
  };

  Wishlist.isInWishlist = async function(userId, whiskyId) {
    const wishlistItem = await this.findOne({
      where: {
        user_id: userId,
        whisky_id: whiskyId
      }
    });
    return !!wishlistItem;
  };

  Wishlist.addToWishlist = async function(userId, whiskyId, data = {}) {
    const { notes, priority = 1 } = data;

    // Check if already in wishlist
    const existing = await this.findOne({
      where: {
        user_id: userId,
        whisky_id: whiskyId
      }
    });

    if (existing) {
      throw new Error('Whisky is already in wishlist');
    }

    return this.create({
      user_id: userId,
      whisky_id: whiskyId,
      notes,
      priority,
      added_at: new Date()
    });
  };

  Wishlist.removeFromWishlist = async function(userId, whiskyId) {
    const deleted = await this.destroy({
      where: {
        user_id: userId,
        whisky_id: whiskyId
      }
    });

    if (deleted === 0) {
      throw new Error('Whisky not found in wishlist');
    }

    return { success: true };
  };

module.exports = Wishlist;