import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy, StrategyOptions } from 'passport-google-oauth20';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';

const router = Router();
const userRepository = AppDataSource.getRepository(User);

// Ensure environment variables are set
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
  throw new Error('Missing required Google OAuth environment variables');
}

if (!process.env.FRONTEND_URL) {
  throw new Error('Missing FRONTEND_URL environment variable');
}

passport.serializeUser((user: any, done: (err: any, id?: any) => void) => done(null, user.id));
passport.deserializeUser(async (id: string, done: (err: any, user?: any) => void) => {
  try {
    const user = await userRepository.findOne({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

interface CustomStrategyOptions extends StrategyOptions {
  accessType?: 'offline' | 'online';
  prompt?: 'consent' | 'select_account';
}

interface GoogleAuthRequestOptions extends passport.AuthenticateOptions {
  accessType?: 'offline' | 'online';
  prompt?: 'consent' | 'select_account';
}

const googleStrategyOptions: CustomStrategyOptions = {
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_CALLBACK_URL!,
  scope: [
    'profile', 
    'email', 
    'https://www.googleapis.com/auth/calendar'
  ],
  accessType: 'offline', // Request refresh token
  prompt: 'consent' // Force consent screen to get refresh token
};

passport.use(new GoogleStrategy(googleStrategyOptions, async (
  accessToken: string,
  refreshToken: string,
  profile: any,
  done: (err: any, user?: any) => void
) => {
  try {
    console.log('--- Google OAuth Callback Debug ---');
    console.log('Received profile:', profile.id, profile.displayName, profile.emails?.[0].value);
    console.log('Received Access Token:', accessToken ? 'Present' : 'Missing');
    console.log('Received Refresh Token:', refreshToken ? 'Present' : 'Missing', refreshToken);
    console.log('---------------------------------');

    if (!profile.emails?.[0]?.value) {
      return done(new Error('No email provided by Google'));
    }

    const email = profile.emails[0].value;
    let user = await userRepository.findOne({ where: { email } });
    
    if (user) {
      if (user.password) {
        return done(new Error('This email is registered with a password. Please use email login.'));
      }
      // Update Google tokens
      user.googleId = profile.id;
      user.googleAccessToken = accessToken;
      if (refreshToken) {
        user.googleRefreshToken = refreshToken;
      }
    } else {
      // Create new Google user
      user = userRepository.create({
        email,
        name: profile.displayName || email.split('@')[0],
        googleId: profile.id,
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken,
      });
      
      // Save the user and wait for the result
      user = await userRepository.save(user);
    }
    
    return done(null, user);
  } catch (err) {
    console.error('Google OAuth error:', err);
    return done(err, undefined);
  }
}));

// Start OAuth
router.get('/google', passport.authenticate('google', {
  scope: [
    'profile', 
    'email', 
    'https://www.googleapis.com/auth/calendar'
  ],
} as GoogleAuthRequestOptions));

// Callback
router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', (err: Error | null, user: any, info: any) => {
      if (err) {
        console.error('Google callback error:', err);
        return res.redirect(`${process.env.FRONTEND_URL}/calendar?error=${encodeURIComponent(err.message)}`);
      }
      
      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/calendar?error=Authentication failed`);
      }
      
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('Login error:', loginErr);
          return res.redirect(`${process.env.FRONTEND_URL}/calendar?error=${encodeURIComponent(loginErr.message)}`);
        }
        return res.redirect(`${process.env.FRONTEND_URL}/calendar?success=connected`);
      });
    })(req, res, next);
  }
);

export default router;