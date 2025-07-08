import express from 'express';
import type { Request, Response } from 'express';
import { AppDataSource } from '../data-source.js';
import { User } from '../entities/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Auth endpoint (to be implemented)' });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  try {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }
    if (!user.password) {
      return res.status(401).json({ error: 'This account does not have a password set. Please use Google login or reset your password.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }
    if (!user.email_verified) {
      return res.status(403).json({ error: 'Email not verified. Please check your inbox for a verification link.' });
    }
    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'changeme',
      { expiresIn: '7d' }
    );
    // Return user info (omit password)
    const { password: _, ...userInfo } = user;
    return res.json({ token, user: userInfo });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  try {
    const userRepo = AppDataSource.getRepository(User);
    const existing = await userRepo.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email is already in use.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = userRepo.create({
      name,
      email,
      password: hashedPassword,
      email_verified: true // For testing, allow immediate login
    });
    await userRepo.save(user);
    return res.status(201).json({ message: 'Registration successful. You can now log in.' });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;