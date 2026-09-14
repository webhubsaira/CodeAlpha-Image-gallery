import { query, isDbConfigured } from './db';

export const initDbSchema = async (): Promise<{ success: boolean; message: string }> => {
  if (!isDbConfigured()) {
    return { success: false, message: 'POSTGRES_URL environment variable is missing.' };
  }

  try {
    // 1. Create images table if not exists
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

    // 2. Create favorites table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        image_id VARCHAR(255) UNIQUE NOT NULL REFERENCES images(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    return { success: true, message: 'Database schema ready.' };
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Database init failed: ${errMessage}` };
  }
};
