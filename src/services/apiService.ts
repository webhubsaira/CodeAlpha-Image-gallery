import { ImageItem } from '../types';
import { INITIAL_IMAGES } from '../data/initialImages';

const API_BASE = '/api';

export const fetchImagesFromDb = async (): Promise<ImageItem[]> => {
  try {
    const res = await fetch(`${API_BASE}/images`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } else {
      const errorText = await res.text();
      console.warn('[API /api/images GET Warning]:', errorText);
    }
  } catch (err) {
    console.warn('[API /api/images GET Error]:', err);
  }

  // Fallback to localStorage + initial images
  try {
    const saved = localStorage.getItem('gallery_custom_images');
    if (saved) {
      const custom = JSON.parse(saved);
      return [...custom, ...INITIAL_IMAGES];
    }
  } catch {
    // ignore
  }

  return INITIAL_IMAGES;
};

export const saveImageToDb = async (image: ImageItem): Promise<boolean> => {
  // Always update localStorage first for instant local persistence
  try {
    const saved = localStorage.getItem('gallery_custom_images');
    const custom: ImageItem[] = saved ? JSON.parse(saved) : [];
    const updated = [image, ...custom.filter((img) => img.id !== image.id)];
    localStorage.setItem('gallery_custom_images', JSON.stringify(updated));
  } catch {
    // ignore
  }

  // Sync to PostgreSQL DB if available
  try {
    const res = await fetch(`${API_BASE}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(image),
    });
    if (!res.ok) {
      const errDetail = await res.text();
      console.error('[API /api/images POST Error]:', res.status, errDetail);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[API /api/images POST Network Error]:', err);
    return false;
  }
};

export const fetchFavoritesFromDb = async (): Promise<Set<string>> => {
  try {
    const res = await fetch(`${API_BASE}/favorites`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return new Set(data);
      }
    }
  } catch {
    // API unavailable
  }

  // Fallback to localStorage
  try {
    const saved = localStorage.getItem('gallery_favorites');
    if (saved) {
      return new Set(JSON.parse(saved));
    }
  } catch {
    // ignore
  }

  return new Set(['img-1', 'img-6', 'img-14']);
};

export const toggleFavoriteInDb = async (imageId: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const likeImageInDb = async (imageId: string): Promise<number | null> => {
  try {
    const res = await fetch(`${API_BASE}/likes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.likes;
    }
  } catch {
    // ignore
  }
  return null;
};
