import { useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export function useApiCache<T = any>(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default
  const cache = useRef<Map<string, CacheEntry<T>>>(new Map());

  // Generate cache key from parameters
  const generateKey = useCallback((params: any[]): string => {
    return JSON.stringify(params);
  }, []);

  // Get cached data
  const get = useCallback((key: string): T | null => {
    const entry = cache.current.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      cache.current.delete(key);
      return null;
    }

    return entry.data;
  }, []);

  // Set cached data
  const set = useCallback((key: string, data: T, ttl: number = defaultTTL): void => {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };
    cache.current.set(key, entry);
  }, [defaultTTL]);

  // Cached function wrapper
  const withCache = useCallback(<Args extends any[], Return>(
    fn: (...args: Args) => Promise<Return>,
    ttl: number = defaultTTL
  ) => {
    return async (...args: Args): Promise<Return> => {
      const key = generateKey(args);
      
      // Try to get from cache first
      const cached = get(key) as Return;
      if (cached !== null) {
        return cached;
      }

      // Execute function and cache result
      try {
        const result = await fn(...args);
        set(key, result as T, ttl);
        return result;
      } catch (error) {
        // Don't cache errors
        throw error;
      }
    };
  }, [generateKey, get, set, defaultTTL]);

  // Clear cache
  const clear = useCallback((pattern?: string): void => {
    if (!pattern) {
      cache.current.clear();
      return;
    }

    // Clear entries matching pattern
    for (const [key] of cache.current) {
      if (key.includes(pattern)) {
        cache.current.delete(key);
      }
    }
  }, []);

  // Clear expired entries
  const clearExpired = useCallback((): void => {
    const now = Date.now();
    for (const [key, entry] of cache.current) {
      if (now > entry.expiresAt) {
        cache.current.delete(key);
      }
    }
  }, []);

  // Get cache stats
  const getStats = useCallback(() => {
    const entries = Array.from(cache.current.values());
    const now = Date.now();
    const expired = entries.filter(entry => now > entry.expiresAt).length;
    
    return {
      total: cache.current.size,
      expired,
      active: cache.current.size - expired
    };
  }, []);

  return {
    get,
    set,
    withCache,
    clear,
    clearExpired,
    getStats,
    generateKey
  };
}