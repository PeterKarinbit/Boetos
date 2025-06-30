const express = require('express');
const { AppDataSource } = require('../data-source');
const { Activity } = require('../entities/Activity');
const { User } = require('../entities/User');

const router = express.Router();
const activityRepository = AppDataSource.getRepository(Activity);
const userRepository = AppDataSource.getRepository(User);

// Get all activities for a user
router.get('/', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const activities = await activityRepository.find({
      where: { userId: req.user.id },
      order: { createdAt: 'DESC' }
    });
    res.json(activities);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Create a new activity
router.post('/', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { type, description, metadata } = req.body;

  try {
    const activity = activityRepository.create({
      userId: req.user.id,
      type,
      description,
      metadata
    });

    await activityRepository.save(activity);
    res.status(201).json(activity);
  } catch (err) {
    console.error('Error creating activity:', err);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// Get activity statistics
router.get('/stats', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const stats = await activityRepository
      .createQueryBuilder('activity')
      .select('activity.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('activity.userId = :userId', { userId: req.user.id })
      .groupBy('activity.type')
      .getRawMany();

    res.json(stats);
  } catch (err) {
    console.error('Error fetching activity stats:', err);
    res.status(500).json({ error: 'Failed to fetch activity statistics' });
  }
});

// Get recent activities with pagination
router.get('/recent', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const [activities, total] = await activityRepository.findAndCount({
      where: { userId: req.user.id },
      order: { createdAt: 'DESC' },
      skip,
      take: limit
    });

    res.json({
      activities,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching recent activities:', err);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
});

module.exports = router; 