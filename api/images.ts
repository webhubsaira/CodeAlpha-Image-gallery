import type { Request, Response } from 'express';
import { query, isDbConfigured } from './lib/db';
import { initDbSchema } from './lib/schema';

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
      message: 'Set POSTGRES_URL environment variable in Vercel settings.',
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
          await initDbSchema();
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
          await initDbSchema();
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
