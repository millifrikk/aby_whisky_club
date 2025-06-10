require('dotenv').config();
const { testConnection, syncDatabase, User, Whisky, Distillery, NewsEvent } = require('../models');
const populateDistilleries = require('./populateDistilleries');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Test connection and sync database
    await testConnection();
    await syncDatabase(true); // Force sync to recreate tables

    console.log('👤 Creating users...');

    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@abywhiskyclub.com',
      password_hash: 'AdminPass123!',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true,
      email_verified: true
    });

    // Create test members
    const members = await User.bulkCreate([
      {
        username: 'erik_taster',
        email: 'erik@example.com',
        password_hash: 'MemberPass123!',
        first_name: 'Erik',
        last_name: 'Karlsson',
        role: 'member',
        is_active: true,
        email_verified: true,
        bio: 'Passionate about Speyside single malts and Japanese whiskies.'
      },
      {
        username: 'anna_whisky',
        email: 'anna@example.com',
        password_hash: 'MemberPass123!',
        first_name: 'Anna',
        last_name: 'Lindberg',
        role: 'member',
        is_active: true,
        email_verified: true,
        bio: 'Love exploring peated Islay whiskies and bourbon.'
      },
      {
        username: 'lars_collector',
        email: 'lars@example.com',
        password_hash: 'MemberPass123!',
        first_name: 'Lars',
        last_name: 'Johansson',
        role: 'member',
        is_active: true,
        email_verified: true,
        bio: 'Collector of rare and vintage whiskies.'
      }
    ]);

    console.log('🥃 Creating whiskies...');

    const whiskies = await Whisky.bulkCreate([
      {
        name: 'Macallan 18 Year Old',
        distillery: 'The Macallan',
        region: 'Speyside',
        country: 'Scotland',
        age: 18,
        abv: 43.0,
        type: 'single_malt',
        cask_type: 'Sherry Oak',
        description: 'Exceptional single malt matured for eighteen years in hand-picked sherry seasoned oak casks from Jerez.',
        tasting_notes: {
          color: 'Rich mahogany',
          nose: 'Dried fruits, spice, chocolate, orange',
          palate: 'Rich fruits, ginger, orange, spice, wood smoke',
          finish: 'Medium, spice, oak, dried fruits'
        },
        purchase_date: new Date('2023-01-15'),
        purchase_price: 450.00,
        current_price: 475.00,
        quantity: 2,
        is_available: true,
        is_featured: true
      },
      {
        name: 'Lagavulin 16 Year Old',
        distillery: 'Lagavulin',
        region: 'Islay',
        country: 'Scotland',
        age: 16,
        abv: 43.0,
        type: 'single_malt',
        cask_type: 'Oak barrels and hogsheads',
        description: 'An intensely flavoured, peat-smoke filled single malt from the south coast of Islay.',
        tasting_notes: {
          color: 'Deep amber gold',
          nose: 'Intense smoke, seaweed, medicinal, sweet undertones',
          palate: 'Dry peat smoke, spice, hints of vanilla and raisins',
          finish: 'Long, elegant peat-filled finish with touch of salt'
        },
        purchase_date: new Date('2023-02-20'),
        purchase_price: 95.00,
        current_price: 105.00,
        quantity: 3,
        is_available: true,
        is_featured: true
      },
      {
        name: 'Glenfiddich 21 Year Old',
        distillery: 'Glenfiddich',
        region: 'Speyside',
        country: 'Scotland',
        age: 21,
        abv: 40.0,
        type: 'single_malt',
        cask_type: 'Caribbean Rum Cask',
        description: 'Aged 21 years and finished in Caribbean rum casks for an extra-sweet, indulgent single malt.',
        tasting_notes: {
          color: 'Rich gold',
          nose: 'Toffee apple, cinnamon, ginger, banana',
          palate: 'Sweet vanilla, honey, candied fruit, spice',
          finish: 'Long, warm, ginger and fig'
        },
        purchase_date: new Date('2023-03-10'),
        purchase_price: 180.00,
        current_price: 190.00,
        quantity: 1,
        is_available: true,
        is_featured: false
      },
      {
        name: 'Ardbeg 10 Year Old',
        distillery: 'Ardbeg',
        region: 'Islay',
        country: 'Scotland',
        age: 10,
        abv: 46.0,
        type: 'single_malt',
        cask_type: 'Bourbon barrels',
        description: 'The ultimate Islay single malt Scotch whisky, acclaimed as the peatiest, smokiest, most complex single malt of them all.',
        tasting_notes: {
          color: 'Pale gold',
          nose: 'Peat smoke, lime, antiseptic, smoked fish',
          palate: 'Powerful peat smoke, espresso, dark chocolate, aniseed',
          finish: 'Very long, peat, tar, smoked fish'
        },
        purchase_date: new Date('2023-04-05'),
        purchase_price: 65.00,
        current_price: 70.00,
        quantity: 4,
        is_available: true,
        is_featured: true
      },
      {
        name: 'Yamazaki 12 Year Old',
        distillery: 'Yamazaki',
        region: 'Osaka',
        country: 'Japan',
        age: 12,
        abv: 43.0,
        type: 'single_malt',
        cask_type: 'Mizunara Oak',
        description: 'Japan\'s first single malt whisky, from the country\'s oldest malt distillery.',
        tasting_notes: {
          color: 'Golden amber',
          nose: 'Peach, pineapple, grapefruit, clove, candied orange',
          palate: 'Coconut, cranberry, butter, mizunara (Japanese oak)',
          finish: 'Medium, sweet, spicy, incense'
        },
        purchase_date: new Date('2023-05-12'),
        purchase_price: 320.00,
        current_price: 380.00,
        quantity: 1,
        is_available: true,
        is_featured: true
      },
      {
        name: 'Buffalo Trace Bourbon',
        distillery: 'Buffalo Trace',
        region: 'Kentucky',
        country: 'United States',
        age: null,
        abv: 45.0,
        type: 'bourbon',
        cask_type: 'New American Oak',
        description: 'An award-winning Kentucky straight bourbon whiskey.',
        tasting_notes: {
          color: 'Medium amber',
          nose: 'Pleasant and sweet, notes of vanilla, mint and molasses',
          palate: 'Pleasantly sweet to the taste with notes of brown sugar and spice',
          finish: 'Long and smooth with toffee flavors'
        },
        purchase_date: new Date('2023-06-18'),
        purchase_price: 35.00,
        current_price: 40.00,
        quantity: 2,
        is_available: true,
        is_featured: false
      }
    ]);

    console.log('🏭 Populating distilleries from WhiskyHunter API...');
    await populateDistilleries();

    console.log('🔗 Linking existing whiskies to distilleries...');
    await linkWhiskiesToDistilleries();

    console.log('📰 Creating news and events...');

    const newsEvents = await NewsEvent.bulkCreate([
      {
        title: 'Welcome to Åby Whisky Club!',
        content: 'We are excited to launch our new whisky club management system. Here you can browse our collection, rate whiskies, and stay updated on upcoming events.',
        type: 'announcement',
        created_by: adminUser.id,
        is_published: true,
        published_at: new Date(),
        is_featured: true
      },
      {
        title: 'Monthly Whisky Tasting - January 2024',
        content: 'Join us for our monthly whisky tasting session where we\'ll be exploring Speyside single malts. We\'ll taste three different expressions and discuss their unique characteristics. Light snacks will be provided.',
        type: 'event',
        event_date: new Date('2024-01-25T19:00:00'),
        event_end_date: new Date('2024-01-25T22:00:00'),
        location: 'Åby Community Center',
        address: 'Storgatan 15, 123 45 Åby',
        capacity: 20,
        current_attendees: 0,
        price: 150.00,
        created_by: adminUser.id,
        is_published: true,
        published_at: new Date(),
        rsvp_required: true,
        rsvp_deadline: new Date('2024-01-20T23:59:59'),
        contact_email: 'events@abywhiskyclub.com',
        tags: ['tasting', 'speyside', 'monthly']
      },
      {
        title: 'New Arrivals: Japanese Whiskies',
        content: 'We\'ve recently added some exceptional Japanese whiskies to our collection, including the highly sought-after Yamazaki 12 Year Old. Come and discover the unique flavors of Japanese whisky making.',
        type: 'news',
        created_by: adminUser.id,
        is_published: true,
        published_at: new Date(),
        tags: ['new-arrivals', 'japanese', 'collection']
      },
      {
        title: 'Peated Whisky Workshop - February 2024',
        content: 'Dive deep into the world of peated whiskies in this special workshop. We\'ll explore the peat-making process, taste whiskies with varying levels of peat, and learn to identify different smoke characteristics. Perfect for both beginners and experienced tasters.',
        type: 'event',
        event_date: new Date('2024-02-15T18:30:00'),
        event_end_date: new Date('2024-02-15T21:30:00'),
        location: 'Åby Community Center',
        address: 'Storgatan 15, 123 45 Åby',
        capacity: 15,
        current_attendees: 0,
        price: 200.00,
        created_by: adminUser.id,
        is_published: true,
        published_at: new Date(),
        rsvp_required: true,
        rsvp_deadline: new Date('2024-02-10T23:59:59'),
        contact_email: 'events@abywhiskyclub.com',
        tags: ['workshop', 'peated', 'educational']
      }
    ]);

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Seeded data summary:');
    console.log(`   👤 Users: ${1 + members.length} (1 admin, ${members.length} members)`);
    console.log(`   🥃 Whiskies: ${whiskies.length}`);
    console.log(`   📰 News & Events: ${newsEvents.length}`);
    
    console.log('\n🔑 Login credentials:');
    console.log('   Admin: admin@abywhiskyclub.com / AdminPass123!');
    console.log('   Member: erik@example.com / MemberPass123!');
    console.log('   Member: anna@example.com / MemberPass123!');
    console.log('   Member: lars@example.com / MemberPass123!');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};

// Helper function to link existing whiskies to distilleries (disabled - no foreign key)
const linkWhiskiesToDistilleries = async () => {
  try {
    console.log('🔗 Skipping distillery linking - no foreign key column exists');
    // Note: Whiskies use 'distillery' text field instead of distillery_id foreign key
  } catch (error) {
    console.error('❌ Error in distillery linking function:', error);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('🌱 Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = seedData;
