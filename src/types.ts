export type ImageCategory =
  | 'All'
  | 'Nature'
  | 'Architecture'
  | 'Travel'
  | 'Minimal'
  | 'Street'
  | 'Animals'
  | 'Favorites';

export type AspectRatioType = 'landscape' | 'portrait' | 'square';

export interface ImageItem {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  category: Exclude<ImageCategory, 'All' | 'Favorites'>;
  photographer: string;
  photographerUrl?: string;
  aspectRatio: AspectRatioType;
  tags: string[];
  likes: number;
  location?: string;
  date: string;
  isCustom?: boolean;
}

export type ViewMode = 'masonry' | 'grid' | 'spacious';
export type SortOption = 'newest' | 'popular' | 'title';
