import express from 'express';
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

const app = express();

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
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Boetos API!',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

export default app;

module.exports = app;