// Advanced caching utilities for performance optimization

export interface CacheOptions {
	ttl?: number; // Time to live in milliseconds
	maxSize?: number; // Maximum number of entries
	storage?: "memory" | "localStorage" | "sessionStorage";
	compress?: boolean;
	onEvict?: (key: string, value: any) => void;
}

export interface CacheEntry<T> {
	value: T;
	timestamp: number;
	ttl?: number;
	accessCount: number;
	lastAccessed: number;
}

// LRU Cache implementation
export class LRUCache<T = any> {
	private cache = new Map<string, CacheEntry<T>>();
	private options: Required<CacheOptions>;

	constructor(options: CacheOptions = {}) {
		this.options = {
			ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
			maxSize: options.maxSize || 100,
			storage: options.storage || "memory",
			compress: options.compress || false,
			onEvict: options.onEvict || (() => {}),
		};

		// Load from persistent storage if specified
		if (this.options.storage !== "memory") {
			this.loadFromStorage();
		}
	}

	// Set cache entry
	set(key: string, value: T, ttl?: number): void {
		const now = Date.now();

		// Remove oldest entries if cache is full
		if (this.cache.size >= this.options.maxSize) {
			this.evictLRU();
		}

		const entry: CacheEntry<T> = {
			value: this.options.compress ? this.compress(value) : value,
			timestamp: now,
			ttl: ttl || this.options.ttl,
			accessCount: 0,
			lastAccessed: now,
		};

		this.cache.set(key, entry);
		this.saveToStorage();
	}

	// Get cache entry
	get(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry) return null;

		const now = Date.now();

		// Check if expired
		if (entry.ttl && now - entry.timestamp > entry.ttl) {
			this.delete(key);
			return null;
		}

		// Update access statistics
		entry.accessCount++;
		entry.lastAccessed = now;

		// Move to end (most recently used)
		this.cache.delete(key);
		this.cache.set(key, entry);

		return this.options.compress ? this.decompress(entry.value) : entry.value;
	}

	// Check if key exists and is valid
	has(key: string): boolean {
		return this.get(key) !== null;
	}

	// Delete entry
	delete(key: string): boolean {
		const entry = this.cache.get(key);
		if (entry) {
			this.options.onEvict(key, entry.value);
		}
		const result = this.cache.delete(key);
		this.saveToStorage();
		return result;
	}

	// Clear all entries
	clear(): void {
		this.cache.forEach((entry, key) => {
			this.options.onEvict(key, entry.value);
		});
		this.cache.clear();
		this.saveToStorage();
	}

	// Get cache statistics
	getStats(): {
		size: number;
		hitRate: number;
		memoryUsage: number;
		entries: Array<{
			key: string;
			size: number;
			accessCount: number;
			age: number;
		}>;
	} {
		const now = Date.now();
		let totalAccesses = 0;
		let totalHits = 0;
		let totalMemory = 0;

		const entries = Array.from(this.cache.entries()).map(([key, entry]) => {
			const size = this.getEntrySize(entry);
			totalAccesses += entry.accessCount;
			if (entry.accessCount > 0) totalHits++;
			totalMemory += size;

			return {
				key,
				size,
				accessCount: entry.accessCount,
				age: now - entry.timestamp,
			};
		});

		return {
			size: this.cache.size,
			hitRate: totalAccesses > 0 ? totalHits / totalAccesses : 0,
			memoryUsage: totalMemory,
			entries,
		};
	}

	// Evict least recently used entry
	private evictLRU(): void {
		const firstKey = this.cache.keys().next().value;
		if (firstKey) {
			this.delete(firstKey);
		}
	}

	// Simple compression
	private compress(value: any): any {
		if (typeof value === "string") {
			return btoa(value); // Base64 encoding as simple compression
		}
		return JSON.stringify(value);
	}

	// Simple decompression
	private decompress(value: any): any {
		if (typeof value === "string") {
			try {
				return atob(value); // Base64 decoding
			} catch {
				return JSON.parse(value);
			}
		}
		return value;
	}

	// Calculate entry size in bytes
	private getEntrySize(entry: CacheEntry<T>): number {
		return JSON.stringify(entry).length;
	}

	// Load from persistent storage
	private loadFromStorage(): void {
		if (typeof window === "undefined") return;

		try {
			const storage =
				this.options.storage === "localStorage" ? localStorage : sessionStorage;
			const data = storage.getItem(`cache_${this.constructor.name}`);

			if (data) {
				const parsed = JSON.parse(data);
				this.cache = new Map(parsed);
			}
		} catch (error) {
			console.warn("Failed to load cache from storage:", error);
		}
	}

	// Save to persistent storage
	private saveToStorage(): void {
		if (typeof window === "undefined" || this.options.storage === "memory")
			return;

		try {
			const storage =
				this.options.storage === "localStorage" ? localStorage : sessionStorage;
			const data = JSON.stringify(Array.from(this.cache.entries()));
			storage.setItem(`cache_${this.constructor.name}`, data);
		} catch (error) {
			console.warn("Failed to save cache to storage:", error);
		}
	}
}

// Query cache for API responses
export class QueryCache extends LRUCache<any> {
	private pendingQueries = new Map<string, Promise<any>>();

	constructor(options: CacheOptions = {}) {
		super({
			...options,
			ttl: options.ttl || 5 * 60 * 1000, // 5 minutes for API responses
			maxSize: options.maxSize || 50,
		});
	}

