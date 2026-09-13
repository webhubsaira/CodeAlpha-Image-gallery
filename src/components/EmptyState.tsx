import React from 'react';
import { ImageOff, RefreshCw, Sparkles, Upload, Wand2 } from 'lucide-react';

interface EmptyStateProps {
  searchQuery: string;
  isFavoritesFilter: boolean;
  onResetFilters: () => void;
  onOpenUpload: () => void;
  onOpenAi: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  searchQuery,
  isFavoritesFilter,
  onResetFilters,
  onOpenUpload,
  onOpenAi,
}) => {
  const isSearchEmpty = Boolean(searchQuery && !isFavoritesFilter);

  return (
    <div id="gallery-empty-state" className="py-12 max-w-lg mx-auto px-4 text-center">
      {isSearchEmpty ? (
        <div className="bg-gradient-to-b from-amber-500/10 via-stone-50 to-stone-100/60 rounded-3xl p-8 border border-amber-200/60 shadow-xs relative overflow-hidden text-center">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 mx-auto flex items-center justify-center mb-4 shadow-xs">
            <Wand2 className="w-7 h-7" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200/80 mb-3">
            <Sparkles className="w-3 h-3 text-amber-600" />
            AI Image Generator API
          </span>

          <h3 className="text-lg font-bold text-stone-900 mb-2">
            No photos found for &ldquo;{searchQuery}&rdquo;
          </h3>

          <p className="text-xs text-stone-600 mb-6 leading-relaxed max-w-md mx-auto">
            This image doesn't exist in the gallery yet. Connect to our AI model API to generate an original high-resolution photo instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="btn-empty-ai-create-primary"
              onClick={onOpenAi}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition shadow-sm hover:shadow active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate &ldquo;{searchQuery}&rdquo; with AI</span>
            </button>

            <button
              id="btn-empty-reset"
              onClick={onResetFilters}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Search</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="py-8">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 text-stone-400 mx-auto flex items-center justify-center mb-4 shadow-xs">
            <ImageOff className="w-7 h-7" />
          </div>

          <h3 className="text-base font-bold text-stone-900 mb-1">
            {isFavoritesFilter
              ? 'No favorite photos yet'
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photo</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
