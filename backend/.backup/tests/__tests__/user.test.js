const request = require('supertest');
const { getTestDataSource } = require('../testUtils/setupTestDB');
const { getTestUser, getAuthRequest } = require('../testUtils/testHelpers');
const app = require('../app');

// Test user data
const testUser = {
  email: 'test-user@example.com',
  password: 'test123',
  firstName: 'Test',
  lastName: 'User',
  phone: '1234567890',
  isEmailVerified: true
};

describe('User API', () => {
  let authToken;
  let userId;
  let testUserData;
  let dataSource;

  beforeAll(async () => {
    // Get test data source
    dataSource = getTestDataSource();
    
    // Create a test user and get auth token
    testUserData = await getTestUser(testUser);
    authToken = testUserData.token;
    userId = testUserData.id;
  });

  describe('GET /api/users/me', () => {
    it('should get current user profile', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', userId);
      expect(res.body.email).toBe(testUser.email);
      expect(res.body.firstName).toBe(testUser.firstName);
      expect(res.body.lastName).toBe(testUser.lastName);
      expect(res.body.phone).toBe(testUser.phone);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/me', () => {
    it('should update current user profile', async () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '9876543210'
      };
      
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);
      
      expect(res.status).toBe(200);
      expect(res.body.firstName).toBe(updates.firstName);
      expect(res.body.lastName).toBe(updates.lastName);
      expect(res.body.phone).toBe(updates.phone);
      
      // Verify the update in the database
      const userRepo = dataSource.getRepository('User');
      const updatedUser = await userRepo.findOne({ where: { id: userId } });
      expect(updatedUser.firstName).toBe(updates.firstName);
      expect(updatedUser.lastName).toBe(updates.lastName);
      expect(updatedUser.phone).toBe(updates.phone);
    });

    it('should return 400 for invalid data', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'invalid-email' });
      
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/users/change-password', () => {
    it('should change user password', async () => {
      const passwordData = {
        currentPassword: testUser.password,
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      };
      
      const res = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Password updated successfully');
      
      // Verify password was updated
      const userRepo = dataSource.getRepository('User');
      const user = await userRepo.findOne({ where: { id: userId } });
      const isPasswordValid = await require('bcryptjs').compare(
        passwordData.newPassword,
        user.password
      );
      expect(isPasswordValid).toBe(true);
    });

    it('should return 400 for invalid current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      };
      
      const res = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Current password is incorrect');
    });
  });

  describe('GET /api/users/preferences', () => {
    it('should get user preferences', async () => {
      const res = await request(app)
        .get('/api/users/preferences')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('preferences');
      // Add more specific assertions based on your preferences structure
    });
  });

  describe('PUT /api/users/preferences', () => {
    it('should update user preferences', async () => {
      const preferences = {
        theme: 'dark',
        notifications: {
          email: true,
          push: true,
          inApp: true
        },
        language: 'en'
      };
      
      const res = await request(app)
        .put('/api/user/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ preferences });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.preferences.theme).toBe('dark');
      // Add more assertions based on your preferences structure
    });
  });

  describe('GET /api/user/analytics', () => {
    it('should return user analytics', async () => {
      const res = await request(app)
        .get('/api/user/analytics')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('analytics');
      // Add more specific expectations based on your analytics structure
    });
  });
});
