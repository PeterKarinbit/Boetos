const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:4001/api';
const FRONTEND_URL = 'http://localhost:3000';

async function testGoogleConnection() {
  try {
    console.log('🔍 Testing Google Calendar connection...\n');
    
    // First, let's check if the backend is running
    try {
      const healthCheck = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ Backend is running');
    } catch (error) {
      console.log('❌ Backend is not running. Please start the backend first.');
      console.log('   Run: cd backend && npm run dev');
      return;
    }

    // Test the Google OAuth URL
    const googleAuthUrl = `${API_BASE_URL}/oauth/google`;
    console.log(`🔗 Google OAuth URL: ${googleAuthUrl}`);
    
    try {
      const response = await axios.get(googleAuthUrl, { 
        maxRedirects: 0,
        validateStatus: function (status) {
          return status >= 200 && status < 400; // Accept redirects
        }
      });
      console.log('✅ Google OAuth endpoint is accessible');
    } catch (error) {
      if (error.response && error.response.status === 302) {
        console.log('✅ Google OAuth endpoint is working (redirecting to Google)');
      } else {
        console.log('❌ Google OAuth endpoint error:', error.message);
      }
    }

    console.log('\n📋 Next steps:');
    console.log('1. Go to your calendar page: http://localhost:3000/calendar');
    console.log('2. Click the "🔗 Connect Google Calendar" button');
    console.log('3. Complete the Google OAuth flow');
    console.log('4. You should be redirected back to the calendar with your events');
    
    console.log('\n🔧 If you\'re still having issues:');
    console.log('- Check that your Google OAuth credentials are set in .env');
    console.log('- Make sure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL are configured');
    console.log('- Verify that the callback URL matches your Google OAuth app settings');
    
  } catch (error) {
    console.error('❌ Error testing Google connection:', error.message);
  }
}

testGoogleConnection(); 