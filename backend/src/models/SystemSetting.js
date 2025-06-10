const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemSetting = sequelize.define('SystemSetting', {
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
  }, {
    tableName: 'system_settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['key']
      },
      {
        fields: ['category']
      },
      {
        fields: ['is_public']
      }
    ]
  });

  // Instance method to get parsed value based on data_type
  SystemSetting.prototype.getParsedValue = function() {
    if (this.value === null || this.value === undefined) {
      return null;
    }

    try {
      switch (this.data_type) {
        case 'boolean':
          return this.value === 'true' || this.value === true;
        case 'number':
          return parseFloat(this.value);
        case 'json':
        case 'array':
          return JSON.parse(this.value);
        case 'string':
        default:
          return this.value;
      }
    } catch (error) {
      console.error(`Error parsing setting ${this.key}:`, error);
      return this.value; // Return raw value if parsing fails
    }
  };

  // Instance method to set value with proper serialization
  SystemSetting.prototype.setParsedValue = function(value) {
    try {
      switch (this.data_type) {
        case 'boolean':
          this.value = Boolean(value).toString();
          break;
        case 'number':
          this.value = Number(value).toString();
          break;
        case 'json':
        case 'array':
          this.value = JSON.stringify(value);
          break;
        case 'string':
        default:
          this.value = String(value);
      }
    } catch (error) {
      console.error(`Error setting value for ${this.key}:`, error);
      throw new Error(`Invalid value for setting ${this.key}`);
    }
  };

  // Class method to get setting by key
  SystemSetting.getSetting = async function(key, defaultValue = null) {
    try {
      const setting = await this.findOne({ where: { key } });
      return setting ? setting.getParsedValue() : defaultValue;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return defaultValue;
    }
  };

  // Class method to set setting by key
  SystemSetting.setSetting = async function(key, value, options = {}) {
    try {
      const {
        data_type = 'string',
        category = 'general',
        description = null,
        is_public = false,
        is_readonly = false,
        validation_rules = null
      } = options;

      const [setting] = await this.findOrCreate({
        where: { key },
        defaults: {
          key,
          data_type,
          category,
          description,
          is_public,
          is_readonly,
          validation_rules
        }
      });

      setting.setParsedValue(value);
      await setting.save();

      return setting;
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      throw error;
    }
  };

  // Class method to get settings by category
  SystemSetting.getSettingsByCategory = async function(category, includePrivate = false) {
    try {
      const where = { category };
      if (!includePrivate) {
        where.is_public = true;
      }

      const settings = await this.findAll({
        where,
        order: [['key', 'ASC']]
      });

      const result = {};
      settings.forEach(setting => {
        result[setting.key] = setting.getParsedValue();
      });

      return result;
    } catch (error) {
      console.error(`Error getting settings for category ${category}:`, error);
      return {};
    }
  };

module.exports = SystemSetting;