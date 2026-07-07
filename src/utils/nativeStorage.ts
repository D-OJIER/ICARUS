import AsyncStorage from '@react-native-async-storage/async-storage';

const cache: Record<string, string> = {};

export const nativeStorage = {
  async init() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const pairs = await AsyncStorage.multiGet(keys);
      for (const [key, value] of pairs) {
        if (value !== null) {
          cache[key] = value;
        }
      }
    } catch (e) {
      console.warn('Failed to initialize native storage cache:', e);
    }
  },

  getItem(key: string): string | null {
    return cache[key] || null;
  },

  setItem(key: string, value: string) {
    cache[key] = value;
    AsyncStorage.setItem(key, value).catch(err => {
      console.warn(`Failed to persist key ${key} to AsyncStorage:`, err);
    });
  },

  removeItem(key: string) {
    delete cache[key];
    AsyncStorage.removeItem(key).catch(err => {
      console.warn(`Failed to remove key ${key} from AsyncStorage:`, err);
    });
  },

  clear() {
    for (const key in cache) {
      delete cache[key];
    }
    AsyncStorage.clear().catch(err => {
      console.warn('Failed to clear AsyncStorage:', err);
    });
  }
};

// Polyfill localStorage globally for progression utilities
if (typeof global !== 'undefined') {
  // Only polyfill if localStorage is not already defined (avoids throwing on web where localStorage is a read-only window property)
  try {
    if (typeof (global as any).localStorage === 'undefined') {
      (global as any).localStorage = nativeStorage;
    }
  } catch (e) {
    console.warn('Failed to polyfill global.localStorage:', e);
  }
  
  // Also polyfill sessionStorage (simple memory fallback)
  if (typeof (global as any).sessionStorage === 'undefined') {
    const sessionCache: Record<string, string> = {};
    (global as any).sessionStorage = {
      getItem: (key: string) => sessionCache[key] || null,
      setItem: (key: string, val: string) => { sessionCache[key] = val; },
      removeItem: (key: string) => { delete sessionCache[key]; },
      clear: () => { for (const k in sessionCache) delete sessionCache[k]; }
    };
  }
}
export default nativeStorage;

