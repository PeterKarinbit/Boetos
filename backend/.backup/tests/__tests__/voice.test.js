const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { getTestDataSource } = require('../testUtils/setupTestDB');
const { getTestUser } = require('../testUtils/testHelpers');
const app = require('../app');

describe('Voice API Endpoints', () => {
  let authToken;
  let testUser;
  let dataSource;
  let testSessionId;

  beforeAll(async () => {
    // Get test data source
    dataSource = getTestDataSource();
    
    // Create a test user and get auth token
    testUser = await getTestUser({
      email: 'voice-test@example.com',
      password: 'test123',
      firstName: 'Voice',
      lastName: 'Test',
      isEmailVerified: true
    });
    authToken = testUser.token;
  });

  describe('POST /api/voice/process', () => {
    it('should process voice command', async () => {
      const command = 'What is the weather like today?';
      
      const res = await request(app)
        .post('/api/voice/process')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ prompt: command });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('text');
      expect(typeof res.body.text).toBe('string');
    });

    it('should return 400 if no prompt is provided', async () => {
      const res = await request(app)
        .post('/api/voice/process')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/voice/voices', () => {
    it('should return available voices', async () => {
      const res = await request(app)
        .get('/api/voice/voices')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.voices)).toBe(true);
      expect(res.body.voices.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/voice/settings', () => {
    it('should update voice settings', async () => {
      const settings = {
        voiceId: 'en-US-Wavenet-B',
        speed: 1.2
      };
      
      const res = await request(app)
        .put('/api/voice/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(settings);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.voiceId).toBe(settings.voiceId);
      expect(res.body.speed).toBe(settings.speed);
    });
  });

  describe('POST /api/voice/transcribe', () => {
    it('should transcribe audio file', async () => {
      // Create a mock audio file
      const audioPath = path.join(__dirname, 'test-audio.wav');
      fs.writeFileSync(audioPath, 'mock audio content');
      
      try {
        const res = await request(app)
          .post('/api/voice/transcribe')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('audio', audioPath);
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('text');
      } finally {
        // Clean up the test file
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
        }
      }
    });

    it('should return 400 if no audio file is provided', async () => {
      const res = await request(app)
        .post('/api/voice/transcribe')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/voice/text-to-speech', () => {
    it('should convert text to speech', async () => {
      const text = 'Hello, this is a test';
      
      const res = await request(app)
        .post('/api/voice/text-to-speech')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('audio');
      expect(res.body).toHaveProperty('audioContentType');
      expect(res.body.audio).toBeDefined();
    });

    it('should return 400 if no text is provided', async () => {
      const res = await request(app)
        .post('/api/voice/text-to-speech')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/voice/commands', () => {
    it('should return available voice commands', async () => {
      const res = await request(app)
        .get('/api/voice/commands')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.commands)).toBe(true);
      expect(res.body.commands.length).toBeGreaterThan(0);
    });
  });
});
