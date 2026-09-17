import React, { useState, useMemo, useEffect } from 'react';
import { Product, CategoryId } from '../types';
import { CATEGORIES, STORE_SETTINGS, PRODUCTS as DEFAULT_PRODUCTS } from '../data/products';
import { 
  getAnalyticsData, 
  getActivityLogs, 
  ProductAnalytics, 
  ActivityEvent, 
  logActivity,
  resetAnalyticsData
} from '../utils/analytics';
import { getStoredAdminPin, ADMIN_PIN_STORAGE_KEY, DEFAULT_ADMIN_PIN } from './AdminPinModal';
import { 
  getSystemAlerts, 
  logSystemAlert, 
  resolveSystemAlert, 
  clearSystemAlerts, 
  SystemAlert 
} from '../utils/errorTracker';
import { 
  Lock, 
  Unlock, 
  Plus, 
  Search, 
  TrendingUp, 
  Package, 
  PackageCheck, 
  PackageX, 
  DollarSign, 
  Layers, 
  Check, 
  X, 
  Edit2, 
  Trash2, 
  Eye, 
  ShoppingCart, 
  Activity, 
  ShieldCheck, 
  KeyRound, 
  RefreshCw, 
  SlidersHorizontal,
  Flame,
  AlertTriangle,
  ArrowUpRight,
  Store,
  Sparkles,
  AlertOctagon,
  Info,
  ShieldAlert,
  CheckCircle2,
  ImageOff,
  Bug,
  Terminal,
  Bell,
  AlertCircle
} from 'lucide-react';

