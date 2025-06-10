require('dotenv').config();
const axios = require('axios');

const API_BASE = `http://localhost:${process.env.PORT || 3001}/api`;

// Test data
let authToken = '';
let testWhiskyId = '';
let testEventId = '';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAPI() {
  try {
    log('blue', '🚀 Starting Åby Whisky Club API Tests...\n');

    // Test 1: Health Check
    log('yellow', '1. Testing Health Check...');
    try {
      const response = await axios.get(`${API_BASE}/health`);
      log('green', `✅ Health check passed: ${response.data.status}`);
    } catch (error) {
      log('red', `❌ Health check failed: ${error.message}`);
      return;
    }

    // Test 2: API Info
    log('yellow', '\n2. Testing API Info...');
    try {
      const response = await axios.get(`${API_BASE}`);
      log('green', `✅ API info retrieved: ${response.data.message}`);
    } catch (error) {
      log('red', `❌ API info failed: ${error.message}`);
    }

    // Test 3: User Registration
    log('yellow', '\n3. Testing User Registration...');
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'User'
      });
      authToken = response.data.token;
      log('green', `✅ User registration successful: ${response.data.user.username}`);
    } catch (error) {
      if (error.response?.status === 409) {
        log('yellow', '⚠️  User already exists, attempting login...');
        
        // Test Login instead
        try {
          const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'test@example.com',
            password: 'TestPass123!'
          });
          authToken = loginResponse.data.token;
          log('green', `✅ User login successful: ${loginResponse.data.user.username}`);
        } catch (loginError) {
          log('red', `❌ Login failed: ${loginError.response?.data?.message || loginError.message}`);
          return;
        }
      } else {
        log('red', `❌ Registration failed: ${error.response?.data?.message || error.message}`);
        return;
      }
    }

    // Test 4: Protected Route (Profile)
    log('yellow', '\n4. Testing Protected Route (Profile)...');
    try {
      const response = await axios.get(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log('green', `✅ Profile retrieved: ${response.data.user.email}`);
    } catch (error) {
      log('red', `❌ Profile retrieval failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 5: Get Whiskies
    log('yellow', '\n5. Testing Get Whiskies...');
    try {
      const response = await axios.get(`${API_BASE}/whiskies`);
      if (response.data.whiskies.length > 0) {
        testWhiskyId = response.data.whiskies[0].id;
        log('green', `✅ Whiskies retrieved: ${response.data.whiskies.length} whiskies found`);
      } else {
        log('yellow', '⚠️  No whiskies found in database');
      }
    } catch (error) {
      log('red', `❌ Get whiskies failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 6: Get Whisky by ID
    if (testWhiskyId) {
      log('yellow', '\n6. Testing Get Whisky by ID...');
      try {
        const response = await axios.get(`${API_BASE}/whiskies/${testWhiskyId}`);
        log('green', `✅ Whisky details retrieved: ${response.data.whisky.name}`);
      } catch (error) {
        log('red', `❌ Get whisky by ID failed: ${error.response?.data?.message || error.message}`);
      }
    }

    // Test 7: Create Rating (requires authentication)
    if (testWhiskyId && authToken) {
      log('yellow', '\n7. Testing Create Rating...');
      try {
        const response = await axios.post(`${API_BASE}/ratings`, {
          whisky_id: testWhiskyId,
          overall_score: 8.5,
          appearance_score: 8.0,
          nose_score: 8.5,
          palate_score: 9.0,
          finish_score: 8.0,
          review_text: 'Excellent whisky with great complexity and balance.',
          tasting_notes: {
            appearance: 'Golden amber',
            nose: 'Rich fruits and spices',
            palate: 'Smooth with vanilla and oak',
            finish: 'Long and warming'
          }
        }, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        log('green', `✅ Rating created successfully: ${response.data.rating.overall_score}/10`);
      } catch (error) {
        log('red', `❌ Create rating failed: ${error.response?.data?.message || error.message}`);
      }
    }

    // Test 8: Get Ratings for Whisky
    if (testWhiskyId) {
      log('yellow', '\n8. Testing Get Ratings for Whisky...');
      try {
        const response = await axios.get(`${API_BASE}/ratings/whisky/${testWhiskyId}`);
        log('green', `✅ Whisky ratings retrieved: ${response.data.statistics.total_ratings} ratings`);
      } catch (error) {
        log('red', `❌ Get whisky ratings failed: ${error.response?.data?.message || error.message}`);
      }
    }

    // Test 9: Get News/Events
    log('yellow', '\n9. Testing Get News/Events...');
    try {
      const response = await axios.get(`${API_BASE}/news-events`);
      if (response.data.news_events.length > 0) {
        testEventId = response.data.news_events.find(item => item.type === 'event')?.id;
        log('green', `✅ News/Events retrieved: ${response.data.news_events.length} items found`);
      } else {
        log('yellow', '⚠️  No news/events found in database');
      }
    } catch (error) {
      log('red', `❌ Get news/events failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 10: Get Upcoming Events
    log('yellow', '\n10. Testing Get Upcoming Events...');
    try {
      const response = await axios.get(`${API_BASE}/news-events/upcoming`);
      log('green', `✅ Upcoming events retrieved: ${response.data.events.length} events`);
    } catch (error) {
      log('red', `❌ Get upcoming events failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 11: Get Top Rated Whiskies
    log('yellow', '\n11. Testing Get Top Rated Whiskies...');
    try {
      const response = await axios.get(`${API_BASE}/ratings/top-whiskies`);
      log('green', `✅ Top rated whiskies retrieved: ${response.data.whiskies.length} whiskies`);
    } catch (error) {
      log('red', `❌ Get top rated whiskies failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 12: Get Whisky Stats
    log('yellow', '\n12. Testing Get Whisky Statistics...');
    try {
      const response = await axios.get(`${API_BASE}/whiskies/stats`);
      log('green', `✅ Whisky stats retrieved: ${response.data.total_whiskies} total whiskies`);
    } catch (error) {
      log('red', `❌ Get whisky stats failed: ${error.response?.data?.message || error.message}`);
    }

    log('blue', '\n🎉 API Tests Completed!\n');

  } catch (error) {
    log('red', `❌ Test suite failed: ${error.message}`);
  }
}

// Add axios dependency to package.json if not present
const checkAxios = async () => {
  try {
    require('axios');
  } catch (error) {
    log('yellow', 'Installing axios for testing...');
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec('npm install axios', (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
};

// Run tests
(async () => {
  try {
    await checkAxios();
    await wait(2000); // Wait for server to start
    await testAPI();
  } catch (error) {
    log('red', `❌ Failed to run tests: ${error.message}`);
  }
})();
