import React from 'react';
import { STORE_SETTINGS } from '../data/products';
import { 
  X, 
  MapPin, 
  Clock, 
  Phone, 
  Truck, 
  ShieldCheck, 
  Store,
  BadgePercent
} from 'lucide-react';
import { motion } from 'motion/react';

interface StoreInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreInfoModal: React.FC<StoreInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl z-10 space-y-4 text-neutral-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {STORE_SETTINGS.name}
              </h2>
              <p className="text-xs text-neutral-400">
                {STORE_SETTINGS.tagline}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Rows */}
        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-3 p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/80">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-neutral-200">Store Location</div>
              <div className="text-neutral-400 mt-0.5">{STORE_SETTINGS.location}</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/80">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-neutral-200">Opening Hours</div>
              <div className="text-neutral-400 mt-0.5">{STORE_SETTINGS.openingHours}</div>
              <div className="text-emerald-400 text-[11px] font-medium mt-1">Open 7 Days a Week</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/80">
            <Truck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-neutral-200">Delivery Coverage</div>
              <div className="text-neutral-400 mt-0.5">
                {STORE_SETTINGS.deliveryCoverage}
              </div>
              <div className="text-neutral-400 text-[11px] mt-1">
                Standard delivery: <strong className="text-white">GH₵ {STORE_SETTINGS.deliveryFee.toFixed(2)}</strong> (Est. {STORE_SETTINGS.deliveryEst})
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/80">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-neutral-200">Payment Methods</div>
              <div className="text-neutral-400 mt-0.5">
                Cash on Delivery, Mobile Money (MTN MoMo, Telecel Cash, AT Money), or Pay at Pickup.
              </div>
            </div>
          </div>
        </div>

        {/* Quick Contacts */}
        <div className="pt-2 flex items-center gap-2">
          <a
            href={`tel:${STORE_SETTINGS.whatsappDisplay}`}
            className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Call Store</span>
          </a>

          <a
            href={`https://wa.me/${STORE_SETTINGS.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
};
