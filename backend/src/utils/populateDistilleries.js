require('dotenv').config();
const axios = require('axios');
const { testConnection, Distillery } = require('../models');

const WHISKYHUNTER_API_URL = 'https://whiskyhunter.net/api/distilleries_info/';

const populateDistilleries = async () => {
  try {
    console.log('🏭 Starting distillery population from WhiskyHunter API...');

    // Test database connection
    await testConnection();

    console.log('📡 Fetching distilleries from WhiskyHunter API...');

    // Fetch distilleries from API
    const response = await axios.get(WHISKYHUNTER_API_URL, {
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'AbyWhiskyClub/1.0'
      }
    });

    const distilleries = response.data;
    console.log(`✅ Retrieved ${distilleries.length} distilleries from API`);

    console.log('💾 Inserting distilleries into database...');

    // Process distilleries in batches to avoid overwhelming the database
    const batchSize = 50;
    let processed = 0;
    let created = 0;
    let updated = 0;

    for (let i = 0; i < distilleries.length; i += batchSize) {
      const batch = distilleries.slice(i, i + batchSize);
      
      for (const distilleryData of batch) {
        try {
          // Check if distillery already exists
          const [distillery, wasCreated] = await Distillery.findOrCreate({
            where: { slug: distilleryData.slug },
            defaults: {
              name: distilleryData.name,
              slug: distilleryData.slug,
              country: distilleryData.country,
              region: getRegionForCountry(distilleryData.country, distilleryData.name),
              is_active: true
            }
          });

          if (wasCreated) {
            created++;
            console.log(`  ✅ Created: ${distilleryData.name} (${distilleryData.country})`);
          } else {
            // Update existing distillery if data has changed
            const needsUpdate = 
              distillery.name !== distilleryData.name ||
              distillery.country !== distilleryData.country;

            if (needsUpdate) {
              await distillery.update({
                name: distilleryData.name,
                country: distilleryData.country,
                region: getRegionForCountry(distilleryData.country, distilleryData.name)
              });
              updated++;
              console.log(`  🔄 Updated: ${distilleryData.name} (${distilleryData.country})`);
            }
          }

          processed++;
        } catch (error) {
          console.error(`  ❌ Error processing ${distilleryData.name}:`, error.message);
        }
      }

      // Progress indicator
      console.log(`📊 Progress: ${Math.min(i + batchSize, distilleries.length)}/${distilleries.length} processed`);
    }

    console.log('\n✅ Distillery population completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   Total processed: ${processed}`);
    console.log(`   New distilleries created: ${created}`);
    console.log(`   Existing distilleries updated: ${updated}`);
    console.log(`   Total in database: ${await Distillery.count()}`);

    // Show some statistics
    const countByCountry = await Distillery.findAll({
      attributes: [
        'country',
        [Distillery.sequelize.fn('COUNT', Distillery.sequelize.col('id')), 'count']
      ],
      group: ['country'],
      order: [[Distillery.sequelize.fn('COUNT', Distillery.sequelize.col('id')), 'DESC']]
    });

    console.log('\n🌍 Distilleries by country:');
    countByCountry.forEach(item => {
      console.log(`   ${item.country}: ${item.get('count')}`);
    });

  } catch (error) {
    console.error('❌ Distillery population failed:', error);
    throw error;
  }
};

// Helper function to assign regions based on country and distillery name
const getRegionForCountry = (country, distilleryName) => {
  if (country === 'Scotland') {
    return getScottishRegion(distilleryName);
  } else if (country === 'Japan') {
    return 'Japan'; // Could be expanded to specific regions
  } else if (country === 'Taiwan') {
    return 'Taiwan';
  }
  return null;
};

// Helper function to map Scottish distilleries to regions
const getScottishRegion = (distilleryName) => {
  const name = distilleryName.toLowerCase();
  
  // Speyside distilleries
  const speysideDistilleries = [
    'aberlour', 'balvenie', 'cardhu', 'cragganmore', 'glenfarclas', 'glenfiddich',
    'glen grant', 'glenlivet', 'macallan', 'mortlach', 'speyburn', 'strathisla',
    'benriach', 'longmorn', 'glen elgin', 'linkwood', 'dufftown', 'glen keith',
    'benrinnes', 'craigellachie', 'aultmore', 'inchgower', 'knockando',
    'glen spey', 'glenlossie', 'mannochmore', 'dailuaine', 'auchroisk',
    'braeval', 'glentauchers', 'tamdhu', 'tamnavulin', 'tomintoul'
  ];
  
  // Islay distilleries
  const islayDistilleries = [
    'ardbeg', 'bowmore', 'bruichladdich', 'bunnahabhain', 'caol ila',
    'kilchoman', 'lagavulin', 'laphroaig', 'port charlotte', 'port ellen'
  ];
  
  // Highland distilleries
  const highlandDistilleries = [
    'aberfeldy', 'balblair', 'dalmore', 'dalwhinnie', 'deanston',
    'glen ord', 'glenmorangie', 'highland park', 'oban', 'old pulteney',
    'royal lochnagar', 'talisker', 'tobermory', 'tomatin', 'tullibardine',
    'ben nevis', 'clynelish', 'fettercairn', 'glen garioch', 'glengoyne',
    'edradour', 'blair athol', 'royal brackla', 'glenturret'
  ];
  
  // Lowland distilleries
  const lowlandDistilleries = [
    'auchentoshan', 'bladnoch', 'glenkinchie', 'annandale'
  ];
  
  // Campbeltown distilleries
  const campbeltownDistilleries = [
    'glen scotia', 'longrow', 'springbank', 'kilkerran', 'glengyle'
  ];
  
  // Check regions
  if (speysideDistilleries.some(d => name.includes(d))) return 'Speyside';
  if (islayDistilleries.some(d => name.includes(d))) return 'Islay';
  if (highlandDistilleries.some(d => name.includes(d))) return 'Highlands';
  if (lowlandDistilleries.some(d => name.includes(d))) return 'Lowlands';
  if (campbeltownDistilleries.some(d => name.includes(d))) return 'Campbeltown';
  
  // Default to Highlands for unknown Scottish distilleries
  return 'Highlands';
};

// Run population if called directly
if (require.main === module) {
  populateDistilleries()
    .then(() => {
      console.log('🏭 Distillery population process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Distillery population process failed:', error);
      process.exit(1);
    });
}

module.exports = populateDistilleries;
