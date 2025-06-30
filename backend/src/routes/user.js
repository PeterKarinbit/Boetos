const express = require('express');
const { AppDataSource } = require('../data-source');
const User = require('../entities/User');
const authMiddleware = require('../middleware/authMiddleware');
const CalendarEvent = require('../entities/CalendarEvent');
const BurnoutScore = require('../entities/BurnoutScore');
const MentalHealthCheck = require('../entities/MentalHealthCheck');
const { Between } = require('typeorm');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Middleware to protect all user routes
router.use(authMiddleware);

// GET /api/user/profile
router.get('/profile', async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: req.user.id },
      select: ['id', 'name', 'email', 'googleId', 'createdAt', 'profileImage', 'role', 'company', 'bio', 'onboardingCompleted'],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/user/change-password
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: req.user.id },
      select: ['id', 'password']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has a password (Google users might not have one)
    if (!user.password) {
      return res.status(400).json({ error: 'Password change not available for Google accounts' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedNewPassword;
    await userRepository.save(user);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Failed to change password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/user/analytics - New endpoint for dashboard analytics
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const calendarRepo = AppDataSource.getRepository(CalendarEvent);
    const burnoutRepo = AppDataSource.getRepository(BurnoutScore);
    const mentalHealthRepo = AppDataSource.getRepository(MentalHealthCheck);

    // 1. Meetings this week
    const meetingsThisWeek = await calendarRepo.count({
      where: {
        user_id: userId,
        event_type: 'meeting',
        start_time: Between(startOfWeek, endOfWeek),
      },
    });

    // 2. Focus Time Today
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const focusEventsToday = await calendarRepo.find({
      where: {
        user_id: userId,
        event_type: 'focus',
        start_time: Between(startOfDay, endOfDay),
      },
    });
    const focusTimeToday = focusEventsToday.reduce((total, event) => {
      return total + (new Date(event.end_time).getTime() - new Date(event.start_time).getTime());
    }, 0) / (1000 * 60 * 60); // in hours

    // 3. Burnout Risk (latest)
    const latestBurnoutScore = await burnoutRepo.findOne({
      where: { user_id: userId },
      order: { date: 'DESC' },
    });

    // 4. Energy Level (latest)
    const latestMentalHealthCheck = await mentalHealthRepo.findOne({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
    
    // Note: Productivity Score and growth are complex metrics. 
    // These are placeholders until a proper calculation model is designed.
    const productivityScore = 85; 
    const weeklyGrowth = '+12%';

    res.json({
      meetingsThisWeek,
      productivityScore,
      focusTime: focusTimeToday.toFixed(1) + 'h',
      burnoutRisk: latestBurnoutScore ? (latestBurnoutScore.score > 70 ? 'High' : latestBurnoutScore.score > 40 ? 'Moderate' : 'Low') : 'N/A',
      energyLevel: latestMentalHealthCheck ? latestMentalHealthCheck.energy * 10 : 0, // Assuming energy is 1-10 scale
    });

  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ message: 'Error fetching user analytics' });
  }
});

// GET /api/user/preferences
router.get('/preferences', async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: req.user.id },
      relations: ['preferences']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return default preferences if none exist
    const preferences = user.preferences || {
      notifications: {
        email: true,
        push: true
      },
      theme: 'light'
    };

    res.json(preferences);
  } catch (error) {
    console.error('Failed to fetch user preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/user/preferences
router.put('/preferences', async (req, res) => {
  try {
    const { notifications, theme } = req.body;
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: req.user.id },
      relations: ['preferences']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user preferences
    if (!user.preferences) {
      user.preferences = {};
    }

    if (notifications) {
      user.preferences.notifications = notifications;
    }

    if (theme) {
      user.preferences.theme = theme;
    }

    await userRepository.save(user);

    res.json(user.preferences);
  } catch (error) {
    console.error('Failed to update user preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/user/profile
router.put('/profile', async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user.id } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields (add more as needed)
    const { name, role, company, bio, profileImage } = req.body;
    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (company !== undefined) user.company = company;
    if (bio !== undefined) user.bio = bio;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await userRepository.save(user);

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Failed to update user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router; 