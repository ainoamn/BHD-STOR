import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bhd_marketplace',
  ssl: process.env.DB_SSL === 'true',
  logging: process.env.DB_LOGGING === 'true',
  synchronize: process.env.NODE_ENV !== 'production' && process.env.DB_SYNCHRONIZE === 'true',
  poolSize: parseInt(process.env.DB_POOL_SIZE, 10) || 20,
  poolMin: parseInt(process.env.DB_POOL_MIN, 10) || 5,
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 60000,
}));

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  logging: boolean;
  synchronize: boolean;
  poolSize: number;
  poolMin: number;
  connectionTimeout: number;
}
