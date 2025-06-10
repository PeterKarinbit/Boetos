import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import { Request, Response } from 'express';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const userRepository = AppDataSource.getRepository(User);

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  profileImage?: string;
  avatar?: string;
  preferences?: any;
}

interface LoginRequest {
  email: string;
  password: string;
}

// Register
router.post('/register', async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  const { name, email, password, profileImage, avatar, preferences } = req.body;
  try {
    const existing = await userRepository.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = userRepository.create({
      name,
      email,
      password: hashedPassword,
      profileImage,
      avatar,
      preferences,
    });

    const savedUser = await userRepository.save(user);
    res.status(201).json({ 
      message: 'User registered successfully', 
      user: { 
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        profileImage: savedUser.profileImage,
        avatar: savedUser.avatar,
        preferences: savedUser.preferences,
        createdAt: savedUser.createdAt
      } 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await userRepository.findOne({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ 
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        avatar: user.avatar,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current authenticated user
router.get('/me', (req: Request, res: Response) => {
  if (req.user) {
    const user = req.user as User;
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      avatar: user.avatar,
      preferences: user.preferences,
      createdAt: user.createdAt
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

export default router; 