/**
 * Safe Storage Utility for Tamayuz Educational Platform
 * Ensures 100% crash-proof storage access in all environments:
 * - Telegram in-app browser (iOS / Android)
 * - WhatsApp in-app browser
 * - Private / Sandboxed / Iframe WebViews
 * - Quota exceeded scenarios
 */

const memoryStorageFallback: Record<string, string> = {};

function checkLocalStorageSupport(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const testKey = '__tamayuz_storage_probe__';
    window.localStorage.setItem(testKey, 'probe');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const isLocalStorageUsable = checkLocalStorageSupport();

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (isLocalStorageUsable) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch {}
    return Object.prototype.hasOwnProperty.call(memoryStorageFallback, key)
      ? memoryStorageFallback[key]
      : null;
  },

  setItem(key: string, value: string): void {
    // Keep in-memory cache updated always
    memoryStorageFallback[key] = String(value);
    try {
      if (isLocalStorageUsable) {
        window.localStorage.setItem(key, String(value));
      }
    } catch (err) {
      // Gracefully ignore quota exceeded or permission errors in restricted webviews
    }
  },

  removeItem(key: string): void {
    delete memoryStorageFallback[key];
    try {
      if (isLocalStorageUsable) {
        window.localStorage.removeItem(key);
      }
    } catch {}
  },

  clear(): void {
    for (const k of Object.keys(memoryStorageFallback)) {
      delete memoryStorageFallback[k];
    }
    try {
      if (isLocalStorageUsable) {
        window.localStorage.clear();
      }
    } catch {}
  },
};

/**
 * Universal browser environment check
 */
export function isRunningInAppBrowser(): boolean {
  if (typeof window === 'undefined' || !navigator.userAgent) return false;
  const ua = navigator.userAgent || '';
  return /Telegram|WhatsApp|FBAN|FBAV|Instagram|Line|Twitter|Snapchat/i.test(ua);
}

export function isTelegramBrowser(): boolean {
  if (typeof window === 'undefined' || !navigator.userAgent) return false;
  const ua = navigator.userAgent || '';
  return /Telegram/i.test(ua) || Boolean((window as any).Telegram?.WebApp);
}

export function isWhatsAppBrowser(): boolean {
  if (typeof window === 'undefined' || !navigator.userAgent) return false;
  const ua = navigator.userAgent || '';
  return /WhatsApp/i.test(ua);
}
