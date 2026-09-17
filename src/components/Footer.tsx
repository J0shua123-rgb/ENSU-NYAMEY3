import React from 'react';
import { STORE_SETTINGS } from '../data/products';
import { Lock, HeartHandshake, MapPin, Clock, Phone, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onOpenAdminAuth: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdminAuth }) => {
  return (
    <footer className="mt-12 pt-8 pb-20 border-t border-neutral-800/80 bg-neutral-950/90 text-neutral-400 text-xs">
      <div className="max-w-xl mx-auto px-4 space-y-6">
        {/* Neighborhood Promise & Store Details */}
        <div className="bg-neutral-900/50 rounded-2xl p-4 border border-neutral-800/70 space-y-3">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-emerald-400 shrink-0" />
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
              {STORE_SETTINGS.name} Promise
            </h3>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Freshly frozen poultry, fish, farm-fresh eggs, vegetables, and pantry staples prepared and dispatched from {STORE_SETTINGS.subtitle} in Ashaiman. All orders are packed cold and confirmed directly on WhatsApp for prompt dispatch.
          </p>
          <div className="pt-2 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{STORE_SETTINGS.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{STORE_SETTINGS.openingHours}</span>
            </div>
          </div>
        </div>

        {/* Store Trust Badges */}
        <div className="flex items-center justify-around py-1 text-[11px] text-neutral-400 border-b border-neutral-850 pb-4">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hygienic Cold Store</span>
          </span>
          <span>•</span>
          <span>WhatsApp Instant Confirmation</span>
          <span>•</span>
          <span>Ashaiman & Tema Dispatch</span>
        </div>

        {/* Copyright & Subtle Discreet Admin Lock Icon */}
        <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
          <p>
            © {new Date().getFullYear()} {STORE_SETTINGS.name}. All rights reserved.
          </p>

          {/* Discreet, subtle lock icon in the footer area alongside store details and copyright text */}
          <button
            id="discreet-admin-lock-btn"
            type="button"
            onClick={onOpenAdminAuth}
            className="inline-flex items-center text-neutral-600 hover:text-neutral-400 p-1 rounded transition-colors opacity-70 hover:opacity-100"
            aria-label="Staff Security Portal"
            title="Staff Login"
          >
            <Lock className="w-3 h-3 stroke-[1.75]" />
          </button>
        </div>
      </div>
    </footer>
  );
};
