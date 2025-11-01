import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import onboardingRoutes from './routes/onboarding';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ 
  origin: corsOrigin === '*' ? false : corsOrigin,
  credentials: true 
}));
app.use(express.json());

// Request ID middleware (simple version for logging)
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = Math.random().toString(36).substring(2, 15);
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
});

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ ok: true });
});

app.use('/onboarding', onboardingRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
