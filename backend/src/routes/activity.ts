import { Router } from 'express';
import { AiInterventionService } from '../services/aiInterventionService';

const router = Router();
const aiInterventionService = new AiInterventionService();

router.post('/log-activity', async (req, res) => {
  const { userId, activityType, timestamp, details } = req.body;
  console.log('Activity Logged:', { userId, activityType, timestamp, details });

  try {
    // Pass the activity to the AI Intervention Service
    await aiInterventionService.processActivity(userId, activityType, timestamp, details);
    res.status(200).json({ message: 'Activity logged and processed successfully' });
  } catch (error) {
    console.error('Error processing activity with AI Intervention Service:', error);
    res.status(500).json({ error: 'Failed to process activity', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router; 