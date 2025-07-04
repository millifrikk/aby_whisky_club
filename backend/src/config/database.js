const { Sequelize } = require('sequelize');

// Load environment variables (only in development)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL;

// Debug logging for Railway
console.log('Environment variables check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All environment variables:', Object.keys(process.env).filter(key => key.includes('DATABASE')));
console.log('DATABASE_URL exists:', !!databaseUrl);
console.log('DATABASE_URL value:', databaseUrl ? `${databaseUrl.substring(0, 20)}...` : 'undefined');
console.log('DATABASE_URL length:', databaseUrl ? databaseUrl.length : 0);

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not set. Please check your Railway environment variables.');
  console.error('Available env vars:', Object.keys(process.env).slice(0, 10));
  process.exit(1);
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    paranoid: true // Enable soft deletes
  }
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };
