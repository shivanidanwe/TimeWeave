import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'timeweave_super_secret_jwt_key_2026',
  databaseUrl: process.env.DATABASE_URL || '',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.FRONTEND_URL || '*'
};
