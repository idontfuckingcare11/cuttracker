import dotenv from 'dotenv';

dotenv.config();

function int(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function bool(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  return value === 'true' || value === '1';
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: int(process.env.PORT, 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'https://cuttracker-client.vercel.app',
  storageEngine: (process.env.STORAGE_ENGINE || 'memory').toLowerCase(),
  dataFile: process.env.DATA_FILE || '',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: int(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'cuttrack',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'cuttrack',
    url:
      process.env.DATABASE_URL ||
      `mysql://${process.env.DB_USER || 'cuttrack'}:${encodeURIComponent(process.env.DB_PASSWORD || '')}@${process.env.DB_HOST || '127.0.0.1'}:${int(process.env.DB_PORT, 3306)}/${process.env.DB_NAME || 'cuttrack'}`
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-only-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  cookie: {
    secure: bool(process.env.COOKIE_SECURE, false),
    name: 'cuttrack_token'
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    url: 'https://api.groq.com/openai/v1/chat/completions'
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: int(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'CutTrack <no-reply@cuttrack.app>'
  }
};
