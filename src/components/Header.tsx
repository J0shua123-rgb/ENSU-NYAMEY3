import React from 'react';
import { Store, Search, X, Clock, MapPin, Phone } from 'lucide-react';
import { STORE_SETTINGS } from '../data/products';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenStoreInfo: () => void;
  totalProductsCount: number;
  filteredCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenStoreInfo,
  totalProductsCount,
  filteredCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 transition-all">
      <div className="max-w-xl mx-auto px-4 pt-3 pb-3">
        {/* Top Store Info Row */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/50">
              <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                <Store className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white truncate">
                  {STORE_SETTINGS.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Open
                </span>
              </div>
              <p className="text-xs text-neutral-400 truncate flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                <span className="text-emerald-400/90 font-medium">{STORE_SETTINGS.subtitle}</span>
                <span className="text-neutral-600">•</span>
                <span>{STORE_SETTINGS.locationShort}</span>
              </p>
            </div>
          </div>

          {/* Quick info button */}
          <button
            id="store-info-btn"
            onClick={onOpenStoreInfo}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors"
            title="View store hours & location"
            aria-label="Store details"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xs:inline sm:inline">Info</span>
          </button>
        </div>

        {/* Sticky Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-neutral-400" />
          </div>
          <input
            id="product-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search plantain, Indomie, Milo, Malta..."
            className="w-full pl-10 pr-9 py-2.5 bg-neutral-900/90 hover:bg-neutral-900 focus:bg-neutral-900 border border-neutral-800 focus:border-emerald-500/70 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              id="clear-search-btn"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-200"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Active search filter hint if searching */}
        {searchQuery.trim().length > 0 && (
          <div className="flex items-center justify-between text-xs text-neutral-400 mt-2 px-1">
            <span>
              Found <strong className="text-emerald-400">{filteredCount}</strong> {filteredCount === 1 ? 'item' : 'items'} for "{searchQuery}"
            </span>
            <button
              onClick={() => onSearchChange('')}
              className="text-emerald-400 hover:underline text-xs"
            >
              Reset search
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
