import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { db } from './db';
import { apiRouter } from './routes';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Centralized error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

async function startServer() {
  try {
    console.log('[TimeWeave Backend] Initializing database and running migrations...');
    await db.runMigrations();

    app.listen(config.port, () => {
      console.log(`[TimeWeave Backend] Server running on http://localhost:${config.port}`);
      console.log(`[TimeWeave Backend] ML Service configured at ${config.mlServiceUrl}`);
    });
  } catch (err) {
    console.error('[TimeWeave Backend] Failed to start:', err);
    process.exit(1);
  }
}

startServer();

export default app;
