const express = require('express');
const { AppDataSource } = require('../data-source');
const MemoryEntry = require('../entities/MemoryEntry');
const authMiddleware = require('../middleware/authMiddleware');
const ChatMessage = require('../entities/ChatMessage');

const router = express.Router();
const memoryRepository = AppDataSource.getRepository(MemoryEntry);
const chatMessageRepo = AppDataSource.getRepository(ChatMessage);

// Catch-all log for debugging
router.use((req, res, next) => {
  console.log('Memory router received:', req.method, req.originalUrl);
  next();
});

// Add memory entry
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { content, type, nudgePreference, snoozedUntil } = req.body;
    const entry = memoryRepository.create({
      user_id: userId,
      content,
      type,
      nudgePreference,
      snoozedUntil,
    });
    await memoryRepository.save(entry);
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add memory entry', details: error.message });
  }
});

// List all (non-archived) entries
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const entries = await memoryRepository.find({
      where: { user_id: userId, isArchived: false },
      order: { createdAt: 'DESC' },
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch memory entries', details: error.message });
  }
});

// Update (mark as done, snooze, archive)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;
    let entry = await memoryRepository.findOne({ where: { id, user_id: userId } });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    Object.assign(entry, updates);
    await memoryRepository.save(entry);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update memory entry', details: error.message });
  }
});

// Hard delete
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const entry = await memoryRepository.findOne({ where: { id, user_id: userId } });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    await memoryRepository.remove(entry);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete memory entry', details: error.message });
  }
});

// Get all chat messages for the authenticated user (optionally filter by session)
router.get('/chat', authMiddleware, async (req, res) => {
  try {
    const { session_id } = req.query;
    const where = { user_id: req.user.id };
    if (session_id) where.session_id = session_id;
    const messages = await chatMessageRepo.find({
      where,
      order: { created_at: 'ASC' },
    });
    res.json(messages);
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// Post a new chat message
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { content, sender, session_id } = req.body;
    if (!content || !sender) {
      return res.status(400).json({ error: 'Content and sender are required' });
    }
    const message = chatMessageRepo.create({
      user_id: req.user.id,
      content,
      sender,
      session_id: session_id || null,
    });
    await chatMessageRepo.save(message);
    res.status(201).json(message);
  } catch (err) {
    console.error('Error saving chat message:', err);
    res.status(500).json({ error: 'Failed to save chat message' });
  }
});

// Delete a chat message by id
router.delete('/chat/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const message = await chatMessageRepo.findOne({ where: { id, user_id: req.user.id } });
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    await chatMessageRepo.remove(message);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting chat message:', err);
    res.status(500).json({ error: 'Failed to delete chat message' });
  }
});

// Delete all chat messages for the authenticated user
router.delete('/chat', authMiddleware, async (req, res) => {
  console.log('DELETE /api/memory/chat called for user:', req.user.id);
  try {
    const userId = req.user.id;
    const result = await chatMessageRepo.delete({ user_id: userId });
    console.log('Delete result:', result);
    res.json({ 
      success: true, 
      message: 'All chat messages deleted successfully',
      deletedCount: result.affected || 0
    });
  } catch (err) {
    console.error('Error deleting all chat messages:', err);
    res.status(500).json({ error: 'Failed to delete all chat messages' });
  }
});

// List all chat sessions for the authenticated user
router.get('/chat-sessions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    // Step 1: Get session_id, min(created_at), max(created_at) for each session
    const sessionTimes = await chatMessageRepo
      .createQueryBuilder('chat')
      .select('chat.session_id', 'session_id')
      .addSelect('MIN(chat.created_at)', 'first_message_time')
      .addSelect('MAX(chat.created_at)', 'last_message_time')
      .where('chat.user_id = :userId', { userId })
      .groupBy('chat.session_id')
      .orderBy('last_message_time', 'DESC')
      .getRawMany();

    // Step 2: For each session, get the first message (by created_at)
    const sessionSummaries = await Promise.all(sessionTimes.map(async (session) => {
      const firstMsg = await chatMessageRepo.findOne({
        where: {
          session_id: session.session_id,
          created_at: session.first_message_time,
          user_id: userId
        },
        order: { created_at: 'ASC' }
      });
      return {
        session_id: session.session_id,
        first_message: firstMsg ? firstMsg.content : '',
        first_message_time: session.first_message_time,
        last_message_time: session.last_message_time,
      };
    }));

    res.json(sessionSummaries);
  } catch (err) {
    console.error('Error fetching chat sessions:', err);
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
});

module.exports = router; 