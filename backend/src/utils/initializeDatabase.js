require('dotenv').config();
const { testConnection, syncDatabase, User, Whisky, Distillery, NewsEvent, SystemSetting } = require('../models');
const seedData = require('./seed');
const AdminController = require('../controllers/adminController');

const initializeDatabase = async () => {
  try {
    console.log('🔧 Initializing Åby Whisky Club database...');

    // Test database connection
    console.log('📡 Testing database connection...');
    await testConnection();
    console.log('✅ Database connection successful!');

    // Sync database (create tables if they don't exist)
    console.log('🗄️  Synchronizing database schema...');
    await syncDatabase(false); // Don't force drop existing tables
    console.log('✅ Database schema synchronized!');

    // Check if database has data
    console.log('🔍 Checking for existing data...');
    const [userCount, whiskyCount, distilleryCount, eventCount, settingsCount] = await Promise.all([
      User.count(),
      Whisky.count(),
      Distillery.count(),
      NewsEvent.count(),
      SystemSetting.count()
    ]);

    console.log(`📊 Current data count:`);
    console.log(`   👤 Users: ${userCount}`);
    console.log(`   🥃 Whiskies: ${whiskyCount}`);
    console.log(`   🏭 Distilleries: ${distilleryCount}`);
    console.log(`   📰 News/Events: ${eventCount}`);
    console.log(`   ⚙️ Settings: ${settingsCount}`);

    // Seed database if empty
    if (whiskyCount === 0 || userCount === 0) {
      console.log('🌱 Database appears empty, running seeding...');
      await seedData();
      console.log('✅ Database seeding completed!');
    } else {
      console.log('📦 Database already contains data, skipping seeding');
    }

    // Check if distilleries need to be populated (separate from main seeding)
    if (distilleryCount === 0) {
      console.log('🏭 Distilleries table is empty, populating from API...');
      try {
        const populateDistilleries = require('./populateDistilleries');
        await populateDistilleries();
        console.log('✅ Distilleries populated from WhiskyHunter API!');
      } catch (error) {
        console.error('❌ Failed to populate distilleries:', error.message);
        console.log('💡 You can manually run: npm run populate-distilleries');
      }
    } else {
      console.log('🏭 Distilleries already populated');
    }

    // Initialize system settings if empty
    if (settingsCount === 0) {
      console.log('⚙️ System settings table is empty, initializing default settings...');
      try {
        await AdminController.initializeDefaultSettings();
        console.log('✅ Default system settings initialized!');
      } catch (error) {
        console.error('❌ Failed to initialize system settings:', error.message);
      }
    } else {
      console.log('⚙️ System settings already initialized');
    }

    // Final data count
    const [finalUserCount, finalWhiskyCount, finalDistilleryCount, finalEventCount, finalSettingsCount] = await Promise.all([
      User.count(),
      Whisky.count(),
      Distillery.count(),
      NewsEvent.count(),
      SystemSetting.count()
    ]);

    console.log('🎉 Database initialization completed successfully!');
    console.log(`📊 Final data count:`);
    console.log(`   👤 Users: ${finalUserCount}`);
    console.log(`   🥃 Whiskies: ${finalWhiskyCount}`);
    console.log(`   🏭 Distilleries: ${finalDistilleryCount}`);
    console.log(`   📰 News/Events: ${finalEventCount}`);
    console.log(`   ⚙️ Settings: ${finalSettingsCount}`);

    if (finalUserCount > 0 && finalWhiskyCount > 0) {
      console.log('✅ Database is ready for use!');
      console.log('\n🔑 Default login credentials:');
      console.log('   Admin: admin@abywhiskyclub.com / AdminPass123!');
      console.log('   Member: erik@example.com / MemberPass123!');
    }

    return {
      success: true,
      counts: {
        users: finalUserCount,
        whiskies: finalWhiskyCount,
        distilleries: finalDistilleryCount,
        events: finalEventCount,
        settings: finalSettingsCount
      }
    };

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('   1. Ensure PostgreSQL is running');
    console.log('   2. Check DATABASE_URL in environment variables');
    console.log('   3. Verify database permissions');
    console.log('   4. Check network connectivity');
    
    throw error;
  }
};

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase()
    .then((result) => {
      console.log('\n✨ Database initialization process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Database initialization failed:', error.message);
      process.exit(1);
    });
}

module.exports = initializeDatabase;