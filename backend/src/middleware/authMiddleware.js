const jwt = require('jsonwebtoken');
const { AppDataSource } = require('../data-source');
const User = require('../entities/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const authMiddleware = async (req, res, next) => {
  console.log('authMiddleware called, Authorization header:', req.headers.authorization);
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('authMiddleware: No or invalid Authorization header');
    // Return 401 Unauthorized immediately if no token is provided
    return res.status(401).json({ error: 'No auth credentials found' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded JWT:', decoded);
    
    // Add debug logging for token expiration
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - currentTime;
    console.log(`Token valid until: ${new Date(decoded.exp * 1000).toISOString()}`);
    console.log(`Current time: ${new Date().toISOString()}`);
    console.log(`Time until expiry: ${timeUntilExpiry} seconds`);
    
    const userRepository = AppDataSource.getRepository(User);
    let user;
    try {
      user = await userRepository.findOne({ where: { id: decoded.userId } });
    } catch (dbErr) {
      console.error('authMiddleware: DB error when fetching user:', dbErr);
      return res.status(503).json({ error: 'Database unavailable' });
    }

    if (!user) {
      console.log('authMiddleware: User not found for decoded token');
      return res.status(401).json({ error: 'Invalid token: User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    console.error('JWT Error Type:', err.name);
    
    // Handle specific JWT errors
    if (err.name === 'TokenExpiredError') {
      console.log('authMiddleware: Token expired');
      return res.status(401).json({ error: 'Token expired', needsReauth: true });
    } else if (err.name === 'JsonWebTokenError') {
      console.log('authMiddleware: Invalid token');
      return res.status(401).json({ error: 'Invalid token' });
    } else if (err.name === 'NotBeforeError') {
      console.log('authMiddleware: Token not active yet');
      return res.status(401).json({ error: 'Token not active yet' });
    }
    return res.status(500).json({ error: 'Failed to authenticate token' });
  }
};

module.exports = authMiddleware; 