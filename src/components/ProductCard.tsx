import React, { useState, useEffect } from 'react';
import { Product, SelectedProteinCut } from '../types';
import { Plus, Minus, Check, ShoppingBag, Coins, Layers, ChevronRight, Sparkles } from 'lucide-react';
import { STORE_SETTINGS } from '../data/products';
import { logSystemAlert } from '../utils/errorTracker';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  currentCustomAmount?: string;
  selectedCutsInCart?: SelectedProteinCut[];
  onAddToCart: (product: Product, customAmount?: string) => void;
  onUpdateQuantity: (productId: string, quantity: number, customAmount?: string) => void;
  onUpdateCustomAmount?: (productId: string, customAmount: string) => void;
  onOpenCutsModal?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantityInCart,
  currentCustomAmount,
  selectedCutsInCart,
  onAddToCart,
  onUpdateQuantity,
  onUpdateCustomAmount,
  onOpenCutsModal,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isAddingAnimation, setIsAddingAnimation] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>(
    currentCustomAmount || product.defaultCustomAmount || 'GH₵ 50'
  );

  useEffect(() => {
    if (currentCustomAmount && currentCustomAmount !== customAmount) {
      setCustomAmount(currentCustomAmount);
    }
  }, [currentCustomAmount]);

  const handleAmountChange = (val: string) => {
    setCustomAmount(val);
    if (quantityInCart > 0 && onUpdateCustomAmount) {
      onUpdateCustomAmount(product.id, val);
    }
  };

  const handlePresetClick = (preset: string) => {
    setCustomAmount(preset);
    if (quantityInCart > 0 && onUpdateCustomAmount) {
      onUpdateCustomAmount(product.id, preset);
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.hasCutsModal && onOpenCutsModal) {
      onOpenCutsModal(product);
      return;
    }

    setIsAddingAnimation(true);
    const amountToSend = product.isVariablePrice
      ? (customAmount.trim() || product.defaultCustomAmount || 'GH₵ 50')
      : undefined;
    onAddToCart(product, amountToSend);
    setTimeout(() => setIsAddingAnimation(false), 400);
  };

  const handleCardClick = () => {
    if (product.hasCutsModal && onOpenCutsModal) {
      onOpenCutsModal(product);
    }
  };

  const hasCutsInCart = !!(selectedCutsInCart && selectedCutsInCart.length > 0);

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={handleCardClick}
      className={`group relative bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700/80 rounded-2xl p-3 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:shadow-black/40 ${
        product.hasCutsModal ? 'cursor-pointer hover:border-emerald-500/40' : ''
      }`}
    >
      {/* Top: Image & Badge */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-neutral-950 mb-2.5 flex items-center justify-center border border-neutral-800/50">
        {!imageError ? (
          <img
            src={product.image}
            alt={product.name}
            onError={() => {
              setImageError(true);
              logSystemAlert({
                level: 'warning',
                category: 'image_broken',
                title: 'Broken Product Image Detected',
                details: `Image failed to load for "${product.name}" (${product.image.substring(0, 50)}...)`,
                source: `ProductCard (${product.id})`,
              });
            }}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-neutral-600 gap-1 p-2 text-center">
            <ShoppingBag className="w-8 h-8 text-neutral-700" />
            <span className="text-[11px] font-medium text-neutral-400 truncate max-w-full">
              {product.name}
            </span>
          </div>
        )}

        {/* Badges */}
        {!product.inStock ? (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/90 text-rose-300 border border-rose-500/40 shadow-sm z-10">
            Out of Stock
          </span>
        ) : product.badge ? (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/20 shadow-sm">
            {product.badge}
          </span>
        ) : null}

        {/* Category / Sub-types Tag */}
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-medium bg-neutral-950/75 backdrop-blur-sm text-neutral-400 uppercase tracking-wider flex items-center gap-1">
          {product.isEggProduct ? (
            <>
              <Layers className="w-2.5 h-2.5 text-emerald-400" />
              <span>Retail & Crates</span>
            </>
          ) : product.hasCutsModal ? (
            <>
              <Layers className="w-2.5 h-2.5 text-emerald-400" />
              <span>Cuts & Sub-types</span>
            </>
          ) : product.isMockPrice ? (
            <>
              <Coins className="w-2.5 h-2.5 text-amber-400" />
              <span>Mock Pricing</span>
            </>
          ) : (
            <span>{product.categoryLabel}</span>
          )}
        </span>
      </div>

      {/* Middle: Title, Unit, Description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-semibold text-sm text-neutral-100 line-clamp-1 group-hover:text-white transition-colors" title={product.name}>
            {product.name}
          </h3>
          {product.isEggProduct ? (
            <span className="shrink-0 text-[9px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
              5 Tiers
            </span>
          ) : product.hasCutsModal ? (
            <span className="shrink-0 text-[9px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
              {product.cuts?.length || 4}+ cuts
            </span>
          ) : product.isMockPrice ? (
            <span className="shrink-0 text-[9px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.2 rounded">
              Temp Mock
            </span>
          ) : null}
        </div>
        <p className="text-[11px] text-neutral-400 mt-0.5 font-normal truncate">
          {product.unit}
        </p>
        <p className="text-[11px] text-neutral-500 line-clamp-2 mt-1 leading-snug">
          {product.description}
        </p>

        {/* Selected Cuts / Tiers In Cart Preview */}
        {product.hasCutsModal && hasCutsInCart && (
          <div className="mt-2 bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-1.5 text-[10px] text-emerald-300 flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium truncate">
              <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">
                {selectedCutsInCart?.length} {selectedCutsInCart?.length === 1 ? (product.isEggProduct ? 'tier' : 'cut') : (product.isEggProduct ? 'tiers' : 'cuts')} selected
              </span>
            </span>
            <span className="text-[9px] text-emerald-400 font-semibold underline shrink-0">
              Edit
            </span>
          </div>
        )}
      </div>

      {/* Bottom: Price in Cedis OR Custom Budget / Portion Input */}
      <div 
        className="mt-3 pt-2.5 border-t border-neutral-800/60 space-y-2"
        onClick={(e) => {
          if (product.isVariablePrice) {
            e.stopPropagation(); // prevent opening cut modal if clicking produce input
          }
        }}
      >
        {product.isVariablePrice ? (
          /* Custom open amount input section for variable produce & mock-priced items */
          <div className="space-y-1.5">
            {/* Temporary mock price banner for sausage & gizzard */}
            {product.isMockPrice && product.price > 0 && (
              <div className="flex items-center justify-between text-[10px] bg-amber-500/10 border border-amber-500/25 px-2 py-1 rounded-lg">
                <span className="font-semibold text-amber-300 flex items-center gap-1">
                  <span>Temp Mock:</span>
                  <span className="text-white font-bold">{STORE_SETTINGS.currency} {product.price.toFixed(2)}</span>
                </span>
                <span className="text-[9px] text-amber-400/90 font-medium">
                  {product.unit.split('(')[0].trim()}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label
                htmlFor={`custom-input-${product.id}`}
                className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1"
              >
                <Coins className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{product.isMockPrice ? 'Your Quantity / Budget:' : 'Your Budget / Portion:'}</span>
              </label>
              <span className="text-[9px] font-medium text-emerald-300/80 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-full">
                {product.isMockPrice ? 'Flexible' : 'Custom'}
              </span>
            </div>

            <div className="relative">
              <input
                id={`custom-input-${product.id}`}
                type="text"
                value={customAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder={product.customAmountPlaceholder || "e.g. GH₵ 50 or 2 kg"}
                className="w-full bg-neutral-950 border border-neutral-700/80 focus:border-emerald-500 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 transition-colors"
              />
            </div>

            {/* Quick suggested amount presets */}
            {product.suggestedAmounts && product.suggestedAmounts.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
                {product.suggestedAmounts.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className={`text-[9.5px] px-1.5 py-0.5 rounded-md border whitespace-nowrap transition-all select-none active:scale-95 ${
                      customAmount === preset
                        ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/60 font-semibold'
                        : 'bg-neutral-800/60 text-neutral-400 border-neutral-700/50 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Fixed / Baseline Price Display */
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
              {product.isEggProduct ? 'Starting from' : product.hasCutsModal ? 'Starting from' : 'Price'}
            </span>
            <span className="text-sm sm:text-base font-bold text-white tracking-tight">
              <span className="text-emerald-400 text-xs sm:text-sm font-semibold mr-0.5">
                {STORE_SETTINGS.currency}
              </span>
              {product.price.toFixed(2)}
            </span>
          </div>
        )}

        {/* Action Row: Quantity Label & Add / Cuts Button */}
        <div className="flex items-center justify-between pt-0.5">
          {product.hasCutsModal ? (
            <span className="text-[11px] font-medium text-neutral-400">
              {hasCutsInCart ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  {product.isEggProduct
                    ? `${selectedCutsInCart?.length} ${selectedCutsInCart?.length === 1 ? 'tier' : 'tiers'}`
                    : 'In basket'}
                </span>
              ) : (
                <span className="text-neutral-400">
                  {product.isEggProduct ? 'Choose tiers' : 'Choose cuts'}
                </span>
              )}
            </span>
          ) : product.isVariablePrice ? (
            <span className="text-[11px] font-medium text-neutral-400">
              {quantityInCart > 0 ? (
                <span className="text-emerald-400 font-semibold">✓ In Cart</span>
              ) : (
                <span className="text-neutral-500">Add to basket</span>
              )}
            </span>
          ) : (
            <div />
          )}

          <div>
            {!product.inStock && quantityInCart === 0 && !hasCutsInCart ? (
              <button
                type="button"
                disabled
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-800/80 text-neutral-500 border border-neutral-750 cursor-not-allowed"
              >
                Out of Stock
              </button>
            ) : product.hasCutsModal ? (
              /* Cuts / Tiers Modal Button */
              <button
                id={`cuts-btn-${product.id}`}
                type="button"
                onClick={handleAddClick}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm ${
                  hasCutsInCart
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-emerald-300 border border-emerald-500/30'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/10'
                }`}
                aria-label={`Select ${product.isEggProduct ? 'tiers' : 'cuts'} for ${product.name}`}
              >
                <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>
                  {hasCutsInCart
                    ? (product.isEggProduct ? 'Edit Tiers' : 'Edit Cuts')
                    : (product.isEggProduct ? 'Select Tiers' : 'Select Cuts')}
                </span>
              </button>
            ) : quantityInCart === 0 ? (
              <button
                id={`add-btn-${product.id}`}
                onClick={handleAddClick}
                disabled={!product.inStock}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm ${
                  isAddingAnimation
                    ? 'bg-emerald-400 text-neutral-950'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/10'
                }`}
                aria-label={`Add ${product.name} to cart`}
              >
                {isAddingAnimation ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Added</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add</span>
                  </>
                )}
              </button>
            ) : (
              <div 
                id={`qty-ctrl-${product.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center bg-neutral-950 border border-emerald-500/40 rounded-xl p-0.5 shadow-inner"
              >
                <button
                  id={`decrease-btn-${product.id}`}
                  onClick={() => onUpdateQuantity(product.id, quantityInCart - 1, customAmount)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors active:scale-90"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3 h-3 stroke-[2.5]" />
                </button>

                <span className="w-6 text-center text-xs font-bold text-emerald-400 select-none">
                  {quantityInCart}
                </span>

                <button
                  id={`increase-btn-${product.id}`}
                  onClick={() => onUpdateQuantity(product.id, quantityInCart + 1, customAmount)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition-colors active:scale-90"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


