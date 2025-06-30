const express = require('express');
const { AppDataSource } = require('../data-source');
const { Meeting } = require('../entities/Meeting');
const { User } = require('../entities/User');
const { google } = require('googleapis');

const router = express.Router();
const meetingRepository = AppDataSource.getRepository(Meeting);
const userRepository = AppDataSource.getRepository(User);

// Get all meetings for a user
router.get('/', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const meetings = await meetingRepository.find({
      where: { userId: req.user.id },
      order: { startTime: 'DESC' }
    });
    res.json(meetings);
  } catch (err) {
    console.error('Error fetching meetings:', err);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Create a new meeting
router.post('/', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { title, description, startTime, endTime, participants, googleCalendarEventId } = req.body;

  try {
    const meeting = meetingRepository.create({
      userId: req.user.id,
      title,
      description,
      startTime,
      endTime,
      participants,
      googleCalendarEventId
    });

    await meetingRepository.save(meeting);
    res.status(201).json(meeting);
  } catch (err) {
    console.error('Error creating meeting:', err);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// Get meeting by ID
router.get('/:id', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const meeting = await meetingRepository.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json(meeting);
  } catch (err) {
    console.error('Error fetching meeting:', err);
    res.status(500).json({ error: 'Failed to fetch meeting' });
  }
});

// Update meeting
router.put('/:id', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const meeting = await meetingRepository.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const { title, description, startTime, endTime, participants, googleCalendarEventId } = req.body;

    meeting.title = title || meeting.title;
    meeting.description = description || meeting.description;
    meeting.startTime = startTime || meeting.startTime;
    meeting.endTime = endTime || meeting.endTime;
    meeting.participants = participants || meeting.participants;
    meeting.googleCalendarEventId = googleCalendarEventId || meeting.googleCalendarEventId;

    await meetingRepository.save(meeting);
    res.json(meeting);
  } catch (err) {
    console.error('Error updating meeting:', err);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

// Delete meeting
router.delete('/:id', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const meeting = await meetingRepository.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    await meetingRepository.remove(meeting);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting meeting:', err);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// Get upcoming meetings
router.get('/upcoming', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const now = new Date();
    const meetings = await meetingRepository.find({
      where: {
        userId: req.user.id,
        startTime: { $gte: now }
      },
      order: { startTime: 'ASC' }
    });
    res.json(meetings);
  } catch (err) {
    console.error('Error fetching upcoming meetings:', err);
    res.status(500).json({ error: 'Failed to fetch upcoming meetings' });
  }
});

module.exports = router; 