import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();

// Placeholder: Get burnout data
router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Burnout data endpoint (to be implemented)' });
});

// Placeholder: Create or update burnout data
router.post('/', (req: Request, res: Response) => {
  res.json({ message: 'Burnout data POST endpoint (to be implemented)' });
});

export default router; 