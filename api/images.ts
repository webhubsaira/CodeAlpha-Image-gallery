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

const ensureImagesTable = async () => {
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
  `);
};

export default async function handler(req: Request, res: Response) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!isDbConfigured()) {
    res.status(503).json({
      error: 'Database not configured',
      message: 'Set POSTGRES_URL or DATABASE_URL in Vercel Environment Variables.',
    });
    return;
  }

  try {
    // GET /api/images - Fetch all images
    if (req.method === 'GET') {
      try {
        const result = await query(
          `SELECT 
            id, 
            title, 
            url, 
            thumbnail_url AS "thumbnailUrl", 
            category, 
            photographer, 
            photographer_url AS "photographerUrl", 
            aspect_ratio AS "aspectRatio", 
            tags, 
            likes, 
            location, 
            date, 
            is_custom AS "isCustom" 
          FROM images 
          ORDER BY created_at DESC, id DESC;`
        );
        res.status(200).json(result.rows);
        return;
      } catch (dbErr: any) {
        if (dbErr?.code === '42P01') {
          // Table doesn't exist yet, initialize once and retry
          await ensureImagesTable();
          const retryResult = await query(
            `SELECT id, title, url, thumbnail_url AS "thumbnailUrl", category, photographer, photographer_url AS "photographerUrl", aspect_ratio AS "aspectRatio", tags, likes, location, date, is_custom AS "isCustom" FROM images ORDER BY created_at DESC, id DESC;`
          );
          res.status(200).json(retryResult.rows);
          return;
        }
        throw dbErr;
      }
    }

    // POST /api/images - Insert a new photo
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

      const {
        id,
        title,
        url,
        thumbnailUrl,
        category,
        photographer,
        photographerUrl,
        aspectRatio,
        tags,
        likes,
        location,
        date,
        isCustom,
      } = body || {};

      if (!id || !title || !url) {
        res.status(400).json({ error: 'Missing required image fields (id, title, url)' });
        return;
      }

      const insertParams = [
        id,
        title,
        url,
        thumbnailUrl || url,
        category || 'Minimal',
        photographer || 'User',
        photographerUrl || null,
        aspectRatio || 'landscape',
        Array.isArray(tags) ? tags : [],
        typeof likes === 'number' ? likes : 0,
        location || null,
        date || new Date().toISOString().split('T')[0],
        isCustom !== undefined ? isCustom : true,
      ];

      const insertQuery = `INSERT INTO images (
        id, title, url, thumbnail_url, category, photographer, photographer_url, aspect_ratio, tags, likes, location, date, is_custom
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        url = EXCLUDED.url,
        thumbnail_url = EXCLUDED.thumbnail_url,
        category = EXCLUDED.category,
        photographer = EXCLUDED.photographer,
        tags = EXCLUDED.tags,
        likes = EXCLUDED.likes;`;

      try {
        await query(insertQuery, insertParams);
      } catch (dbErr: any) {
        if (dbErr?.code === '42P01') {
          await ensureImagesTable();
          await query(insertQuery, insertParams);
        } else {
          throw dbErr;
        }
      }

      res.status(201).json({ success: true, message: 'Image saved to PostgreSQL', id });
      return;
    }

    // DELETE /api/images?id=...
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        res.status(400).json({ error: 'Image id query parameter required' });
        return;
      }

      await query(`DELETE FROM images WHERE id = $1;`, [id]);
      res.status(200).json({ success: true, message: 'Image deleted', id });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Internal Server Error', details: errorMsg });
  }
}
