import express from 'express';
import type { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app: Application = express();

// CORS configuration for Netlify frontend
app.use(cors({
  origin: ['https://boetos.netlify.app'],
  credentials: true,
}));

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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