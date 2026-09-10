import React from 'react';
import {
  Search,
  X,
  Upload,
  LayoutGrid,
  Columns3,
  Rows3,
  Heart,
  SlidersHorizontal,
  Image as ImageIcon
} from 'lucide-react';
import { ViewMode, SortOption } from '../types';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  onOpenUpload: () => void;
  totalImagesCount: number;
  favoriteCount: number;
  showOnlyFavorites: boolean;
  onToggleFavoritesOnly: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortOption,
  onSortChange,
  onOpenUpload,
  totalImagesCount,
  favoriteCount,
  showOnlyFavorites,
  onToggleFavoritesOnly,
}) => {
  return (
    <header id="gallery-header" className="sticky top-0 z-30 bg-stone-50/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-900 text-stone-50 flex items-center justify-center shadow-sm">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-stone-900 leading-tight">
                  Image Gallery
                </h1>
                <p className="text-xs text-stone-500 font-medium">
                  {totalImagesCount} curated photographs
                </p>
              </div>
            </div>

            {/* Mobile upload trigger */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                id="btn-upload-mobile"
                onClick={onOpenUpload}
                aria-label="Upload photo"
                className="p-2 rounded-lg bg-stone-900 text-stone-50 hover:bg-stone-800 transition-colors"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="w-full md:max-w-md relative">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
              <input
                id="gallery-search-input"
                type="text"
                placeholder="Search photos by title, tag, photographer, location..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-9 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 shadow-xs transition"
              />
              {searchQuery && (
                <button
                  id="btn-clear-search"
                  onClick={() => onSearchChange('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 p-1 text-stone-400 hover:text-stone-700 rounded-md transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Actions: Favorites, Layout, Sort, Upload */}
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end">
            
            {/* Favorites filter toggle */}
            <button
              id="btn-filter-favorites"
              onClick={onToggleFavoritesOnly}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                showOnlyFavorites
                  ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-xs'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100/70'
              }`}
              title="Filter by favorites"
            >
              <Heart className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-rose-500 text-rose-500' : 'text-stone-500'}`} />
              <span>Favorites</span>
              {favoriteCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  showOnlyFavorites ? 'bg-rose-200 text-rose-800' : 'bg-stone-200 text-stone-700'
                }`}>
                  {favoriteCount}
                </span>
              )}
            </button>

            {/* Sort selector */}
            <div className="relative flex items-center">
              <label htmlFor="select-gallery-sort" className="sr-only">Sort photos</label>
              <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 pointer-events-none" />
              <select
                id="select-gallery-sort"
                value={sortOption}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="pl-8 pr-7 py-2 text-xs font-semibold bg-white border border-stone-200 text-stone-700 rounded-xl focus:outline-none focus:border-stone-400 cursor-pointer shadow-xs appearance-none"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Liked</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div id="view-mode-group" className="flex items-center bg-white border border-stone-200 rounded-xl p-0.5 shadow-xs">
              <button
                id="view-mode-masonry"
                onClick={() => onViewModeChange('masonry')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'masonry'
                    ? 'bg-stone-900 text-stone-50'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Masonry View"
                aria-label="Masonry layout"
              >
                <Columns3 className="w-4 h-4" />
              </button>
              <button
                id="view-mode-grid"
                onClick={() => onViewModeChange('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-stone-900 text-stone-50'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Square Grid View"
                aria-label="Square grid layout"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                id="view-mode-spacious"
                onClick={() => onViewModeChange('spacious')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'spacious'
                    ? 'bg-stone-900 text-stone-50'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Cinematic Wide View"
                aria-label="Cinematic wide layout"
              >
                <Rows3 className="w-4 h-4" />
              </button>
            </div>

            {/* Desktop Upload Button */}
            <button
              id="btn-upload-desktop"
              onClick={onOpenUpload}
              className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900 text-stone-50 text-xs font-semibold hover:bg-stone-800 transition shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Add Image</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
