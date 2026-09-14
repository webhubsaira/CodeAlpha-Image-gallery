import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const getConnectionString = (): string => {
  let url =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    '';
  url = url.replace(/^["']|["']$/g, '').trim();

  // Ensure SSL is required for remote databases like Neon
  if (url && !url.includes('localhost') && !url.includes('127.0.0.1') && !url.includes('sslmode=')) {
    url += (url.includes('?') ? '&' : '?') + 'sslmode=require';
  }

  return url;
};

export const isDbConfigured = (): boolean => {
  return Boolean(getConnectionString());
};

let poolInstance: pg.Pool | null = null;

export const getPool = (): pg.Pool => {
  if (!poolInstance) {
    const connectionString = getConnectionString();
    const isLocalhost =
      connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

    poolInstance = new Pool({
      connectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 8000,
    });

    poolInstance.on('error', (err) => {
      console.error('[pg pool error]:', err);
      poolInstance = null;
    });
  }
  return poolInstance;
};

export const query = async (text: string, params?: (string | number | boolean | object | null)[]) => {
  if (!isDbConfigured()) {
    throw new Error('Database is not configured. Please set POSTGRES_URL or DATABASE_URL in .env file.');
  }
  const pool = getPool();
  return pool.query(text, params);
};