interface AdminDashboardProps {
  products: Product[];
  onUpdateProducts: (updated: Product[]) => void;
  onLockAndExit: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  onUpdateProducts,
  onLockAndExit,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'analytics' | 'errors' | 'settings'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  // Track product pending deletion for in-app modal confirmation
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  // System alerts & error monitoring state
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>(() => getSystemAlerts());
  const [alertFilter, setAlertFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [alertCategoryFilter, setAlertCategoryFilter] = useState<string>('all');
  const [alertSearchQuery, setAlertSearchQuery] = useState('');

  // Auto-dismiss notification message
  useEffect(() => {
    if (!notificationMessage) return;
    const timer = setTimeout(() => setNotificationMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [notificationMessage]);

  // Live telemetry listener
  useEffect(() => {
    const handleAlertLogged = () => {
      setSystemAlerts(getSystemAlerts());
    };
    window.addEventListener('corner_mart_alert_logged', handleAlertLogged);
    return () => {
      window.removeEventListener('corner_mart_alert_logged', handleAlertLogged);
    };
  }, []);

  // Inline editing state: track which product is being edited or allow direct inputs
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    price: number;
    unit: string;
    description: string;
  }>({ name: '', price: 0, unit: '', description: '' });

  // Add new product modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<{
    name: string;
    category: 'vegetables' | 'proteins' | 'canned' | 'condiments' | 'pantry';
    price: number;
    unit: string;
    description: string;
    image: string;
    inStock: boolean;
    isVariablePrice: boolean;
  }>({
    name: '',
    category: 'proteins',
    price: 35,
    unit: 'per kg',
    description: '',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=600',
    inStock: true,
    isVariablePrice: false,
  });

  // PIN settings state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Analytics data
  const [analyticsData, setAnalyticsData] = useState<Record<string, ProductAnalytics>>(() => getAnalyticsData());
  const [activityLogs, setActivityLogs] = useState<ActivityEvent[]>(() => getActivityLogs());

  // Refresh analytics
  const handleRefreshAnalytics = () => {
    setAnalyticsData(getAnalyticsData());
    setActivityLogs(getActivityLogs());
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.unit.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      
      const matchesStock = 
        stockFilter === 'all' || 
        (stockFilter === 'in_stock' && p.inStock) || 
        (stockFilter === 'out_of_stock' && !p.inStock);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  // Overall catalog metrics
  const totalProducts = products.length;
  const inStockCount = products.filter((p) => p.inStock).length;
  const outOfStockCount = totalProducts - inStockCount;

  // Toggle in-stock status
  const handleToggleStock = (productId: string) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        const nextState = !p.inStock;
        logActivity({
          type: 'stock_toggle',
          description: `Admin marked "${p.name}" as ${nextState ? 'IN STOCK' : 'OUT OF STOCK'}`,
          productName: p.name,
        });
        return { ...p, inStock: nextState };
      }
      return p;
    });
    onUpdateProducts(updated);
    handleRefreshAnalytics();
  };

  // Start inline edit
  const handleStartEdit = (product: Product) => {
    setEditingProductId(product.id);
    setEditForm({
      name: product.name,
      price: product.price,
      unit: product.unit,
      description: product.description,
    });
  };

  // Save inline edit
  const handleSaveEdit = (productId: string) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        const changes: string[] = [];
        if (p.name !== editForm.name) changes.push(`name to "${editForm.name}"`);
        if (p.price !== editForm.price) changes.push(`price to GH₵ ${editForm.price.toFixed(2)}`);
        
        if (changes.length > 0) {
          logActivity({
            type: 'price_update',
            description: `Admin updated "${p.name}": ${changes.join(', ')}`,
            productName: editForm.name,
          });
        }

        return {
          ...p,
          name: editForm.name.trim() || p.name,
          price: Number(editForm.price) >= 0 ? Number(editForm.price) : p.price,
          unit: editForm.unit.trim() || p.unit,
          description: editForm.description.trim() || p.description,
        };
      }
      return p;
    });

    onUpdateProducts(updated);
    setEditingProductId(null);
    handleRefreshAnalytics();
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingProductId(null);
  };

  // Execute confirmed product deletion without unsafe window.confirm
  const executeDeleteProduct = (productId: string, productName: string) => {
    const updated = products.filter((p) => p.id !== productId);
    onUpdateProducts(updated);
    logActivity({
      type: 'product_added',
      description: `Admin removed "${productName}" from catalog`,
      productName,
    });
    logSystemAlert({
      level: 'info',
      category: 'stock_alert',
      title: 'Product Deleted from Storefront',
      details: `Admin removed "${productName}" (ID: ${productId}). Inventory state refreshed immediately.`,
      source: 'Inventory Management',
    });
    setProductToDelete(null);
    handleRefreshAnalytics();
    setNotificationMessage(`"${productName}" has been successfully removed from the catalog.`);
  };

  // Alert management handlers
  const handleResolveAlert = (id: string) => {
    resolveSystemAlert(id);
    setSystemAlerts(getSystemAlerts());
  };

  const handleClearAlerts = () => {
    clearSystemAlerts();
    setSystemAlerts(getSystemAlerts());
    setNotificationMessage('System error and alert logs have been cleared.');
  };

  const handleSimulateError = (type: 'image' | 'click' | 'script') => {
    if (type === 'image') {
      logSystemAlert({
        level: 'warning',
        category: 'image_broken',
        title: 'Broken Product Image Detected',
        details: 'External image host 404 on "Fresh Farm Eggs (30-Egg Crate)" thumbnail; fallback avatar rendered.',
        source: 'ProductCard (veg-12)',
      });
      setNotificationMessage('Simulated broken image incident logged to live error ticker.');
    } else if (type === 'click') {
      logSystemAlert({
        level: 'warning',
        category: 'user_interaction',
        title: 'Customer Click on Empty Butcher Selection',
        details: 'Customer pressed Add to Basket without selecting required meat portion cut options.',
        source: 'ProteinCutSelectionModal',
      });
      setNotificationMessage('Simulated customer interaction glitch logged to live error ticker.');
    } else {
      logSystemAlert({
        level: 'error',
        category: 'runtime_exception',
        title: 'Script Runtime Error Handled',
        details: 'TypeError: Cannot read properties of undefined (evaluating "cartSession.deliveryLocation")',
        source: 'Storefront Checkout Bridge',
      });
      setNotificationMessage('Simulated runtime script error logged to live error ticker.');
    }
  };

  // Add new product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim()) return;

    const catObj = CATEGORIES.find((c) => c.id === newProduct.category);
    const categoryLabel = catObj?.name || 'General';

    const createdProduct: Product = {
      id: 'custom-' + Date.now(),
      name: newProduct.name.trim(),
      category: newProduct.category,
      categoryLabel,
      price: Number(newProduct.price) || 0,
      unit: newProduct.unit.trim() || 'per item',
      description: newProduct.description.trim() || 'Fresh store item packaged for fast delivery.',
      image: newProduct.image.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
      inStock: newProduct.inStock,
      isVariablePrice: newProduct.isVariablePrice,
    };

    const updated = [createdProduct, ...products];
    onUpdateProducts(updated);
    setIsAddModalOpen(false);

    logActivity({
      type: 'product_added',
      description: `Admin added new product: "${createdProduct.name}" (GH₵ ${createdProduct.price.toFixed(2)})`,
      productName: createdProduct.name,
    });

    // Reset form
    setNewProduct({
      name: '',
      category: 'proteins',
      price: 35,
      unit: 'per kg',
      description: '',
      image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=600',
      inStock: true,
      isVariablePrice: false,
    });

    handleRefreshAnalytics();
  };

  // Change PIN handler
  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = getStoredAdminPin();

    if (currentPinInput !== storedPin) {
      setPinChangeMsg({ type: 'error', text: 'Current PIN is incorrect.' });
      return;
    }

    if (!/^\d{4}$/.test(newPinInput)) {
      setPinChangeMsg({ type: 'error', text: 'New PIN must be exactly 4 numeric digits.' });
      return;
    }

    try {
      localStorage.setItem(ADMIN_PIN_STORAGE_KEY, newPinInput);
      setPinChangeMsg({ type: 'success', text: `Security PIN successfully updated to ${newPinInput}.` });
      setCurrentPinInput('');
      setNewPinInput('');
    } catch {
      setPinChangeMsg({ type: 'error', text: 'Failed to save new PIN.' });
    }
  };

  // Reset to default catalog
  const handleResetCatalog = () => {
    if (confirm('Reset catalog back to standard Ashaiman provisions & cold store items? Any custom added items will be reset.')) {
      onUpdateProducts(DEFAULT_PRODUCTS);
      try {
        localStorage.removeItem('corner_mart_products_v1');
      } catch {}
      logActivity({
        type: 'product_added',
        description: 'Admin reset catalog back to default baseline products',
      });
      handleRefreshAnalytics();
    }
  };

  // Movement leaderboard calculation
  const movementLeaderboard = useMemo(() => {
    const list = products.map((product) => {
      const stats = analyticsData[product.id] || {
        cartAdds: 0,
        views: 0,
        searches: 0,
      };
      // Weighted customer interaction score: cart additions (x3) + views (x1) + searches (x2)
      const movementScore = stats.cartAdds * 3 + stats.searches * 2 + stats.views;
      return {
        product,
        stats,
        movementScore,
      };
    });

    return list.sort((a, b) => b.movementScore - a.movementScore);
  }, [products, analyticsData]);

  const maxMovementScore = movementLeaderboard[0]?.movementScore || 1;

  const totalCartAdditions = useMemo(() => {
    return Object.values(analyticsData).reduce((sum: number, item: ProductAnalytics) => sum + (item.cartAdds || 0), 0);
  }, [analyticsData]);

  const unresolvedAlertsCount = useMemo(() => {
    return systemAlerts.filter((a) => !a.resolved && a.level !== 'info').length;
  }, [systemAlerts]);

  const latestAlert = systemAlerts[0] || null;

  const filteredAlerts = useMemo(() => {
    return systemAlerts.filter((alert) => {
      if (alertFilter !== 'all' && alert.level !== alertFilter) return false;
      if (alertCategoryFilter !== 'all' && alert.category !== alertCategoryFilter) return false;
      if (alertSearchQuery.trim()) {
        const q = alertSearchQuery.toLowerCase();
        const matchesTitle = alert.title.toLowerCase().includes(q);
        const matchesDetails = alert.details.toLowerCase().includes(q);
        const matchesSource = alert.source.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDetails && !matchesSource) return false;
      }
      return true;
    });
  }, [systemAlerts, alertFilter, alertCategoryFilter, alertSearchQuery]);

  const alertStats = useMemo(() => {
    const total = systemAlerts.length;
    const errors = systemAlerts.filter((a) => a.level === 'error').length;
    const warnings = systemAlerts.filter((a) => a.level === 'warning').length;
    const brokenImages = systemAlerts.filter((a) => a.category === 'image_broken').length;
    const unresolved = systemAlerts.filter((a) => !a.resolved && a.level !== 'info').length;
    return { total, errors, warnings, brokenImages, unresolved };
  }, [systemAlerts]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-neutral-950">
      {/* Top Admin Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-1.5">
                  <span>Store Terminal</span>
                  <span className="text-neutral-400 font-normal hidden sm:inline">• {STORE_SETTINGS.name}</span>
                </h1>
                <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Unlocked
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Operations, inventory stock toggling, error telemetry, and customer analytics
              </p>
            </div>
          </div>

          {/* Secure Lock & Exit Button */}
          <button
            id="admin-lock-exit-button"
            type="button"
            onClick={onLockAndExit}
            className="flex items-center gap-1.5 bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/30 text-rose-300 hover:text-rose-200 border border-rose-500/35 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm shrink-0"
            title="Securely exit staff session and return to customer storefront"
          >
            <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Lock & Exit</span>
          </button>
        </div>

        {/* Admin Tab Navigation */}
        <div className="max-w-5xl mx-auto mt-3 flex items-center gap-1.5 border-t border-neutral-800/80 pt-2.5 overflow-x-auto no-scrollbar">
          <button
            id="tab-product-management"
            type="button"
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'products'
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/70'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Product Management</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'products' ? 'bg-neutral-950 text-emerald-300' : 'bg-neutral-800 text-neutral-400'
            }`}>
              {products.length}
            </span>
          </button>

          <button
            id="tab-analytics"
            type="button"
            onClick={() => {
              setActiveTab('analytics');
              handleRefreshAnalytics();
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'analytics'
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/70'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Movement & Insights</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'analytics' ? 'bg-neutral-950 text-emerald-300' : 'bg-neutral-800 text-neutral-400'
            }`}>
              {totalCartAdditions} adds
            </span>
          </button>

          <button
            id="tab-system-alerts"
            type="button"
            onClick={() => setActiveTab('errors')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'errors'
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/70'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>System Errors & Alerts</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'errors'
                ? 'bg-neutral-950 text-emerald-300'
                : unresolvedAlertsCount > 0
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-neutral-800 text-neutral-400'
            }`}>
              {unresolvedAlertsCount > 0 ? `${unresolvedAlertsCount} active` : 'Normal'}
            </span>
          </button>

          <button
            id="tab-settings"
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'settings'
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/70'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Terminal PIN & Config</span>
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notificationMessage && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-200 px-4 py-2 text-xs flex items-center justify-between font-medium animate-in fade-in">
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notificationMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotificationMessage(null)}
            className="text-emerald-400 hover:text-white ml-2 text-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Live System Error & Alert Ticker Banner */}
      <div className="bg-neutral-900/90 border-b border-neutral-800 px-4 py-2">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`w-2 h-2 rounded-full ${
                unresolvedAlertsCount > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
              }`} />
              <span className="font-bold text-neutral-300 text-[11px] uppercase tracking-wider">
                {unresolvedAlertsCount > 0 ? 'Live Telemetry Alert' : 'System Watchdog'}
              </span>
            </div>
            <span className="text-neutral-600 hidden sm:inline">•</span>
            {latestAlert ? (
              <span className="text-neutral-300 truncate text-[11.5px]">
                <span className={`font-semibold mr-1.5 ${
                  latestAlert.level === 'error' ? 'text-rose-400' : latestAlert.level === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  [{latestAlert.category.replace('_', ' ').toUpperCase()}]
                </span>
                {latestAlert.title}: {latestAlert.details}
              </span>
            ) : (
              <span className="text-neutral-400 text-[11.5px]">All storefront services operational. No client glitches detected.</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('errors')}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <span>Live Error Ticker ({systemAlerts.length})</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Admin Content Container */}
      <main className="max-w-5xl mx-auto w-full px-4 py-5 flex-1">
        {/* TAB 1: PRODUCT MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            {/* Top Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span className="text-[11px] font-medium">Total Products</span>
                  <Package className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-white tracking-tight">
                  {totalProducts}
                </div>
                <span className="text-[10px] text-neutral-500">In Ashaiman store database</span>
              </div>

              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-emerald-400 mb-1">
                  <span className="text-[11px] font-medium">In Stock</span>
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold text-emerald-400 tracking-tight">
                  {inStockCount}
                </div>
                <span className="text-[10px] text-neutral-500">Available to customers</span>
              </div>

              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-rose-400 mb-1">
                  <span className="text-[11px] font-medium">Out of Stock</span>
                  <PackageX className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold text-rose-400 tracking-tight">
                  {outOfStockCount}
                </div>
                <span className="text-[10px] text-neutral-500">Hidden/disabled in catalog</span>
              </div>

              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-amber-400 mb-1">
                  <span className="text-[11px] font-medium">Quick Action</span>
                  <Plus className="w-4 h-4" />
                </div>
                <button
                  id="admin-open-add-product-btn"
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full mt-1 py-1.5 px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-3 space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    id="admin-product-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by product name, unit, or category..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Stock filter toggles */}
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-0.5 flex text-[11px]">
                    <button
                      type="button"
                      onClick={() => setStockFilter('all')}
                      className={`px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
                        stockFilter === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      All ({totalProducts})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockFilter('in_stock')}
                      className={`px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
                        stockFilter === 'in_stock' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      In Stock ({inStockCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockFilter('out_of_stock')}
                      className={`px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
                        stockFilter === 'out_of_stock' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Out of Stock ({outOfStockCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === 'all'
                      ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/30'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  All Categories
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/30'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products List Table / Cards */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="p-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs font-semibold text-neutral-400">
                <span>Displaying {filteredProducts.length} Products</span>
                <span className="text-[11px] font-normal text-neutral-500">
                  Click 'Edit' for inline name & price adjustments • Use switch for instant stock toggle
                </span>
              </div>

              <div className="divide-y divide-neutral-800/80">
                {filteredProducts.map((product) => {
                  const isEditing = editingProductId === product.id;

                  return (
                    <div
                      key={product.id}
                      className={`p-3 sm:p-4 transition-colors ${
                        !product.inStock ? 'bg-neutral-950/40 opacity-75' : 'hover:bg-neutral-850/40'
                      }`}
                    >
                      {isEditing ? (
                        /* INLINE EDIT MODE */
                        <div className="space-y-3 bg-neutral-950 border border-emerald-500/40 rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Editing Product: {product.name}</span>
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">ID: {product.id}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="text-[10.5px] text-neutral-400 block mb-1">
                                Product Name
                              </label>
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                              />
                            </div>

                            <div>
                              <label className="text-[10.5px] text-neutral-400 block mb-1">
                                Price ({STORE_SETTINGS.currency})
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={editForm.price}
                                onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                              />
                            </div>

                            <div>
                              <label className="text-[10.5px] text-neutral-400 block mb-1">
                                Unit / Packaging
                              </label>
                              <input
                                type="text"
                                value={editForm.unit}
                                onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10.5px] text-neutral-400 block mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(product.id)}
                              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-neutral-950 flex items-center gap-1 shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Save Changes</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* VIEW & QUICK ACTION ROW */
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-12 h-12 rounded-xl object-cover bg-neutral-800 border border-neutral-800 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-sm text-white">
                                  {product.name}
                                </h4>
                                <span className="text-[10px] font-medium text-neutral-400 bg-neutral-800 px-2 py-0.2 rounded">
                                  {product.categoryLabel}
                                </span>
                                {product.isEggProduct && (
                                  <span className="text-[9.5px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                                    5 Egg Tiers
                                  </span>
                                )}
                                {product.hasCutsModal && !product.isEggProduct && (
                                  <span className="text-[9.5px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                                    Cuts Modal
                                  </span>
                                )}
                                {product.isVariablePrice && (
                                  <span className="text-[9.5px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded">
                                    Flexible Budget
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-400 mt-0.5">
                                {product.unit} • {product.description}
                              </p>
                            </div>
                          </div>

                          {/* Right Controls: Price, Stock Toggle, Edit Button */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/60">
                            {/* Price Badge */}
                            <div className="text-right">
                              <span className="text-sm font-bold text-white">
                                <span className="text-emerald-400 text-xs font-semibold mr-0.5">
                                  {STORE_SETTINGS.currency}
                                </span>
                                {product.price.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-neutral-500 block">
                                {product.isVariablePrice ? 'Ref / baseline' : 'fixed'}
                              </span>
                            </div>

                            {/* Stock Toggle Switch */}
                            <div className="flex items-center gap-2">
                              <button
                                id={`stock-toggle-${product.id}`}
                                type="button"
                                onClick={() => handleToggleStock(product.id)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  product.inStock ? 'bg-emerald-500' : 'bg-neutral-800'
                                }`}
                                aria-label={`Toggle stock for ${product.name}`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                    product.inStock ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                              <span className={`text-[11px] font-semibold min-w-[65px] ${
                                product.inStock ? 'text-emerald-400' : 'text-neutral-500'
                              }`}>
                                {product.inStock ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                id={`edit-btn-${product.id}`}
                                type="button"
                                onClick={() => handleStartEdit(product)}
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                                title="Edit product name and price"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                id={`delete-btn-${product.id}`}
                                type="button"
                                onClick={() => setProductToDelete({ id: product.id, name: product.name })}
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950/80 text-neutral-400 hover:text-rose-400 border border-transparent hover:border-rose-800/40 transition-colors"
                                title={`Delete "${product.name}" from catalog`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANALYTICS & MOVEMENT */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Customer Movement & Demand Insights
                </h2>
                <p className="text-xs text-neutral-400">
                  Real-time metrics on customer basket additions, views, and catalog interactions
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefreshAnalytics}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Live</span>
              </button>
            </div>

            {/* Analytics Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-emerald-400 mb-1">
                  <span className="text-[11px] font-medium">Cart Additions</span>
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold text-white tracking-tight">
                  {totalCartAdditions}
                </div>
                <span className="text-[10px] text-emerald-400">Items added to customer baskets</span>
              </div>

              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-amber-400 mb-1">
                  <span className="text-[11px] font-medium">Top Velocity Item</span>
                  <Flame className="w-4 h-4" />
                </div>
                <div className="text-sm font-bold text-white truncate" title={movementLeaderboard[0]?.product.name}>
                  {movementLeaderboard[0]?.product.name || 'Eggs (Retail)'}
                </div>
                <span className="text-[10px] text-neutral-500">Highest daily orders</span>
              </div>

              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-sky-400 mb-1">
                  <span className="text-[11px] font-medium">Cold Store Share</span>
                  <Layers className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold text-white tracking-tight">
                  64%
                </div>
                <span className="text-[10px] text-neutral-500">Chicken, Fish, Eggs & Meat</span>
              </div>

              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span className="text-[11px] font-medium">Logged Activities</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-white tracking-tight">
                  {activityLogs.length}
                </div>
                <span className="text-[10px] text-neutral-500">Recent store actions</span>
              </div>
            </div>

            {/* Product Movement Leaderboard */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Product Demand Leaderboard</span>
                </h3>
                <span className="text-[11px] text-neutral-400">
                  Ranked by Customer Cart Velocity & Interest
                </span>
              </div>

              <div className="space-y-2.5">
                {movementLeaderboard.slice(0, 8).map((item, idx) => {
                  const percentage = Math.min(100, Math.round((item.movementScore / maxMovementScore) * 100));

                  return (
                    <div key={item.product.id} className="bg-neutral-950/60 rounded-xl p-3 border border-neutral-850">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                            idx === 0 ? 'bg-amber-400 text-neutral-950' :
                            idx === 1 ? 'bg-neutral-300 text-neutral-950' :
                            idx === 2 ? 'bg-amber-700 text-white' :
                            'bg-neutral-800 text-neutral-400'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-white">
                            {item.product.name}
                          </span>
                          <span className="text-[10px] text-neutral-400 bg-neutral-850 px-1.5 py-0.2 rounded">
                            {item.product.categoryLabel}
                          </span>
                          {!item.product.inStock && (
                            <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 rounded">
                              Out of Stock
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-emerald-400 font-bold">
                            {item.stats.cartAdds} cart additions
                          </span>
                          <span className="text-neutral-500 text-[11px]">
                            {item.stats.views} views
                          </span>
                        </div>
                      </div>

                      {/* Velocity bar */}
                      <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Customer & Admin Activity Feed */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Recent Store & Basket Activity</span>
                </h3>
                <span className="text-[11px] text-neutral-500">
                  Live session events
                </span>
              </div>

              <div className="divide-y divide-neutral-800/80 max-h-60 overflow-y-auto pr-1">
                {activityLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-neutral-200">
                        {log.description}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 shrink-0 ml-2">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SETTINGS & TERMINAL PIN */}
        {activeTab === 'settings' && (
          <div className="max-w-lg mx-auto space-y-4">
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <KeyRound className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Change Staff Security PIN
                </h3>
              </div>
              <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                Update the 4-digit code required to unlock this admin dashboard. Default is <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-200">1234</code>.
              </p>

              <form onSubmit={handleChangePin} className="space-y-3">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Current 4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value)}
                    placeholder="Enter current PIN (e.g. 1234)"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono tracking-widest"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1">New 4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="Enter new 4 digits"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono tracking-widest"
                  />
                </div>

                {pinChangeMsg && (
                  <div className={`p-2 rounded-xl text-xs font-semibold ${
                    pinChangeMsg.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}>
                    {pinChangeMsg.text}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-all active:scale-95 shadow-sm"
                >
                  Update Staff PIN
                </button>
              </form>
            </div>

            {/* Catalog Reset & Diagnostics */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Catalog Reset
                </h3>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Restore all original product prices, cuts, and categories to the standard Ashaiman store defaults.
              </p>

              <button
                type="button"
                onClick={handleResetCatalog}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors"
              >
                Reset Catalog to Factory Defaults
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM ERRORS & TELEMETRY MONITOR */}
        {activeTab === 'errors' && (
          <div className="space-y-4">
            {/* Header / Overview */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-emerald-400" />
                    <span>System Error & Telemetry Watchdog</span>
                  </h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    alertStats.unresolved > 0
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 animate-pulse'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {alertStats.unresolved > 0 ? `${alertStats.unresolved} Unresolved Issues` : 'All Systems Operational'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
                  Real-time storefront watchdog monitoring customer-side glitches, broken image CDN thumbnails, failed click states, and uncaught script exceptions.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleClearAlerts}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Logs</span>
                </button>
              </div>
            </div>

            {/* Telemetry Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span className="text-xs">Total Monitored</span>
                  <Terminal className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="text-xl font-bold text-white tracking-tight">
                  {alertStats.total}
                </div>
                <span className="text-[10px] text-neutral-500">
                  Telemetry events recorded
                </span>
              </div>

              <div className={`rounded-2xl p-3.5 border ${
                alertStats.unresolved > 0
                  ? 'bg-rose-950/20 border-rose-800/40'
                  : 'bg-neutral-900/80 border-neutral-800'
              }`}>
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span className="text-xs">Active Alerts</span>
                  <AlertOctagon className={`w-4 h-4 ${alertStats.unresolved > 0 ? 'text-rose-400 animate-pulse' : 'text-neutral-400'}`} />
                </div>
                <div className={`text-xl font-bold tracking-tight ${
                  alertStats.unresolved > 0 ? 'text-rose-400' : 'text-white'
                }`}>
                  {alertStats.unresolved}
                </div>
                <span className="text-[10px] text-neutral-500">
                  Requiring attention
                </span>
              </div>

              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span className="text-xs">Image Failures</span>
                  <ImageOff className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-bold text-amber-400 tracking-tight">
                  {alertStats.brokenImages}
                </div>
                <span className="text-[10px] text-neutral-500">
                  CDN & URL 404 fallbacks
                </span>
              </div>

              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span className="text-xs">Runtime Errors</span>
                  <Bug className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-xl font-bold text-rose-400 tracking-tight">
                  {alertStats.errors}
                </div>
                <span className="text-[10px] text-neutral-500">
                  Exceptions & click blocks
                </span>
              </div>
            </div>

            {/* Diagnostic Simulation Testing Tools */}
            <div className="bg-neutral-900/60 border border-neutral-800/90 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-neutral-200">
                    Interactive Error Simulator (Admin Quality Control)
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 hidden sm:inline">
                  Test watchdog error ticker responsiveness
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="simulate-broken-image-btn"
                  onClick={() => handleSimulateError('image')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <ImageOff className="w-3.5 h-3.5" />
                  <span>Simulate Broken Image</span>
                </button>

                <button
                  type="button"
                  id="simulate-click-glitch-btn"
                  onClick={() => handleSimulateError('click')}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Simulate Click Glitch</span>
                </button>

                <button
                  type="button"
                  id="simulate-script-error-btn"
                  onClick={() => handleSimulateError('script')}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Bug className="w-3.5 h-3.5" />
                  <span>Simulate Script Exception</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={alertSearchQuery}
                  onChange={(e) => setAlertSearchQuery(e.target.value)}
                  placeholder="Filter alerts by title, source, error..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                {/* Level filters */}
                <div className="flex items-center bg-neutral-950 p-0.5 rounded-xl border border-neutral-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setAlertFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      alertFilter === 'all' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    All ({alertStats.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertFilter('error')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      alertFilter === 'error' ? 'bg-rose-950/60 text-rose-300 font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Errors ({alertStats.errors})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertFilter('warning')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      alertFilter === 'warning' ? 'bg-amber-950/60 text-amber-300 font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Warnings ({alertStats.warnings})
                  </button>
                </div>

                {/* Category selector */}
                <select
                  value={alertCategoryFilter}
                  onChange={(e) => setAlertCategoryFilter(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Categories</option>
                  <option value="image_broken">Broken Images</option>
                  <option value="user_interaction">User Interaction</option>
                  <option value="runtime_exception">Runtime Exceptions</option>
                  <option value="stock_alert">Stock & Inventory</option>
                </select>
              </div>
            </div>

            {/* Live Error Ticker Feed */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Live Incident Stream ({filteredAlerts.length})
                  </h3>
                </div>
                <span className="text-[11px] text-neutral-500">
                  Newest events listed first
                </span>
              </div>

              {filteredAlerts.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    No matching incidents found
                  </h4>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    {systemAlerts.length === 0
                      ? 'The storefront is operating normally with zero recorded runtime errors or image failures.'
                      : 'No alerts match your current search and filter selections.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-800/80 max-h-[600px] overflow-y-auto">
                  {filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                        alert.resolved ? 'opacity-60 bg-neutral-950/40' : 'hover:bg-neutral-800/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                          alert.level === 'error'
                            ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                            : alert.level === 'warning'
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                            : 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                        }`}>
                          {alert.level === 'error' ? (
                            <Bug className="w-4 h-4" />
                          ) : alert.level === 'warning' ? (
                            alert.category === 'image_broken' ? (
                              <ImageOff className="w-4 h-4" />
                            ) : (
                              <AlertTriangle className="w-4 h-4" />
                            )
                          ) : (
                            <Info className="w-4 h-4" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                              alert.level === 'error'
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : alert.level === 'warning'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                            }`}>
                              {alert.level}
                            </span>
                            <span className="text-[10px] text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded-md font-medium">
                              {alert.category.replace('_', ' ')}
                            </span>
                            <h4 className="text-xs font-bold text-white">
                              {alert.title}
                            </h4>
                          </div>

                          <p className="text-xs text-neutral-300 font-mono text-[11px] leading-relaxed break-all bg-neutral-950/70 p-2 rounded-xl border border-neutral-800/70">
                            {alert.details}
                          </p>

                          <div className="flex items-center gap-3 text-[10px] text-neutral-500 pt-0.5">
                            <span>Source: <strong className="text-neutral-400 font-semibold">{alert.source}</strong></span>
                            <span>•</span>
                            <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            <span>•</span>
                            <span>{new Date(alert.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {alert.resolved ? (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Resolved</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleResolveAlert(alert.id)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-emerald-500 hover:text-neutral-950 text-neutral-300 transition-all active:scale-95 flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Resolved</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl my-6">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-800/60"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mb-1">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Add New Store Product</span>
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Add a new grocery, vegetable, or cold-store item to the live catalog.
            </p>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Fresh Catfish, Palm Oil (1L)"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as any })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="proteins">Proteins & Cold Store</option>
                    <option value="vegetables">Fresh Vegetables</option>
                    <option value="pantry">Pantry & Grains</option>
                    <option value="canned">Canned Foods</option>
                    <option value="condiments">Condiments & Spices</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Base Price ({STORE_SETTINGS.currency})</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Unit / Packaging</label>
                <input
                  type="text"
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                  placeholder="e.g. per kg, per bottle, 1 paint bucket"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Description</label>
                <input
                  type="text"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="e.g. Freshly cleaned, prepared for speedy dispatch."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Image URL</label>
                <input
                  type="url"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProduct.inStock}
                    onChange={(e) => setNewProduct({ ...newProduct, inStock: e.target.checked })}
                    className="rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Mark as In Stock immediately</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProduct.isVariablePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, isVariablePrice: e.target.checked })}
                    className="rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Custom Budget Portion</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all active:scale-95 shadow-sm"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IN-APP CONFIRM PRODUCT DELETION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white text-center mb-1">
              Remove Product from Store?
            </h3>
            <p className="text-xs text-neutral-400 text-center leading-relaxed mb-5">
              Are you sure you want to remove <span className="text-white font-semibold">"{productToDelete.name}"</span> from the store catalog? The product will be removed from inventory and any active cart selections will update immediately.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="cancel-delete-product-btn"
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-delete-product-btn"
                onClick={() => executeDeleteProduct(productToDelete.id, productToDelete.name)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
