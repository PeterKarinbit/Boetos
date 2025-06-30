const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { AppDataSource, initializeDataSource, checkConnection } = require('../data-source');
const User = require('../entities/User');
// Import with proper type checking
const UserVoiceSettings = require('../entities/UserVoiceSettings');
const EmailService = require('../services/emailService');
const config = require('../config');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

let userRepository;
let userVoiceSettingsRepository;

// Initialize the repositories
const initRepositories = async () => {
  try {
    const dataSource = await initializeDataSource();
    userRepository = dataSource.getRepository(User);
    userVoiceSettingsRepository = dataSource.getRepository(UserVoiceSettings);
  } catch (error) {
    console.error('Failed to initialize repositories:', error);
    throw error;
  }
};

// Initialize repositories when the module loads
initRepositories().catch(console.error);

// Helper function to generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper function to prepare user data for response
const prepareUserResponse = (user) => {
  if (!user) return null;

  const response = {
    id: user.id,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage,
    avatar: user.avatar,
    preferences: user.preferences,
    onboardingCompleted: user.onboardingCompleted,
    onboardingData: user.onboardingData,
    emailVerified: user.email_verified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  // Include voice settings if available
  if (user.voiceSettings) {
    response.voiceSettings = user.voiceSettings;
  }

  return response;
};

// Register
router.post('/register', async (req, res) => {
  try {
    if (!userRepository || !userVoiceSettingsRepository) {
      await initRepositories();
    }
    // Debug log for repositories
    console.log('[DEBUG] userRepository:', !!userRepository);
    console.log('[DEBUG] userVoiceSettingsRepository:', !!userVoiceSettingsRepository);
    if (!userVoiceSettingsRepository) {
      console.error('[ERROR] userVoiceSettingsRepository is undefined after initRepositories');
      return res.status(500).json({ error: 'Server misconfiguration: userVoiceSettingsRepository is undefined' });
    }

    const { name, email, password, profileImage, avatar, preferences } = req.body;

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    let user = userRepository.create({
      name,
      email,
      password: hashedPassword,
      profileImage,
      avatar,
      preferences,
      onboardingCompleted: false,
      onboardingData: null,
      email_verified: false,
      email_verification_token: verificationToken,
      email_verification_expires: verificationExpires,
    });

    // Save user
    user = await userRepository.save(user);

    // Create default voice settings for the new user
    const defaultVoiceSettings = userVoiceSettingsRepository.create({
      user_id: user.id,
      voice_enabled: false,
      voice_model: 'eleven_monolingual_v1',
    });
    await userVoiceSettingsRepository.save(defaultVoiceSettings);

    // Associate voice settings with the user
    user.voiceSettings = defaultVoiceSettings;

    // Send verification email
    try {
      await EmailService.sendVerificationEmail(email, name, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails, but log it
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // Return user data and token
    res.status(201).json({
      token,
      user: prepareUserResponse(user),
      message: 'Registration successful! Please check your email to verify your account.'
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    if (!userRepository) {
      await initRepositories();
    }

    // Find user with this token
    const user = await userRepository.findOne({
      where: { email_verification_token: token }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    // Check if token is expired
    if (user.email_verification_expires < new Date()) {
      return res.status(400).json({ error: 'Verification token has expired' });
    }

    // Verify the user
    user.email_verified = true;
    user.email_verification_token = null;
    user.email_verification_expires = null;
    await userRepository.save(user);

    // Send welcome email
    try {
      await EmailService.sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail verification if email fails
    }

    // Redirect to frontend with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/verify-email-success`);
  } catch (err) {
    console.error('Email verification error:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/verify-email-error`);
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    console.log('Auth: Resend verification endpoint called');
    console.log('Auth: Request body:', req.body);
    
    const { email } = req.body;

    if (!email) {
      console.log('Auth: Email is missing from request');
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Auth: Looking for user with email:', email);

    if (!userRepository) {
      await initRepositories();
    }

    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      console.log('Auth: User not found for email:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Auth: User found:', { id: user.id, name: user.name, email_verified: user.email_verified });

    if (user.email_verified) {
      console.log('Auth: Email is already verified');
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    console.log('Auth: Generated new verification token:', verificationToken);

    // Update user with new token
    user.email_verification_token = verificationToken;
    user.email_verification_expires = verificationExpires;
    await userRepository.save(user);

    console.log('Auth: User updated with new token, now sending email');

    // Send verification email
    await EmailService.sendVerificationEmail(email, user.name, verificationToken);

    console.log('Auth: Email sent successfully');
    res.json({ message: 'Verification email sent successfully' });
  } catch (err) {
    console.error('Auth: Resend verification error:', err);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// Login
router.post('/login', async (req, res) => {
  console.log('Login attempt started');
  try {
    console.log('Checking database connection...');
    // Ensure data source is initialized and connection is healthy
    if (!(await checkConnection())) {
      console.warn('Connection lost. Attempting to reconnect...');
      await initializeDataSource();
      if (!(await checkConnection())) {
        console.error('Database connection failed after reconnection attempt');
        return res.status(503).json({ error: 'Database connection failed' });
      }
    }

    if (!userRepository) {
      console.log('Initializing repositories...');
      await initRepositories();
    }

    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('Looking for user in database...');
    const user = await userRepository.findOne({
      where: { email },
      relations: ['voiceSettings']
    });

    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.password) {
      console.log('User found but has no password (possibly OAuth user)');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('User found, comparing passwords...');
    console.log('Input password length:', password.length);
    console.log('Stored password hash:', user.password ? `${user.password.substring(0, 10)}...` : 'null');
    
    try {
      const valid = await bcrypt.compare(password, user.password);
      console.log('Password comparison result:', valid);
      
      if (!valid) {
        console.log('Password comparison failed - incorrect password');
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (compareError) {
      console.error('Error during password comparison:', compareError);
      return res.status(500).json({ error: 'Error during authentication' });
    }

    console.log('Password valid, generating token...');
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    const userResponse = prepareUserResponse(user);
    
    // Add warning if email is not verified
    if (!user.email_verified) {
      console.log('User email not verified');
      userResponse.warning = 'Please verify your email to unlock all features';
    }
    
    console.log('Login successful');
    res.json({
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current authenticated user
router.get('/me', async (req, res) => {
  try {
    if (!userRepository) {
      await initRepositories();
    }

    // Check for JWT in Authorization header
    const authHeader = req.headers['authorization'];
    console.log('[DEBUG] /me Authorization header:', authHeader); // Debug log
    let userId;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('[DEBUG] /me token:', token); // Debug log
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('[DEBUG] /me decoded token:', decoded); // Debug log
        userId = decoded.userId;
      } catch (err) {
        console.error('[DEBUG] /me JWT error:', err);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    } else if (req.user) {
      // Fallback to session user
      userId = req.user.id;
    }

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['voiceSettings']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(prepareUserResponse(user));
  } catch (err) {
    console.error('Failed to fetch user info:', err);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

// Refresh token route
router.post('/refresh', async (req, res) => {
  try {
    if (!userRepository) {
      await initRepositories();
    }

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await userRepository.findOne({
        where: { id: decoded.userId },
        relations: ['voiceSettings']
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Generate new token
      const newToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({
        token: newToken,
        user: prepareUserResponse(user),
      });
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', needsReauth: true });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

module.exports = router; 