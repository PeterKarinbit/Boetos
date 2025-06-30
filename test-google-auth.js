const axios = require('axios');
const express = require('express');
const open = require('open');

// Configuration
const API_BASE_URL = 'http://localhost:4001/api';
const FRONTEND_URL = 'http://localhost:3000';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your_google_client_id';
const GOOGLE_REDIRECT_URI = `${FRONTEND_URL}/auth/callback`;

// Create a simple server to handle the OAuth callback
const app = express();
const PORT = 3000;

app.get('/auth/callback', async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    return res.send(`Error: ${error}`);
  }

  try {
    // Exchange the authorization code for tokens
    const tokenResponse = await axios.post(`${API_BASE_URL}/auth/google/callback`, {
      code,
      redirect_uri: GOOGLE_REDIRECT_URI
    });

    console.log('Authentication successful!');
    console.log('Tokens:', tokenResponse.data);
    res.send('Authentication successful! You can close this window.');
  } catch (err) {
    console.error('Error exchanging code for tokens:', err.response?.data || err.message);
    res.status(500).send('Authentication failed. Please check the console for details.');
  } finally {
    // Close the server after handling the callback
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  }
});

const server = app.listen(PORT, async () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  
  // Construct the Google OAuth URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', GOOGLE_REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'profile',
    'email'
  ].join(' '));
  authUrl.searchParams.append('access_type', 'offline');
  authUrl.searchParams.append('prompt', 'consent');

  console.log('Opening Google OAuth consent screen in your browser...');
  console.log('If it does not open automatically, visit this URL:');
  console.log(authUrl.toString());
  
  // Open the URL in the default browser
  await open(authUrl.toString());
});
