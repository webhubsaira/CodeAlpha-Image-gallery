import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CategoryFilter } from './components/CategoryFilter';
import { ImageCard } from './components/ImageCard';
import { LightboxModal } from './components/LightboxModal';
import { UploadModal } from './components/UploadModal';
import { EmptyState } from './components/EmptyState';
import { INITIAL_IMAGES } from './data/initialImages';
import { ImageItem, ImageCategory, ViewMode, SortOption } from './types';
import { Sparkles, ArrowUpDown } from 'lucide-react';

const CATEGORIES: ImageCategory[] = [
  'All',
  'Nature',
  'Architecture',
  'Travel',
  'Minimal',
  'Street',
  'Animals',
];

export default function App() {
  // 1. Initial State with LocalStorage hydration
  const [images, setImages] = useState<ImageItem[]>(() => {
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
  });

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('gallery_favorites');
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
    return new Set(['img-1', 'img-6', 'img-14']);
  });

  const [activeCategory, setActiveCategory] = useState<ImageCategory>('All');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('masonry');
  const [sortOption, setSortOption] = useState<SortOption>('popular');
  const [activeLightboxImage, setActiveLightboxImage] = useState<ImageItem | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gallery_favorites', JSON.stringify(Array.from(favorites)));
    } catch {
      // ignore
    }
  }, [favorites]);

  // Toggle favorite
  const handleToggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Add new image from UploadModal
  const handleAddImage = useCallback((newImage: ImageItem) => {
    setImages((prev) => {
      const updated = [newImage, ...prev];
      try {
        const customOnly = updated.filter((item) => item.isCustom);
        localStorage.setItem('gallery_custom_images', JSON.stringify(customOnly));
      } catch {
        // ignore
      }
      return updated;
    });
    // Switch to category of uploaded image
    setActiveCategory(newImage.category as ImageCategory);
  }, []);

  // Filter images by search, category, and favorites
  const filteredImages = useMemo(() => {
    let result = [...images];

    // Favorites filter
    if (showOnlyFavorites) {
      result = result.filter((item) => favorites.has(item.id));
    }

    // Category filter
    if (activeCategory !== 'All') {
      result = result.filter((item) => item.category === activeCategory);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        const inTitle = item.title.toLowerCase().includes(q);
        const inPhotographer = item.photographer.toLowerCase().includes(q);
        const inCategory = item.category.toLowerCase().includes(q);
        const inLocation = item.location?.toLowerCase().includes(q);
        const inTags = item.tags.some((tag) => tag.toLowerCase().includes(q));
        return inTitle || inPhotographer || inCategory || inLocation || inTags;
      });
    }

    // Sorting
    if (sortOption === 'popular') {
      result.sort((a, b) => b.likes - a.likes);
    } else if (sortOption === 'newest') {
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortOption === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [images, showOnlyFavorites, favorites, activeCategory, searchQuery, sortOption]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: images.length,
    };
    CATEGORIES.forEach((cat) => {
      if (cat !== 'All') {
        counts[cat] = images.filter((img) => img.category === cat).length;
      }
    });
    return counts;
  }, [images]);

  // Handle clicking a tag
  const handleTagClick = useCallback((tag: string) => {
    setSearchQuery(tag);
    setShowOnlyFavorites(false);
  }, []);

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setActiveCategory('All');
    setShowOnlyFavorites(false);
  }, []);

  return (
    <div id="gallery-app-root" className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortOption={sortOption}
        onSortChange={setSortOption}
        onOpenUpload={() => setIsUploadOpen(true)}
        totalImagesCount={images.length}
        favoriteCount={favorites.size}
        showOnlyFavorites={showOnlyFavorites}
        onToggleFavoritesOnly={() => setShowOnlyFavorites((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main id="gallery-main-container" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Category filtering bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-stone-200/80 pb-4">
          <CategoryFilter
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onSelectCategory={(cat) => {
              setActiveCategory(cat);
              if (showOnlyFavorites) setShowOnlyFavorites(false);
            }}
            categoryCounts={categoryCounts}
          />

          <div className="flex items-center gap-2 text-xs text-stone-500 shrink-0">
            <span>Showing <strong className="font-semibold text-stone-800">{filteredImages.length}</strong> photo{filteredImages.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Empty State vs Gallery Layout */}
        {filteredImages.length === 0 ? (
          <EmptyState
            searchQuery={searchQuery}
            isFavoritesFilter={showOnlyFavorites}
            onResetFilters={handleResetFilters}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        ) : (
          <div>
            {/* Masonry Layout */}
            {viewMode === 'masonry' && (
              <div
                id="gallery-masonry-grid"
                className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:balance]"
              >
                {filteredImages.map((image) => (
                  <div key={image.id} className="break-inside-avoid mb-4">
                    <ImageCard
                      image={image}
                      viewMode={viewMode}
                      isFavorite={favorites.has(image.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onOpenLightbox={setActiveLightboxImage}
                      onTagClick={handleTagClick}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Square Grid Layout */}
            {viewMode === 'grid' && (
              <div
                id="gallery-square-grid"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4"
              >
                {filteredImages.map((image) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    viewMode={viewMode}
                    isFavorite={favorites.has(image.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenLightbox={setActiveLightboxImage}
                    onTagClick={handleTagClick}
                  />
                ))}
              </div>
            )}

            {/* Spacious Cinematic Layout */}
            {viewMode === 'spacious' && (
              <div
                id="gallery-spacious-grid"
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {filteredImages.map((image) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    viewMode={viewMode}
                    isFavorite={favorites.has(image.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenLightbox={setActiveLightboxImage}
                    onTagClick={handleTagClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer id="gallery-footer" className="mt-auto border-t border-stone-200 bg-white/70 py-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-stone-600">
            Image Gallery • Responsive Web Showcase
          </p>
          <div className="flex items-center gap-4 text-[11px] text-stone-400">
            <span>Built with HTML, CSS & JavaScript (React & Tailwind)</span>
            <span>•</span>
            <span>Click any photo to open Lightbox</span>
          </div>
        </div>
      </footer>

      {/* Lightbox Modal */}
      <LightboxModal
        image={activeLightboxImage}
        images={filteredImages}
        isOpen={Boolean(activeLightboxImage)}
        onClose={() => setActiveLightboxImage(null)}
        onSelectImage={setActiveLightboxImage}
        isFavorite={activeLightboxImage ? favorites.has(activeLightboxImage.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onTagClick={handleTagClick}
      />

      {/* Add / Upload Photo Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAddImage={handleAddImage}
      />
    </div>
  );
}