	// Get or fetch data
	async getOrFetch<T>(
		key: string,
		fetcher: () => Promise<T>,
		ttl?: number,
	): Promise<T> {
		// Check cache first
		const cached = this.get(key);
		if (cached) return cached;

		// Check if query is already pending
		if (this.pendingQueries.has(key)) {
			return this.pendingQueries.get(key)!;
		}

		// Fetch and cache
		const promise = fetcher()
			.then((data) => {
				this.set(key, data, ttl);
				this.pendingQueries.delete(key);
				return data;
			})
			.catch((error) => {
				this.pendingQueries.delete(key);
				throw error;
			});

		this.pendingQueries.set(key, promise);
		return promise;
	}

	// Invalidate cache by pattern
	invalidatePattern(pattern: string | RegExp): void {
		const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
		const stats = this.getStats();

		stats.entries.forEach((entry) => {
			if (regex.test(entry.key)) {
				this.delete(entry.key);
			}
		});
	}

	// Prefetch data
	async prefetch<T>(
		key: string,
		fetcher: () => Promise<T>,
		ttl?: number,
	): Promise<void> {
		if (!this.has(key)) {
			try {
				await this.getOrFetch(key, fetcher, ttl);
			} catch (error) {
				console.warn("Prefetch failed:", error);
			}
		}
	}
}

// Image cache for optimized loading
export class ImageCache extends LRUCache<string> {
	constructor(options: CacheOptions = {}) {
		super({
			...options,
			ttl: options.ttl || 24 * 60 * 60 * 1000, // 24 hours for images
			maxSize: options.maxSize || 200,
		});
	}

	// Load and cache image
	async loadImage(url: string): Promise<string> {
		const cached = this.get(url);
		if (cached) return cached;

		return new Promise((resolve, reject) => {
			const img = new Image();

			img.onload = () => {
				// Convert to data URL for caching
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d")!;
				canvas.width = img.width;
				canvas.height = img.height;
				ctx.drawImage(img, 0, 0);

				const dataURL = canvas.toDataURL();
				this.set(url, dataURL);
				resolve(dataURL);
			};

			img.onerror = reject;
			img.src = url;
		});
	}

	// Preload images
	async preloadImages(urls: string[]): Promise<void> {
		const promises = urls.map((url) =>
			this.loadImage(url).catch((error) =>
				console.warn(`Failed to preload image: ${url}`, error),
			),
		);

		await Promise.allSettled(promises);
	}
}

// Component state cache for preserving UI state
export class ComponentStateCache extends LRUCache<any> {
	constructor() {
		super({
			ttl: 30 * 60 * 1000, // 30 minutes for component state
			maxSize: 100,
			storage: "sessionStorage", // Preserve during session
		});
	}

	// Save component state
	saveState(componentId: string, state: any): void {
		this.set(`component_${componentId}`, state);
	}

	// Restore component state
	restoreState(componentId: string): any {
		return this.get(`component_${componentId}`);
	}

	// Clear state for specific component
	clearState(componentId: string): void {
		this.delete(`component_${componentId}`);
	}
}

// Cache manager for coordinating multiple caches
export class CacheManager {
	private caches = new Map<string, LRUCache>();

	// Register a cache
	register(name: string, cache: LRUCache): void {
		this.caches.set(name, cache);
	}

	// Get cache by name
	getCache(name: string): LRUCache | undefined {
		return this.caches.get(name);
	}

	// Clear all caches
	clearAll(): void {
		this.caches.forEach((cache) => cache.clear());
	}

	// Get global statistics
	getGlobalStats(): Record<string, any> {
		const stats: Record<string, any> = {};

		this.caches.forEach((cache, name) => {
			stats[name] = cache.getStats();
		});

		return stats;
	}

	// Cleanup expired entries across all caches
	cleanup(): void {
		this.caches.forEach((cache) => {
			// Force a cleanup by checking all entries for expiration
			const stats = cache.getStats();
			stats.entries.forEach((entry) => {
				cache.get(entry.key); // This will trigger cleanup of expired entries
			});
		});
	}
}

// Global cache instances
export const queryCache = new QueryCache();
export const imageCache = new ImageCache();
export const componentStateCache = new ComponentStateCache();
export const cacheManager = new CacheManager();

// Register global caches
cacheManager.register("query", queryCache);
cacheManager.register("image", imageCache);
cacheManager.register("componentState", componentStateCache);

// React hooks for cache integration
export function useQueryCache<T>(
	key: string,
	fetcher: () => Promise<T>,
	options: { ttl?: number; enabled?: boolean } = {},
): {
	data: T | null;
	loading: boolean;
	error: Error | null;
	refetch: () => Promise<void>;
} {
	const [data, setData] = React.useState<T | null>(null);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<Error | null>(null);

	const fetchData = React.useCallback(async () => {
		if (!options.enabled) return;

		setLoading(true);
		setError(null);

		try {
			const result = await queryCache.getOrFetch(key, fetcher, options.ttl);
			setData(result);
		} catch (err) {
			setError(err as Error);
		} finally {
			setLoading(false);
		}
	}, [key, fetcher, options.ttl, options.enabled]);

	React.useEffect(() => {
		// Check cache first
		const cached = queryCache.get(key);
		if (cached) {
			setData(cached);
		} else if (options.enabled !== false) {
			fetchData();
		}
	}, [key, fetchData]);

	const refetch = React.useCallback(async () => {
		queryCache.delete(key);
		await fetchData();
	}, [key, fetchData]);

	return { data, loading, error, refetch };
}

export function useComponentState<T>(
	componentId: string,
	initialState: T,
): [T, (state: T) => void] {
	const [state, setState] = React.useState<T>(() => {
		const saved = componentStateCache.restoreState(componentId);
		return saved !== null ? saved : initialState;
	});

	const updateState = React.useCallback(
		(newState: T) => {
			setState(newState);
			componentStateCache.saveState(componentId, newState);
		},
		[componentId],
	);

	return [state, updateState];
}

// React import
import React from "react";
