import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
// @ts-ignore
import authRouter from './routes/auth';
// @ts-ignore
import googleAuthRoutes from './routes/googleAuth';
// @ts-ignore
import calendarRoutes from './routes/calendar';
// @ts-ignore
import activityRoutes from './routes/activity';
// @ts-ignore
import meetingsRoutes from './routes/meetings';
// @ts-ignore
import voiceRoutes from './routes/voice';
// @ts-ignore
import voiceAssistantRoutes from './routes/voice-assistant';
// @ts-ignore
import userRoutes from './routes/user';
// @ts-ignore
import burnoutRoutes from './routes/burnout';
// @ts-ignore
import mentalHealthRoutes from './routes/mentalHealth';
// @ts-ignore
import authMiddleware from './middleware/authMiddleware';
import config from './config';
// @ts-ignore
import memoryRoutes from './routes/memory';
// @ts-ignore
import sidekickRoutes from './routes/sidekick';
// @ts-ignore
import notificationsRoutes from './routes/notifications';

// Validate required environment variables
const requiredEnvVars = [
  'SESSION_SECRET',
  'FRONTEND_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const app: Application = express();

// CORS configuration for frontend - more flexible for production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'https://your-frontend-app.netlify.app'
].filter(Boolean) as string[];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: isProduction ? 'strict' : 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRouter);
app.use('/api/oauth', googleAuthRoutes);
app.use('/api/calendar', authMiddleware, calendarRoutes);
app.use('/api/activity', authMiddleware, activityRoutes);
app.use('/api/meetings', authMiddleware, meetingsRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/voice-assistant', voiceAssistantRoutes);
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api/burnout', authMiddleware, burnoutRoutes);
app.use('/api/mental-health', authMiddleware, mentalHealthRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/sidekick', sidekickRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to the Boetos API!',
    version: process.env.npm_package_version || '1.0.0'
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

export default app; 