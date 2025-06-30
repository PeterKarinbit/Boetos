const express = require('express');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { AppDataSource } = require('../data-source');
const User = require('../entities/User');
const jwt = require('jsonwebtoken');

const router = express.Router();
const userRepository = AppDataSource.getRepository(User);

// Ensure environment variables are set
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
  throw new Error('Missing required Google OAuth environment variables');
}

if (!process.env.FRONTEND_URL) {
  throw new Error('Missing FRONTEND_URL environment variable');
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await userRepository.findOne({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

const googleStrategyOptions = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  scope: [
    'profile', 
    'email', 
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ],
  accessType: 'offline', // Request refresh token
  prompt: 'consent', // Force consent screen to get refresh token
  passReqToCallback: true // <-- Enable passing req to callback
};

passport.use(new GoogleStrategy(googleStrategyOptions, async (
  req, accessToken, refreshToken, profile, done
) => {
  try {
    console.log('--- Google OAuth Callback Debug ---');
    console.log('Received profile:', profile.id, profile.displayName, profile.emails?.[0].value);
    console.log('Received Access Token:', accessToken ? 'Present' : 'Missing');
    console.log('Received Refresh Token:', refreshToken ? 'Present' : 'Missing');
    console.log('---------------------------------');

    if (!profile.emails?.[0]?.value) {
      return done(new Error('No email provided by Google'));
    }

    const email = profile.emails[0].value;
    let user = await userRepository.findOne({ where: { email } });
    
    // Get JWT from session (if present)
    const jwtToken = req.session ? req.session.jwt : null;
    let loggedInUserId = null;
    if (jwtToken) {
      try {
        const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET || 'supersecret');
        loggedInUserId = decoded.userId;
      } catch (e) {
        // Invalid token, ignore
      }
    }

    if (user) {
      // Always allow linking/updating Google account, regardless of previous login method
      user.google_id = profile.id;
      user.google_access_token = accessToken;
      if (refreshToken) user.google_refresh_token = refreshToken;
      user = await userRepository.save(user);
      return done(null, user);
    }
    // Create new Google user
    user = userRepository.create({
      email,
      name: profile.displayName || email.split('@')[0],
      google_id: profile.id,
      google_access_token: accessToken,
      google_refresh_token: refreshToken,
    });
    user = await userRepository.save(user);
    return done(null, user);
  } catch (err) {
    console.error('Google OAuth error:', err);
    return done(err, undefined);
  }
}));

// Start OAuth
router.get('/google', (req, res, next) => {
  if (req.query.jwt) {
    req.session.jwt = req.query.jwt; // Store JWT in session
  }
  passport.authenticate('google', {
    scope: [
      'profile', 
      'email', 
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ],
    accessType: 'offline',
    prompt: 'consent'
  })(req, res, next);
});

// Callback
router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
      // Clean up session JWT after use
      if (req.session) req.session.jwt = undefined;
      if (err) {
        console.error('Google callback error:', err);
        return res.redirect(`${process.env.FRONTEND_URL}/calendar?error=${encodeURIComponent(err.message)}`);
      }
      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/calendar?error=Authentication failed`);
      }
      // Directly generate JWT and redirect, assuming frontend handles token
      const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      return res.redirect(`${process.env.FRONTEND_URL}/calendar?token=${token}&success=connected`);
    })(req, res, next);
  }
);

module.exports = router; 