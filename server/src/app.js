import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { config } from './config.js';
import { getStore } from './lib/db/index.js';

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import calculatorRoutes from './routes/calculator.js';
import foodsRoutes from './routes/foods.js';
import foodEntriesRoutes from './routes/foodEntries.js';
import weightRoutes from './routes/weight.js';
import workoutsRoutes from './routes/workouts.js';
import analysisRoutes from './routes/analysis.js';
import dashboardRoutes from './routes/dashboard.js';
import progressRoutes from './routes/progress.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>CutTrack API Server</title></head>
        <body style="font-family: sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 60px 20px;">
          <h1 style="font-size: 28px; font-weight: 800; margin-bottom: 10px;">⚡ CutTrack API Backend Server</h1>
          <p style="color: #94a3b8; font-size: 15px;">The server API is running on port ${config.port} (Engine: ${config.storageEngine}).</p>
          <div style="margin-top: 30px;">
            <p style="color: #cbd5e1; font-size: 14px;">To access the full web application interface, open the frontend app:</p>
            <a href="${config.clientOrigin}" style="display: inline-block; background: #38bdf8; color: #0f172a; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; margin-top: 12px;">Open CutTrack App UI (${config.clientOrigin}) ➔</a>
          </div>
        </body>
      </html>
    `);
  });

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, engine: config.storageEngine, time: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/calculator', calculatorRoutes);
  app.use('/api/foods', foodsRoutes);
  app.use('/api/food-entries', foodEntriesRoutes);
  app.use('/api/weight-entries', weightRoutes);
  app.use('/api/workouts', workoutsRoutes);
  app.use('/api/analysis', analysisRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/progress', progressRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    console.error('[server] Unhandled error:', err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  });

  return app;
}

export function getStoreForApp() {
  return getStore();
}
