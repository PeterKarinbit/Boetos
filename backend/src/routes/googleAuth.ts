import express from 'express';
import type { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../entities/User.js';
import { initializeDataSource } from '../data-source.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL!;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://boetos.netlify.app';

const oauth2Client = new OAuth2Client({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: CALLBACK_URL,
});

// Step 1: Redirect to Google for login
router.get('/login', (req: Request, res: Response) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'profile',
      'email',
      'openid',
    ],
    prompt: 'consent',
  });
  res.redirect(url);
});

// Step 2: Google callback
router.get('/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).json({ error: 'Missing code' });
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    // Get user info
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(400).json({ error: 'No email from Google' });
    // DB: Find or create user
    const ds = await initializeDataSource();
    const userRepo = ds.getRepository(User);
    let user = await userRepo.findOne({ where: { email: payload.email } });
    if (!user) {
      user = userRepo.create({
        email: payload.email ?? undefined,
        name: payload.name ?? undefined,
        google_id: payload.sub,
        profileImage: payload.picture,
        email_verified: !!payload.email_verified,
      });
    } else {
      user.google_id = payload.sub;
      user.name = payload.name ?? undefined;
      user.profileImage = payload.picture;
      user.email_verified = !!payload.email_verified;
    }
    user.google_access_token = tokens.access_token === null || tokens.access_token === undefined ? undefined : tokens.access_token;
    user.google_refresh_token = tokens.refresh_token === null || tokens.refresh_token === undefined ? undefined : tokens.refresh_token;
    await userRepo.save(user);
    // Issue JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    // Redirect to frontend with token
    res.redirect(`${FRONTEND_URL}/pages/auth/callback?token=${token}`);
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.status(500).json({ error: 'Google OAuth failed' });
  }
});

export default router; 