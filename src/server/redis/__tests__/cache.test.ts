import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "@jest/globals";
import {
	CacheInvalidator,
	CacheManager,
	getOrSetCache,
	organizationCache,
	RateLimiter,
	userCache,
} from "../cache";
import { redis } from "../index";

describe("Cache Manager", () => {
	let testCache: CacheManager;

	beforeAll(async () => {
		testCache = new CacheManager("test");
		await redis.flushdb();
	});

	afterAll(async () => {
		await redis.flushdb();
	});

	beforeEach(async () => {
		await testCache.flush();
	});

	it("should set and get values correctly", async () => {
		const key = "test-key";
		const value = { id: 1, name: "test" };

		const setResult = await testCache.set(key, value);
		expect(setResult).toBe(true);

		const retrieved = await testCache.get(key);
		expect(retrieved).toEqual(value);
	});

	it("should return null for non-existent keys", async () => {
		const result = await testCache.get("non-existent");
		expect(result).toBeNull();
	});

	it("should handle TTL correctly", async () => {
		const key = "ttl-test";
		const value = "test-value";

		await testCache.set(key, value, { ttl: 1 });

		let result = await testCache.get(key);
		expect(result).toBe(value);

		// Wait for expiration
		await new Promise((resolve) => setTimeout(resolve, 1100));

		result = await testCache.get(key);
		expect(result).toBeNull();
	});

	it("should delete keys correctly", async () => {
		const key = "delete-test";
		const value = "test-value";

		await testCache.set(key, value);

		let exists = await testCache.exists(key);
		expect(exists).toBe(true);

		const deleted = await testCache.delete(key);
		expect(deleted).toBe(true);

		exists = await testCache.exists(key);
		expect(exists).toBe(false);
	});

	it("should delete by pattern correctly", async () => {
		await testCache.set("pattern:test1", "value1");
		await testCache.set("pattern:test2", "value2");
		await testCache.set("other:test", "value3");

		const deleted = await testCache.deletePattern("pattern:*");
		expect(deleted).toBe(2);

		const exists1 = await testCache.exists("pattern:test1");
		const exists2 = await testCache.exists("pattern:test2");
		const exists3 = await testCache.exists("other:test");

		expect(exists1).toBe(false);
		expect(exists2).toBe(false);
		expect(exists3).toBe(true);
	});

	it("should increment values correctly", async () => {
		const key = "counter";

		const count1 = await testCache.increment(key);
		expect(count1).toBe(1);

		const count2 = await testCache.increment(key, 5);
		expect(count2).toBe(6);
	});

	it("should handle getOrSetCache pattern", async () => {
		const key = "getOrSet";
		let fetchCalled = false;

		const fetchFn = async () => {
			fetchCalled = true;
			return { data: "fetched" };
		};

		// First call should fetch
		const result1 = await getOrSetCache(testCache, key, fetchFn);
		expect(result1).toEqual({ data: "fetched" });
		expect(fetchCalled).toBe(true);

		// Second call should use cache
		fetchCalled = false;
		const result2 = await getOrSetCache(testCache, key, fetchFn);
		expect(result2).toEqual({ data: "fetched" });
		expect(fetchCalled).toBe(false);
	});
});

describe("Cache Invalidator", () => {
	beforeAll(async () => {
		await redis.flushdb();
	});

	beforeEach(async () => {
		// Setup test data
		await organizationCache.set("details:org1", {
			id: "org1",
			name: "Test Org",
		});
		await organizationCache.set("settings:org1", { theme: "dark" });
		await organizationCache.set("users:org1:user1", {
			id: "user1",
			name: "Test User",
		});
		await userCache.set("profile:user1", {
			id: "user1",
			email: "test@example.com",
		});
	});

	it("should invalidate organization cache correctly", async () => {
		// Verify data exists
		expect(await organizationCache.exists("details:org1")).toBe(true);
		expect(await organizationCache.exists("settings:org1")).toBe(true);
		expect(await organizationCache.exists("users:org1:user1")).toBe(true);

		await CacheInvalidator.invalidateOrganization("org1");

		// Verify data is deleted
		expect(await organizationCache.exists("details:org1")).toBe(false);
		expect(await organizationCache.exists("settings:org1")).toBe(false);
		expect(await organizationCache.exists("users:org1:user1")).toBe(false);
	});

	it("should invalidate user cache correctly", async () => {
		expect(await userCache.exists("profile:user1")).toBe(true);

		await CacheInvalidator.invalidateUser("user1");

		expect(await userCache.exists("profile:user1")).toBe(false);
	});
});

describe("Rate Limiter", () => {
	let rateLimiter: RateLimiter;

	beforeAll(async () => {
		rateLimiter = new RateLimiter(10, 3); // 3 requests per 10 seconds
		await redis.flushdb();
	});

	afterAll(async () => {
		await redis.flushdb();
	});

	it("should allow requests within limit", async () => {
		const identifier = "test-user";

		for (let i = 0; i < 3; i++) {
			const result = await rateLimiter.isAllowed(identifier);
			expect(result.allowed).toBe(true);
			expect(result.count).toBe(i + 1);
			expect(result.remaining).toBe(2 - i);
		}
	});

	it("should deny requests over limit", async () => {
		const identifier = "test-user-2";

		// Use up the limit
		for (let i = 0; i < 3; i++) {
			await rateLimiter.isAllowed(identifier);
		}

		// Next request should be denied
		const result = await rateLimiter.isAllowed(identifier);
		expect(result.allowed).toBe(false);
		expect(result.count).toBe(4);
		expect(result.remaining).toBe(0);
	});

	it("should reset after time window", async () => {
		const identifier = "test-user-3";
		const shortLimiter = new RateLimiter(1, 2); // 2 requests per 1 second

		// Use up the limit
		await shortLimiter.isAllowed(identifier);
		await shortLimiter.isAllowed(identifier);

		// Should be denied
		let result = await shortLimiter.isAllowed(identifier);
		expect(result.allowed).toBe(false);

		// Wait for reset
		await new Promise((resolve) => setTimeout(resolve, 1100));

		// Should be allowed again
		result = await shortLimiter.isAllowed(identifier);
		expect(result.allowed).toBe(true);
		expect(result.count).toBe(1);
	});
});
