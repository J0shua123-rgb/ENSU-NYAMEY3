export interface SystemAlert {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  category: 'image_broken' | 'cart_error' | 'runtime_exception' | 'stock_alert' | 'user_interaction' | 'network';
  title: string;
  details: string;
  source?: string;
  resolved?: boolean;
}

const LOCAL_STORAGE_ALERTS_KEY = 'corner_mart_system_alerts_v1';

// Pre-seeded diagnostic baseline alerts for Ashaiman store monitoring
const INITIAL_BASELINE_ALERTS: SystemAlert[] = [
  {
    id: 'alert-init-1',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    level: 'info',
    category: 'network',
    title: 'Store System Initialized',
    details: 'Catalog & WhatsApp checkout router successfully loaded with 17 active items.',
    source: 'Storefront Core',
    resolved: true,
  },
  {
    id: 'alert-init-2',
    timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    level: 'warning',
    category: 'image_broken',
    title: 'Fallback Image Rendered',
    details: 'External CDN latency detected on tilapia thumbnail; replaced with fallback asset.',
    source: 'Catalog Engine (prot-5)',
    resolved: true,
  },
  {
    id: 'alert-init-3',
    timestamp: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
    level: 'info',
    category: 'stock_alert',
    title: 'Inventory Sync Verified',
    details: 'All poultry and seafood cuts reconciled with cold store warehouse balance.',
    source: 'Stock Telemetry',
    resolved: true,
  },
];

export function getSystemAlerts(): SystemAlert[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_ALERTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore error
  }

  try {
    localStorage.setItem(LOCAL_STORAGE_ALERTS_KEY, JSON.stringify(INITIAL_BASELINE_ALERTS));
  } catch {}

  return INITIAL_BASELINE_ALERTS;
}

export function logSystemAlert(alert: Omit<SystemAlert, 'id' | 'timestamp'>): SystemAlert {
  const newAlert: SystemAlert = {
    ...alert,
    id: 'alt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    resolved: alert.resolved ?? false,
  };

  try {
    const current = getSystemAlerts();
    // Prepend new alert and keep last 50
    const updated = [newAlert, ...current.filter((a) => a.id !== newAlert.id)].slice(0, 50);
    localStorage.setItem(LOCAL_STORAGE_ALERTS_KEY, JSON.stringify(updated));

    // Dispatch a custom event so active dashboard components update in real-time
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('corner_mart_alert_logged', { detail: newAlert }));
    }
  } catch (err) {
    console.error('Failed to log system alert:', err);
  }

  return newAlert;
}

export function resolveSystemAlert(id: string) {
  try {
    const current = getSystemAlerts();
    const updated = current.map((a) => (a.id === id ? { ...a, resolved: true } : a));
    localStorage.setItem(LOCAL_STORAGE_ALERTS_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('corner_mart_alert_logged'));
    }
  } catch {}
}

export function clearSystemAlerts() {
  try {
    localStorage.setItem(LOCAL_STORAGE_ALERTS_KEY, JSON.stringify([]));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('corner_mart_alert_logged'));
    }
  } catch {}
}

// Global window error & unhandled rejection catcher
let isListening = false;
export function initGlobalErrorCapture() {
  if (isListening || typeof window === 'undefined') return;
  isListening = true;

  window.addEventListener('error', (event) => {
    // Skip benign vite websocket messages
    if (event.message && event.message.includes('[vite]')) return;

    logSystemAlert({
      level: 'error',
      category: 'runtime_exception',
      title: 'Script Runtime Error',
      details: event.message || 'Unknown runtime error occurred',
      source: event.filename ? `${event.filename}:${event.lineno || 0}` : 'Window Listener',
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason ? String(event.reason) : 'Promise rejection with no reason';
    logSystemAlert({
      level: 'error',
      category: 'runtime_exception',
      title: 'Unhandled Promise Rejection',
      details: reason,
      source: 'Async Pipeline',
    });
  });
}
