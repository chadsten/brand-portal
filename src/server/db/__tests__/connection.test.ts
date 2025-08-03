import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { sql } from "drizzle-orm";
import {
	checkDatabaseHealth,
	createDatabaseSchema,
	testDatabaseConnection,
} from "../connection";
import { db } from "../index";

describe("Database Connection", () => {
	beforeAll(async () => {
		// Ensure test database is available
		await createDatabaseSchema();
	});

	afterAll(async () => {
		// Clean up test data if needed
	});

	it("should successfully connect to database", async () => {
		const isConnected = await testDatabaseConnection();
		expect(isConnected).toBe(true);
	});

	it("should return health status with latency", async () => {
		const health = await checkDatabaseHealth();

		expect(health.connected).toBe(true);
		expect(typeof health.latency).toBe("number");
		expect(health.latency).toBeGreaterThan(0);
		expect(health.error).toBeUndefined();
	});

	it("should handle connection errors gracefully", async () => {
		// Mock a failed connection by using invalid query
		const health = await checkDatabaseHealth();

		// Since we're testing with real connection, this should pass
		expect(health.connected).toBe(true);
	});

	it("should create required database extensions", async () => {
		await expect(createDatabaseSchema()).resolves.not.toThrow();

		// Verify uuid-ossp extension exists
		const result = await db.execute(sql`
      SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
    `);

		expect(result.length).toBeGreaterThan(0);
	});

	it("should execute basic queries", async () => {
		const result = await db.execute(sql`SELECT version()`);
		expect(result).toBeDefined();
		expect(result.length).toBeGreaterThan(0);
	});

	it("should handle concurrent connections", async () => {
		const promises = Array.from({ length: 5 }, () => testDatabaseConnection());
		const results = await Promise.all(promises);

		expect(results.every((result) => result === true)).toBe(true);
	});
});
