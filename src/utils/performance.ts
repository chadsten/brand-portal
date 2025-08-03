// Performance monitoring and optimization utilities

// Performance measurement
export class PerformanceMonitor {
	private static instance: PerformanceMonitor;
	private metrics: Map<string, number[]> = new Map();
	private observers: PerformanceObserver[] = [];

	static getInstance(): PerformanceMonitor {
		if (!PerformanceMonitor.instance) {
			PerformanceMonitor.instance = new PerformanceMonitor();
		}
		return PerformanceMonitor.instance;
	}

	// Start timing an operation
	startTiming(name: string): () => void {
		const startTime = performance.now();

		return () => {
			const endTime = performance.now();
			const duration = endTime - startTime;
			this.recordMetric(name, duration);
		};
	}

	// Record a performance metric
	recordMetric(name: string, value: number): void {
		if (!this.metrics.has(name)) {
			this.metrics.set(name, []);
		}
		this.metrics.get(name)!.push(value);
	}

	// Get performance stats for a metric
	getStats(name: string): {
		count: number;
		average: number;
		min: number;
		max: number;
		latest: number;
	} | null {
		const values = this.metrics.get(name);
		if (!values || values.length === 0) return null;

		return {
			count: values.length,
			average: values.reduce((a, b) => a + b, 0) / values.length,
			min: Math.min(...values),
			max: Math.max(...values),
			latest: values[values.length - 1] || 0,
		};
	}

	// Get all metrics
	getAllMetrics(): Record<string, ReturnType<typeof this.getStats>> {
		const result: Record<string, ReturnType<typeof this.getStats>> = {};
		for (const [name] of this.metrics) {
			result[name] = this.getStats(name);
		}
		return result;
	}

	// Clear metrics
	clearMetrics(name?: string): void {
		if (name) {
			this.metrics.delete(name);
		} else {
			this.metrics.clear();
		}
	}

	// Start monitoring web vitals
	startWebVitalsMonitoring(): void {
		if (typeof window === "undefined") return;

		// Monitor Largest Contentful Paint (LCP)
		this.observeWebVital("largest-contentful-paint", (entries) => {
			const entry = entries[entries.length - 1];
			this.recordMetric("lcp", entry.startTime);
		});

		// Monitor First Input Delay (FID)
		this.observeWebVital("first-input", (entries) => {
			const entry = entries[0];
			this.recordMetric("fid", entry.processingStart - entry.startTime);
		});

		// Monitor Cumulative Layout Shift (CLS)
		this.observeWebVital("layout-shift", (entries) => {
			let clsScore = 0;
			for (const entry of entries) {
				if (!entry.hadRecentInput) {
					clsScore += entry.value;
				}
			}
			this.recordMetric("cls", clsScore);
		});
	}

	private observeWebVital(
		type: string,
		callback: (entries: any[]) => void,
	): void {
		try {
			const observer = new PerformanceObserver((list) => {
				callback(list.getEntries());
			});
			observer.observe({ type, buffered: true });
			this.observers.push(observer);
		} catch (error) {
			console.warn(`Failed to observe ${type}:`, error);
		}
	}

	// Stop all observers
	stopMonitoring(): void {
		this.observers.forEach((observer) => observer.disconnect());
		this.observers = [];
	}
}

// React performance hooks
export function usePerformanceTimer(
	name: string,
	dependencies: any[] = [],
): void {
	if (typeof window === "undefined") return;

	const monitor = PerformanceMonitor.getInstance();

	React.useEffect(() => {
		const stopTiming = monitor.startTiming(name);
		return stopTiming;
	}, dependencies);
}

// Image optimization utilities
export class ImageOptimizer {
	// Resize image maintaining aspect ratio
	static resizeImage(
		file: File,
		maxWidth: number,
		maxHeight: number,
		quality = 0.8,
	): Promise<Blob> {
		return new Promise((resolve) => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d")!;
			const img = new Image();

			img.onload = () => {
				// Calculate new dimensions
				let { width, height } = img;
				const aspectRatio = width / height;

				if (width > maxWidth) {
					width = maxWidth;
					height = width / aspectRatio;
				}

				if (height > maxHeight) {
					height = maxHeight;
					width = height * aspectRatio;
				}

				// Set canvas size
				canvas.width = width;
				canvas.height = height;

				// Draw and compress
				ctx.drawImage(img, 0, 0, width, height);
				canvas.toBlob(
					(blob) => {
						if (blob) {
							resolve(blob);
						}
					},
					"image/jpeg",
					quality,
				);
			};

			img.src = URL.createObjectURL(file);
		});
	}

	// Generate responsive image srcset
	static generateSrcSet(
		baseUrl: string,
		sizes: number[] = [320, 480, 768, 1024, 1440, 1920],
	): string {
		return sizes.map((size) => `${baseUrl}?w=${size} ${size}w`).join(", ");
	}

	// Lazy load images with intersection observer
	static lazyLoadImages(selector = "[data-lazy]"): void {
		if (typeof window === "undefined") return;

		const images = document.querySelectorAll(selector);
		const imageObserver = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const img = entry.target as HTMLImageElement;
					img.src = img.dataset.lazy || "";
					img.classList.remove("lazy");
					imageObserver.unobserve(img);
				}
			});
		});

		images.forEach((img) => imageObserver.observe(img));
	}
}

