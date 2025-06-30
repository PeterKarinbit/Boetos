const express = require('express');
const router = express.Router();
const Notification = require('../entities/Notification');
const { AppDataSource } = require('../data-source');
const authMiddleware = require('../middleware/auth');
const { sendPushNotification } = require('../services/onesignalService');
const logger = require('../utils/logger');

// Apply auth middleware to all routes EXCEPT push notifications
router.use((req, res, next) => {
  // Skip auth for push notifications endpoint
  if (req.path === '/push') {
    return next();
  }
  // Apply auth middleware for all other routes
  authMiddleware(req, res, next);
});

// Get all notifications for a user
router.get('/', async (req, res) => {
  try {
    const notificationRepo = AppDataSource.getRepository(Notification);
    
    const notifications = await notificationRepo.find({
      where: { user_id: req.user.id },
      order: { created_at: 'DESC' },
      take: 50 // Limit to 50 most recent notifications
    });

    res.json({
      success: true,
      notifications: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const notificationRepo = AppDataSource.getRepository(Notification);
    
    const count = await notificationRepo.count({
      where: { 
        user_id: req.user.id,
        read: false
      }
    });

    res.json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count'
    });
  }
});

// Mark a notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notificationRepo = AppDataSource.getRepository(Notification);
    const notificationId = req.params.id;

    // Find the notification and ensure it belongs to the user
    const notification = await notificationRepo.findOne({
      where: { 
        id: notificationId,
        user_id: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Mark as read
    notification.read = true;
    await notificationRepo.save(notification);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', async (req, res) => {
  try {
    const notificationRepo = AppDataSource.getRepository(Notification);
    
    await notificationRepo.update(
      { 
        user_id: req.user.id,
        read: false
      },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

// Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const notificationRepo = AppDataSource.getRepository(Notification);
    const notificationId = req.params.id;

    // Find the notification and ensure it belongs to the user
    const notification = await notificationRepo.findOne({
      where: { 
        id: notificationId,
        user_id: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Delete the notification
    await notificationRepo.remove(notification);

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
});

// Get notifications by type
router.get('/type/:type', async (req, res) => {
  try {
    const notificationRepo = AppDataSource.getRepository(Notification);
    const type = req.params.type;
    
    const notifications = await notificationRepo.find({
      where: { 
        user_id: req.user.id,
        type: type
      },
      order: { created_at: 'DESC' },
      take: 20
    });

    res.json({
      success: true,
      notifications: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications by type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications by type'
    });
  }
});

// Get recent notifications (last 7 days)
router.get('/recent', async (req, res) => {
  try {
    const notificationRepo = AppDataSource.getRepository(Notification);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const notifications = await notificationRepo.find({
      where: { 
        user_id: req.user.id,
        created_at: { $gte: sevenDaysAgo }
      },
      order: { created_at: 'DESC' },
      take: 30
    });

    res.json({
      success: true,
      notifications: notifications
    });
  } catch (error) {
    console.error('Error fetching recent notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent notifications'
    });
  }
});

// Create a new notification
router.post('/', async (req, res) => {
  try {
    const { title, message, type, data } = req.body;
    const notificationRepo = AppDataSource.getRepository(Notification);
    
    const notification = notificationRepo.create({
      user_id: req.user.userId,
      title,
      message,
      type,
      data,
      read: false
    });
    
    const savedNotification = await notificationRepo.save(notification);
    res.json(savedNotification);
  } catch (error) {
    logger.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Send a push notification to all users
router.post('/push', async (req, res) => {
  const { message, title, data } = req.body;
  try {
    const result = await sendPushNotification({
      contents: message,
      headings: title,
      included_segments: ['All'],
      data: data || { type: 'general' }
    });
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Error sending push notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// TEST: Trigger a notification for the current user
router.post('/test', async (req, res) => {
  try {
    const notificationRepo = AppDataSource.getRepository(Notification);
    const userId = req.user.id;
    const notification = notificationRepo.create({
      user_id: userId,
      message: 'This is a test notification!',
      read: false,
      type: 'test',
      created_at: new Date()
    });
    await notificationRepo.save(notification);
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ success: false, error: 'Failed to create test notification' });
  }
});

// Bulk delete notifications
router.delete('/bulk', async (req, res) => {
  try {
    const notificationRepo = AppDataSource.getRepository(Notification);
    const userId = req.user.id;
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'No notification IDs provided' });
    }
    await notificationRepo.delete({ user_id: userId, id: ids });
    res.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error('Error bulk deleting notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to bulk delete notifications' });
  }
});

// Clear all notifications for the user
router.delete('/clear', async (req, res) => {
  try {
    const notificationRepo = AppDataSource.getRepository(Notification);
    const userId = req.user.id;
    await notificationRepo.delete({ user_id: userId });
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to clear notifications' });
  }
});

module.exports = router; 