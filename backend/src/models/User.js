const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      isAlphanumeric: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'member', 'guest'),
    defaultValue: 'member',
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  profile_image: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  whisky_preferences: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  approval_status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'approved',
    allowNull: false
  },
  approval_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  approved_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approval_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  failed_login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  account_locked_until: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_failed_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  email_verification_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  email_verification_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  password_reset_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  password_reset_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  email_notifications_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'users',
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['username']
    },
    {
      fields: ['role']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['approval_status']
    }
  ]
});

// Hash password before saving
User.beforeCreate(async (user) => {
  if (user.password_hash) {
    const salt = await bcrypt.genSalt(12);
    user.password_hash = await bcrypt.hash(user.password_hash, salt);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password_hash')) {
    const salt = await bcrypt.genSalt(12);
    user.password_hash = await bcrypt.hash(user.password_hash, salt);
  }
});

// Instance methods
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

User.prototype.toSafeObject = function() {
  const { password_hash, ...safeUser } = this.toJSON();
  return safeUser;
};

User.prototype.isAccountLocked = function() {
  return this.account_locked_until && this.account_locked_until > new Date();
};

User.prototype.incrementFailedAttempts = async function(maxAttempts = 5) {
  const newAttempts = this.failed_login_attempts + 1;
  this.failed_login_attempts = newAttempts;
  this.last_failed_login = new Date();
  
  if (newAttempts >= maxAttempts) {
    // Lock account for 15 minutes
    this.account_locked_until = new Date(Date.now() + 15 * 60 * 1000);
  }
  
  await this.save();
};

User.prototype.resetFailedAttempts = async function() {
  this.failed_login_attempts = 0;
  this.account_locked_until = null;
  this.last_failed_login = null;
  await this.save();
};

// Email verification methods
User.prototype.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  this.email_verification_token = crypto.randomBytes(32).toString('hex');
  this.email_verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
};

User.prototype.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  this.password_reset_token = crypto.randomBytes(32).toString('hex');
  this.password_reset_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
};

User.prototype.isEmailVerificationTokenValid = function(token) {
  return this.email_verification_token === token && 
         this.email_verification_expires && 
         this.email_verification_expires > new Date();
};

User.prototype.isPasswordResetTokenValid = function(token) {
  return this.password_reset_token === token && 
         this.password_reset_expires && 
         this.password_reset_expires > new Date();
};

User.prototype.clearEmailVerificationToken = function() {
  this.email_verification_token = null;
  this.email_verification_expires = null;
  this.email_verified = true;
};

User.prototype.clearPasswordResetToken = function() {
  this.password_reset_token = null;
  this.password_reset_expires = null;
};

// Class methods
User.associate = function(models) {
  User.hasMany(models.Rating, {
    foreignKey: 'user_id',
    as: 'ratings'
  });
  
  User.hasMany(models.NewsEvent, {
    foreignKey: 'created_by',
    as: 'posts'
  });

  User.hasMany(models.Wishlist, {
    foreignKey: 'user_id',
    as: 'wishlist'
  });

  User.hasMany(models.ComparisonSession, {
    foreignKey: 'user_id',
    as: 'comparisonSessions'
  });
};

module.exports = User;
