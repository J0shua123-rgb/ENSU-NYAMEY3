import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, X, ShieldAlert, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ADMIN_PIN_STORAGE_KEY = 'corner_mart_admin_pin_v1';
export const DEFAULT_ADMIN_PIN = '1234';

export function getStoredAdminPin(): string {
  try {
    const saved = localStorage.getItem(ADMIN_PIN_STORAGE_KEY);
    if (saved && saved.trim().length === 4) {
      return saved.trim();
    }
  } catch {}
  return DEFAULT_ADMIN_PIN;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Reset states on open/close
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setIsShaking(false);
    }
  }, [isOpen]);

  // Validate entered PIN
  const handleValidatePin = useCallback((enteredPin: string) => {
    const currentPin = getStoredAdminPin();
    if (enteredPin === currentPin) {
      setError(null);
      setPin('');
      onSuccess();
    } else {
      setError('Incorrect PIN. Please try again.');
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 600);
    }
  }, [onSuccess]);

  // Handle digit input
  const handleKeyPress = useCallback((digit: string) => {
    if (isShaking) return;
    setError(null);
    setPin((prev) => {
      if (prev.length >= 4) return prev;
      const next = prev + digit;
      if (next.length === 4) {
        // Auto-submit on 4th digit
        setTimeout(() => handleValidatePin(next), 50);
      }
      return next;
    });
  }, [isShaking, handleValidatePin]);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (isShaking) return;
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  }, [isShaking]);

  // Handle clear all
  const handleClear = useCallback(() => {
    if (isShaking) return;
    setError(null);
    setPin('');
  }, [isShaking]);

  // Keyboard support for physical keyboards
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyPress, handleBackspace, handleClear, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md">
      <div 
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            x: isShaking ? [-10, 10, -8, 8, -4, 4, 0] : 0,
          }}
          transition={{
            x: { duration: 0.45, ease: "easeInOut" },
            opacity: { duration: 0.2 },
            scale: { duration: 0.2 },
          }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-xs bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl z-10 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle top decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-emerald-500/40 rounded-full" />

          {/* Close button */}
          <button
            id="close-admin-pin-modal"
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-800/60 hover:bg-neutral-800 transition-colors"
            aria-label="Close authentication"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="text-center pt-2">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
              <Lock className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Staff Portal Access
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Enter the 4-digit security PIN to unlock the store management terminal.
            </p>
          </div>

          {/* PIN Digit Indicators */}
          <div className="my-6 flex justify-center items-center gap-3">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    isShaking
                      ? 'bg-rose-500 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                      : isFilled
                      ? 'bg-emerald-400 border border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.7)] scale-110'
                      : 'bg-neutral-800 border border-neutral-700'
                  }`}
                />
              );
            })}
          </div>

          {/* Error Message */}
          <div className="h-6 flex items-center justify-center mb-3">
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20"
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            ) : (
              <span className="text-[11px] text-neutral-500 font-medium">
                Default Staff PIN: <code className="text-neutral-400 bg-neutral-800 px-1 py-0.2 rounded font-mono">1234</code>
              </span>
            )}
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                id={`pin-key-${num}`}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="h-12 rounded-2xl bg-neutral-800/80 hover:bg-neutral-750 active:bg-neutral-700 text-white font-semibold text-lg flex items-center justify-center border border-neutral-750 transition-all active:scale-95 shadow-sm"
              >
                {num}
              </button>
            ))}

            {/* Clear / C */}
            <button
              id="pin-key-clear"
              type="button"
              onClick={handleClear}
              className="h-12 rounded-2xl bg-neutral-800/50 hover:bg-neutral-800 active:bg-neutral-750 text-neutral-400 hover:text-neutral-200 font-medium text-xs uppercase tracking-wider flex items-center justify-center border border-neutral-800 transition-all active:scale-95"
            >
              Clear
            </button>

            {/* Zero */}
            <button
              id="pin-key-0"
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-12 rounded-2xl bg-neutral-800/80 hover:bg-neutral-750 active:bg-neutral-700 text-white font-semibold text-lg flex items-center justify-center border border-neutral-750 transition-all active:scale-95 shadow-sm"
            >
              0
            </button>

            {/* Backspace */}
            <button
              id="pin-key-backspace"
              type="button"
              onClick={handleBackspace}
              className="h-12 rounded-2xl bg-neutral-800/50 hover:bg-neutral-800 active:bg-neutral-750 text-neutral-400 hover:text-rose-300 flex items-center justify-center border border-neutral-800 transition-all active:scale-95"
              aria-label="Delete last digit"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-500">
            <span className="flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-emerald-400" />
              <span>Corner Mart Secure Admin</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
