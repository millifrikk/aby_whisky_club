const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create wishlists table
    await queryInterface.createTable('wishlists', {
      id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      whisky_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'whiskies',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      added_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
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
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create comparison_sessions table
    await queryInterface.createTable('comparison_sessions', {
      id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      whisky_ids: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add unique constraint for wishlists (user can only have one wishlist entry per whisky)
    await queryInterface.addConstraint('wishlists', {
      fields: ['user_id', 'whisky_id'],
      type: 'unique',
      name: 'unique_user_whisky_wishlist'
    });

    // Add index for performance
    await queryInterface.addIndex('wishlists', ['user_id']);
    await queryInterface.addIndex('wishlists', ['whisky_id']);
    await queryInterface.addIndex('comparison_sessions', ['user_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('comparison_sessions');
    await queryInterface.dropTable('wishlists');
  }
};