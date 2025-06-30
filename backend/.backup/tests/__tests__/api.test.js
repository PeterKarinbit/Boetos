jest.setTimeout(30000);

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../app');
const { setupTestDB, teardownTestDB, TEST_USER } = require('../testUtils/setupTestDB');

const LOG_FILE = path.join(__dirname, 'api-test.log');
function logToFile(...args) {
  const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a, null, 2))).join(' ');
  fs.appendFileSync(LOG_FILE, msg + '\n');
}

let token = '';
let session_id = '';

describe('API Integration Tests', () => {
  beforeAll(async () => {
    fs.writeFileSync(LOG_FILE, 'API Integration Test Log\n==========================\n');
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('should login and return a JWT', async () => {
    try {
      const res = await request(app)
        .post('/api/auth/login')
        .send(TEST_USER);
      console.log('Login response:', res.statusCode, res.body);
      logToFile('Login response:', res.statusCode, res.body);
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      token = res.body.token;
    } catch (err) {
      console.error('Login test error:', err);
      logToFile('Login test error:', err);
      throw err;
    }
  }, 15000);

  it('should get calendar events for authenticated user', async () => {
    try {
      const res = await request(app)
        .get('/api/calendar/events')
        .set('Authorization', `Bearer ${token}`);
      console.log('Calendar events response:', res.statusCode, res.body);
      logToFile('Calendar events response:', res.statusCode, res.body);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.events)).toBe(true);
    } catch (err) {
      console.error('Calendar events test error:', err);
      logToFile('Calendar events test error:', err);
      throw err;
    }
  });

  it('should get notifications for authenticated user', async () => {
    try {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);
      console.log('Notifications response:', res.statusCode, res.body);
      logToFile('Notifications response:', res.statusCode, res.body);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.notifications)).toBe(true);
    } catch (err) {
      console.error('Notifications test error:', err);
      logToFile('Notifications test error:', err);
      throw err;
    }
  });

  it('should get chat sessions for authenticated user', async () => {
    try {
      const res = await request(app)
        .get('/api/chat/sessions')
        .set('Authorization', `Bearer ${token}`);
      console.log('Chat sessions response:', res.statusCode, res.body);
      logToFile('Chat sessions response:', res.statusCode, res.body);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.sessions)).toBe(true);
      if (res.body.sessions.length > 0) {
        session_id = res.body.sessions[0].session_id;
      }
    } catch (err) {
      console.error('Chat sessions test error:', err);
      logToFile('Chat sessions test error:', err);
      throw err;
    }
  });

  it('should send a chat message (if session exists)', async () => {
    if (!session_id) {
      console.warn('No session_id available for chat message test. Skipping.');
      logToFile('No session_id available for chat message test. Skipping.');
      return;
    }
    try {
      const res = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Hello, AI!', session_id, sender: 'user' });
      console.log('Send chat message response:', res.statusCode, res.body);
      logToFile('Send chat message response:', res.statusCode, res.body);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBeDefined();
    } catch (err) {
      console.error('Send chat message test error:', err);
      logToFile('Send chat message test error:', err);
      throw err;
    }
  });

  it('should process a voice assistant prompt', async () => {
    try {
      const res = await request(app)
        .post('/api/voice/process')
        .set('Authorization', `Bearer ${token}`)
        .send({ prompt: 'What is the weather today?' });
      console.log('Voice assistant response:', res.statusCode, res.body);
      logToFile('Voice assistant response:', res.statusCode, res.body);
      expect(res.statusCode).toBe(200);
      expect(res.body.text).toBeDefined();
    } catch (err) {
      console.error('Voice assistant test error:', err);
      logToFile('Voice assistant test error:', err);
      throw err;
    }
  });
}); 