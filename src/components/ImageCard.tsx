import React, { useState } from 'react';
import { Heart, Maximize2, Download, MapPin, Tag } from 'lucide-react';
import { ImageItem, ViewMode } from '../types';

interface ImageCardProps {
  image: ImageItem;
  viewMode: ViewMode;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenLightbox: (image: ImageItem) => void;
  onTagClick?: (tag: string) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  viewMode,
  isFavorite,
  onToggleFavorite,
  onOpenLightbox,
  onTagClick,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Aspect ratio class helper based on view mode
  const getImageAspectClass = () => {
    if (viewMode === 'grid') return 'aspect-square object-cover';
    if (viewMode === 'spacious') return 'aspect-[16/10] object-cover';
    // Masonry mode uses aspect presets
    if (image.aspectRatio === 'portrait') return 'aspect-[3/4] object-cover';
    if (image.aspectRatio === 'square') return 'aspect-square object-cover';
    return 'aspect-[4/3] object-cover';
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = image.url;
    link.target = '_blank';
    link.download = `${image.title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id={`image-card-${image.id}`}
      className="group relative rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer"
      onClick={() => onOpenLightbox(image)}
    >
      {/* Image container */}
      <div className="relative w-full overflow-hidden bg-stone-200">
        {/* Skeleton loader */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-stone-200 animate-pulse" />
        )}

        {/* The actual image */}
        <img
          id={`img-element-${image.id}`}
          src={image.thumbnailUrl || image.url}
          alt={image.title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setIsLoaded(true);
            setHasError(true);
          }}
          className={`w-full h-full transition-transform duration-500 ease-out group-hover:scale-[1.03] ${getImageAspectClass()} ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Fallback if image load fails */}
        {hasError && (
          <div className="flex flex-col items-center justify-center p-6 text-stone-400 bg-stone-100 aspect-video">
            <span className="text-xs">Unable to load image preview</span>
          </div>
        )}

        {/* Dark subtle gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Top actions overlay (Favorite & Quick Expand) */}
        <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            id={`btn-favorite-${image.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(image.id);
            }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`p-2 rounded-xl backdrop-blur-md transition shadow-xs ${
              isFavorite
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-white/80 text-stone-700 hover:bg-white hover:text-stone-900'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            id={`btn-expand-${image.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenLightbox(image);
            }}
            aria-label="View larger"
            className="p-2 rounded-xl bg-white/80 backdrop-blur-md text-stone-700 hover:bg-white hover:text-stone-900 transition shadow-xs"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom hover details (Title, Photographer, Tags) */}
        <div className="absolute bottom-3 left-3 right-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-bold tracking-tight drop-shadow-sm truncate">
                {image.title}
              </h3>
              <p className="text-xs text-stone-200 font-medium truncate">
                by {image.photographer}
              </p>
            </div>

            <button
              id={`btn-card-download-${image.id}`}
              onClick={handleDownload}
              title="Download photo"
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tags preview on hover */}
          {image.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {image.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  id={`tag-chip-${image.id}-${tag}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick?.(tag);
                  }}
                  className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md hover:bg-white hover:text-stone-900 text-stone-200 transition font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Spacious mode visible footer info */}
      {viewMode === 'spacious' && (
        <div className="p-4 bg-white border-t border-stone-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-stone-900">{image.title}</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                {image.category}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
              <span>Photo by <strong className="font-semibold text-stone-700">{image.photographer}</strong></span>
              {image.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-stone-400" />
                  {image.location}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id={`btn-spacious-fav-${image.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(image.id);
              }}
              className={`p-2 rounded-xl border transition ${
                isFavorite
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-stone-50 border-stone-200 text-stone-500 hover:text-stone-900'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              id={`btn-spacious-download-${image.id}`}
              onClick={handleDownload}
              className="p-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
