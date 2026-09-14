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

const ensureFavoritesTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS favorites (
      id SERIAL PRIMARY KEY,
      image_id VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!isDbConfigured()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  try {
    if (req.method === 'GET') {
      try {
        const result = await query(`SELECT image_id FROM favorites ORDER BY created_at ASC;`);
        const favoriteIds = result.rows.map((r) => r.image_id);
        res.status(200).json(favoriteIds);
        return;
      } catch (dbErr: any) {
        if (dbErr?.code === '42P01') {
          await ensureFavoritesTable();
          res.status(200).json([]);
          return;
        }
        throw dbErr;
      }
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          res.status(400).json({ error: 'Invalid JSON body' });
          return;
        }
      }

      const { imageId } = body || {};
      if (!imageId) {
        res.status(400).json({ error: 'imageId required' });
        return;
      }

      let checkResult;
      try {
        checkResult = await query(`SELECT id FROM favorites WHERE image_id = $1;`, [imageId]);
      } catch (dbErr: any) {
        if (dbErr?.code === '42P01') {
          await ensureFavoritesTable();
          checkResult = await query(`SELECT id FROM favorites WHERE image_id = $1;`, [imageId]);
        } else {
          throw dbErr;
        }
      }

      let isFavorite = false;
      if (checkResult.rows.length > 0) {
        // Remove from favorites
        await query(`DELETE FROM favorites WHERE image_id = $1;`, [imageId]);
        isFavorite = false;
      } else {
        // Add to favorites
        await query(`INSERT INTO favorites (image_id) VALUES ($1) ON CONFLICT DO NOTHING;`, [imageId]);
        isFavorite = true;
      }

      res.status(200).json({ success: true, imageId, isFavorite });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Internal Server Error', details: errorMsg });
  }
}
