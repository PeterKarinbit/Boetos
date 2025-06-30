const axios = require('axios');

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

// Debug log for environment variables
console.log('OneSignal ENV:', {
  ONESIGNAL_APP_ID,
  REST_API_KEY: REST_API_KEY ? '***HIDDEN***' : undefined
});

async function sendPushNotification({ contents, headings, included_segments = ['All'], data = {} }) {
  try {
    const response = await axios.post('https://onesignal.com/api/v1/notifications', {
      app_id: ONESIGNAL_APP_ID,
      contents: { en: contents },
      headings: { en: headings },
      included_segments,
      data,
    }, {
      headers: {
        'Authorization': `Basic ${REST_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    return response.data;
  } catch (error) {
    console.error('OneSignal push error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { sendPushNotification }; 