import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const userRepository = AppDataSource.getRepository(User);

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, profileImage, avatar, preferences } = req.body;
  try {
    const existing = await userRepository.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = userRepository.create({
      name,
      email,
      password: hashedPassword,
      profileImage,
      avatar,
      preferences,
    });
    await userRepository.save(user);
    res.status(201).json({ message: 'User registered', user: { ...user, password: undefined } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userRepository.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password as string, user.password as string);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { ...user, password: undefined } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current authenticated user
router.get('/me', (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

export default router; 