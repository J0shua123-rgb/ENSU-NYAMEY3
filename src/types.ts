export interface ProteinCutOption {
  id: string;
  name: string;
  description?: string;
  suggestedAmounts?: string[]; // e.g. ["1 kg", "2 kg", "GH₵ 50", "GH₵ 100"]
  placeholder?: string; // e.g. "e.g. 2 kg or GH₵ 50"
  defaultAmount?: string; // e.g. "1 kg" or "GH₵ 50"
  unitPrice?: number; // Specific price for this tier or cut (e.g. 2.00, 2.50, 3.00, 35.00, 65.00)
  unitLabel?: string; // e.g. "per egg", "15 eggs tray", "30 eggs crate"
  isTier?: boolean; // Flag indicating a pricing tier (such as retail egg tiers)
}

export interface SelectedProteinCut {
  id: string;
  name: string;
  amount: string; // e.g. "2 kg", "GH₵ 50", "10 eggs (GH₵ 25.00)"
  price?: number; // Parsed numeric Cedis value if customer specified a budget or tier calculation
  unitPrice?: number; // Base tier price if applicable
  quantity?: number; // Count if specified
}

export interface Product {
  id: string;
  name: string;
  category: 'vegetables' | 'proteins' | 'canned' | 'condiments' | 'pantry';
  categoryLabel: string;
  price: number; // in GH₵ (Cedis)
  unit: string; // e.g. "per paint bucket", "per kg", "crate of 30", "425g tin"
  image: string;
  description: string;
  inStock: boolean;
  badge?: string;
  popular?: boolean;
  isVariablePrice?: boolean; // If true, replaces fixed price tag with custom budget / portion input
  customAmountPlaceholder?: string; // e.g. "e.g. GH₵ 50 or 2 buckets"
  suggestedAmounts?: string[]; // Quick tap presets, e.g. ["GH₵ 20", "GH₵ 50", "GH₵ 100"]
  defaultCustomAmount?: string; // Default starter amount e.g. "GH₵ 50"
  hasCutsModal?: boolean; // If true, opens sub-type and cuts selection modal
  cuts?: ProteinCutOption[]; // Available cuts and sub-types
  isMockPrice?: boolean; // If true, this item has a temporary reference mock price
  mockPriceLabel?: string; // e.g. "Temp Mock Price: GH₵ 45.00 / pack"
  isEggProduct?: boolean; // If true, opens egg retail tier and crate selector
}

export interface CartItem {
  product: Product;
  quantity: number;
  customAmount?: string; // e.g. "GH₵ 50" or "2 paint buckets" or "3 tubers"
  customPrice?: number; // Parsed numeric value if customer specified a budget amount
  selectedCuts?: SelectedProteinCut[]; // Specific cuts selected for protein products
}

export type CategoryId = 'all' | 'vegetables' | 'proteins' | 'canned' | 'condiments' | 'pantry';

export interface Category {
  id: CategoryId;
  name: string;
  iconName: string;
}

export interface OrderCustomerInfo {
  name: string;
  phone: string;
  deliveryType: 'delivery' | 'pickup';
  address: string;
  paymentMethod: 'Cash on Delivery' | 'Mobile Money (MTN / Telecel / AT)' | 'Pay at Pickup';
  notes?: string;
}
