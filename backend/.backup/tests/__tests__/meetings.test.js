const request = require('supertest');
const { setupTestDB, teardownTestDB } = require('../testUtils/setupTestDB');
const { getTestUser, testData } = require('../testUtils/testHelpers');
const app = require('../app');

describe('Meetings API Endpoints', () => {
  let authToken;
  let testUser;
  let meetingId;

  beforeAll(async () => {
    await setupTestDB();
    const userData = await getTestUser();
    testUser = userData;
    authToken = userData.token;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  // Helper function to create a test meeting
  const createTestMeeting = async (overrides = {}) => {
    const defaultMeeting = {
      title: 'Test Meeting',
      description: 'This is a test meeting',
      startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      endTime: new Date(Date.now() + 7200000).toISOString(),   // 2 hours from now
      location: 'Test Location',
      isOnline: false,
      status: 'scheduled',
      ...overrides
    };

    const res = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${authToken}`)
      .send(defaultMeeting);

    return res;
  };

  describe('POST /api/meetings', () => {
    it('should create a new meeting', async () => {
      const meetingData = {
        title: 'Team Standup',
        description: 'Daily team standup meeting',
        startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        endTime: new Date(Date.now() + 7200000).toISOString(),   // 2 hours from now
        location: 'Conference Room A',
        isOnline: false,
        status: 'scheduled'
      };

      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(meetingData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe(meetingData.title);
      expect(res.body.description).toBe(meetingData.description);
      expect(new Date(res.body.startTime).toISOString()).toBe(meetingData.startTime);
      expect(new Date(res.body.endTime).toISOString()).toBe(meetingData.endTime);
      
      // Save the ID for later tests
      meetingId = res.body.id;
    });

    it('should return 400 for invalid meeting data', async () => {
      const invalidMeeting = {
        // Missing required fields
        title: 'Invalid Meeting',
        startTime: 'invalid-date',
        endTime: 'invalid-date'
      };

      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidMeeting);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/meetings', () => {
    beforeAll(async () => {
      // Create a few test meetings
      await createTestMeeting({ title: 'Meeting 1' });
      await createTestMeeting({ title: 'Meeting 2' });
      await createTestMeeting({ title: 'Meeting 3' });
    });

    it('should retrieve all meetings', async () => {
      const res = await request(app)
        .get('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.meetings)).toBe(true);
      expect(res.body.meetings.length).toBeGreaterThanOrEqual(3);
      
      // Check that each meeting has required fields
      res.body.meetings.forEach(meeting => {
        expect(meeting).toHaveProperty('id');
        expect(meeting).toHaveProperty('title');
        expect(meeting).toHaveProperty('startTime');
        expect(meeting).toHaveProperty('endTime');
      });
    });

    it('should filter meetings by status', async () => {
      const res = await request(app)
        .get('/api/meetings')
        .query({ status: 'scheduled' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.meetings)).toBe(true);
      
      // All returned meetings should have the requested status
      res.body.meetings.forEach(meeting => {
        expect(meeting.status).toBe('scheduled');
      });
    });
  });

  describe('GET /api/meetings/:id', () => {
    it('should retrieve a specific meeting', async () => {
      if (!meetingId) {
        // If no meeting was created in previous tests, create one
        const res = await createTestMeeting();
        meetingId = res.body.id;
      }
      
      const res = await request(app)
        .get(`/api/meetings/${meetingId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(meetingId);
      expect(res.body).toHaveProperty('title');
      expect(res.body).toHaveProperty('description');
      expect(res.body).toHaveProperty('startTime');
      expect(res.body).toHaveProperty('endTime');
      expect(res.body).toHaveProperty('location');
      expect(res.body).toHaveProperty('isOnline');
      expect(res.body).toHaveProperty('status');
    });

    it('should return 404 for non-existent meeting', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/meetings/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/meetings/:id', () => {
    it('should update a meeting', async () => {
      if (!meetingId) {
        // If no meeting was created in previous tests, create one
        const res = await createTestMeeting();
        meetingId = res.body.id;
      }
      
      const updateData = {
        title: 'Updated Meeting Title',
        description: 'This meeting has been updated',
        location: 'New Location',
        status: 'in_progress'
      };
      
      const res = await request(app)
        .put(`/api/meetings/${meetingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe(updateData.title);
      expect(res.body.description).toBe(updateData.description);
      expect(res.body.location).toBe(updateData.location);
      expect(res.body.status).toBe(updateData.status);
    });
  });

  describe('DELETE /api/meetings/:id', () => {
    it('should delete a meeting', async () => {
      if (!meetingId) {
        // If no meeting was created in previous tests, create one
        const res = await createTestMeeting();
        meetingId = res.body.id;
      }
      
      const res = await request(app)
        .delete(`/api/meetings/${meetingId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Meeting deleted successfully');
      
      // Verify the meeting no longer exists
      const getRes = await request(app)
        .get(`/api/meetings/${meetingId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(getRes.statusCode).toBe(404);
    });
  });

  describe('GET /api/meetings/upcoming', () => {
    beforeAll(async () => {
      // Create some upcoming meetings
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 3600000);
      const twoHoursLater = new Date(now.getTime() + 7200000);
      const threeHoursLater = new Date(now.getTime() + 10800000);
      
      await createTestMeeting({
        title: 'Upcoming Meeting 1',
        startTime: oneHourLater.toISOString(),
        endTime: new Date(oneHourLater.getTime() + 1800000).toISOString()
      });
      
      await createTestMeeting({
        title: 'Upcoming Meeting 2',
        startTime: twoHoursLater.toISOString(),
        endTime: new Date(twoHoursLater.getTime() + 1800000).toISOString()
      });
      
      await createTestMeeting({
        title: 'Upcoming Meeting 3',
        startTime: threeHoursLater.toISOString(),
        endTime: new Date(threeHoursLater.getTime() + 1800000).toISOString()
      });
    });

    it('should retrieve upcoming meetings', async () => {
      const res = await request(app)
        .get('/api/meetings/upcoming')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.meetings)).toBe(true);
      
      // Verify that all returned meetings are in the future
      const now = new Date();
      res.body.meetings.forEach(meeting => {
        expect(new Date(meeting.startTime).getTime()).toBeGreaterThan(now.getTime());
      });
    });

    it('should limit the number of upcoming meetings when limit is specified', async () => {
      const limit = 2;
      const res = await request(app)
        .get('/api/meetings/upcoming')
        .query({ limit })
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.meetings)).toBe(true);
      expect(res.body.meetings.length).toBeLessThanOrEqual(limit);
    });
  });
});
