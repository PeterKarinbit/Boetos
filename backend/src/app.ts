import express from 'express';
import type { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Import routers
import authRouter from './routes/auth';
import googleAuthRouter from './routes/googleAuth';
import activityRouter from './routes/activity';
import burnoutRouter from './routes/burnout';
import calendarRouter from './routes/calendar';
import meetingsRouter from './routes/meetings';
import memoryRouter from './routes/memory';
import mentalHealthRouter from './routes/mentalHealth';
import notificationsRouter from './routes/notifications';
import sidekickRouter from './routes/sidekick';
import userRouter from './routes/user';
import voiceRouter from './routes/voice';
import voiceAssistantRouter from './routes/voice-assistant';

const app: Application = express();

// CORS configuration for Netlify frontend
app.use(cors({
  origin: ['https://boetos.netlify.app'],
  credentials: true,
}));

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount routers
app.use('/api/auth', authRouter);
app.use('/api/auth/google', googleAuthRouter);
app.use('/api/activity', activityRouter);
app.use('/api/burnout', burnoutRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/meetings', meetingsRouter);
app.use('/api/memory', memoryRouter);
app.use('/api/mental-health', mentalHealthRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/sidekick', sidekickRouter);
app.use('/api/user', userRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/voice-assistant', voiceAssistantRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to the Boetos API!',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

export default app;