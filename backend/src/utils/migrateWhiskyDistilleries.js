const { Whisky, Distillery } = require('../models');
const { Op } = require('sequelize');

/**
 * Migrate existing whisky data to use distillery relationships
 * Matches whisky.distillery text field to actual distillery records
 */
async function migrateWhiskyDistilleries() {
  console.log('🔄 Starting whisky-distillery migration...');
  
  try {
    // Get all whiskies that don't have distillery_id but have distillery text
    const whiskiesWithoutDistilleryId = await Whisky.findAll({
      where: {
        distillery_id: null,
        distillery: {
          [Op.ne]: null,
          [Op.ne]: ''
        }
      }
    });

    console.log(`📊 Found ${whiskiesWithoutDistilleryId.length} whiskies to migrate`);

    let matched = 0;
    let notMatched = 0;
    const unmatchedDistilleries = new Set();

    // Process each whisky
    for (const whisky of whiskiesWithoutDistilleryId) {
      const distilleryName = whisky.distillery.trim();
      
      // Try to find matching distillery by name (case-insensitive)
      const matchedDistillery = await Distillery.findOne({
        where: {
          name: {
            [Op.iLike]: distilleryName
          }
        }
      });

      if (matchedDistillery) {
        // Update whisky with distillery_id
        await whisky.update({
          distillery_id: matchedDistillery.id
        });
        
        matched++;
        console.log(`✅ Matched "${whisky.name}" → "${matchedDistillery.name}"`);
      } else {
        notMatched++;
        unmatchedDistilleries.add(distilleryName);
        console.log(`❌ No match found for "${whisky.name}" → "${distilleryName}"`);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully matched: ${matched} whiskies`);
    console.log(`❌ No matches found: ${notMatched} whiskies`);
    
    if (unmatchedDistilleries.size > 0) {
      console.log('\n📋 Unmatched distilleries (consider adding these):');
      unmatchedDistilleries.forEach(name => {
        console.log(`   - ${name}`);
      });
    }

    return {
      total: whiskiesWithoutDistilleryId.length,
      matched,
      notMatched,
      unmatchedDistilleries: Array.from(unmatchedDistilleries)
    };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Create missing distilleries from unmatched whisky distillery names
 */
async function createMissingDistilleries(unmatchedNames) {
  console.log('🔄 Creating missing distilleries...');
  
  const created = [];
  
  for (const name of unmatchedNames) {
    try {
      // Generate a slug from the name
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

      // Determine country and region based on common patterns
      let country = 'Scotland';
      let region = '';

      if (name.toLowerCase().includes('buffalo') || name.toLowerCase().includes('kentucky')) {
        country = 'United States';
        region = 'Kentucky';
      } else if (name.toLowerCase().includes('yamazaki') || name.toLowerCase().includes('japanese')) {
        country = 'Japan';
        region = 'Japan';
      } else if (name.toLowerCase().includes('irish')) {
        country = 'Ireland';
        region = 'Ireland';
      }

      const distillery = await Distillery.create({
        name,
        slug,
        country,
        region,
        description: `Auto-created distillery from whisky migration`,
        is_active: true
      });

      created.push(distillery);
      console.log(`✅ Created distillery: ${name}`);
      
    } catch (error) {
      console.error(`❌ Failed to create distillery "${name}":`, error.message);
    }
  }

  console.log(`📊 Created ${created.length} distilleries`);
  return created;
}

/**
 * Complete migration process: migrate existing data and create missing distilleries
 */
async function completeDistilleryMigration() {
  console.log('🚀 Starting complete distillery migration...\n');
  
  try {
    // Step 1: Migrate existing data
    const migrationResult = await migrateWhiskyDistilleries();
    
    // Step 2: Create missing distilleries if any
    if (migrationResult.unmatchedDistilleries.length > 0) {
      console.log('\n🔄 Creating missing distilleries...');
      await createMissingDistilleries(migrationResult.unmatchedDistilleries);
      
      // Step 3: Re-run migration to match newly created distilleries
      console.log('\n🔄 Re-running migration after creating distilleries...');
      const secondMigrationResult = await migrateWhiskyDistilleries();
      
      return {
        ...migrationResult,
        secondPass: secondMigrationResult
      };
    }
    
    return migrationResult;
    
  } catch (error) {
    console.error('❌ Complete migration failed:', error);
    throw error;
  }
}

module.exports = {
  migrateWhiskyDistilleries,
  createMissingDistilleries,
  completeDistilleryMigration
};