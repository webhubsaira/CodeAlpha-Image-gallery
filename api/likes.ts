import type { Request, Response } from 'express';
import { query, isDbConfigured } from './lib/db';

export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
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

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
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

    const result = await query(
      `UPDATE images SET likes = likes + 1 WHERE id = $1 RETURNING likes;`,
      [imageId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    res.status(200).json({ success: true, imageId, likes: result.rows[0].likes });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Internal Server Error', details: errorMsg });
  }
}
