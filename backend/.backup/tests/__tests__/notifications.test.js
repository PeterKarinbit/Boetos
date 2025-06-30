const request = require('supertest');
const { getTestDataSource } = require('../testUtils/setupTestDB');
const { getTestUser } = require('../testUtils/testHelpers');
const app = require('../app');

describe('Notifications API', () => {
  let authToken;
  let testUser;
  let dataSource;

  beforeAll(async () => {
    // Get test data source
    dataSource = getTestDataSource();
    
    // Create a test user and get auth token
    testUser = await getTestUser({
      email: 'notifications-test@example.com',
      password: 'test123',
      firstName: 'Notifications',
      lastName: 'Test',
      isEmailVerified: true
    });
    authToken = testUser.token;
  });

  describe('GET /api/notifications', () => {
    it('should get all notifications for the user', async () => {
      // First create a test notification
      await request(app)
        .post('/api/notifications/test')
        .set('Authorization', `Bearer ${authToken}`);
      
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('message');
      expect(res.body[0]).toHaveProperty('isRead', false);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/notifications/unread', () => {
    it('should get unread notifications count', async () => {
      // Create some unread notifications
      await request(app)
        .post('/api/notifications/test')
        .set('Authorization', `Bearer ${authToken}`);
      
      const res = await request(app)
        .get('/api/notifications/unread')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('count');
      expect(typeof res.body.count).toBe('number');
      expect(res.body.count).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      // Create some unread notifications first
      await request(app)
        .post('/api/notifications/test')
        .set('Authorization', `Bearer ${authToken}`);
      
      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'All notifications marked as read');
      
      // Verify all notifications are now read
      const notificationsRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);
      
      const allRead = notificationsRes.body.every(n => n.isRead === true);
      expect(allRead).toBe(true);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark a notification as read', async () => {
      // First create a test notification
      const notificationRes = await request(app)
        .post('/api/notifications/test')
        .set('Authorization', `Bearer ${authToken}`);
      
      const notificationId = notificationRes.body.id;
      
      const res = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Notification marked as read');
      
      // Verify the notification is now read
      const getRes = await request(app)
        .get(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(getRes.body.isRead).toBe(true);
    });

    it('should return 404 for non-existent notification', async () => {
      const res = await request(app)
        .put('/api/notifications/9999/read')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete a notification', async () => {
      // First create a test notification
      const notificationRes = await request(app)
        .post('/api/notifications/test')
        .set('Authorization', `Bearer ${authToken}`);
      
      const notificationId = notificationRes.body.id;
      
      // Verify the notification exists
      const getRes = await request(app)
        .get(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(getRes.status).toBe(200);
      
      // Delete the notification
      const res = await request(app)
        .delete(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Notification deleted');
      
      // Verify the notification no longer exists
      const getAfterDelete = await request(app)
        .get(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(getAfterDelete.status).toBe(404);
    });
  });

  describe('PATCH /api/notifications/mark-all-read', () => {
    it('should mark all notifications as read', async () => {
      const res = await request(app)
        .patch('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'All notifications marked as read');
    });
  });

  describe('GET /api/notifications/type/:type', () => {
    it('should return notifications by type', async () => {
      const type = 'info';
      const res = await request(app)
        .get(`/api/notifications/type/${type}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.notifications)).toBe(true);
    });
  });

  describe('GET /api/notifications/recent', () => {
    it('should return recent notifications', async () => {
      const res = await request(app)
        .get('/api/notifications/recent')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.notifications)).toBe(true);
      // Assuming recent returns at most 10 notifications
      expect(res.body.notifications.length).toBeLessThanOrEqual(10);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete a notification', async () => {
      if (!testNotificationId) {
        return; // Skip if no notification was created
      }
      
      const res = await request(app)
        .delete(`/api/notifications/${testNotificationId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Notification deleted');
    });
  });

  describe('DELETE /api/notifications/bulk', () => {
    it('should delete multiple notifications', async () => {
      const res = await request(app)
        .delete('/api/notifications/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ids: [1, 2, 3] // These should be valid notification IDs
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Notifications deleted');
    });
  });

  describe('DELETE /api/notifications/clear', () => {
    it('should clear all notifications', async () => {
      const res = await request(app)
        .delete('/api/notifications/clear')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'All notifications cleared');
    });
  });
});
