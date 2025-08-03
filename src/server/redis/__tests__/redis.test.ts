import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import {
	checkRedisHealth,
	closeRedisConnection,
	redis,
	testRedisConnection,
} from "../index";

describe("Redis Connection", () => {
	beforeAll(async () => {
		// Ensure Redis is connected
		await redis.ping();
	});

	afterAll(async () => {
		// Clean up
		await redis.flushdb();
	});

	it("should successfully connect to Redis", async () => {
		const isConnected = await testRedisConnection();
		expect(isConnected).toBe(true);
	});

	it("should return health status with latency", async () => {
		const health = await checkRedisHealth();

		expect(health.connected).toBe(true);
		expect(typeof health.latency).toBe("number");
		expect(health.latency).toBeGreaterThan(0);
		expect(health.error).toBeUndefined();
	});

	it("should handle basic Redis operations", async () => {
		const key = "test:basic";
		const value = "test-value";

		// Set value
		await redis.set(key, value);

		// Get value
		const retrieved = await redis.get(key);
		expect(retrieved).toBe(value);

		// Check existence
		const exists = await redis.exists(key);
		expect(exists).toBe(1);

		// Delete
		const deleted = await redis.del(key);
		expect(deleted).toBe(1);

		// Verify deletion
		const existsAfter = await redis.exists(key);
		expect(existsAfter).toBe(0);
	});

	it("should handle JSON operations", async () => {
		const key = "test:json";
		const obj = { id: 1, name: "test", data: [1, 2, 3] };

		await redis.set(key, JSON.stringify(obj));

		const retrieved = await redis.get(key);
		const parsed = JSON.parse(retrieved!);

		expect(parsed).toEqual(obj);
	});

	it("should handle TTL operations", async () => {
		const key = "test:ttl";
		const value = "expires";

		await redis.setex(key, 2, value);

		const ttl = await redis.ttl(key);
		expect(ttl).toBeGreaterThan(0);
		expect(ttl).toBeLessThanOrEqual(2);

		const retrieved = await redis.get(key);
		expect(retrieved).toBe(value);
	});

	it("should handle list operations", async () => {
		const key = "test:list";
		const values = ["item1", "item2", "item3"];

		// Push items
		for (const value of values) {
			await redis.lpush(key, value);
		}

		// Get list length
		const length = await redis.llen(key);
		expect(length).toBe(3);

		// Get range
		const range = await redis.lrange(key, 0, -1);
		expect(range).toEqual(values.reverse()); // lpush reverses order

		// Clean up
		await redis.del(key);
	});

	it("should handle hash operations", async () => {
		const key = "test:hash";
		const hash = { field1: "value1", field2: "value2" };

		// Set hash fields
		await redis.hset(key, hash);

		// Get single field
		const field1 = await redis.hget(key, "field1");
		expect(field1).toBe("value1");

		// Get all fields
		const all = await redis.hgetall(key);
		expect(all).toEqual(hash);

		// Clean up
		await redis.del(key);
	});

	it("should handle set operations", async () => {
		const key = "test:set";
		const members = ["member1", "member2", "member3"];

		// Add members
		await redis.sadd(key, ...members);

		// Check membership
		const isMember = await redis.sismember(key, "member1");
		expect(isMember).toBe(1);

		// Get all members
		const allMembers = await redis.smembers(key);
		expect(allMembers.sort()).toEqual(members.sort());

		// Get cardinality
		const cardinality = await redis.scard(key);
		expect(cardinality).toBe(3);

		// Clean up
		await redis.del(key);
	});

	it("should handle sorted set operations", async () => {
		const key = "test:zset";

		// Add scored members
		await redis.zadd(key, 1, "first", 2, "second", 3, "third");

		// Get by rank
		const byRank = await redis.zrange(key, 0, -1);
		expect(byRank).toEqual(["first", "second", "third"]);

		// Get by score
		const byScore = await redis.zrangebyscore(key, 2, 3);
		expect(byScore).toEqual(["second", "third"]);

		// Get score
		const score = await redis.zscore(key, "second");
		expect(score).toBe("2");

		// Clean up
		await redis.del(key);
	});

	it("should handle pipeline operations", async () => {
		const pipeline = redis.pipeline();

		pipeline.set("pipe:1", "value1");
		pipeline.set("pipe:2", "value2");
		pipeline.get("pipe:1");
		pipeline.get("pipe:2");

		const results = await pipeline.exec();

		expect(results).toHaveLength(4);
		expect(results![0]![1]).toBe("OK");
		expect(results![1]![1]).toBe("OK");
		expect(results![2]![1]).toBe("value1");
		expect(results![3]![1]).toBe("value2");

		// Clean up
		await redis.del("pipe:1", "pipe:2");
	});

	it("should handle key patterns and scanning", async () => {
		const keys = ["pattern:test1", "pattern:test2", "other:test"];

		// Set test keys
		for (const key of keys) {
			await redis.set(key, "value");
		}

		// Find by pattern
		const patternKeys = await redis.keys("pattern:*");
		expect(patternKeys.sort()).toEqual(["pattern:test1", "pattern:test2"]);

		// Clean up
		await redis.del(...keys);
	});

	it("should handle concurrent operations", async () => {
		const promises = Array.from({ length: 10 }, (_, i) =>
			redis.set(`concurrent:${i}`, `value${i}`),
		);

		const results = await Promise.all(promises);
		expect(results.every((result) => result === "OK")).toBe(true);

		// Verify all keys exist
		const checkPromises = Array.from({ length: 10 }, (_, i) =>
			redis.get(`concurrent:${i}`),
		);

		const values = await Promise.all(checkPromises);
		values.forEach((value, i) => {
			expect(value).toBe(`value${i}`);
		});

		// Clean up
		const cleanupKeys = Array.from({ length: 10 }, (_, i) => `concurrent:${i}`);
		await redis.del(...cleanupKeys);
	});

	it("should handle connection errors gracefully", async () => {
		// This test verifies error handling without actually breaking the connection
		// In a real scenario, you might temporarily disconnect Redis

		const health = await checkRedisHealth();
		expect(health.connected).toBe(true);

		// Test with invalid command to see error handling
		try {
			// @ts-ignore - intentionally invalid command
			await redis.invalidCommand();
		} catch (error) {
			expect(error).toBeDefined();
		}
	});
});
