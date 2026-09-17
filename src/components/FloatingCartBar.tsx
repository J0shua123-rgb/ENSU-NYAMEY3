import React from 'react';
import { ShoppingBag, ChevronUp } from 'lucide-react';
import { STORE_SETTINGS } from '../data/products';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingCartBarProps {
  totalItems: number;
  totalPrice: number;
  onOpenCart: () => void;
}

export const FloatingCartBar: React.FC<FloatingCartBarProps> = ({
  totalItems,
  totalPrice,
  onOpenCart,
}) => {
  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.aside
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 inset-x-4 max-w-lg mx-auto z-40"
          aria-label="Shopping Cart Summary"
        >
          <button
            id="floating-cart-bar-btn"
            onClick={onOpenCart}
            className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 font-semibold p-3.5 rounded-2xl shadow-xl shadow-emerald-950/80 flex items-center justify-between gap-3 border border-emerald-400/40 transition-transform active:scale-[0.99] group"
          >
            {/* Left: Badge + Count */}
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-xl bg-neutral-950/20 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-neutral-950 stroke-[2.5]" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-neutral-950 text-emerald-400 rounded-full text-[10px] font-extrabold flex items-center justify-center">
                  {totalItems}
                </span>
              </div>
              <div className="text-left">
                <div className="text-xs font-medium text-neutral-950/80">
                  {totalItems} {totalItems === 1 ? 'item selected' : 'items selected'}
                </div>
                <div className="text-base font-extrabold text-neutral-950 tracking-tight leading-tight">
                  {STORE_SETTINGS.currency} {totalPrice.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Right: CTA & Expand icon */}
            <div className="flex items-center gap-1.5 pl-3 py-1 pr-1.5 bg-neutral-950/15 rounded-xl text-xs font-bold text-neutral-950 group-hover:bg-neutral-950/25 transition-colors">
              <span>View Cart & Checkout</span>
              <div className="w-5 h-5 rounded-lg bg-neutral-950/20 flex items-center justify-center">
                <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
