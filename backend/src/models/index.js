const { sequelize, testConnection } = require('../config/database');

// Import all models
const User = require('./User');
const Whisky = require('./Whisky');
const Distillery = require('./Distillery');
const Rating = require('./Rating');
const NewsEvent = require('./NewsEvent');
const EventRSVP = require('./EventRSVP');
const SystemSetting = require('./SystemSetting');
const Wishlist = require('./Wishlist');
const ComparisonSession = require('./ComparisonSession');
const UserActivity = require('./UserActivity');
const PerformanceMetric = require('./PerformanceMetric');

// Set up associations
const models = {
  User,
  Whisky,
  Distillery,
  Rating,
  NewsEvent,
  EventRSVP,
  SystemSetting,
  Wishlist,
  ComparisonSession,
  UserActivity,
  PerformanceMetric
};

// Initialize associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Sync database
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ 
      force, 
      logging: process.env.NODE_ENV === 'development' ? console.log : false 
    });
    console.log('✅ Database synchronized successfully');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  models,
  syncDatabase,
  // Export individual models for convenience
  User,
  Whisky,
  Distillery,
  Rating,
  NewsEvent,
  EventRSVP,
  SystemSetting,
  Wishlist,
  ComparisonSession,
  UserActivity,
  PerformanceMetric
};
