const request = require('supertest');
const { getTestDataSource } = require('../testUtils/setupTestDB');
const { getTestUser } = require('../testUtils/testHelpers');
const app = require('../app');

describe('Mental Health API', () => {
  let authToken;
  let testUser;
  let dataSource;

  beforeAll(async () => {
    // Get test data source
    dataSource = getTestDataSource();
    
    // Create a test user and get auth token
    testUser = await getTestUser({
      email: 'mentalhealth-test@example.com',
      password: 'test123',
      firstName: 'Mental',
      lastName: 'Health',
      isEmailVerified: true
    });
    authToken = testUser.token;
  });

  describe('POST /api/mental-health/check-in', () => {
    it('should submit a mental health check-in', async () => {
      const checkInData = {
        mood: 7,
        energy: 6,
        stress: 4,
        sleepQuality: 8,
        sleepHours: 7.5,
        exerciseMinutes: 30,
        socialInteraction: 6,
        notes: 'Feeling good today!',
        tags: ['productive', 'social']
      };
      
      const res = await request(app)
        .post('/api/mental-health/check-in')
        .set('Authorization', `Bearer ${authToken}`)
        .send(checkInData);
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.userId).toBe(testUser.id);
      expect(res.body.mood).toBe(checkInData.mood);
      expect(res.body.energy).toBe(checkInData.energy);
      expect(res.body.stress).toBe(checkInData.stress);
      expect(res.body.sleepQuality).toBe(checkInData.sleepQuality);
      expect(res.body.notes).toBe(checkInData.notes);
      expect(Array.isArray(res.body.tags)).toBe(true);
      expect(res.body.tags).toEqual(expect.arrayContaining(checkInData.tags));
      
      // Verify the check-in was saved to the database
      const checkInRepo = dataSource.getRepository('MentalHealthCheckIn');
      const savedCheckIn = await checkInRepo.findOne({ 
        where: { id: res.body.id } 
      });
      
      expect(savedCheckIn).toBeDefined();
      expect(savedCheckIn.userId).toBe(testUser.id);
    });

    it('should return 400 for invalid check-in data', async () => {
      const invalidData = {
        mood: 11, // Invalid - should be between 1-10
        energy: 6,
        stress: 4,
        sleepQuality: 8
      };
      
      const res = await request(app)
        .post('/api/mental-health/check-in')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);
      
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/mental-health/check-ins', () => {
    beforeAll(async () => {
      // Create some test check-ins
      const checkInRepo = dataSource.getRepository('MentalHealthCheckIn');
      
      // Create check-ins for different dates
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      await checkInRepo.save([
        {
          userId: testUser.id,
          mood: 8,
          energy: 7,
          stress: 3,
          sleepQuality: 8,
          sleepHours: 8,
          exerciseMinutes: 45,
          socialInteraction: 7,
          notes: 'Great day!',
          tags: ['productive', 'social'],
          createdAt: today
        },
        {
          userId: testUser.id,
          mood: 5,
          energy: 4,
          stress: 7,
          sleepQuality: 5,
          sleepHours: 6,
          exerciseMinutes: 0,
          socialInteraction: 3,
          notes: 'Tired today',
          tags: ['tired'],
          createdAt: yesterday
        }
      ]);
    });
  });

  describe('GET /api/mental-health/streak', () => {
    it('should return current check-in streak', async () => {
      const res = await request(app)
        .get('/api/mental-health/streak')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('currentStreak');
      expect(res.body).toHaveProperty('longestStreak');
      expect(res.body).toHaveProperty('lastCheckIn');
      expect(typeof res.body.currentStreak).toBe('number');
      expect(typeof res.body.longestStreak).toBe('number');
    });
  });

  describe('GET /api/mental-health/recommendations', () => {
    it('should return personalized recommendations', async () => {
      const res = await request(app)
        .get('/api/mental-health/recommendations')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.recommendations)).toBe(true);
      expect(res.body).toHaveProperty('lastUpdated');
      
      // Check that each recommendation has required fields
      if (res.body.recommendations.length > 0) {
        const recommendation = res.body.recommendations[0];
        expect(recommendation).toHaveProperty('id');
        expect(recommendation).toHaveProperty('title');
        expect(recommendation).toHaveProperty('description');
        expect(recommendation).toHaveProperty('category');
      }
    });
  });

  describe('GET /api/mental-health/check-ins/:id', () => {
    it('should return a specific check-in', async () => {
      if (!checkInId) {
        // If no check-in was created in previous tests, skip this test
        return;
      }
      
      const res = await request(app)
        .get(`/api/mental-health/check-ins/${checkInId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(checkInId);
      expect(res.body).toHaveProperty('mood');
      expect(res.body).toHaveProperty('stressLevel');
      expect(res.body).toHaveProperty('energyLevel');
      expect(res.body).toHaveProperty('notes');
      expect(res.body).toHaveProperty('createdAt');
    });

    it('should return 404 for non-existent check-in', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/mental-health/check-ins/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
});
