import React, { useState } from 'react';
import { CartItem, OrderCustomerInfo, SelectedProteinCut, Product } from '../types';
import { STORE_SETTINGS, parseCustomAmountPrice, calculateCustomItemPrice } from '../data/products';
import { computeEggTierPrice } from './ProteinCutSelectionModal';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  MessageCircle, 
  Copy, 
  Check, 
  MapPin, 
  Truck, 
  Store, 
  ArrowRight,
  Sparkles,
  PhoneCall,
  CreditCard,
  Banknote,
  Coins,
  Edit3,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number, customAmount?: string) => void;
  onClearCart: () => void;
  onUpdateCustomAmount?: (productId: string, customAmount: string) => void;
  onUpdateProteinCuts?: (productId: string, selectedCuts: SelectedProteinCut[]) => void;
  onOpenCutsModal?: (product: Product) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onClearCart,
  onUpdateCustomAmount,
  onUpdateProteinCuts,
  onOpenCutsModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [customPhone, setCustomPhone] = useState(STORE_SETTINGS.whatsappNumber);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // Customer order info state
  const [customerInfo, setCustomerInfo] = useState<OrderCustomerInfo>({
    name: '',
    phone: '',
    deliveryType: 'delivery',
    address: '',
    paymentMethod: 'Cash on Delivery',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<{ name?: string }>({});

  // Handlers for single cut edits within cart
  const handleUpdateCutAmount = (productId: string, cutId: string, newAmount: string) => {
    if (!onUpdateProteinCuts) return;
    const item = cartItems.find((i) => i.product.id === productId);
    if (!item || !item.selectedCuts) return;

    let parsedPrice: number | undefined;
    if (item.product.isEggProduct) {
      const cutDef = item.product.cuts?.find((c) => c.id === cutId);
      if (cutDef) {
        const res = computeEggTierPrice(cutDef, newAmount);
        parsedPrice = res.price;
      }
    } else {
      parsedPrice = parseCustomAmountPrice(newAmount) ?? undefined;
    }

    const updatedCuts = item.selectedCuts.map((cut) =>
      cut.id === cutId
        ? {
            ...cut,
            amount: newAmount,
            price: parsedPrice,
          }
        : cut
    );

    onUpdateProteinCuts(productId, updatedCuts);
  };

  const handleRemoveSingleCut = (productId: string, cutId: string) => {
    const item = cartItems.find((i) => i.product.id === productId);
    if (!item || !item.selectedCuts) return;

    const remainingCuts = item.selectedCuts.filter((cut) => cut.id !== cutId);
    if (remainingCuts.length === 0) {
      // If no cuts left, remove the item completely
      onUpdateQuantity(productId, 0);
    } else if (onUpdateProteinCuts) {
      onUpdateProteinCuts(productId, remainingCuts);
    }
  };

  // Calculations: support variable items with custom pricing, protein cuts, and fixed items
  const subtotal = cartItems.reduce((sum, item) => {
    if (item.selectedCuts && item.selectedCuts.length > 0) {
      const cutsPriceSum = item.selectedCuts.reduce((cSum, c) => cSum + (c.price || 0), 0);
      return sum + cutsPriceSum;
    }
    if (item.product.isVariablePrice) {
      const price = item.customPrice ?? (item.product.price > 0 ? item.product.price : 0);
      return sum + price * item.quantity;
    }
    return sum + item.product.price * item.quantity;
  }, 0);

  const hasUnpricedCustomItems = cartItems.some((item) => {
    if (item.selectedCuts && item.selectedCuts.length > 0) {
      return item.selectedCuts.some((c) => !c.price || c.price <= 0);
    }
    if (item.product.isVariablePrice) {
      if (item.product.isMockPrice && item.product.price > 0) return false;
      return !item.customPrice || item.customPrice <= 0;
    }
    return false;
  });

  const deliveryCost = customerInfo.deliveryType === 'delivery' ? STORE_SETTINGS.deliveryFee : 0;
  const grandTotal = subtotal + deliveryCost;
  const totalItemsCount = cartItems.reduce((sum, item) => {
    if (item.selectedCuts && item.selectedCuts.length > 0) {
      return sum + item.selectedCuts.length;
    }
    return sum + item.quantity;
  }, 0);

  // Format WhatsApp Text with clear custom budget/portion specifications and protein cuts
  const generateWhatsAppMessage = () => {
    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const itemsList = cartItems
      .map((item, index) => {
        // Egg retail tiers & crates
        if (item.product.isEggProduct && item.selectedCuts && item.selectedCuts.length > 0) {
          const tiersListText = item.selectedCuts
            .map((c) => `   ↳ *${c.name}:* ${c.amount}${c.price && c.price > 0 ? ` (${STORE_SETTINGS.currency} ${c.price.toFixed(2)})` : ''}`)
            .join('\n');

          const tiersPriceSum = item.selectedCuts.reduce((cSum, c) => cSum + (c.price || 0), 0);
          const priceLine = tiersPriceSum > 0
            ? `   Tiers Subtotal: *${STORE_SETTINGS.currency} ${tiersPriceSum.toFixed(2)}*`
            : `   (Pending confirmation of egg count)`;

          return `${index + 1}. *${item.product.name}* 🥚 [RETAIL TIERS & CRATES]
${tiersListText}
${priceLine}`;
        }

        // Standard Cold Store Protein Cuts
        if (item.selectedCuts && item.selectedCuts.length > 0) {
          const cutsListText = item.selectedCuts
            .map((c) => `   ↳ *${c.name}:* "${c.amount}"${c.price && c.price > 0 ? ` (${STORE_SETTINGS.currency} ${c.price.toFixed(2)})` : ''}`)
            .join('\n');

          const cutsPriceSum = item.selectedCuts.reduce((cSum, c) => cSum + (c.price || 0), 0);
          const priceLine =
            cutsPriceSum > 0
              ? `   Est. Cuts Subtotal: *${STORE_SETTINGS.currency} ${cutsPriceSum.toFixed(2)}*`
              : `   (Pending cold store scale quote for portion weight)`;

          return `${index + 1}. *${item.product.name}* 🍗 [COLD STORE CUTS & PORTIONS]
${cutsListText}
${priceLine}`;
        }

        // Variable fresh produce, custom budget items (Lobster, Beef), or mock-priced items (Sausage, Gizzard)
        if (item.product.isVariablePrice) {
          const customDetail = item.customAmount?.trim() || 'Custom amount requested';
          const calculatedItemPrice = item.customPrice ?? (item.product.price > 0 ? item.product.price : 0);
          const totalItemPrice = calculatedItemPrice * item.quantity;

          const mockPriceNotice = item.product.isMockPrice && item.product.price > 0
            ? `\n   ↳ *Temp Mock Ref:* ${STORE_SETTINGS.currency} ${item.product.price.toFixed(2)} (${item.product.unit.split('(')[0].trim()})`
            : '';

          const priceLine =
            totalItemPrice > 0
              ? `   Qty: ${item.quantity} × ${STORE_SETTINGS.currency} ${calculatedItemPrice.toFixed(2)} = *${STORE_SETTINGS.currency} ${totalItemPrice.toFixed(2)}*`
              : `   Qty: ${item.quantity} (Pending market quote based on portion)`;

          const tag = item.product.isMockPrice
            ? '🌭 [TEMP MOCK PRICING & SPECIFICATION]'
            : item.product.id === 'prot-7' || item.product.id === 'prot-11'
            ? '🥩 [FLEXIBLE CUSTOM BUDGET / AMOUNT]'
            : '🟢 [CUSTOM BUDGET / PORTION]';

          return `${index + 1}. *${item.product.name}* ${tag}
   ↳ *Requested Budget / Portion:* "${customDetail}"${mockPriceNotice}
${priceLine}`;
        }

        // Standard fixed item
        return `${index + 1}. *${item.product.name}*
   Qty: ${item.quantity} × ${STORE_SETTINGS.currency} ${item.product.price.toFixed(2)} = *${STORE_SETTINGS.currency} ${(item.product.price * item.quantity).toFixed(2)}* (${item.product.unit})`;
      })
      .join('\n\n');

    // 1. Egg retail tiers breakdown notice
    const eggTierItems = cartItems.filter(
      (item) => item.product.isEggProduct && item.selectedCuts && item.selectedCuts.length > 0
    );
    const eggTiersNotice =
      eggTierItems.length > 0
        ? `\n\n🥚 *EGG RETAIL TIERS & CRATES SPECIFICATION:*
${eggTierItems
  .map(
    (item) =>
      `• *${item.product.name}:*\n${item.selectedCuts!
        .map((c) => `  - ${c.name}: ${c.amount}`)
        .join('\n')}`
  )
  .join('\n\n')}`
        : '';

    // 2. Cold Store butchery cuts notice (excluding eggs)
    const proteinCutsItems = cartItems.filter(
      (item) => !item.product.isEggProduct && item.selectedCuts && item.selectedCuts.length > 0
    );
    const proteinCutsNotice =
      proteinCutsItems.length > 0
        ? `\n\n🥩 *COLD STORE BUTCHERY & PACKAGING INSTRUCTIONS:*
${proteinCutsItems
  .map(
    (item) =>
      `• *${item.product.name} (${item.selectedCuts!.length} cut${item.selectedCuts!.length > 1 ? 's' : ''}):*\n${item.selectedCuts!
        .map((c) => `  - ${c.name}: "${c.amount}"`)
        .join('\n')}`
  )
  .join('\n\n')}
(Please butcher, clean, and pack according to requested cuts)`
        : '';

    // 3. Custom budget & flexible produce notice (including Beef, Lobster, Sausage, Gizzard)
    const variableBudgetItems = cartItems.filter((item) => item.product.isVariablePrice);
    const customItemsNotice =
      variableBudgetItems.length > 0
        ? `\n\n📌 *SPECIAL BUDGET & PORTION INSTRUCTIONS:*
The customer requested specific custom budgets or portions:
${variableBudgetItems
  .map((i) => `• ${i.product.name}: *"${i.customAmount || 'Standard'}"*${i.product.isMockPrice ? ` (Temp mock: ${STORE_SETTINGS.currency} ${i.product.price.toFixed(2)})` : ''}`)
  .join('\n')}
(Please measure & pack fresh according to the requested budgets)`
        : '';

    const customerDetailsLines = [
      `• *Name:* ${customerInfo.name.trim() || 'Valued Customer'}`,
      customerInfo.phone.trim() ? `• *Contact:* ${customerInfo.phone.trim()}` : null,
      `• *Order Type:* ${customerInfo.deliveryType === 'delivery' ? '🛵 Home Delivery' : '🏬 Store Pickup'}`,
      customerInfo.deliveryType === 'delivery' && customerInfo.address.trim()
        ? `• *Delivery Address / Landmark:* ${customerInfo.address.trim()}`
        : null,
      `• *Payment Method:* ${customerInfo.paymentMethod}`,
      customerInfo.notes?.trim() ? `• *Notes:* ${customerInfo.notes.trim()}` : null,
    ].filter(Boolean).join('\n');

    const customerSection = `*Customer Details:*\n${customerDetailsLines}`;

    const totalLine = hasUnpricedCustomItems
      ? `💰 *ESTIMATED TOTAL: ${STORE_SETTINGS.currency} ${grandTotal.toFixed(2)} (+ custom portions to confirm)*`
      : `💰 *GRAND TOTAL: ${STORE_SETTINGS.currency} ${grandTotal.toFixed(2)}*`;

    const message = `🛒 *NEW ORDER - ${STORE_SETTINGS.name} (${STORE_SETTINGS.subtitle})*
📍 *Store:* ${STORE_SETTINGS.locationShort}
📅 ${dateStr}
----------------------------------------
${customerSection}

----------------------------------------
📦 *ITEMS ORDERED (${totalItemsCount} total):*
${itemsList}${eggTiersNotice}${proteinCutsNotice}${customItemsNotice}

----------------------------------------
🧾 *PAYMENT BREAKDOWN:*
• Subtotal: ${STORE_SETTINGS.currency} ${subtotal.toFixed(2)}${hasUnpricedCustomItems ? ' (plus custom portions)' : ''}
• Delivery Fee: ${deliveryCost > 0 ? `${STORE_SETTINGS.currency} ${deliveryCost.toFixed(2)}` : 'FREE (Pickup)'}
${totalLine}
----------------------------------------

Please confirm this order, current stock, and estimated dispatch time. Thank you!`;

    return message;
  };


  const validateForm = () => {
    const errors: { name?: string } = {};
    if (!customerInfo.name.trim()) {
      errors.name = 'Please provide your name for the order';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleWhatsAppCheckout = () => {
    if (!validateForm()) {
      const inputEl = document.getElementById('customer-name-input');
      if (inputEl) {
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputEl.focus();
      }
      return;
    }

    const message = generateWhatsAppMessage();
    const cleanPhone = customPhone.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    // Open WhatsApp link in new tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyOrderText = () => {
    const message = generateWhatsAppMessage();
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex justify-center pointer-events-none">
        {/* Drawer Container (Mobile-first bottom sheet that stretches or centers on desktop) */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="pointer-events-auto w-full max-w-lg h-full max-h-[92vh] sm:max-h-[85vh] mt-auto sm:my-auto bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-100"
        >
          {/* Top handle visual on mobile */}
          <div className="w-12 h-1.5 bg-neutral-700/60 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

          {/* Drawer Header */}
          <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">
                  Your Basket
                </h2>
                <p className="text-xs text-neutral-400">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} ready for checkout
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cartItems.length > 0 && (
                <button
                  id="clear-cart-btn"
                  onClick={onClearCart}
                  className="px-2.5 py-1 text-xs text-neutral-400 hover:text-rose-400 transition-colors flex items-center gap-1 rounded-lg hover:bg-neutral-800"
                  title="Remove all items from cart"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
              <button
                id="close-cart-drawer-btn"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                aria-label="Close cart"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 no-scrollbar">
            {cartItems.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-neutral-500 mb-3">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h3 className="text-base font-semibold text-neutral-200">
                  Your basket is empty
                </h3>
                <p className="text-xs text-neutral-400 max-w-xs mt-1 mb-5">
                  Browse our fresh vegetables, provisions, drinks, and snacks to start filling your basket.
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">
                    <span>Selected Items</span>
                    <span>Subtotal</span>
                  </div>

                  {cartItems.map((item) => (
                    <div
                      key={item.product.id}
                      id={`cart-item-${item.product.id}`}
                      className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-3 flex items-center gap-3 transition-colors hover:border-neutral-700"
                    >
                      {/* Thumbnail */}
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-xl object-cover bg-neutral-900 border border-neutral-800 shrink-0"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-semibold text-neutral-100 truncate" title={item.product.name}>
                            {item.product.name}
                          </h4>
                          {item.product.isEggProduct && item.selectedCuts && item.selectedCuts.length > 0 ? (
                            <span className="shrink-0 text-[9px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded flex items-center gap-1">
                              <Layers className="w-2.5 h-2.5" />
                              <span>{item.selectedCuts.length} {item.selectedCuts.length === 1 ? 'Tier' : 'Tiers'}</span>
                            </span>
                          ) : item.selectedCuts && item.selectedCuts.length > 0 ? (
                            <span className="shrink-0 text-[9px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded flex items-center gap-1">
                              <Layers className="w-2.5 h-2.5" />
                              <span>{item.selectedCuts.length} Cuts</span>
                            </span>
                          ) : item.product.isMockPrice ? (
                            <span className="shrink-0 text-[9px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded">
                              Temp Mock
                            </span>
                          ) : item.product.isVariablePrice ? (
                            <span className="shrink-0 text-[9px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                              Custom Budget
                            </span>
                          ) : null}
                        </div>
                        
                        {/* Protein Cuts OR Egg Tiers Selection Listing */}
                        {item.selectedCuts && item.selectedCuts.length > 0 ? (
                          <div className="mt-2 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                <span>{item.product.isEggProduct ? 'Egg Tiers & Crates:' : 'Cuts & Portions:'}</span>
                              </span>
                              {onOpenCutsModal && (
                                <button
                                  type="button"
                                  onClick={() => onOpenCutsModal(item.product)}
                                  className="text-[9.5px] text-emerald-400 hover:text-emerald-300 font-semibold underline flex items-center gap-0.5"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                  <span>{item.product.isEggProduct ? 'Edit tiers in modal' : 'Edit cuts in modal'}</span>
                                </button>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              {item.selectedCuts.map((cut) => (
                                <div
                                  key={cut.id}
                                  className="bg-neutral-900/90 border border-neutral-800/80 rounded-xl p-2 text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-semibold text-neutral-200 text-[11px] truncate">
                                      {cut.name}
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {cut.price && cut.price > 0 && (
                                        <span className="text-[10.5px] font-bold text-emerald-400">
                                          {STORE_SETTINGS.currency} {cut.price.toFixed(2)}
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSingleCut(item.product.id, cut.id)}
                                        className="text-neutral-500 hover:text-rose-400 p-0.5 transition-colors"
                                        title={`Remove ${cut.name}`}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-neutral-400 shrink-0">
                                      {item.product.isEggProduct ? 'Count:' : 'Portion:'}
                                    </span>
                                    <input
                                      type="text"
                                      value={cut.amount}
                                      onChange={(e) => handleUpdateCutAmount(item.product.id, cut.id, e.target.value)}
                                      placeholder={item.product.isEggProduct ? "e.g. 10 eggs or 1 crate" : "e.g. 1 kg or GH₵ 50"}
                                      className="w-full bg-neutral-950 border border-neutral-700/80 focus:border-emerald-500 rounded-md px-2 py-0.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.product.id, 0)}
                                className="text-[10.5px] text-rose-400/80 hover:text-rose-300 flex items-center gap-1 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remove {item.product.name}</span>
                              </button>
                              {onOpenCutsModal && (
                                <button
                                  type="button"
                                  onClick={() => onOpenCutsModal(item.product)}
                                  className="text-[10.5px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>{item.product.isEggProduct ? 'Add more tiers' : 'Add more cuts'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ) : item.product.isVariablePrice ? (
                          /* Variable Produce / Flexible Budget / Mock Price Input */
                          <div className="mt-1.5 bg-neutral-900/90 border border-neutral-800 rounded-xl p-2 space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                                <Coins className="w-3 h-3" />
                                <span>{item.product.isMockPrice ? 'Quantity / Custom Budget:' : 'Budget / Portion:'}</span>
                              </span>
                              {item.product.isMockPrice && item.product.price > 0 && (
                                <span className="text-[9px] text-amber-300 font-semibold bg-amber-500/10 px-1 rounded">
                                  Mock: {STORE_SETTINGS.currency} {item.product.price.toFixed(2)}/{item.product.unit.split('(')[0].trim()}
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={item.customAmount || ''}
                              onChange={(e) => onUpdateCustomAmount?.(item.product.id, e.target.value)}
                              placeholder={item.product.customAmountPlaceholder || "e.g. GH₵ 50 or 2 packs"}
                              className="w-full bg-neutral-950 border border-neutral-700/80 focus:border-emerald-500 rounded-lg px-2 py-1 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 transition-colors"
                            />
                          </div>
                        ) : (
                          <p className="text-[11px] text-neutral-400">
                            {STORE_SETTINGS.currency} {item.product.price.toFixed(2)} • {item.product.unit}
                          </p>
                        )}

                        {/* Controls for Non-Cuts Items */}
                        {(!item.selectedCuts || item.selectedCuts.length === 0) && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center bg-neutral-900 border border-neutral-700/80 rounded-lg p-0.5">
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1, item.customAmount)}
                                className="w-6 h-6 flex items-center justify-center rounded text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                                aria-label="Decrease quantity"
                              >
                                {item.quantity === 1 ? (
                                  <Trash2 className="w-3 h-3 text-rose-400" />
                                ) : (
                                  <Minus className="w-3 h-3" />
                                )}
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-emerald-400">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.customAmount)}
                                className="w-6 h-6 flex items-center justify-center rounded text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-[11px] text-neutral-500">
                              {item.product.isVariablePrice
                                ? item.customPrice && item.customPrice > 0
                                  ? `${item.quantity} × ${STORE_SETTINGS.currency} ${item.customPrice.toFixed(2)}`
                                  : `${item.quantity} × (portion)`
                                : `${item.quantity} × ${item.product.price.toFixed(2)}`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right shrink-0">
                        {item.selectedCuts && item.selectedCuts.length > 0 ? (
                          (() => {
                            const cutsSum = item.selectedCuts.reduce((s, c) => s + (c.price || 0), 0);
                            return cutsSum > 0 ? (
                              <div>
                                <div className="text-sm font-bold text-white">
                                  <span className="text-emerald-400 text-xs font-medium mr-0.5">
                                    {STORE_SETTINGS.currency}
                                  </span>
                                  {cutsSum.toFixed(2)}
                                </div>
                                <span className="text-[9px] text-emerald-400/80 block">
                                  {item.product.isEggProduct ? 'Tiers Total' : 'Est. Cuts'}
                                </span>
                              </div>
                            ) : (
                              <div>
                                <div className="text-xs font-semibold text-amber-400">
                                  Pending
                                </div>
                                <span className="text-[9px] text-neutral-500 block">
                                  {item.product.isEggProduct ? 'Count quote' : 'Scale quote'}
                                </span>
                              </div>
                            );
                          })()
                        ) : item.product.isVariablePrice ? (
                          item.customPrice && item.customPrice > 0 ? (
                            <div>
                              <div className="text-sm font-bold text-white">
                                <span className="text-emerald-400 text-xs font-medium mr-0.5">
                                  {STORE_SETTINGS.currency}
                                </span>
                                {(item.customPrice * item.quantity).toFixed(2)}
                              </div>
                              <span className="text-[9.5px] text-emerald-400/80 block">
                                {item.product.isMockPrice ? 'Mock Total' : 'Budget'}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <div className="text-xs font-semibold text-amber-400">
                                Pending
                              </div>
                              <span className="text-[9px] text-neutral-500 block">
                                Store quote
                              </span>
                            </div>
                          )
                        ) : (
                          <div className="text-sm font-bold text-white">
                            <span className="text-emerald-400 text-xs font-medium mr-0.5">
                              {STORE_SETTINGS.currency}
                            </span>
                            {(item.product.price * item.quantity).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery & Customer Checkout Details */}
                <div className="bg-neutral-950/40 border border-neutral-800/90 rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-emerald-400" />
                      Delivery & Order Details
                    </h3>
                    <span className="text-[11px] text-neutral-400">
                      Included in WhatsApp text
                    </span>
                  </div>

                  {/* Delivery vs Pickup switch */}
                  <div className="grid grid-cols-2 gap-2 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setCustomerInfo((prev) => ({ ...prev, deliveryType: 'delivery' }))}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                        customerInfo.deliveryType === 'delivery'
                          ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Delivery (+GH₵ {STORE_SETTINGS.deliveryFee})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerInfo((prev) => ({ ...prev, deliveryType: 'pickup' }))}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                        customerInfo.deliveryType === 'pickup'
                          ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Store Pickup (Free)</span>
                    </button>
                  </div>

                  {/* Inputs */}
                  <div className="space-y-2.5 text-xs">
                    {/* Customer Name */}
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        Your Name <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        id="customer-name-input"
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => {
                          setCustomerInfo((prev) => ({ ...prev, name: e.target.value }));
                          if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                        }}
                        placeholder="e.g. Kwame Mensah / Akosua"
                        className={`w-full px-3 py-2 bg-neutral-900 border rounded-xl text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs ${
                          formErrors.name ? 'border-rose-500' : 'border-neutral-800'
                        }`}
                      />
                      {formErrors.name && (
                        <p className="text-[11px] text-rose-400 mt-0.5">{formErrors.name}</p>
                      )}
                    </div>

                    {/* Phone (optional) */}
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        Contact Phone <span className="text-neutral-500 text-[11px] font-normal">(Optional)</span>
                      </label>
                      <input
                        id="customer-phone-input"
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="e.g. 024 123 4567 (optional)"
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                      />
                    </div>

                    {/* Delivery Address / Landmark (optional) */}
                    {customerInfo.deliveryType === 'delivery' && (
                      <div>
                        <label className="block text-neutral-300 font-medium mb-1">
                          Delivery Address & Landmark <span className="text-neutral-500 text-[11px] font-normal">(Optional)</span>
                        </label>
                        <input
                          id="customer-address-input"
                          type="text"
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo((prev) => ({ ...prev, address: e.target.value }))}
                          placeholder="e.g. Near Ashaiman Main Station / Market Square, House #14 (optional)"
                          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                        />
                      </div>
                    )}

                    {/* Payment Method */}
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        Payment Preference
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setCustomerInfo((prev) => ({ ...prev, paymentMethod: 'Cash on Delivery' }))}
                          className={`flex items-center gap-1.5 p-2 rounded-xl border text-[11px] font-medium text-left transition-all ${
                            customerInfo.paymentMethod === 'Cash on Delivery'
                              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <Banknote className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Cash on Delivery</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomerInfo((prev) => ({ ...prev, paymentMethod: 'Mobile Money (MTN / Telecel / AT)' }))}
                          className={`flex items-center gap-1.5 p-2 rounded-xl border text-[11px] font-medium text-left transition-all ${
                            customerInfo.paymentMethod === 'Mobile Money (MTN / Telecel / AT)'
                              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Mobile Money (MoMo)</span>
                        </button>
                      </div>
                    </div>

                    {/* Special Instructions */}
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        Special Instructions (Optional)
                      </label>
                      <input
                        type="text"
                        value={customerInfo.notes}
                        onChange={(e) => setCustomerInfo((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="e.g. Please call before arriving, ring door bell"
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* WhatsApp destination phone number setting (toggleable) */}
                <div className="text-[11px] text-neutral-400 bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Store WhatsApp:</span>
                    <strong className="text-neutral-200">+{customPhone}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(!isEditingPhone)}
                    className="text-emerald-400 hover:underline shrink-0 ml-2"
                  >
                    {isEditingPhone ? 'Done' : 'Change Number'}
                  </button>
                </div>

                {isEditingPhone && (
                  <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1.5">
                    <label className="text-[11px] text-neutral-300">
                      Customize Store WhatsApp Number (Country code + digits, e.g. 233241234567):
                    </label>
                    <input
                      type="text"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      placeholder="e.g. 233241234567"
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white"
                    />
                  </div>
                )}

                {/* Optional Message Preview Accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowTextPreview(!showTextPreview)}
                    className="text-[11px] text-neutral-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                  >
                    <span>{showTextPreview ? 'Hide' : 'Preview'} WhatsApp text formatting</span>
                    <span className="text-neutral-500">({showTextPreview ? '▲' : '▼'})</span>
                  </button>

                  {showTextPreview && (
                    <div className="mt-2 p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-[11px] font-mono text-neutral-300 whitespace-pre-line leading-relaxed select-all max-h-48 overflow-y-auto">
                      {generateWhatsAppMessage()}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer & WhatsApp Checkout CTA */}
          {cartItems.length > 0 && (
            <div className="px-5 py-4 border-t border-neutral-800 bg-neutral-950/90 shrink-0 space-y-3">
              {/* Price summary row */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Items Subtotal</span>
                  <span className="text-neutral-200 font-medium">
                    {STORE_SETTINGS.currency} {subtotal.toFixed(2)}
                    {hasUnpricedCustomItems && (
                      <span className="text-[10px] text-amber-400 ml-1">(+ custom portions)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Delivery</span>
                  <span>
                    {deliveryCost > 0 ? `${STORE_SETTINGS.currency} ${deliveryCost.toFixed(2)}` : 'FREE (Pickup)'}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-white pt-1.5 border-t border-neutral-800">
                  <span>Total Amount</span>
                  <span className="text-emerald-400">
                    {STORE_SETTINGS.currency} {grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Main Prominent WhatsApp Checkout Button */}
              <button
                id="whatsapp-checkout-btn"
                onClick={handleWhatsAppCheckout}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 font-bold text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] group"
              >
                {/* SVG WhatsApp Brand Icon */}
                <svg
                  className="w-5 h-5 fill-neutral-950"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.301-.15-1.78-.877-2.056-.977-.276-.1-.477-.15-.678.15-.2.3-.778.978-.954 1.179-.176.2-.351.226-.652.075s-1.27-.468-2.42-1.493c-.894-.798-1.497-1.784-1.673-2.085-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.301-.501.101-.2.05-.376-.025-.526-.075-.15-.678-1.635-.929-2.238-.244-.588-.493-.508-.678-.517-.176-.008-.376-.01-.577-.01s-.527.075-.803.376c-.276.301-1.054 1.03-1.054 2.512s1.079 2.913 1.23 3.114c.15.2 2.124 3.243 5.146 4.55 3.022 1.307 3.022.871 3.573.816.551-.055 1.78-.727 2.031-1.43.251-.703.251-1.305.176-1.43-.075-.125-.276-.201-.577-.351z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.103 1.509 5.834L.102 23.364l5.702-1.495C7.464 22.955 9.68 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.848 0-3.577-.502-5.071-1.378l-.364-.213-3.771.989.998-3.676-.233-.371A9.957 9.957 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z" />
                </svg>
                <span>Order via WhatsApp ({STORE_SETTINGS.currency} {grandTotal.toFixed(2)})</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Secondary Helper: Copy Order Text */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleCopyOrderText}
                  className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-200 transition-colors py-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Order text copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Order Text</span>
                    </>
                  )}
                </button>

                <span className="text-[11px] text-neutral-500">
                  Pre-filled message opens in WhatsApp
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
