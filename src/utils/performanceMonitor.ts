// Performance monitoring and optimization utilities

interface PerformanceMetrics {
  renderTime: number;
  loadTime: number;
  memoryUsage: number;
  connectionSpeed: string;
  cacheHitRate: number;
  errorRate: number;
}

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  entryType: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    loadTime: 0,
    memoryUsage: 0,
    connectionSpeed: 'unknown',
    cacheHitRate: 0,
    errorRate: 0,
  };

  private observers: Map<string, PerformanceObserver> = new Map();
  private cacheStats = { hits: 0, misses: 0 };
  private errorCount = 0;
  private totalRequests = 0;

  constructor() {
    this.initializeObservers();
    this.monitorResourceLoading();
    this.monitorMemoryUsage();
    this.monitorConnectionSpeed();
  }

  private initializeObservers() {
    // Monitor navigation timing
    if ('PerformanceObserver' in window) {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.metrics.loadTime = navEntry.loadEventEnd - navEntry.navigationStart;
          }
        });
      });

      try {
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navigationObserver);
      } catch (error) {
        console.warn('Navigation performance observer not supported', error);
      }

      // Monitor measure timing
      const measureObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.startsWith('React') || entry.name.includes('render')) {
            this.metrics.renderTime = entry.duration;
          }
        });
      });

      try {
        measureObserver.observe({ entryTypes: ['measure'] });
        this.observers.set('measure', measureObserver);
      } catch (error) {
        console.warn('Measure performance observer not supported', error);
      }
    }
  }

  private monitorResourceLoading() {
    const originalFetch = window.fetch;
    let requestCount = 0;
    let errorCount = 0;

    window.fetch = async (...args) => {
      const startTime = performance.now();
      requestCount++;
      this.totalRequests++;

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        // Log slow requests
        if (endTime - startTime > 1000) {
          console.warn(`Slow request detected: ${args[0]} took ${endTime - startTime}ms`);
        }

        // Update cache stats based on cache headers
        const cacheControl = response.headers.get('cache-control');
        if (cacheControl?.includes('max-age') || response.headers.get('etag')) {
          this.cacheStats.hits++;
        } else {
          this.cacheStats.misses++;
        }

        this.updateCacheHitRate();

        if (!response.ok) {
          errorCount++;
          this.errorCount++;
          this.updateErrorRate();
        }

        return response;
      } catch (error) {
        errorCount++;
        this.errorCount++;
        this.updateErrorRate();
        throw error;
      }
    };
  }

  private monitorMemoryUsage() {
    const updateMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
      }
    };

    updateMemory();
    setInterval(updateMemory, 10000); // Update every 10 seconds
  }

  private monitorConnectionSpeed() {
    const updateConnection = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        this.metrics.connectionSpeed = connection.effectiveType || 'unknown';
      }
    };

    updateConnection();
    
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', updateConnection);
    }
  }

  private updateCacheHitRate() {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    this.metrics.cacheHitRate = total > 0 ? (this.cacheStats.hits / total) * 100 : 0;
  }

  private updateErrorRate() {
    this.metrics.errorRate = this.totalRequests > 0 ? (this.errorCount / this.totalRequests) * 100 : 0;
  }

  // Public methods
  markRenderStart(componentName: string) {
    performance.mark(`${componentName}-render-start`);
  }

  markRenderEnd(componentName: string) {
    performance.mark(`${componentName}-render-end`);
    performance.measure(
      `${componentName}-render`,
      `${componentName}-render-start`,
      `${componentName}-render-end`
    );
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getDetailedTiming() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (!navigation) return null;

    return {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      ssl: navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : 0,
      ttfb: navigation.responseStart - navigation.requestStart,
      download: navigation.responseEnd - navigation.responseStart,
      domProcessing: navigation.domContentLoadedEventStart - navigation.responseEnd,
      resourceLoading: navigation.loadEventStart - navigation.domContentLoadedEventEnd,
      total: navigation.loadEventEnd - navigation.navigationStart,
    };
  }

  getResourceTiming() {
    return performance.getEntriesByType('resource').map((entry) => ({
      name: entry.name,
      duration: entry.duration,
      size: (entry as PerformanceResourceTiming).transferSize,
      type: this.getResourceType(entry.name),
    }));
  }

  private getResourceType(url: string): string {
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\.(js|jsx|ts|tsx)$/i)) return 'script';
    if (url.match(/\.(css)$/i)) return 'stylesheet';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  reportVitals() {
    // Core Web Vitals
    const vitals = {
      LCP: 0, // Largest Contentful Paint
      FID: 0, // First Input Delay
      CLS: 0, // Cumulative Layout Shift
      FCP: 0, // First Contentful Paint
      TTFB: 0, // Time to First Byte
    };

    // Get LCP
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.LCP = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Get FID
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            vitals.FID = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Get CLS
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!(entry as any).hadRecentInput) {
              vitals.CLS += (entry as any).value;
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

      } catch (error) {
        console.warn('Web Vitals monitoring not fully supported', error);
      }
    }

    // Get paint timings
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach((entry) => {
      if (entry.name === 'first-contentful-paint') {
        vitals.FCP = entry.startTime;
      }
    });

    // Get TTFB from navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      vitals.TTFB = navigation.responseStart - navigation.requestStart;
    }

    return vitals;
  }

  generateReport() {
    const metrics = this.getMetrics();
    const timing = this.getDetailedTiming();
    const resources = this.getResourceTiming();
    const vitals = this.reportVitals();

    return {
      timestamp: new Date().toISOString(),
      metrics,
      timing,
      resources,
      vitals,
      recommendations: this.generateRecommendations(metrics, timing, vitals),
    };
  }

  private generateRecommendations(
    metrics: PerformanceMetrics,
    timing: any,
    vitals: any
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.loadTime > 3000) {
      recommendations.push('Page load time is slow. Consider code splitting and lazy loading.');
    }

    if (metrics.memoryUsage > 100) {
      recommendations.push('High memory usage detected. Check for memory leaks.');
    }

    if (metrics.cacheHitRate < 70) {
      recommendations.push('Low cache hit rate. Implement better caching strategies.');
    }

    if (metrics.errorRate > 5) {
      recommendations.push('High error rate detected. Review error handling.');
    }

    if (vitals.LCP > 2500) {
      recommendations.push('Largest Contentful Paint is slow. Optimize largest elements.');
    }

    if (vitals.FID > 100) {
      recommendations.push('First Input Delay is high. Reduce JavaScript execution time.');
    }

    if (vitals.CLS > 0.1) {
      recommendations.push('Cumulative Layout Shift is high. Stabilize page layout.');
    }

    if (timing?.ttfb > 800) {
      recommendations.push('Time to First Byte is slow. Optimize server response time.');
    }

    return recommendations;
  }

  cleanup() {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitoring(componentName: string) {
  const startRender = () => performanceMonitor.markRenderStart(componentName);
  const endRender = () => performanceMonitor.markRenderEnd(componentName);
  
  return {
    startRender,
    endRender,
    getMetrics: () => performanceMonitor.getMetrics(),
    generateReport: () => performanceMonitor.generateReport(),
  };
}

// Utility functions for performance optimization
export const PerformanceUtils = {
  // Preload critical resources
  preloadResource(href: string, as: string, type?: string) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    document.head.appendChild(link);
  },

  // Prefetch resources for next navigation
  prefetchResource(href: string) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  },

  // Check if user prefers reduced motion
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Get connection quality
  getConnectionQuality() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        saveData: connection.saveData,
        downlink: connection.downlink,
        rtt: connection.rtt,
      };
    }
    return null;
  },

  // Optimize images based on connection
  getOptimalImageQuality() {
    const connection = this.getConnectionQuality();
    if (!connection) return 'high';

    if (connection.saveData) return 'low';
    
    switch (connection.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'low';
      case '3g':
        return 'medium';
      case '4g':
      default:
        return 'high';
    }
  },

  // Measure component render time
  measureRender<T extends (...args: any[]) => any>(
    fn: T,
    componentName: string
  ): T {
    return ((...args: Parameters<T>) => {
      performanceMonitor.markRenderStart(componentName);
      const result = fn(...args);
      performanceMonitor.markRenderEnd(componentName);
      return result;
    }) as T;
  },
};