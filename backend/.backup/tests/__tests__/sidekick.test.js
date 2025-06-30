const request = require('supertest');
const { setupTestDB, teardownTestDB } = require('../testUtils/setupTestDB');
const { getTestUser } = require('../testUtils/testHelpers');
const app = require('../app');

describe('Sidekick API Endpoints', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await setupTestDB();
    const userData = await getTestUser();
    testUser = userData;
    authToken = userData.token;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('POST /api/sidekick/event', () => {
    it('should process a calendar event', async () => {
      const eventData = {
        type: 'meeting',
        title: 'Team Sync',
        startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        endTime: new Date(Date.now() + 7200000).toISOString(),   // 2 hours from now
        attendees: ['team@example.com'],
        description: 'Team sync meeting to discuss progress'
      };
      
      const res = await request(app)
        .post('/api/sidekick/event')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('event');
      expect(res.body.event).toHaveProperty('id');
      expect(res.body.event.title).toBe(eventData.title);
      expect(res.body.event.type).toBe(eventData.type);
    });

    it('should return 400 for invalid event data', async () => {
      const invalidEvent = {
        // Missing required fields
        title: 'Invalid Event',
        startTime: 'invalid-date'
      };
      
      const res = await request(app)
        .post('/api/sidekick/event')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEvent);
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/sidekick/overwhelmed', () => {
    it('should handle overwhelmed state', async () => {
      const overwhelmedData = {
        reason: 'Too many meetings',
        currentStressLevel: 8,
        currentTasks: [
          { id: 'task1', title: 'Finish report', due: new Date().toISOString() },
          { id: 'task2', title: 'Prepare presentation', due: new Date().toISOString() }
        ]
      };
      
      const res = await request(app)
        .post('/api/sidekick/overwhelmed')
        .set('Authorization', `Bearer ${authToken}`)
        .send(overwhelmedData);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('suggestions');
      expect(Array.isArray(res.body.suggestions)).toBe(true);
      expect(res.body).toHaveProperty('message');
      
      // Verify that suggestions are provided
      expect(res.body.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle minimal overwhelmed data', async () => {
      const minimalData = {
        reason: 'Feeling overwhelmed',
        currentStressLevel: 5
      };
      
      const res = await request(app)
        .post('/api/sidekick/overwhelmed')
        .set('Authorization', `Bearer ${authToken}`)
        .send(minimalData);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('suggestions');
      expect(Array.isArray(res.body.suggestions)).toBe(true);
    });
  });

  describe('POST /api/sidekick/analyze', () => {
    it('should analyze productivity data', async () => {
      const analysisData = {
        timeRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          end: new Date().toISOString()
        },
        metrics: ['productivity', 'focus', 'energy'],
        includeSuggestions: true
      };
      
      const res = await request(app)
        .post('/api/sidekick/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(analysisData);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('analysis');
      expect(res.body).toHaveProperty('metrics');
      expect(res.body).toHaveProperty('suggestions');
      
      // Verify metrics structure
      expect(Array.isArray(res.body.metrics)).toBe(true);
      
      // Verify suggestions if included
      if (analysisData.includeSuggestions) {
        expect(Array.isArray(res.body.suggestions)).toBe(true);
      }
    });
  });

  describe('GET /api/sidekick/insights', () => {
    it('should provide productivity insights', async () => {
      const res = await request(app)
        .get('/api/sidekick/insights')
        .query({
          period: 'week',
          includeTrends: 'true'
        })
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('insights');
      expect(res.body).toHaveProperty('period');
      expect(res.body).toHaveProperty('metrics');
      
      // Verify insights structure
      expect(Array.isArray(res.body.insights)).toBe(true);
      
      // Verify metrics structure
      expect(typeof res.body.metrics).toBe('object');
      
      // If trends are included, verify them
      if (res.body.includeTrends) {
        expect(res.body).toHaveProperty('trends');
        expect(Array.isArray(res.body.trends)).toBe(true);
      }
    });
  });

  describe('POST /api/sidekick/reminder', () => {
    it('should create a reminder', async () => {
      const reminderData = {
        title: 'Take a break',
        message: 'You have been working for 50 minutes. Time to take a short break!',
        time: new Date(Date.now() + 3000000).toISOString(), // 50 minutes from now
        type: 'break_reminder',
        priority: 'medium'
      };
      
      const res = await request(app)
        .post('/api/sidekick/reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reminderData);
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe(reminderData.title);
      expect(res.body.message).toBe(reminderData.message);
      expect(res.body.type).toBe(reminderData.type);
      expect(res.body.status).toBe('scheduled');
    });
  });
});
