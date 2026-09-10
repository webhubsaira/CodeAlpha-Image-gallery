import React from 'react';
import { ImageCategory } from '../types';

interface CategoryFilterProps {
  categories: ImageCategory[];
  activeCategory: ImageCategory;
  onSelectCategory: (category: ImageCategory) => void;
  categoryCounts: Record<string, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  return (
    <div id="category-filter-container" className="overflow-x-auto py-2 scrollbar-none">
      <div className="flex items-center gap-2 min-w-max pb-1">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          const count = categoryCounts[cat] ?? 0;
          return (
            <button
              key={cat}
              id={`category-btn-${cat.toLowerCase()}`}
              onClick={() => onSelectCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 shadow-xs whitespace-nowrap ${
                isActive
                  ? 'bg-stone-900 text-stone-50 ring-1 ring-stone-900'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100/80 hover:text-stone-900'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  isActive ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
