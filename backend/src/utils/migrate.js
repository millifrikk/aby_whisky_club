require('dotenv').config();
const { testConnection, syncDatabase } = require('../models');

const migrate = async () => {
  try {
    console.log('🔄 Starting database migration...');

    // Test connection
    await testConnection();
    
    // Sync database (create/update tables)
    await syncDatabase(false); // Don't force drop existing tables
    
    console.log('✅ Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('🔄 Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = migrate;
