import { redis } from "./index";

export interface CacheOptions {
	ttl?: number; // Time to live in seconds
	namespace?: string;
}

export class CacheManager {
	private defaultTTL = 3600; // 1 hour
	private namespace: string;

	constructor(namespace = "default") {
		this.namespace = namespace;
	}

	private getKey(key: string): string {
		return `${this.namespace}:${key}`;
	}

	async get<T = any>(key: string): Promise<T | null> {
		try {
			const value = await redis.get(this.getKey(key));
			return value ? JSON.parse(value) : null;
		} catch (error) {
			console.error(`Cache get error for key ${key}:`, error);
			return null;
		}
	}

	async set<T = any>(
		key: string,
		value: T,
		options: CacheOptions = {},
	): Promise<boolean> {
		try {
			const ttl = options.ttl ?? this.defaultTTL;
			const serialized = JSON.stringify(value);

			await redis.setex(this.getKey(key), ttl, serialized);
			return true;
		} catch (error) {
			console.error(`Cache set error for key ${key}:`, error);
			return false;
		}
	}

	async delete(key: string): Promise<boolean> {
		try {
			const result = await redis.del(this.getKey(key));
			return result > 0;
		} catch (error) {
			console.error(`Cache delete error for key ${key}:`, error);
			return false;
		}
	}

	async deletePattern(pattern: string): Promise<number> {
		try {
			const keys = await redis.keys(this.getKey(pattern));
			if (keys.length === 0) return 0;

			const result = await redis.del(...keys);
			return result;
		} catch (error) {
			console.error(
				`Cache delete pattern error for pattern ${pattern}:`,
				error,
			);
			return 0;
		}
	}

	async exists(key: string): Promise<boolean> {
		try {
			const result = await redis.exists(this.getKey(key));
			return result === 1;
		} catch (error) {
			console.error(`Cache exists error for key ${key}:`, error);
			return false;
		}
	}

	async increment(key: string, amount = 1): Promise<number> {
		try {
			return await redis.incrby(this.getKey(key), amount);
		} catch (error) {
			console.error(`Cache increment error for key ${key}:`, error);
			return 0;
		}
	}

	async expire(key: string, ttl: number): Promise<boolean> {
		try {
			const result = await redis.expire(this.getKey(key), ttl);
			return result === 1;
		} catch (error) {
			console.error(`Cache expire error for key ${key}:`, error);
			return false;
		}
	}

	async ttl(key: string): Promise<number> {
		try {
			return await redis.ttl(this.getKey(key));
		} catch (error) {
			console.error(`Cache TTL error for key ${key}:`, error);
			return -1;
		}
	}

	async flush(): Promise<boolean> {
		try {
			const keys = await redis.keys(this.getKey("*"));
			if (keys.length === 0) return true;

			await redis.del(...keys);
			return true;
		} catch (error) {
			console.error("Cache flush error:", error);
			return false;
		}
	}
}

// Pre-configured cache managers for different purposes
export const organizationCache = new CacheManager("org");
export const userCache = new CacheManager("user");
export const assetCache = new CacheManager("asset");
export const sessionCache = new CacheManager("session");
export const tierCache = new CacheManager("tier");

// Utility functions for common caching patterns
export async function getOrSetCache<T>(
	cacheManager: CacheManager,
	key: string,
	fetchFn: () => Promise<T>,
	options: CacheOptions = {},
): Promise<T> {
	// Try to get from cache first
	const cached = await cacheManager.get<T>(key);
	if (cached !== null) {
		return cached;
	}

	// Fetch fresh data
	const fresh = await fetchFn();

	// Cache the fresh data
	await cacheManager.set(key, fresh, options);

	return fresh;
}

// Cache invalidation patterns
export class CacheInvalidator {
	static async invalidateOrganization(orgId: string): Promise<void> {
		await Promise.all([
			organizationCache.delete(`details:${orgId}`),
			organizationCache.delete(`settings:${orgId}`),
			organizationCache.delete(`usage:${orgId}`),
			organizationCache.deletePattern(`users:${orgId}:*`),
			assetCache.deletePattern(`org:${orgId}:*`),
		]);
	}

	static async invalidateUser(userId: string): Promise<void> {
		await Promise.all([
			userCache.delete(`profile:${userId}`),
			userCache.delete(`permissions:${userId}`),
			userCache.delete(`roles:${userId}`),
		]);
	}

	static async invalidateAsset(assetId: string, orgId: string): Promise<void> {
		await Promise.all([
			assetCache.delete(`details:${assetId}`),
			assetCache.delete(`metadata:${assetId}`),
			organizationCache.delete(`usage:${orgId}`),
		]);
	}

	static async invalidateTier(tierId: string): Promise<void> {
		await Promise.all([
			tierCache.delete(`details:${tierId}`),
			tierCache.delete(`limits:${tierId}`),
			tierCache.delete(`features:${tierId}`),
		]);
	}
}

// Rate limiting using Redis
export class RateLimiter {
	private window: number; // Time window in seconds
	private maxRequests: number;
	private keyPrefix: string;

	constructor(window: number, maxRequests: number, keyPrefix = "ratelimit") {
		this.window = window;
		this.maxRequests = maxRequests;
		this.keyPrefix = keyPrefix;
	}

	async isAllowed(identifier: string): Promise<{
		allowed: boolean;
		count: number;
		remaining: number;
		resetTime: number;
	}> {
		const key = `${this.keyPrefix}:${identifier}`;
		const now = Math.floor(Date.now() / 1000);
		const windowStart = now - this.window;

		try {
			// Use Redis pipeline for atomic operations
			const pipeline = redis.pipeline();

			// Remove old entries
			pipeline.zremrangebyscore(key, 0, windowStart);

			// Count current requests
			pipeline.zcard(key);

			// Add current request
			pipeline.zadd(key, now, `${now}-${Math.random()}`);

			// Set expiration
			pipeline.expire(key, this.window);

			const results = await pipeline.exec();

			if (!results) {
				throw new Error("Pipeline execution failed");
			}

			const count = (results[1]?.[1] as number) || 0;
			const allowed = count < this.maxRequests;
			const remaining = Math.max(0, this.maxRequests - count - 1);
			const resetTime = now + this.window;

			return { allowed, count: count + 1, remaining, resetTime };
		} catch (error) {
			console.error("Rate limiting error:", error);
			// Default to allowing request if Redis fails
			return {
				allowed: true,
				count: 1,
				remaining: this.maxRequests - 1,
				resetTime: now + this.window,
			};
		}
	}
}

// Pre-configured rate limiters
export const authRateLimit = new RateLimiter(60, 5); // 5 requests per minute
export const apiRateLimit = new RateLimiter(60, 100); // 100 requests per minute
export const uploadRateLimit = new RateLimiter(3600, 50); // 50 uploads per hour
