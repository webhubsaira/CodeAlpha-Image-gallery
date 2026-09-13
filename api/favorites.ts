import type { Request, Response } from 'express';
import { query, isDbConfigured } from './lib/db';
import { initDbSchema } from './lib/schema';

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
    await initDbSchema();

    if (req.method === 'GET') {
      const result = await query(`SELECT image_id FROM favorites ORDER BY created_at ASC;`);
      const favoriteIds = result.rows.map((r) => r.image_id);
      res.status(200).json(favoriteIds);
      return;
    }

    if (req.method === 'POST') {
      const { imageId } = req.body || {};
      if (!imageId) {
        res.status(400).json({ error: 'imageId required' });
        return;
      }

      // Check if already in favorites
      const checkResult = await query(`SELECT id FROM favorites WHERE image_id = $1;`, [imageId]);
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
