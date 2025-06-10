// Test the admin dashboard endpoint directly
const axios = require('axios');

async function testAdminEndpoint() {
  try {
    console.log('Testing admin endpoint without auth...');
    const response = await axios.get('http://localhost:3001/api/admin/dashboard/stats');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('Error status:', error.response?.status);
    console.log('Error message:', error.response?.data?.error);
    console.log('This is expected - admin endpoint requires authentication');
    
    // Now test with mock admin user
    console.log('\nTesting with admin token...');
    try {
      // We need to get a real admin token first
      const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
        email: 'admin@abywhiskyclub.com',
        password: 'AdminPass123!'
      });
      
      console.log('Login successful, testing admin endpoint...');
      const adminResponse = await axios.get('http://localhost:3001/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`
        }
      });
      
      console.log('Admin response:', JSON.stringify(adminResponse.data, null, 2));
      
    } catch (authError) {
      console.log('Auth error:', authError.response?.data?.error || authError.message);
    }
  }
}

testAdminEndpoint();