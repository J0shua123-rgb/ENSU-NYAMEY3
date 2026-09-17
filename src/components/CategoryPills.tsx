import React, { useRef } from 'react';
import { CategoryId } from '../types';
import { CATEGORIES } from '../data/products';
import { 
  LayoutGrid, 
  Salad, 
  Fish, 
  Package, 
  Flame, 
  Wheat 
} from 'lucide-react';

interface CategoryPillsProps {
  selectedCategory: CategoryId;
  onSelectCategory: (id: CategoryId) => void;
  categoryCounts: Record<CategoryId, number>;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getCategoryIcon = (id: CategoryId) => {
    switch (id) {
      case 'all':
        return <LayoutGrid className="w-3.5 h-3.5" />;
      case 'vegetables':
        return <Salad className="w-3.5 h-3.5" />;
      case 'proteins':
        return <Fish className="w-3.5 h-3.5" />;
      case 'canned':
        return <Package className="w-3.5 h-3.5" />;
      case 'condiments':
        return <Flame className="w-3.5 h-3.5" />;
      case 'pantry':
        return <Wheat className="w-3.5 h-3.5" />;
      default:
        return <Package className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="w-full bg-neutral-950/60 py-2.5 border-b border-neutral-900 sticky top-[98px] z-20 backdrop-blur-sm">
      <div 
        ref={scrollContainerRef}
        className="max-w-xl mx-auto px-4 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth"
      >
        {CATEGORIES.map((category) => {
          const isActive = selectedCategory === category.id;
          const count = categoryCounts[category.id] ?? 0;

          return (
            <button
              key={category.id}
              id={`cat-pill-${category.id}`}
              onClick={() => onSelectCategory(category.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 active:scale-95 select-none ${
                isActive
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20 font-semibold ring-2 ring-emerald-400/30'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-800'
              }`}
            >
              <span className={isActive ? 'text-neutral-950' : 'text-emerald-400'}>
                {getCategoryIcon(category.id)}
              </span>
              <span>{category.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-neutral-950/20 text-neutral-900 font-bold'
                    : 'bg-neutral-800 text-neutral-400'
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
