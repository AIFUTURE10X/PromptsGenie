import { useCallback, useRef } from 'react';

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  return debouncedCallback;
}

export function useDebouncedAsync<T extends (...args: any[]) => Promise<any>>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const pendingPromiseRef = useRef<Promise<any> | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve, reject) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Cancel previous pending promise
        if (pendingPromiseRef.current) {
          pendingPromiseRef.current = null;
        }

        timeoutRef.current = setTimeout(async () => {
          try {
            const promise = callback(...args);
            pendingPromiseRef.current = promise;
            const result = await promise;
            
            // Only resolve if this is still the current promise
            if (pendingPromiseRef.current === promise) {
              resolve(result);
              pendingPromiseRef.current = null;
            }
          } catch (error) {
            // Only reject if this is still the current promise
            if (pendingPromiseRef.current) {
              reject(error);
              pendingPromiseRef.current = null;
            }
          }
        }, delay);
      });
    },
    [callback, delay]
  ) as T;

  return debouncedCallback;
}