// Memory management utilities
export class MemoryManager {
	private static cleanupTasks: Array<() => void> = [];

	// Register cleanup task
	static registerCleanup(cleanup: () => void): void {
		MemoryManager.cleanupTasks.push(cleanup);
	}

	// Run all cleanup tasks
	static runCleanup(): void {
		MemoryManager.cleanupTasks.forEach((cleanup) => {
			try {
				cleanup();
			} catch (error) {
				console.warn("Cleanup task failed:", error);
			}
		});
		MemoryManager.cleanupTasks = [];
	}

	// Memory usage monitoring
	static getMemoryUsage(): {
		used: number;
		total: number;
		percentage: number;
	} | null {
		if (typeof window === "undefined" || !("memory" in performance)) {
			return null;
		}

		const memory = (performance as any).memory;
		return {
			used: memory.usedJSHeapSize,
			total: memory.totalJSHeapSize,
			percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
		};
	}

	// Force garbage collection (development only)
	static forceGC(): void {
		if (typeof window !== "undefined" && (window as any).gc) {
			(window as any).gc();
		}
	}
}

// Bundle size optimization utilities
export class BundleOptimizer {
	// Dynamic import with error handling
	static async dynamicImport<T>(
		importFn: () => Promise<T>,
		fallback?: T,
	): Promise<T> {
		try {
			return await importFn();
		} catch (error) {
			console.warn("Dynamic import failed:", error);
			if (fallback) return fallback;
			throw error;
		}
	}

	// Preload critical resources
	static preloadResource(href: string, as: string): void {
		if (typeof document === "undefined") return;

		const link = document.createElement("link");
		link.rel = "preload";
		link.href = href;
		link.as = as;
		document.head.appendChild(link);
	}

	// Prefetch resources
	static prefetchResource(href: string): void {
		if (typeof document === "undefined") return;

		const link = document.createElement("link");
		link.rel = "prefetch";
		link.href = href;
		document.head.appendChild(link);
	}
}

// API response caching
export class ResponseCache {
	private static cache = new Map<
		string,
		{
			data: any;
			timestamp: number;
			ttl: number;
		}
	>();

	// Set cache entry
	static set(key: string, data: any, ttl = 5 * 60 * 1000): void {
		ResponseCache.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl,
		});
	}

	// Get cache entry
	static get<T>(key: string): T | null {
		const entry = ResponseCache.cache.get(key);
		if (!entry) return null;

		if (Date.now() - entry.timestamp > entry.ttl) {
			ResponseCache.cache.delete(key);
			return null;
		}

		return entry.data;
	}

	// Clear cache
	static clear(pattern?: string): void {
		if (pattern) {
			const regex = new RegExp(pattern);
			for (const [key] of ResponseCache.cache) {
				if (regex.test(key)) {
					ResponseCache.cache.delete(key);
				}
			}
		} else {
			ResponseCache.cache.clear();
		}
	}

	// Get cache stats
	static getStats(): {
		size: number;
		entries: string[];
		totalSize: number;
	} {
		const entries = Array.from(ResponseCache.cache.keys());
		const totalSize = entries.reduce((size, key) => {
			const entry = ResponseCache.cache.get(key);
			return size + (entry ? JSON.stringify(entry.data).length : 0);
		}, 0);

		return {
			size: ResponseCache.cache.size,
			entries,
			totalSize,
		};
	}
}

// Virtual scrolling utilities
export class VirtualScroller {
	private container: HTMLElement;
	private itemHeight: number;
	private items: any[];
	private renderItem: (item: any, index: number) => HTMLElement;
	private visibleItems: HTMLElement[] = [];

	constructor(
		container: HTMLElement,
		itemHeight: number,
		items: any[],
		renderItem: (item: any, index: number) => HTMLElement,
	) {
		this.container = container;
		this.itemHeight = itemHeight;
		this.items = items;
		this.renderItem = renderItem;
		this.init();
	}

	private init(): void {
		this.container.style.height = `${this.items.length * this.itemHeight}px`;
		this.container.style.position = "relative";
		this.container.addEventListener("scroll", this.handleScroll.bind(this));
		this.updateVisibleItems();
	}

