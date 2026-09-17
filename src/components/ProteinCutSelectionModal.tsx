import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProteinCutOption, SelectedProteinCut } from '../types';
import { STORE_SETTINGS, parseCustomAmountPrice } from '../data/products';
import { X, Check, Layers, AlertCircle, Sparkles, ChevronRight, CheckSquare, Square, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProteinCutSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  existingSelectedCuts?: SelectedProteinCut[];
  onConfirmCuts: (product: Product, selectedCuts: SelectedProteinCut[]) => void;
}

const EMPTY_CUTS: SelectedProteinCut[] = [];

/**
 * Computes price and quantity for egg retail tiers and crates
 */
export function computeEggTierPrice(cut: ProteinCutOption, rawAmount: string): { price: number; formattedAmount: string; qty: number } {
  const cleaned = (rawAmount || '').trim();
  const unitPrice = cut.unitPrice ?? (
    cut.id === 'egg-tier-2' ? 2.0 :
    cut.id === 'egg-tier-250' ? 2.5 :
    cut.id === 'egg-tier-3' ? 3.0 :
    cut.id === 'egg-tier-half-crate' ? 35.0 :
    cut.id === 'egg-tier-full-crate' ? 65.0 : 2.0
  );

  // 1. Direct Cedis budget specified (e.g. "GH₵ 50", "20 cedis", "ghc 25")
  const cediMatch = cleaned.match(/(?:gh[¢c]|cedi|cedis|\$)\s*(\d+(?:\.\d+)?)/i) ||
                    cleaned.match(/(\d+(?:\.\d+)?)\s*(?:cedi|cedis|ghc|gh¢)/i);
  if (cediMatch && cediMatch[1]) {
    const val = parseFloat(cediMatch[1]);
    if (!isNaN(val) && val > 0) {
      const approxQty = Math.floor(val / unitPrice);
      return {
        price: val,
        formattedAmount: `Budget: ${STORE_SETTINGS.currency} ${val.toFixed(2)} (~${approxQty} ${cut.id.includes('crate') ? 'crates' : 'eggs'})`,
        qty: approxQty > 0 ? approxQty : 1,
      };
    }
  }

  // 2. Quantity of eggs or crates specified (e.g. "10 eggs", "1 crate", "2 crates", "15")
  const qtyMatch = cleaned.match(/^(\d+(?:\.\d+)?)/);
  if (qtyMatch && qtyMatch[1]) {
    const qty = parseFloat(qtyMatch[1]);
    if (!isNaN(qty) && qty > 0) {
      const price = qty * unitPrice;
      const isCrate = cut.id.includes('crate');
      const unitLabel = isCrate
        ? (qty === 1 ? 'crate' : 'crates')
        : (qty === 1 ? 'egg' : 'eggs');
      return {
        price,
        formattedAmount: `${qty} ${unitLabel} (${STORE_SETTINGS.currency} ${price.toFixed(2)})`,
        qty,
      };
    }
  }

  // 3. Fallback
  return {
    price: unitPrice,
    formattedAmount: cleaned || `1 ${cut.unitLabel || 'unit'}`,
    qty: 1,
  };
}

