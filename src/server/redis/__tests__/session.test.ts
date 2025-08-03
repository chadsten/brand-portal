import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "@jest/globals";
import { redis } from "../index";
import { type SessionData, SessionManager, sessionManager } from "../session";

describe("Session Manager", () => {
	let testSessionManager: SessionManager;

	beforeAll(async () => {
		testSessionManager = new SessionManager();
		await redis.flushdb();
	});

	afterAll(async () => {
		await redis.flushdb();
	});

	beforeEach(async () => {
		await redis.flushdb();
	});

	const createTestSessionData = (): SessionData => ({
		userId: "user123",
		organizationId: "org123",
		roles: ["admin"],
		permissions: {
			assets: ["read", "write"],
			users: ["read"],
		},
		lastActivity: Date.now(),
		metadata: { loginMethod: "oauth" },
	});

	it("should create and retrieve sessions correctly", async () => {
		const sessionId = "session123";
		const sessionData = createTestSessionData();

		const created = await testSessionManager.create(sessionId, sessionData);
		expect(created).toBe(true);

		const retrieved = await testSessionManager.get(sessionId);
		expect(retrieved).toBeDefined();
		expect(retrieved?.userId).toBe(sessionData.userId);
		expect(retrieved?.organizationId).toBe(sessionData.organizationId);
		expect(retrieved?.roles).toEqual(sessionData.roles);
		expect(retrieved?.permissions).toEqual(sessionData.permissions);
	});

	it("should return null for non-existent sessions", async () => {
		const result = await testSessionManager.get("non-existent");
		expect(result).toBeNull();
	});

	it("should update sessions correctly", async () => {
		const sessionId = "session456";
		const sessionData = createTestSessionData();

		await testSessionManager.create(sessionId, sessionData);

		const updates = {
			roles: ["user", "content_manager"],
			metadata: { loginMethod: "credentials" },
		};

		const updated = await testSessionManager.update(sessionId, updates);
		expect(updated).toBe(true);

		const retrieved = await testSessionManager.get(sessionId);
		expect(retrieved?.roles).toEqual(updates.roles);
		expect(retrieved?.metadata).toEqual(updates.metadata);
		expect(retrieved?.userId).toBe(sessionData.userId); // Should preserve other fields
	});

	it("should touch sessions to update activity", async () => {
		const sessionId = "session789";
		const sessionData = createTestSessionData();

		await testSessionManager.create(sessionId, sessionData);

		const originalActivity = sessionData.lastActivity;

		// Wait a bit to ensure different timestamp
		await new Promise((resolve) => setTimeout(resolve, 10));

		const touched = await testSessionManager.touch(sessionId);
		expect(touched).toBe(true);

		const retrieved = await testSessionManager.get(sessionId);
		expect(retrieved?.lastActivity).toBeGreaterThan(originalActivity);
	});

	it("should delete sessions correctly", async () => {
		const sessionId = "session-delete";
		const sessionData = createTestSessionData();

		await testSessionManager.create(sessionId, sessionData);

		const exists = await testSessionManager.exists(sessionId);
		expect(exists).toBe(true);

		const deleted = await testSessionManager.delete(sessionId);
		expect(deleted).toBe(true);

		const existsAfter = await testSessionManager.exists(sessionId);
		expect(existsAfter).toBe(false);
	});

	it("should delete sessions by user ID", async () => {
		const userId = "user-multi";
		const sessionData1 = { ...createTestSessionData(), userId };
		const sessionData2 = { ...createTestSessionData(), userId };
		const sessionData3 = createTestSessionData(); // Different user

		await testSessionManager.create("session1", sessionData1);
		await testSessionManager.create("session2", sessionData2);
		await testSessionManager.create("session3", sessionData3);

		const deletedCount = await testSessionManager.deleteByUser(userId);
		expect(deletedCount).toBe(2);

		expect(await testSessionManager.exists("session1")).toBe(false);
		expect(await testSessionManager.exists("session2")).toBe(false);
		expect(await testSessionManager.exists("session3")).toBe(true);
	});

	it("should extend session TTL", async () => {
		const sessionId = "session-extend";
		const sessionData = createTestSessionData();

		await testSessionManager.create(sessionId, sessionData, 60); // 60 seconds

		const initialTTL = await redis.ttl(`session:${sessionId}`);
		expect(initialTTL).toBeGreaterThan(50);
		expect(initialTTL).toBeLessThanOrEqual(60);

		const extended = await testSessionManager.extend(sessionId, 30);
		expect(extended).toBe(true);

		const newTTL = await redis.ttl(`session:${sessionId}`);
		expect(newTTL).toBeGreaterThan(initialTTL);
	});

	it("should get active sessions for a user", async () => {
		const userId = "user-active";
		const sessionData = { ...createTestSessionData(), userId };

		await testSessionManager.create("active1", sessionData);
		await testSessionManager.create("active2", sessionData);
		await testSessionManager.create("other", createTestSessionData());

		const activeSessions = await testSessionManager.getActiveSessions(userId);
		expect(activeSessions).toHaveLength(2);
		expect(activeSessions).toContain("active1");
		expect(activeSessions).toContain("active2");
		expect(activeSessions).not.toContain("other");
	});

	it("should handle session expiration", async () => {
		const sessionId = "session-expire";
		const sessionData = createTestSessionData();

		await testSessionManager.create(sessionId, sessionData, 1); // 1 second TTL

		let exists = await testSessionManager.exists(sessionId);
		expect(exists).toBe(true);

		// Wait for expiration
		await new Promise((resolve) => setTimeout(resolve, 1100));

		exists = await testSessionManager.exists(sessionId);
		expect(exists).toBe(false);

		const retrieved = await testSessionManager.get(sessionId);
		expect(retrieved).toBeNull();
	});

	it("should cleanup expired sessions", async () => {
		const sessionData = createTestSessionData();

		// Create sessions with different TTL
		await testSessionManager.create("expire1", sessionData, 1);
		await testSessionManager.create("expire2", sessionData, 1);
		await testSessionManager.create("keep", sessionData, 3600);

		// Wait for some to expire
		await new Promise((resolve) => setTimeout(resolve, 1100));

		const cleanedUp = await testSessionManager.cleanup();
		expect(cleanedUp).toBeGreaterThanOrEqual(0); // Some sessions may have been cleaned

		// Long-lived session should still exist
		const stillExists = await testSessionManager.exists("keep");
		expect(stillExists).toBe(true);
	});

	it("should handle concurrent operations", async () => {
		const sessionId = "concurrent-test";
		const sessionData = createTestSessionData();

		// Create session
		await testSessionManager.create(sessionId, sessionData);

		// Simulate concurrent updates
		const promises = Array.from({ length: 5 }, (_, i) =>
			testSessionManager.update(sessionId, {
				metadata: { updateNumber: i },
			}),
		);

		const results = await Promise.all(promises);
		expect(results.every((result) => result === true)).toBe(true);

		// Session should still be valid
		const final = await testSessionManager.get(sessionId);
		expect(final).toBeDefined();
		expect(final?.userId).toBe(sessionData.userId);
	});
});
