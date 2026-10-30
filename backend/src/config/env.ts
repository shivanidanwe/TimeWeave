import dotenv from 'dotenv';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const configuredJwtSecret = process.env.JWT_SECRET;

if (nodeEnv === 'production' && (!configuredJwtSecret || configuredJwtSecret === 'your_jwt_secret_key_here')) {
  throw new Error('Set a unique JWT_SECRET before starting in production.');
}

export const config = {
  port: Number.parseInt(process.env.PORT || '5000', 10),
  jwtSecret: configuredJwtSecret || randomBytes(32).toString('hex'),
  databaseUrl: process.env.DATABASE_URL || '',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000',
  nodeEnv,
  corsOrigin: process.env.FRONTEND_URL || 'http://localhost:3000'
};
