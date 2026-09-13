import type { Request, Response } from 'express';
import { initDbSchema } from './lib/schema';
import { isDbConfigured } from './lib/db';

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
