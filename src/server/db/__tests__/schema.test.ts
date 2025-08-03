import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { sql } from "drizzle-orm";
import { db } from "../index";
import {
	organizations,
	roles,
	tiers,
	usageMetrics,
	userRoles,
	users,
} from "../schema";
import {
	createDefaultSuperAdmin,
	getOrganizationUsage,
	initializeDefaultData,
	updateUsageMetrics,
	validateDatabaseSchema,
} from "../utils";

describe("Database Schema", () => {
	beforeAll(async () => {
		// Clean up any existing test data
		await db.execute(sql`TRUNCATE TABLE ${userRoles} CASCADE`);
		await db.execute(sql`TRUNCATE TABLE ${usageMetrics} CASCADE`);
		await db.execute(sql`TRUNCATE TABLE ${users} CASCADE`);
		await db.execute(sql`TRUNCATE TABLE ${organizations} CASCADE`);
		await db.execute(sql`TRUNCATE TABLE ${roles} CASCADE`);
		await db.execute(sql`TRUNCATE TABLE ${tiers} CASCADE`);
	});

	afterAll(async () => {
		// Clean up test data
		await db.execute(sql`TRUNCATE TABLE ${userRoles} CASCADE`);
		await db.execute(sql`TRUNCATE TABLE ${usageMetrics} CASCADE`);
		await db.execute(sql`TRUNCATE TABLE ${users} CASCADE`);
		await db.execute(sql`TRUNCATE TABLE ${organizations} CASCADE`);
		await db.execute(sql`TRUNCATE TABLE ${roles} CASCADE`);
		await db.execute(sql`TRUNCATE TABLE ${tiers} CASCADE`);
	});

	it("should validate schema structure", async () => {
		const isValid = await validateDatabaseSchema();
		expect(isValid).toBe(true);
	});

	it("should initialize default data", async () => {
		await expect(initializeDefaultData()).resolves.not.toThrow();

		// Verify tiers were created
		const tierCount = await db.select().from(tiers);
		expect(tierCount.length).toBe(3);

		// Verify roles were created
		const roleCount = await db.select().from(roles);
		expect(roleCount.length).toBe(3);
	});

	it("should create tier with proper structure", async () => {
		const [basicTier] = await db
			.select()
			.from(tiers)
			.where(sql`${tiers.name} = 'basic'`)
			.limit(1);

		expect(basicTier).toBeDefined();
		if (basicTier) {
			expect(basicTier.name).toBe("basic");
			expect(basicTier.displayName).toBe("Basic");
			expect(basicTier.limits).toHaveProperty("maxUsers");
			expect(basicTier.features).toHaveProperty("customS3");
		}
	});

	it("should create organization with tier reference", async () => {
		const [basicTier] = await db
			.select()
			.from(tiers)
			.where(sql`${tiers.name} = 'basic'`)
			.limit(1);

		if (!basicTier) throw new Error("Basic tier not found");

		const [org] = await db
			.insert(organizations)
			.values({
				name: "Test Organization",
				slug: "test-org",
				tierId: basicTier.id,
			})
			.returning();

		expect(org).toBeDefined();
		if (org) {
			expect(org.name).toBe("Test Organization");
			expect(org.tierId).toBe(basicTier.id);
		}
	});

	it("should create super admin user", async () => {
		const adminId = await createDefaultSuperAdmin(
			"admin@test.com",
			"hashedpassword",
			"Super Admin",
		);

		expect(adminId).toBeDefined();

		const [admin] = await db
			.select()
			.from(users)
			.where(sql`${users.id} = ${adminId}`)
			.limit(1);

		expect(admin).toBeDefined();
		if (admin) {
			expect(admin.isSuperAdmin).toBe(true);
			expect(admin.email).toBe("admin@test.com");
		}
	});

	it("should prevent duplicate super admin creation", async () => {
		await expect(
			createDefaultSuperAdmin(
				"admin2@test.com",
				"hashedpassword",
				"Super Admin 2",
			),
		).rejects.toThrow("Super admin already exists");
	});

	it("should handle user-role relationships", async () => {
		const [org] = await db.select().from(organizations).limit(1);
		const [role] = await db.select().from(roles).limit(1);

		if (!org || !role) throw new Error("Test data not found");

		const [user] = await db
			.insert(users)
			.values({
				email: "user@test.com",
				name: "Test User",
				organizationId: org.id,
			})
			.returning();

		if (!user) throw new Error("User creation failed");

		await db.insert(userRoles).values({
			userId: user.id,
			roleId: role.id,
		});

		const userRole = await db
			.select()
			.from(userRoles)
			.where(sql`${userRoles.userId} = ${user.id}`)
			.limit(1);

		expect(userRole.length).toBe(1);
	});

	it("should track usage metrics", async () => {
		const [org] = await db.select().from(organizations).limit(1);

		if (!org) throw new Error("Organization not found");

		await updateUsageMetrics(org.id, {
			totalAssets: 100,
			totalStorageBytes: 1000000,
			totalUsers: 5,
		});

		const usage = await getOrganizationUsage(org.id);

		expect(usage.totalAssets).toBe(100);
		expect(usage.totalStorageBytes).toBe(1000000);
		expect(usage.totalUsers).toBe(5);
	});

	it("should enforce unique constraints", async () => {
		const [basicTier] = await db.select().from(tiers).limit(1);

		if (!basicTier) throw new Error("Basic tier not found");

		// Try to create organization with duplicate slug
		await expect(
			db.insert(organizations).values({
				name: "Duplicate Test",
				slug: "test-org", // This slug already exists
				tierId: basicTier.id,
			}),
		).rejects.toThrow();

		// Try to create user with duplicate email
		await expect(
			db.insert(users).values({
				email: "admin@test.com", // This email already exists
				name: "Duplicate User",
			}),
		).rejects.toThrow();
	});

	it("should handle JSONB fields correctly", async () => {
		const [tier] = await db.select().from(tiers).limit(1);

		if (!tier) throw new Error("Tier not found");

		expect(typeof tier.limits).toBe("object");
		expect(typeof tier.features).toBe("object");
		expect(tier.limits).toHaveProperty("maxUsers");
		expect(tier.features).toHaveProperty("customS3");
	});

	it("should maintain referential integrity", async () => {
		const [org] = await db.select().from(organizations).limit(1);

		if (!org) throw new Error("Organization not found");

		// Try to delete organization that has users
		await expect(
			db.delete(organizations).where(sql`${organizations.id} = ${org.id}`),
		).rejects.toThrow();
	});
});
