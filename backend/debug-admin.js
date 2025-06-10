// Debug script to test admin API endpoint directly
const { User, Whisky, Rating, NewsEvent } = require('./src/models');

async function testAdminQueries() {
  try {
    console.log('Testing basic counts...');
    
    const userCount = await User.count();
    console.log('User count:', userCount);
    
    const whiskyCount = await Whisky.count();
    console.log('Whisky count:', whiskyCount);
    
    const ratingCount = await Rating.count();
    console.log('Rating count:', ratingCount);
    
    const eventCount = await NewsEvent.count();
    console.log('NewsEvent count:', eventCount);
    
    console.log('\nTesting user statistics query...');
    const userStats = await User.findAll({
      attributes: [
        'role',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      group: ['role'],
      raw: true
    });
    console.log('User stats:', userStats);
    
    console.log('\nTesting whisky statistics query...');
    const whiskyStats = await Whisky.findOne({
      attributes: [
        [Whisky.sequelize.fn('COUNT', Whisky.sequelize.col('id')), 'total_whiskies'],
        [Whisky.sequelize.fn('COUNT', Whisky.sequelize.literal('CASE WHEN is_available = true THEN 1 END')), 'available_whiskies']
      ],
      raw: true
    });
    console.log('Whisky stats:', whiskyStats);
    
  } catch (error) {
    console.error('Error testing queries:', error);
  }
}

testAdminQueries();