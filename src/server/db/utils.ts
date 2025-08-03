import { sql } from "drizzle-orm";
import { db } from "./index";
import { organizations, roles, tiers, usageMetrics, users } from "./schema";

export async function initializeDefaultData(): Promise<void> {
	try {
		// Create default tiers
		const existingTiers = await db.select().from(tiers).limit(1);

		if (existingTiers.length === 0) {
			await db.insert(tiers).values([
				{
					name: "basic",
					displayName: "Basic",
					limits: {
						maxUsers: 5,
						maxAssets: 500,
						maxStorageGB: 5,
						maxFileSizeMB: 50,
						maxAssetGroups: 10,
					},
					features: {
						customS3: false,
						passwordProtectedSharing: false,
						colorPalettes: false,
						fontManagement: false,
						advancedAnalytics: false,
						apiAccess: false,
						customBranding: false,
						ssoIntegration: false,
					},
					monthlyPriceUSD: "0.00",
				},
				{
					name: "pro",
					displayName: "Professional",
					limits: {
						maxUsers: 25,
						maxAssets: 5000,
						maxStorageGB: 50,
						maxFileSizeMB: 500,
						maxAssetGroups: 100,
					},
					features: {
						customS3: true,
						passwordProtectedSharing: true,
						colorPalettes: true,
						fontManagement: true,
						advancedAnalytics: true,
						apiAccess: true,
						customBranding: true,
						ssoIntegration: false,
					},
					monthlyPriceUSD: "49.00",
				},
				{
					name: "enterprise",
					displayName: "Enterprise",
					limits: {
						maxUsers: -1,
						maxAssets: -1,
						maxStorageGB: -1,
						maxFileSizeMB: 2000,
						maxAssetGroups: -1,
					},
					features: {
						customS3: true,
						passwordProtectedSharing: true,
						colorPalettes: true,
						fontManagement: true,
						advancedAnalytics: true,
						apiAccess: true,
						customBranding: true,
						ssoIntegration: true,
					},
					monthlyPriceUSD: "199.00",
				},
			]);
		}

		// Create default roles
		const existingRoles = await db.select().from(roles).limit(1);

		if (existingRoles.length === 0) {
			await db.insert(roles).values([
				{
					name: "admin",
					permissions: {
						assets: ["create", "read", "update", "delete"],
						users: ["create", "read", "update", "delete"],
						organization: ["read", "update"],
						groups: ["create", "read", "update", "delete"],
						sharing: ["create", "read", "update", "delete"],
						analytics: ["read"],
					},
				},
				{
					name: "content_manager",
					permissions: {
						assets: ["create", "read", "update", "delete"],
						users: ["read"],
						organization: ["read"],
						groups: ["create", "read", "update", "delete"],
						sharing: ["create", "read", "update", "delete"],
						analytics: [],
					},
				},
				{
					name: "user",
					permissions: {
						assets: ["read"],
						users: ["read"],
						organization: ["read"],
						groups: ["read"],
						sharing: ["read"],
						analytics: [],
					},
				},
			]);
		}

		console.log("Default data initialized successfully");
	} catch (error) {
		console.error("Failed to initialize default data:", error);
		throw error;
	}
}

export async function validateDatabaseSchema(): Promise<boolean> {
	try {
		// Check if all tables exist by querying them
		await db.select().from(tiers).limit(1);
		await db.select().from(organizations).limit(1);
		await db.select().from(users).limit(1);
		await db.select().from(roles).limit(1);
		await db.select().from(usageMetrics).limit(1);

		return true;
	} catch (error) {
		console.error("Schema validation failed:", error);
		return false;
	}
}

export async function createDefaultSuperAdmin(
	email: string,
	password: string,
	name: string,
): Promise<string> {
	try {
		const existingSuperAdmin = await db
			.select()
			.from(users)
			.where(sql`${users.isSuperAdmin} = true`)
			.limit(1);

		if (existingSuperAdmin.length > 0) {
			throw new Error("Super admin already exists");
		}

		const [user] = await db
			.insert(users)
			.values({
				email,
				password, // Will be hashed by auth system
				name,
				isSuperAdmin: true,
				provider: "credentials",
				emailVerified: new Date(),
			})
			.returning({ id: users.id });

		if (!user) {
			throw new Error("Failed to create super admin");
		}

		return user.id;
	} catch (error) {
		console.error("Failed to create super admin:", error);
		throw error;
	}
}

export async function getOrganizationUsage(orgId: string) {
	const [usage] = await db
		.select()
		.from(usageMetrics)
		.where(sql`${usageMetrics.organizationId} = ${orgId}`)
		.orderBy(sql`${usageMetrics.calculatedAt} DESC`)
		.limit(1);

	return (
		usage ?? {
			totalAssets: 0,
			totalStorageBytes: 0,
			totalUsers: 0,
			totalAssetGroups: 0,
			monthlyDownloads: 0,
			monthlyUploads: 0,
			monthlyActiveUsers: 0,
		}
	);
}

export async function updateUsageMetrics(
	orgId: string,
	updates: Partial<{
		totalAssets: number;
		totalStorageBytes: number;
		totalUsers: number;
		totalAssetGroups: number;
		monthlyDownloads: number;
		monthlyUploads: number;
		monthlyActiveUsers: number;
	}>,
): Promise<void> {
	const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

	try {
		await db
			.insert(usageMetrics)
			.values({
				organizationId: orgId,
				month: currentMonth,
				calculatedAt: new Date(),
				...updates,
			})
			.onConflictDoUpdate({
				target: [usageMetrics.organizationId, usageMetrics.month],
				set: {
					...updates,
					calculatedAt: new Date(),
				},
			});
	} catch (error) {
		console.error("Failed to update usage metrics:", error);
		throw error;
	}
}
