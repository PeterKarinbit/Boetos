import express, { Request, Response } from 'express';
const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Voice Assistant endpoint (to be implemented)' });
});

export default router; 