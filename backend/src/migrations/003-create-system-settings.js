const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('system_settings', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Unique identifier for the setting'
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON string or plain text value'
      },
      data_type: {
        type: DataTypes.ENUM('string', 'number', 'boolean', 'json', 'array'),
        defaultValue: 'string',
        comment: 'Type of the value for proper parsing'
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'general',
        comment: 'Category grouping for settings (general, email, security, etc.)'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Human-readable description of the setting'
      },
      is_public: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this setting can be read by non-admin users'
      },
      is_readonly: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this setting can be modified through the UI'
      },
      validation_rules: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'JSON object with validation rules for the value'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('system_settings', ['key']);
    await queryInterface.addIndex('system_settings', ['category']);
    await queryInterface.addIndex('system_settings', ['is_public']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('system_settings');
  }
};