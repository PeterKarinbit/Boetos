const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getTestDataSource } = require('./setupTestDB');
const { TEST_USER } = require('./setupTestDB');
const User = require('@/entities/User');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-123';

/**
 * Generate a test JWT token for a user
 * @param {Object} user - User object
 * @param {number} expiresIn - Token expiration in seconds
 * @returns {string} JWT token
 */
const generateTestToken = (user = {}, expiresIn = '1h') => {
  const payload = {
    userId: user.id || 1,
    email: user.email || TEST_USER.email,
    ...user
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Get an authenticated test user
 * @param {Object} overrides - User properties to override
 * @returns {Promise<Object>} User object with token
 */
const getTestUser = async (overrides = {}) => {
  try {
    const dataSource = getTestDataSource();
    const userRepo = dataSource.getRepository(User);
    
    // Create a new test user with the given overrides
    const userData = {
      ...TEST_USER,
      ...overrides,
      password: await bcrypt.hash(overrides.password || TEST_USER.password, 10),
      isEmailVerified: overrides.isEmailVerified !== undefined ? overrides.isEmailVerified : true,
    };
    
    const user = userRepo.create(userData);
    await userRepo.save(user);
    
    // Generate token
    const token = generateTestToken(user);
    
    // Return user data with token (without password)
    const { password, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, token };
  } catch (error) {
    console.error('Error in getTestUser:', error);
    throw error;
  }
};

/**
 * Get a test request with authentication headers
 * @param {Object} user - User object (optional)
 * @returns {Object} Request object with auth headers
 */
const getAuthRequest = (user = null) => {
  const token = user?.token || generateTestToken(user || TEST_USER);
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

/**
 * Create test data for different entities
 */
const testData = {
  calendarEvent: (overrides = {}) => ({
    title: 'Test Event',
    description: 'Test Description',
    start: new Date().toISOString(),
    end: new Date(Date.now() + 3600000).toISOString(),
    isAllDay: false,
    ...overrides
  }),
  
  notification: (overrides = {}) => ({
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'info',
    isRead: false,
    ...overrides
  }),
  
  mentalHealthCheckIn: (overrides = {}) => ({
    mood: 7,
    stressLevel: 5,
    energyLevel: 6,
    notes: 'Feeling good today',
    ...overrides
  }),
  
  voiceSettings: (overrides = {}) => ({
    voiceId: 'en-US-Wavenet-A',
    speed: 1.0,
    pitch: 0,
    volumeGain: 0,
    ...overrides
  })
};

/**
 * Wait for a specified time (useful for async operations)
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  generateTestToken,
  getTestUser,
  testData,
  wait
};
