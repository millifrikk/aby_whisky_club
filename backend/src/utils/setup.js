#!/usr/bin/env node

require('dotenv').config();
const { testConnection, syncDatabase } = require('../models');
const populateDistilleries = require('./populateDistilleries');

const setupDatabase = async () => {
  try {
    console.log('🚀 Starting Åby Whisky Club database setup...\n');

    // Test database connection
    console.log('📡 Testing database connection...');
    await testConnection();
    console.log('✅ Database connection successful!\n');

    // Sync database (create tables)
    console.log('🗄️  Synchronizing database schema...');
    await syncDatabase(false); // Don't force sync to preserve existing data
    console.log('✅ Database schema synchronized!\n');

    // Populate distilleries
    console.log('🏭 Populating distilleries from WhiskyHunter API...');
    await populateDistilleries();
    console.log('✅ Distilleries populated successfully!\n');

    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: npm run seed (to add sample data)');
    console.log('   2. Start the server: npm run dev');
    console.log('   3. Access the API at: http://localhost:3001/api');
    console.log('\n🔧 Available commands:');
    console.log('   npm run populate-distilleries  - Refresh distillery data');
    console.log('   npm run seed                   - Seed database with sample data');
    console.log('   npm run dev                    - Start development server');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your .env file contains correct DATABASE_URL');
    console.log('   2. Ensure PostgreSQL is running');
    console.log('   3. Verify database exists and is accessible');
    console.log('   4. Check network connectivity for API calls');
    throw error;
  }
};

// Run setup if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('\n✨ Setup process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Setup process failed:', error.message);
      process.exit(1);
    });
}

module.exports = setupDatabase;
