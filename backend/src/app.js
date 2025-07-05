require('reflect-metadata');
const express = require('express');
const cors = require('cors');
const authRouter = require('./routes/auth');
const session = require('express-session');
const passport = require('passport');
const googleAuthRoutes = require('./routes/googleAuth');
const calendarRoutes = require('./routes/calendar');
const activityRoutes = require('./routes/activity');
const meetingsRoutes = require('./routes/meetings');
const voiceRoutes = require('./routes/voice');
const voiceAssistantRoutes = require('./routes/voice-assistant');
const userRoutes = require('./routes/user');
const burnoutRoutes = require('./routes/burnout.js');
const mentalHealthRoutes = require('./routes/mentalHealth');
const authMiddleware = require('./middleware/authMiddleware');
const path = require('path');
const { initializeDataSource } = require('./data-source');
const config = require('./config');
const memoryRoutes = require('./routes/memory');
const sidekickRoutes = require('./routes/sidekick');
const notificationsRoutes = require('./routes/notifications');

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

const app = express();

// CORS configuration for frontend - more flexible for production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'https://your-frontend-app.netlify.app'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
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

// Security middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction, // Only use secure cookies in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: isProduction ? 'strict' : 'lax'
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
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
  res.status(500).json({ error: 'Something broke!' });
});

module.exports = app; 