export const ProteinCutSelectionModal: React.FC<ProteinCutSelectionModalProps> = ({
  isOpen,
  onClose,
  product,
  existingSelectedCuts = EMPTY_CUTS,
  onConfirmCuts,
}) => {
  const isEgg = !!(product?.isEggProduct || product?.id === 'prot-12');

  // Map of cutId -> boolean
  const [selectedCutIds, setSelectedCutIds] = useState<Record<string, boolean>>(() => {
    const initialSelected: Record<string, boolean> = {};
    if (existingSelectedCuts && existingSelectedCuts.length > 0) {
      for (const item of existingSelectedCuts) {
        initialSelected[item.id] = true;
      }
    } else if (product?.cuts && product.cuts.length > 0) {
      const firstCut = product.cuts[0];
      initialSelected[firstCut.id] = true;
    }
    return initialSelected;
  });

  // Map of cutId -> amount string
  const [cutAmounts, setCutAmounts] = useState<Record<string, string>>(() => {
    const initialAmounts: Record<string, string> = {};
    if (existingSelectedCuts && existingSelectedCuts.length > 0) {
      for (const item of existingSelectedCuts) {
        initialAmounts[item.id] = item.amount;
      }
    } else if (product?.cuts && product.cuts.length > 0) {
      const firstCut = product.cuts[0];
      initialAmounts[firstCut.id] = firstCut.defaultAmount || (isEgg ? '10 eggs' : '1 kg');
    }
    return initialAmounts;
  });

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const cuts = useMemo(() => product?.cuts || [], [product]);
  const selectedCount = Object.values(selectedCutIds).filter(Boolean).length;

  // Live total calculation
  const totalCalculatedCedis = useMemo(() => {
    if (!product) return 0;
    let sum = 0;
    for (const cut of cuts) {
      if (selectedCutIds[cut.id]) {
        const rawAmount = cutAmounts[cut.id] || cut.defaultAmount || '';
        if (isEgg) {
          const res = computeEggTierPrice(cut, rawAmount);
          sum += res.price;
        } else {
          const parsed = parseCustomAmountPrice(rawAmount);
          if (parsed && parsed > 0) {
            sum += parsed;
          }
        }
      }
    }
    return sum;
  }, [cuts, selectedCutIds, cutAmounts, isEgg, product]);

  if (!product || !isOpen) return null;

  const handleToggleCut = (cut: ProteinCutOption) => {
    setSelectedCutIds((prev) => {
      const isCurrentlySelected = !!prev[cut.id];
      const nextState = !isCurrentlySelected;

      if (nextState && !cutAmounts[cut.id]) {
        setCutAmounts((prevAmounts) => ({
          ...prevAmounts,
          [cut.id]: cut.defaultAmount || (isEgg ? (cut.id.includes('crate') ? '1 crate' : '10 eggs') : '1 kg'),
        }));
      }

      return {
        ...prev,
        [cut.id]: nextState,
      };
    });
  };

  const handleAmountChange = (cutId: string, amount: string) => {
    setCutAmounts((prev) => ({
      ...prev,
      [cutId]: amount,
    }));
  };

  const handlePresetClick = (cutId: string, preset: string) => {
    setSelectedCutIds((prev) => ({
      ...prev,
      [cutId]: true,
    }));
    setCutAmounts((prev) => ({
      ...prev,
      [cutId]: preset,
    }));
  };

  // Stepper helper for eggs & portions
  const handleStepQuantity = (cut: ProteinCutOption, delta: number) => {
    const current = cutAmounts[cut.id] || cut.defaultAmount || (cut.id.includes('crate') ? '1 crate' : '10 eggs');
    const isCrate = cut.id.includes('crate');
    
    // Extract current number
    const match = current.match(/^(\d+(?:\.\d+)?)/);
    let currentQty = match ? parseFloat(match[1]) : (isCrate ? 1 : 10);
    if (isNaN(currentQty) || currentQty <= 0) currentQty = isCrate ? 1 : 10;

    let step = isCrate ? 1 : (delta > 0 && currentQty >= 10 ? 5 : delta < 0 && currentQty > 10 ? 5 : 1);
    let newQty = Math.max(1, currentQty + delta * step);

    const unitWord = isCrate
      ? (newQty === 1 ? 'crate' : 'crates')
      : (newQty === 1 ? 'egg' : 'eggs');

    const newAmountStr = `${newQty} ${unitWord}`;

    setSelectedCutIds((prev) => ({ ...prev, [cut.id]: true }));
    setCutAmounts((prev) => ({ ...prev, [cut.id]: newAmountStr }));
  };

  const handleSelectAll = () => {
    const allSelected: Record<string, boolean> = {};
    const updatedAmounts = { ...cutAmounts };
    for (const cut of cuts) {
      allSelected[cut.id] = true;
      if (!updatedAmounts[cut.id]) {
        updatedAmounts[cut.id] = cut.defaultAmount || (isEgg ? '10 eggs' : '1 kg');
      }
    }
    setSelectedCutIds(allSelected);
    setCutAmounts(updatedAmounts);
  };

  const handleDeselectAll = () => {
    setSelectedCutIds({});
  };

  const handleConfirm = () => {
    if (!product) return;

    const finalSelectedCuts: SelectedProteinCut[] = [];

    for (const cut of cuts) {
      if (selectedCutIds[cut.id]) {
        const rawAmount = cutAmounts[cut.id]?.trim() || cut.defaultAmount || (isEgg ? '10 eggs' : '1 portion');

        if (isEgg) {
          const eggResult = computeEggTierPrice(cut, rawAmount);
          finalSelectedCuts.push({
            id: cut.id,
            name: cut.name,
            amount: eggResult.formattedAmount,
            price: eggResult.price,
            unitPrice: cut.unitPrice,
            quantity: eggResult.qty,
          });
        } else {
          const parsedPrice = parseCustomAmountPrice(rawAmount);
          finalSelectedCuts.push({
            id: cut.id,
            name: cut.name,
            amount: rawAmount,
            price: parsedPrice ?? undefined,
          });
        }
      }
    }

    onConfirmCuts(product, finalSelectedCuts);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-2xl bg-neutral-900 border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90dvh] sm:h-auto sm:max-h-[85vh] z-10"
        >
          {/* Header */}
          <div className="relative bg-neutral-950/95 border-b border-neutral-800/80 px-4 py-3.5 sm:p-5 flex items-start justify-between gap-3 shrink-0">
            <div className="flex items-start gap-3 sm:gap-3.5">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {isEgg ? 'Egg Retail Tiers & Crates' : 'Cold Store Cuts & Sub-types'}
                  </span>
                  {product.badge && (
                    <span className="text-[9.5px] sm:text-[10px] text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-md">
                      {product.badge}
                    </span>
                  )}
                </div>

                <h2 className="text-base sm:text-xl font-bold text-white mt-1">
                  {product.name}
                </h2>
                <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                  {isEgg
                    ? 'Select your preferred egg price tier (GH₵ 2, 2.50, 3) or crates, then adjust quantity.'
                    : product.description}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
              aria-label="Close selection modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Prompt / Instructions & Bulk Controls */}
          <div className="px-4 sm:px-6 py-2.5 bg-neutral-950/60 border-b border-neutral-800/60 flex items-center justify-between flex-wrap gap-2 text-xs shrink-0">
            <div className="text-neutral-300 flex items-center gap-1.5 text-[11px] sm:text-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                {isEgg
                  ? 'Choose your desired tier and specify your quantity or budget:'
                  : 'Select your preferred cuts and specify your budget or weight:'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium hover:underline flex items-center gap-1"
              >
                <CheckSquare className="w-3 h-3" />
                Select All
              </button>
              <span className="text-neutral-700">•</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-[11px] text-neutral-400 hover:text-neutral-300 font-medium hover:underline flex items-center gap-1"
              >
                <Square className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>

          {/* Cuts / Tiers Selection List (Scrollable Area) */}
          <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-3 flex-1 min-h-0">
            {cuts.map((cut, idx) => {
              const isSelected = !!selectedCutIds[cut.id];
              const currentAmount = cutAmounts[cut.id] || '';
              const eggCalculation = isEgg ? computeEggTierPrice(cut, currentAmount) : null;

              return (
                <div
                  key={cut.id}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    isSelected
                      ? 'bg-neutral-900/90 border-emerald-500/50 shadow-md shadow-emerald-950/20 ring-1 ring-emerald-500/20'
                      : 'bg-neutral-950/50 border-neutral-800/80 hover:border-neutral-700/80 hover:bg-neutral-900/40'
                  }`}
                >
                  {/* Item Header / Toggle Bar */}
                  <div
                    onClick={() => handleToggleCut(cut)}
                    className="p-3 sm:p-3.5 flex items-start gap-3 cursor-pointer select-none"
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-emerald-500 text-neutral-950'
                          : 'border border-neutral-700 bg-neutral-900 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>

                    {/* Name, Unit Price & Description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-semibold transition-colors ${
                              isSelected ? 'text-white' : 'text-neutral-300'
                            }`}
                          >
                            {cut.name}
                          </h4>
                          {cut.unitPrice && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.2 rounded-md">
                              {STORE_SETTINGS.currency} {cut.unitPrice.toFixed(2)} {cut.unitLabel ? `/${cut.unitLabel}` : ''}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-neutral-500 shrink-0">
                          {isEgg ? `Tier #${idx + 1}` : `Cut #${idx + 1}`}
                        </span>
                      </div>

                      {cut.description && (
                        <p className="text-xs text-neutral-400 mt-0.5 leading-snug">
                          {cut.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Budget Controls (Visible when selected) */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-3 sm:px-3.5 pb-3.5 pt-2 border-t border-neutral-800/60 space-y-2.5 bg-neutral-950/40"
                    >
                      {/* Quantity Stepper & Subtotal (Specialized for Egg Tiers) */}
                      {isEgg && (
                        <div className="flex items-center justify-between gap-2 bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-neutral-300">
                              Quantity:
                            </span>
                            <div className="flex items-center bg-neutral-950 border border-neutral-700/80 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => handleStepQuantity(cut, -1)}
                                className="w-7 h-7 flex items-center justify-center rounded text-neutral-300 hover:text-white hover:bg-neutral-800 active:scale-95 transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2 text-center text-xs font-bold text-emerald-400 min-w-[50px]">
                                {eggCalculation?.qty || 1} {cut.id.includes('crate') ? 'crate' : 'eggs'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleStepQuantity(cut, 1)}
                                className="w-7 h-7 flex items-center justify-center rounded bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold active:scale-95 transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Calculated Tier Total */}
                          {eggCalculation && (
                            <div className="text-right">
                              <span className="text-[10px] text-neutral-400 block">
                                Subtotal:
                              </span>
                              <span className="text-xs font-bold text-white">
                                <span className="text-emerald-400 font-medium mr-0.5">
                                  {STORE_SETTINGS.currency}
                                </span>
                                {eggCalculation.price.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Amount / Budget Input Field */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <label
                            htmlFor={`cut-input-${cut.id}`}
                            className="font-semibold text-emerald-400 flex items-center gap-1.5"
                          >
                            <span>{isEgg ? 'Custom Amount or Budget:' : 'Specify Amount / Portion / Budget:'}</span>
                          </label>
                          <span className="text-[10px] text-neutral-400">
                            {isEgg ? 'e.g. 10 eggs, 1 crate, or GH₵ 30' : 'e.g. 2 kg, GH₵ 60, or 3 pieces'}
                          </span>
                        </div>

                        <div className="relative">
                          <input
                            id={`cut-input-${cut.id}`}
                            type="text"
                            value={currentAmount}
                            onChange={(e) => handleAmountChange(cut.id, e.target.value)}
                            placeholder={cut.placeholder || (isEgg ? 'e.g. 10 eggs or GH₵ 25' : 'e.g. 1 kg or GH₵ 50')}
                            className="w-full bg-neutral-900 border border-neutral-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 transition-colors shadow-inner"
                          />
                        </div>
                      </div>

                      {/* Quick Presets */}
                      {cut.suggestedAmounts && cut.suggestedAmounts.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-[10px] text-neutral-500 font-medium mr-0.5">
                            Quick select:
                          </span>
                          {cut.suggestedAmounts.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handlePresetClick(cut.id, preset)}
                              className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all select-none active:scale-95 ${
                                currentAmount === preset
                                  ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/60 font-semibold'
                                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-800'
                              }`}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Bar (Pinned at bottom, never clipped) */}
          <div className="p-3 sm:p-5 bg-neutral-950 border-t border-neutral-800/80 flex items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-neutral-400">
              {selectedCount > 0 ? (
                <div>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>
                      {selectedCount} {selectedCount === 1 ? (isEgg ? 'Tier' : 'Cut') : (isEgg ? 'Tiers' : 'Cuts')} selected
                    </span>
                  </span>
                  {totalCalculatedCedis > 0 && (
                    <span className="text-[11px] text-neutral-300 block font-medium mt-0.5">
                      Est. Total: <strong className="text-white">{STORE_SETTINGS.currency} {totalCalculatedCedis.toFixed(2)}</strong>
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-amber-400/90 flex items-center gap-1 text-[11px] sm:text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Select at least 1 {isEgg ? 'tier' : 'cut'}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors min-h-[40px] flex items-center justify-center"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={handleConfirm}
                className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 transition-all active:scale-95 shadow-md shadow-emerald-500/10 min-h-[40px]"
              >
                <span>
                  {totalCalculatedCedis > 0
                    ? `Add to Basket • ${STORE_SETTINGS.currency} ${totalCalculatedCedis.toFixed(2)}`
                    : 'Add Selected to Basket'}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
