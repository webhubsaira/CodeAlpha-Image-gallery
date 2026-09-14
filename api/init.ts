import type { Request, Response } from 'express';
import pg from 'pg';

const { Pool } = pg;

const getConnectionString = (): string => {
  let url =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    '';
  url = url.replace(/^["']|["']$/g, '').trim();

  if (url && !url.includes('localhost') && !url.includes('127.0.0.1') && !url.includes('sslmode=')) {
    url += (url.includes('?') ? '&' : '?') + 'sslmode=require';
  }

  return url;
};

const isDbConfigured = (): boolean => {
  return Boolean(getConnectionString());
};

let poolInstance: pg.Pool | null = null;

const getPool = (): pg.Pool => {
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

const query = async (text: string, params?: (string | number | boolean | object | null)[]) => {
  const pool = getPool();
  return pool.query(text, params);
};

const initDbSchema = async (): Promise<{ success: boolean; message: string }> => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS images (
        id VARCHAR(255) PRIMARY KEY,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        thumbnail_url TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        photographer VARCHAR(255) NOT NULL,
        photographer_url TEXT,
        aspect_ratio VARCHAR(50) NOT NULL,
        tags TEXT[] NOT NULL DEFAULT '{}',
        likes INTEGER DEFAULT 0,
        location TEXT,
        date VARCHAR(50) NOT NULL,
        is_custom BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE images ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
      ALTER TABLE images ADD COLUMN IF NOT EXISTS photographer_url TEXT;
      ALTER TABLE images ADD COLUMN IF NOT EXISTS aspect_ratio VARCHAR(50) DEFAULT 'landscape';
      ALTER TABLE images ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
      ALTER TABLE images ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
      ALTER TABLE images ADD COLUMN IF NOT EXISTS location TEXT;
      ALTER TABLE images ADD COLUMN IF NOT EXISTS date VARCHAR(50) DEFAULT '';
      ALTER TABLE images ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
      ALTER TABLE images ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        image_id VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    return { success: true, message: 'Database schema ready.' };
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Database init failed: ${errMessage}` };
  }
};

export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!isDbConfigured()) {
    res.status(530).json({
      configured: false,
      message: 'POSTGRES_URL environment variable is not configured.',
    });
    return;
  }

  const result = await initDbSchema();
  if (result.success) {
    res.status(200).json({ configured: true, ...result });
  } else {
    res.status(500).json({ configured: true, ...result });
  }
}
