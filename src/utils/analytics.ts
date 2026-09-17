import { Product } from '../types';

export interface ProductAnalytics {
  productId: string;
  productName: string;
  category: string;
  cartAdds: number;
  views: number;
  searches: number;
  lastInteractedAt: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: 'cart_add' | 'cart_remove' | 'cut_select' | 'stock_toggle' | 'price_update' | 'product_added';
  description: string;
  productName?: string;
}

const LOCAL_STORAGE_ANALYTICS_KEY = 'corner_mart_analytics_v1';
const LOCAL_STORAGE_ACTIVITY_KEY = 'corner_mart_activity_v1';

// Seed initial realistic baseline customer demand data for Ashaiman community store
const BASELINE_ANALYTICS: Record<string, { cartAdds: number; views: number; searches: number }> = {
  'prot-1': { cartAdds: 48, views: 164, searches: 32 }, // Soft Chicken
  'prot-2': { cartAdds: 39, views: 142, searches: 28 }, // Hard Chicken
  'prot-3': { cartAdds: 42, views: 155, searches: 36 }, // Turkey Wings
  'prot-4': { cartAdds: 35, views: 120, searches: 21 }, // Red Snapper
  'prot-5': { cartAdds: 46, views: 178, searches: 45 }, // Fresh Tilapia
  'prot-12': { cartAdds: 57, views: 210, searches: 51 }, // Eggs (Retail & Crates)
  'pant-1': { cartAdds: 38, views: 130, searches: 19 }, // Jasmine Rice
  'pant-2': { cartAdds: 41, views: 145, searches: 24 }, // Pure Vegetable Cooking Oil
  'veg-1': { cartAdds: 34, views: 115, searches: 18 },  // Fresh Tomatoes
  'veg-2': { cartAdds: 29, views: 98, searches: 14 },   // Fresh Onions
  'prot-7': { cartAdds: 26, views: 92, searches: 22 },  // Fresh Beef
  'prot-6': { cartAdds: 21, views: 84, searches: 17 },  // Gizzard
};

export function getAnalyticsData(): Record<string, ProductAnalytics> {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_ANALYTICS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore error
  }

  // Initialize with baseline
  const initial: Record<string, ProductAnalytics> = {};
  const now = new Date().toISOString();

  Object.entries(BASELINE_ANALYTICS).forEach(([id, data]) => {
    initial[id] = {
      productId: id,
      productName: id,
      category: 'general',
      cartAdds: data.cartAdds,
      views: data.views,
      searches: data.searches,
      lastInteractedAt: now,
    };
  });

  try {
    localStorage.setItem(LOCAL_STORAGE_ANALYTICS_KEY, JSON.stringify(initial));
  } catch {
    // Ignore
  }

  return initial;
}

export function recordProductInteraction(
  product: Product,
  type: 'cart_add' | 'view' | 'search'
) {
  try {
    const current = getAnalyticsData();
    const existing = current[product.id] || {
      productId: product.id,
      productName: product.name,
      category: product.category,
      cartAdds: 0,
      views: 0,
      searches: 0,
      lastInteractedAt: new Date().toISOString(),
    };

    if (type === 'cart_add') {
      existing.cartAdds += 1;
      logActivity({
        type: 'cart_add',
        description: `Customer added "${product.name}" to cart`,
        productName: product.name,
      });
    } else if (type === 'view') {
      existing.views += 1;
    } else if (type === 'search') {
      existing.searches += 1;
    }

    existing.lastInteractedAt = new Date().toISOString();
    existing.productName = product.name;
    existing.category = product.category;

    current[product.id] = existing;
    localStorage.setItem(LOCAL_STORAGE_ANALYTICS_KEY, JSON.stringify(current));
  } catch {
    // Ignore
  }
}

export function logActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>) {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_ACTIVITY_KEY);
    const list: ActivityEvent[] = saved ? JSON.parse(saved) : [];

    const newEvent: ActivityEvent = {
      ...event,
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };

    // Keep last 40 events
    const updated = [newEvent, ...list].slice(0, 40);
    localStorage.setItem(LOCAL_STORAGE_ACTIVITY_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}

export function getActivityLogs(): ActivityEvent[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_ACTIVITY_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // Ignore
  }

  // Pre-seed baseline activity for Ashaiman store
  const defaultLogs: ActivityEvent[] = [
    {
      id: 'act-init-1',
      timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      type: 'cart_add',
      description: 'Customer added "Eggs (Retail Tiers & Crates)" (Full Crate) to basket',
      productName: 'Eggs',
    },
    {
      id: 'act-init-2',
      timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      type: 'cart_add',
      description: 'Customer added "Soft Chicken" (2 kg cut & portioned) to basket',
      productName: 'Soft Chicken',
    },
    {
      id: 'act-init-3',
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      type: 'cart_add',
      description: 'Customer added "Fresh Tilapia" (Cleaned, Gilled & Scaled) to basket',
      productName: 'Fresh Tilapia',
    },
    {
      id: 'act-init-4',
      timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      type: 'cart_add',
      description: 'Customer added "Jasmine Perfumed Rice (5kg)" to basket',
      productName: 'Jasmine Rice',
    },
  ];

  try {
    localStorage.setItem(LOCAL_STORAGE_ACTIVITY_KEY, JSON.stringify(defaultLogs));
  } catch {}

  return defaultLogs;
}

export function resetAnalyticsData() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_ANALYTICS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_ACTIVITY_KEY);
  } catch {}
}
