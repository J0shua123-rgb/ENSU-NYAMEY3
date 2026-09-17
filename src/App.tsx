import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem, CategoryId, SelectedProteinCut } from './types';
import { PRODUCTS, CATEGORIES, STORE_SETTINGS, parseCustomAmountPrice, calculateCustomItemPrice } from './data/products';
import { Header } from './components/Header';
import { CategoryPills } from './components/CategoryPills';
import { ProductCard } from './components/ProductCard';
import { FloatingCartBar } from './components/FloatingCartBar';
import { CartDrawer } from './components/CartDrawer';
import { StoreInfoModal } from './components/StoreInfoModal';
import { ProteinCutSelectionModal } from './components/ProteinCutSelectionModal';
import { Footer } from './components/Footer';
import { AdminPinModal } from './components/AdminPinModal';
import { AdminDashboard } from './components/AdminDashboard';
import { recordProductInteraction } from './utils/analytics';
import { initGlobalErrorCapture, logSystemAlert } from './utils/errorTracker';
import { 
  ShoppingBag, 
  Sparkles, 
  SearchX, 
  Flame, 
  Truck, 
  ShieldCheck, 
  HeartHandshake,
  MessageCircle,
  Phone
} from 'lucide-react';

const LOCAL_STORAGE_CART_KEY = 'corner_mart_cart_v1';
const LOCAL_STORAGE_PRODUCTS_KEY = 'corner_mart_products_v1';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isStoreInfoOpen, setIsStoreInfoOpen] = useState(false);
  const [selectedProteinForModal, setSelectedProteinForModal] = useState<Product | null>(null);

  // Admin states
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Store products initialized from localStorage with fallback to PRODUCTS
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PRODUCTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return PRODUCTS;
  });

  // Initialize global runtime error monitoring
  useEffect(() => {
    initGlobalErrorCapture();
  }, []);

  // Save products changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(products));
    } catch {
      // Ignore
    }
  }, [products]);

  // Initialize cart from localStorage for seamless convenience
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CART_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore fallback
    }
    return [];
  });

  // Save cart changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore
    }
  }, [cartItems]);

  // Cart quantity map for O(1) lookup in ProductCard
  const cartQuantityMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cartItems) {
      map.set(item.product.id, item.quantity);
    }
    return map;
  }, [cartItems]);

  // Cart custom amount map for O(1) lookup in ProductCard
  const cartCustomAmountMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of cartItems) {
      if (item.customAmount) {
        map.set(item.product.id, item.customAmount);
      }
    }
    return map;
  }, [cartItems]);

  // Cart cuts map for O(1) lookup in ProductCard and Modal
  const cartCutsMap = useMemo(() => {
    const map = new Map<string, SelectedProteinCut[]>();
    for (const item of cartItems) {
      if (item.selectedCuts && item.selectedCuts.length > 0) {
        map.set(item.product.id, item.selectedCuts);
      }
    }
    return map;
  }, [cartItems]);

  // Total items count (including individual protein cuts)
  const totalItemsCount = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      if (item.selectedCuts && item.selectedCuts.length > 0) {
        return sum + item.selectedCuts.length;
      }
      return sum + item.quantity;
    }, 0);
  }, [cartItems]);

  // Total price calculation in Cedis
  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      if (item.selectedCuts && item.selectedCuts.length > 0) {
        const cutsSum = item.selectedCuts.reduce((cSum, c) => cSum + (c.price || 0), 0);
        return sum + cutsSum;
      }
      if (item.product.isVariablePrice) {
        const itemPrice = item.customPrice ?? (item.product.price > 0 ? item.product.price : 0);
        return sum + itemPrice * item.quantity;
      }
      return sum + item.product.price * item.quantity;
    }, 0);
  }, [cartItems]);

  // Add to cart handler with custom budget/portion support
  const handleAddToCart = (product: Product, customAmount?: string) => {
    recordProductInteraction(product, 'cart_add');
    const finalCustomAmount = product.isVariablePrice
      ? (customAmount?.trim() || product.defaultCustomAmount || (product.price > 0 ? '1 pack' : 'GH₵ 50'))
      : undefined;
    const customPrice = calculateCustomItemPrice(product, finalCustomAmount);

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
          customAmount: finalCustomAmount ?? updated[existingIndex].customAmount,
          customPrice: customPrice ?? updated[existingIndex].customPrice,
        };
        return updated;
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          customAmount: finalCustomAmount,
          customPrice: customPrice ?? undefined,
        },
      ];
    });
  };

  // Update item quantity handler
  const handleUpdateQuantity = (productId: string, quantity: number, customAmount?: string) => {
    setCartItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) => {
        if (item.product.id === productId) {
          const finalAmount = customAmount ?? item.customAmount;
          const parsedPrice = calculateCustomItemPrice(item.product, finalAmount);
          return {
            ...item,
            quantity,
            customAmount: finalAmount,
            customPrice: parsedPrice ?? item.customPrice,
          };
        }
        return item;
      });
    });
  };

  // Update item custom amount directly
  const handleUpdateCustomAmount = (productId: string, customAmount: string) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const parsedPrice = calculateCustomItemPrice(item.product, customAmount);
          return {
            ...item,
            customAmount,
            customPrice: parsedPrice ?? undefined,
          };
        }
        return item;
      })
    );
  };

  // Confirm selected cuts from ProteinCutSelectionModal
  const handleConfirmCuts = (product: Product, selectedCuts: SelectedProteinCut[]) => {
    if (selectedCuts && selectedCuts.length > 0) {
      recordProductInteraction(product, 'cart_add');
    }
    setCartItems((prev) => {
      if (!selectedCuts || selectedCuts.length === 0) {
        return prev.filter((i) => i.product.id !== product.id);
      }

      const existingIndex = prev.findIndex((i) => i.product.id === product.id);
      const summaryAmount = selectedCuts.map((c) => `${c.name}: ${c.amount}`).join(', ');

      const newItem: CartItem = {
        product,
        quantity: selectedCuts.length,
        selectedCuts,
        customAmount: summaryAmount,
      };

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = newItem;
        return updated;
      }
      return [...prev, newItem];
    });
  };

  // Update protein cuts directly (e.g. within cart drawer)
  const handleUpdateProteinCuts = (productId: string, selectedCuts: SelectedProteinCut[]) => {
    setCartItems((prev) => {
      if (!selectedCuts || selectedCuts.length === 0) {
        return prev.filter((i) => i.product.id !== productId);
      }
      return prev.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            quantity: selectedCuts.length,
            selectedCuts,
            customAmount: selectedCuts.map((c) => `${c.name}: ${c.amount}`).join(', '),
          };
        }
        return item;
      });
    });
  };

  // Clear cart handler
  const handleClearCart = () => {
    setCartItems([]);
  };

  // Dynamic category counts (all products)
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryId, number> = {
      all: products.length,
      vegetables: 0,
      proteins: 0,
      canned: 0,
      condiments: 0,
      pantry: 0,
    };

    for (const product of products) {
      if (counts[product.category] !== undefined) {
        counts[product.category]++;
      }
    }
    return counts;
  }, [products]);

  // Filter products by category and sticky search query
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      // Category check
      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      if (!matchesCategory) return false;

      // Search query check
      if (!query) return true;

      const nameMatch = product.name.toLowerCase().includes(query);
      const descMatch = product.description.toLowerCase().includes(query);
      const unitMatch = product.unit.toLowerCase().includes(query);
      const catMatch = product.categoryLabel.toLowerCase().includes(query);
      const badgeMatch = product.badge?.toLowerCase().includes(query) ?? false;

      return nameMatch || descMatch || unitMatch || catMatch || badgeMatch;
    });
  }, [products, searchQuery, selectedCategory]);

  // If Admin Terminal is authenticated, show Admin Dashboard view
  const handleUpdateProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    try {
      localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(updatedProducts));
    } catch {
      // Ignore
    }
    // Clean up cart items for any removed products
    setCartItems((prev) => prev.filter((item) => updatedProducts.some((p) => p.id === item.product.id)));
  };

  if (isAdminAuthenticated) {
    return (
      <AdminDashboard
        products={products}
        onUpdateProducts={handleUpdateProducts}
        onLockAndExit={() => setIsAdminAuthenticated(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans pb-28">
      {/* Top Banner: Local Neighborhood Delivery */}
      <div className="bg-gradient-to-r from-emerald-950 via-neutral-900 to-emerald-950 border-b border-emerald-500/20 py-1.5 px-4 text-center">
        <div className="max-w-xl mx-auto flex items-center justify-between text-[11px] text-emerald-300 font-medium">
          <span className="flex items-center gap-1.5 truncate">
            <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Fast Neighborhood Delivery ({STORE_SETTINGS.deliveryEst})</span>
          </span>
          <span className="flex items-center gap-1 shrink-0 text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pay on Delivery / MoMo</span>
          </span>
        </div>
      </div>

      {/* Sticky Header with Search Bar */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenStoreInfo={() => setIsStoreInfoOpen(true)}
        totalProductsCount={products.length}
        filteredCount={filteredProducts.length}
      />

      {/* Sticky Horizontal Category Filter Pills */}
      <CategoryPills
        selectedCategory={selectedCategory}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
        }}
        categoryCounts={categoryCounts}
      />

      {/* Main Catalog View (Mobile-first container) */}
      <main className="max-w-xl mx-auto w-full px-4 pt-4 flex-1">
        {/* Catalog Subheader or active filter indicator */}
        <div className="flex items-center justify-between mb-3 px-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              {selectedCategory === 'all'
                ? 'All Grocery & Provisions'
                : CATEGORIES.find((c) => c.id === selectedCategory)?.name}
            </h2>
            <span className="text-[10px] text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded-full border border-neutral-800">
              {filteredProducts.length} items
            </span>
          </div>

          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-xs text-emerald-400 hover:underline"
            >
              Show all
            </button>
          )}
        </div>

        {/* Product Cards Grid: 2 columns on mobile, clean spacing */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantityInCart={cartQuantityMap.get(product.id) ?? 0}
                currentCustomAmount={cartCustomAmountMap.get(product.id)}
                selectedCutsInCart={cartCutsMap.get(product.id)}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
                onUpdateCustomAmount={handleUpdateCustomAmount}
                onOpenCutsModal={(p) => setSelectedProteinForModal(p)}
              />
            ))}
          </div>
        ) : (
          /* Empty Search or Filter Result */
          <div className="py-16 text-center flex flex-col items-center justify-center bg-neutral-900/40 rounded-3xl border border-neutral-800/60 p-6 my-4">
            <div className="w-14 h-14 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-500 mb-3">
              <SearchX className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-200">
              No items matching "{searchQuery}"
            </h3>
            <p className="text-xs text-neutral-400 max-w-xs mt-1 mb-4">
              We couldn't find what you're looking for in {selectedCategory === 'all' ? 'our catalog' : 'this category'}.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition-colors"
              >
                Clear Search
              </button>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-semibold text-neutral-950 transition-colors"
              >
                View All Items
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Discreet Footer with Store Details, Copyright, and Subtle Lock Icon */}
      <Footer onOpenAdminAuth={() => setIsAdminPinModalOpen(true)} />

      {/* Floating Bottom Cart Bar (Appears when items are in cart) */}
      <FloatingCartBar
        totalItems={totalItemsCount}
        totalPrice={totalPrice}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Expanded Cart Bottom Sheet / Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        onUpdateCustomAmount={handleUpdateCustomAmount}
        onUpdateProteinCuts={handleUpdateProteinCuts}
        onOpenCutsModal={(p) => {
          setIsCartOpen(false);
          setSelectedProteinForModal(p);
        }}
      />

      {/* Protein Cut Selection Modal */}
      {selectedProteinForModal && (
        <ProteinCutSelectionModal
          key={selectedProteinForModal.id}
          isOpen={true}
          onClose={() => setSelectedProteinForModal(null)}
          product={selectedProteinForModal}
          existingSelectedCuts={cartCutsMap.get(selectedProteinForModal.id)}
          onConfirmCuts={handleConfirmCuts}
        />
      )}

      {/* Store Information Modal */}
      <StoreInfoModal
        isOpen={isStoreInfoOpen}
        onClose={() => setIsStoreInfoOpen(false)}
      />

      {/* Admin PIN Authentication Modal */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        onSuccess={() => {
          setIsAdminPinModalOpen(false);
          setIsAdminAuthenticated(true);
        }}
      />
    </div>
  );
}

