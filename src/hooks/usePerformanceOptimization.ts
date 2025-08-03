"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

// Hook for debouncing values (prevents excessive API calls)
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Hook for throttling function calls
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      return callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCall.current = Date.now();
        callback(...args);
      }, delay - (now - lastCall.current));
    }
  }, [callback, delay]) as T;

  return throttledCallback;
}

// Hook for intersection observer (lazy loading)
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, IntersectionObserverEntry | null] {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [element, setElement] = useState<Element | null>(null);

  const callbackRef = useCallback((node: Element | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setEntry(entry);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, options]);

  return [callbackRef, entry];
}

// Hook for lazy loading images
export function useLazyImage(src: string, options: IntersectionObserverInit = {}) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [ref, entry] = useIntersectionObserver(options);

  useEffect(() => {
    if (entry?.isIntersecting && src && !imageSrc) {
      setImageSrc(src);
    }
  }, [entry, src, imageSrc]);

  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setIsError(true);
    img.src = imageSrc;
  }, [imageSrc]);

  return {
    ref,
    src: imageSrc,
    isLoaded,
    isError,
    isInView: entry?.isIntersecting ?? false,
  };
}

// Hook for performance monitoring
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<{
    renderTime: number;
    memoryUsage: number;
    connectionType: string;
  }>({
    renderTime: 0,
    memoryUsage: 0,
    connectionType: 'unknown',
  });

  const markRenderStart = useRef<number>(0);

  const startRender = useCallback(() => {
    markRenderStart.current = performance.now();
  }, []);

  const endRender = useCallback(() => {
    const renderTime = performance.now() - markRenderStart.current;
    setMetrics(prev => ({ ...prev, renderTime }));
  }, []);

  useEffect(() => {
    // Monitor memory usage
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
        }));
      }
    };

    // Monitor connection type
    const updateConnectionType = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setMetrics(prev => ({
          ...prev,
          connectionType: connection.effectiveType || 'unknown',
        }));
      }
    };

    updateMemoryUsage();
    updateConnectionType();

    const interval = setInterval(() => {
      updateMemoryUsage();
      updateConnectionType();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    startRender,
    endRender,
  };
}

// Hook for optimizing re-renders with shallow comparison
export function useShallowMemo<T>(value: T): T {
  const ref = useRef<T>(value);

  if (typeof value === 'object' && value !== null) {
    const keys = Object.keys(value) as (keyof T)[];
    const prevKeys = Object.keys(ref.current || {}) as (keyof T)[];

    if (keys.length !== prevKeys.length) {
      ref.current = value;
    } else {
      const hasChanged = keys.some(key => value[key] !== (ref.current as T)[key]);
      if (hasChanged) {
        ref.current = value;
      }
    }
  } else if (value !== ref.current) {
    ref.current = value;
  }

  return ref.current;
}

// Hook for batching state updates
export function useBatchedState<T>(initialState: T): [T, (updater: (prev: T) => T) => void] {
  const [state, setState] = useState<T>(initialState);
  const pendingUpdates = useRef<((prev: T) => T)[]>([]);
  const isScheduled = useRef(false);

  const batchedSetState = useCallback((updater: (prev: T) => T) => {
    pendingUpdates.current.push(updater);

    if (!isScheduled.current) {
      isScheduled.current = true;
      
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        setState(prevState => {
          let newState = prevState;
          pendingUpdates.current.forEach(update => {
            newState = update(newState);
          });
          pendingUpdates.current = [];
          isScheduled.current = false;
          return newState;
        });
      });
    }
  }, []);

  return [state, batchedSetState];
}

// Hook for prefetching data
export function usePrefetch<T>(
  fetcher: () => Promise<T>,
  shouldPrefetch: boolean = true,
  delay: number = 100
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<Map<string, T>>(new Map());

  const prefetch = useCallback(async (key?: string) => {
    const cacheKey = key || 'default';
    
    if (cacheRef.current.has(cacheKey)) {
      setData(cacheRef.current.get(cacheKey)!);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cacheRef.current.set(cacheKey, result);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    if (shouldPrefetch) {
      const timer = setTimeout(() => {
        prefetch();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [shouldPrefetch, delay, prefetch]);

  return {
    data,
    isLoading,
    error,
    prefetch,
    clearCache: () => cacheRef.current.clear(),
  };
}

// Hook for optimizing list rendering
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 3
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleEnd = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(visibleStart, visibleEnd).map((item, index) => ({
    item,
    index: visibleStart + index,
    top: (visibleStart + index) * itemHeight,
  }));

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    visibleStart,
    visibleEnd,
  };
}