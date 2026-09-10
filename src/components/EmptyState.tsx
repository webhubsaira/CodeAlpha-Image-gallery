import React from 'react';
import { ImageOff, RefreshCw, Upload } from 'lucide-react';

interface EmptyStateProps {
  searchQuery: string;
  isFavoritesFilter: boolean;
  onResetFilters: () => void;
  onOpenUpload: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  searchQuery,
  isFavoritesFilter,
  onResetFilters,
  onOpenUpload,
}) => {
  return (
    <div id="gallery-empty-state" className="py-16 text-center max-w-md mx-auto px-4">
      <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 text-stone-400 mx-auto flex items-center justify-center mb-4 shadow-xs">
        <ImageOff className="w-7 h-7" />
      </div>

      <h3 className="text-base font-bold text-stone-900 mb-1">
        {isFavoritesFilter
          ? 'No favorite photos yet'
          : searchQuery
          ? `No photos matching "${searchQuery}"`
          : 'No photos found in this category'}
      </h3>

      <p className="text-xs text-stone-500 mb-6 leading-relaxed">
        {isFavoritesFilter
          ? 'Tap the heart icon on any photo in the gallery to add it to your curated favorites collection.'
          : 'Try searching for something else, resetting your filters, or adding your own photo to the gallery.'}
      </p>

      <div className="flex items-center justify-center gap-3">
        <button
          id="btn-empty-reset"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>

        <button
          id="btn-empty-upload"
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition shadow-xs"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Photo</span>
        </button>
      </div>
    </div>
  );
};