	private handleScroll(): void {
		this.updateVisibleItems();
	}

	private updateVisibleItems(): void {
		const scrollTop = this.container.scrollTop;
		const containerHeight = this.container.clientHeight;

		const startIndex = Math.floor(scrollTop / this.itemHeight);
		const endIndex = Math.min(
			startIndex + Math.ceil(containerHeight / this.itemHeight) + 1,
			this.items.length - 1,
		);

		// Clear existing items
		this.visibleItems.forEach((item) => item.remove());
		this.visibleItems = [];

		// Render visible items
		for (let i = startIndex; i <= endIndex; i++) {
			const item = this.renderItem(this.items[i], i);
			item.style.position = "absolute";
			item.style.top = `${i * this.itemHeight}px`;
			item.style.height = `${this.itemHeight}px`;
			this.container.appendChild(item);
			this.visibleItems.push(item);
		}
	}

	updateItems(newItems: any[]): void {
		this.items = newItems;
		this.container.style.height = `${this.items.length * this.itemHeight}px`;
		this.updateVisibleItems();
	}

	destroy(): void {
		this.container.removeEventListener("scroll", this.handleScroll.bind(this));
		this.visibleItems.forEach((item) => item.remove());
	}
}

// React virtual scrolling hook
export function useVirtualScroll<T>(
	items: T[],
	itemHeight: number,
	containerHeight: number,
	renderItem: (item: T, index: number) => React.ReactNode,
): {
	visibleItems: Array<{ item: T; index: number; top: number }>;
	totalHeight: number;
	scrollElementProps: {
		style: React.CSSProperties;
		onScroll: (e: React.UIEvent) => void;
	};
} {
	const [scrollTop, setScrollTop] = React.useState(0);

	const visibleStartIndex = Math.floor(scrollTop / itemHeight);
	const visibleEndIndex = Math.min(
		visibleStartIndex + Math.ceil(containerHeight / itemHeight) + 1,
		items.length - 1,
	);

	const visibleItems = React.useMemo(() => {
		const result: Array<{ item: T; index: number; top: number }> = [];
		for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
			if (i >= 0 && i < items.length) {
				const item = items[i];
				if (item !== undefined) {
					result.push({
						item,
						index: i,
						top: i * itemHeight,
					});
				}
			}
		}
		return result;
	}, [items, visibleStartIndex, visibleEndIndex, itemHeight]);

	const totalHeight = items.length * itemHeight;

	const scrollElementProps = {
		style: {
			height: containerHeight,
			overflow: "auto" as const,
		},
		onScroll: (e: React.UIEvent) => {
			setScrollTop((e.target as HTMLElement).scrollTop);
		},
	};

	return {
		visibleItems,
		totalHeight,
		scrollElementProps,
	};
}

// Performance debugging utilities
export class PerformanceDebugger {
	// Log render performance for React components
	static logRenderTime(componentName: string): MethodDecorator {
		return (
			target: any,
			propertyKey: string | symbol,
			descriptor: PropertyDescriptor,
		) => {
			const originalMethod = descriptor.value;

			descriptor.value = function (...args: any[]) {
				const start = performance.now();
				const result = originalMethod.apply(this, args);
				const end = performance.now();

				console.log(
					`${componentName}.${String(propertyKey)} rendered in ${end - start}ms`,
				);
				return result;
			};

			return descriptor;
		};
	}

	// Detect slow operations
	static detectSlowOperations(threshold = 16.67): void {
		if (typeof window === "undefined") return;

		const observer = new PerformanceObserver((list) => {
			list.getEntries().forEach((entry) => {
				if (entry.duration > threshold) {
					console.warn(
						`Slow operation detected: ${entry.name} took ${entry.duration}ms`,
					);
				}
			});
		});

		observer.observe({ entryTypes: ["measure"] });
	}

	// Memory leak detection
	static detectMemoryLeaks(): void {
		if (typeof window === "undefined") return;

		let baseline = 0;
		const checkInterval = 30000; // 30 seconds

		const check = () => {
			const usage = MemoryManager.getMemoryUsage();
			if (!usage) return;

			if (baseline === 0) {
				baseline = usage.used;
			} else if (usage.used > baseline * 1.5) {
				console.warn("Potential memory leak detected:", {
					baseline: baseline / 1024 / 1024,
					current: usage.used / 1024 / 1024,
					increase:
						(((usage.used - baseline) / baseline) * 100).toFixed(2) + "%",
				});
			}
		};

		setInterval(check, checkInterval);
	}
}

// Export singleton instances
export const performanceMonitor = PerformanceMonitor.getInstance();

// React import for hooks
import React from "react";
