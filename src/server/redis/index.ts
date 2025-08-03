import Redis from "ioredis";
import { env } from "~/env";

const globalForRedis = globalThis as unknown as {
	redis: Redis | undefined;
};

const createRedisInstance = () => {
	return new Redis(env.REDIS_URL, {
		maxRetriesPerRequest: 3,
		connectTimeout: 10000,
		commandTimeout: 5000,
		lazyConnect: true,
		keepAlive: 30000,
		family: 4,
		keyPrefix: "brand_portal:",
		db: env.NODE_ENV === "test" ? 1 : 0,
	});
};

export const redis = globalForRedis.redis ?? createRedisInstance();

if (env.NODE_ENV !== "production") {
	globalForRedis.redis = redis;
}

// Redis connection health check
export async function testRedisConnection(): Promise<boolean> {
	try {
		await redis.ping();
		return true;
	} catch (error) {
		console.error("Redis connection failed:", error);
		return false;
	}
}

// Redis health status with latency
export async function checkRedisHealth(): Promise<{
	connected: boolean;
	latency?: number;
	error?: string;
}> {
	try {
		const start = Date.now();
		await redis.ping();
		const latency = Date.now() - start;

		return { connected: true, latency };
	} catch (error) {
		return {
			connected: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

// Graceful shutdown
export async function closeRedisConnection(): Promise<void> {
	try {
		await redis.quit();
	} catch (error) {
		console.error("Error closing Redis connection:", error);
	}
}
