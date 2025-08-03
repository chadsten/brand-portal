import { sql } from "drizzle-orm";
import { db } from "~/server/db";
import { assets, organizations, tiers, usageMetrics } from "~/server/db/schema";
import { CacheManager } from "~/server/redis/cache";

export interface UsageData {
	totalAssets: number;
	totalStorageBytes: number;
	totalUsers: number;
	totalAssetGroups: number;
	monthlyDownloads: number;
	monthlyUploads: number;
	monthlyActiveUsers: number;
}

export interface UsageLimits {
	maxUsers: number;
	maxAssets: number;
	maxStorageGB: number;
	maxFileSizeMB: number;
	maxAssetGroups: number;
}

export interface UsageValidationResult {
	allowed: boolean;
	reason?: string;
	currentUsage?: UsageData;
	limits?: UsageLimits;
	remaining?: {
		assets: number;
		storageBytes: number;
		users: number;
	};
}

export class UsageTracker {
	private cache: CacheManager;

	constructor() {
		this.cache = new CacheManager();
	}

	async updateUsageMetrics(organizationId: string): Promise<UsageData> {
		try {
			// Get current month identifier
			const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

			// Calculate current usage from database
			const [assetStats] = await db
				.select({
					totalAssets: sql<number>`count(*)::integer`,
					totalStorageBytes: sql<number>`sum(${assets.fileSize})::bigint`,
				})
				.from(assets)
				.where(
					sql`${assets.organizationId} = ${organizationId} AND ${assets.deletedAt} IS NULL`,
				);

			const [userCount] = await db
				.select({
					totalUsers: sql<number>`count(*)::integer`,
				})
				.from(organizations)
				.where(sql`${organizations.id} = ${organizationId}`);

			// Get existing metrics for the current month
			const [existingMetric] = await db
				.select()
				.from(usageMetrics)
				.where(
					sql`${usageMetrics.organizationId} = ${organizationId} AND ${usageMetrics.month} = ${currentMonth}`,
				)
				.limit(1);

			const usageData: UsageData = {
				totalAssets: assetStats?.totalAssets || 0,
				totalStorageBytes: assetStats?.totalStorageBytes || 0,
				totalUsers: userCount?.totalUsers || 0,
				totalAssetGroups: 0, // TODO: Implement when asset groups are added
				monthlyDownloads: existingMetric?.monthlyDownloads || 0,
				monthlyUploads: existingMetric?.monthlyUploads || 0,
				monthlyActiveUsers: existingMetric?.monthlyActiveUsers || 0,
			};

			// Upsert usage metrics
			await db
				.insert(usageMetrics)
				.values({
					organizationId,
					...usageData,
					month: currentMonth,
					calculatedAt: new Date(),
				})
				.onConflictDoUpdate({
					target: [usageMetrics.organizationId, usageMetrics.month],
					set: {
						...usageData,
						calculatedAt: new Date(),
					},
				});

			// Cache the usage data for 10 minutes
			await this.cache.set(
				`usage:${organizationId}:${currentMonth}`,
				usageData,
				{ ttl: 600 },
			);

			return usageData;
		} catch (error) {
			console.error("Failed to update usage metrics:", error);
			throw error;
		}
	}

	async getCachedUsage(organizationId: string): Promise<UsageData | null> {
		const currentMonth = new Date().toISOString().slice(0, 7);
		return await this.cache.get<UsageData>(
			`usage:${organizationId}:${currentMonth}`,
		);
	}

	async getCurrentUsage(organizationId: string): Promise<UsageData> {
		// Try to get from cache first
		const cached = await this.getCachedUsage(organizationId);
		if (cached) {
			return cached;
		}

		// Update and return fresh data
		return await this.updateUsageMetrics(organizationId);
	}

	async getOrganizationLimits(organizationId: string): Promise<UsageLimits> {
		try {
			const [orgData] = await db
				.select({
					tierLimits: tiers.limits,
					tierOverrides: organizations.tierOverrides,
				})
				.from(organizations)
				.leftJoin(tiers, sql`${organizations.tierId} = ${tiers.id}`)
				.where(sql`${organizations.id} = ${organizationId}`)
				.limit(1);

			if (!orgData) {
				throw new Error("Organization not found");
			}

			const baseLimits = orgData.tierLimits as UsageLimits;
			const overrides = (orgData.tierOverrides as Partial<UsageLimits>) || {};

			// Apply overrides to base limits
			return {
				maxUsers: overrides.maxUsers ?? baseLimits.maxUsers,
				maxAssets: overrides.maxAssets ?? baseLimits.maxAssets,
				maxStorageGB: overrides.maxStorageGB ?? baseLimits.maxStorageGB,
				maxFileSizeMB: overrides.maxFileSizeMB ?? baseLimits.maxFileSizeMB,
				maxAssetGroups: overrides.maxAssetGroups ?? baseLimits.maxAssetGroups,
			};
		} catch (error) {
			console.error("Failed to get organization limits:", error);
			// Return default limits as fallback
			return {
				maxUsers: 10,
				maxAssets: 1000,
				maxStorageGB: 10,
				maxFileSizeMB: 100,
				maxAssetGroups: 50,
			};
		}
	}

	async validateAssetUpload(
		organizationId: string,
		fileSizeBytes: number,
	): Promise<UsageValidationResult> {
		try {
			const [currentUsage, limits] = await Promise.all([
				this.getCurrentUsage(organizationId),
				this.getOrganizationLimits(organizationId),
			]);

			// Check asset count limit
			if (currentUsage.totalAssets >= limits.maxAssets) {
				return {
					allowed: false,
					reason: `Asset limit reached (${limits.maxAssets} assets)`,
					currentUsage,
					limits,
				};
			}

			// Check storage limit
			const maxStorageBytes = limits.maxStorageGB * 1024 * 1024 * 1024;
			const newTotalStorage = currentUsage.totalStorageBytes + fileSizeBytes;

			if (newTotalStorage > maxStorageBytes) {
				const remainingMB = Math.max(
					0,
					(maxStorageBytes - currentUsage.totalStorageBytes) / 1024 / 1024,
				);
				return {
					allowed: false,
					reason: `Storage limit exceeded. Remaining: ${remainingMB.toFixed(2)}MB`,
					currentUsage,
					limits,
				};
			}

			// Check file size limit
			const maxFileSizeBytes = limits.maxFileSizeMB * 1024 * 1024;
			if (fileSizeBytes > maxFileSizeBytes) {
				return {
					allowed: false,
					reason: `File size exceeds limit (${limits.maxFileSizeMB}MB)`,
					currentUsage,
					limits,
				};
			}

			return {
				allowed: true,
				currentUsage,
				limits,
				remaining: {
					assets: limits.maxAssets - currentUsage.totalAssets,
					storageBytes: maxStorageBytes - currentUsage.totalStorageBytes,
					users: limits.maxUsers - currentUsage.totalUsers,
				},
			};
		} catch (error) {
			console.error("Failed to validate asset upload:", error);
			return {
				allowed: false,
				reason: "Unable to validate upload limits",
			};
		}
	}

	async validateUserCreation(
		organizationId: string,
	): Promise<UsageValidationResult> {
		try {
			const [currentUsage, limits] = await Promise.all([
				this.getCurrentUsage(organizationId),
				this.getOrganizationLimits(organizationId),
			]);

			if (currentUsage.totalUsers >= limits.maxUsers) {
				return {
					allowed: false,
					reason: `User limit reached (${limits.maxUsers} users)`,
					currentUsage,
					limits,
				};
			}

			return {
				allowed: true,
				currentUsage,
				limits,
				remaining: {
					assets: limits.maxAssets - currentUsage.totalAssets,
					storageBytes:
						limits.maxStorageGB * 1024 * 1024 * 1024 -
						currentUsage.totalStorageBytes,
					users: limits.maxUsers - currentUsage.totalUsers,
				},
			};
		} catch (error) {
			console.error("Failed to validate user creation:", error);
			return {
				allowed: false,
				reason: "Unable to validate user limits",
			};
		}
	}

	async incrementUploadCount(organizationId: string): Promise<void> {
		try {
			const currentMonth = new Date().toISOString().slice(0, 7);

			await db
				.update(usageMetrics)
				.set({
					monthlyUploads: sql`${usageMetrics.monthlyUploads} + 1`,
					calculatedAt: new Date(),
				})
				.where(
					sql`${usageMetrics.organizationId} = ${organizationId} AND ${usageMetrics.month} = ${currentMonth}`,
				);

			// Invalidate cache
			await this.cache.delete(`usage:${organizationId}:${currentMonth}`);
		} catch (error) {
			console.error("Failed to increment upload count:", error);
		}
	}

	async incrementDownloadCount(organizationId: string): Promise<void> {
		try {
			const currentMonth = new Date().toISOString().slice(0, 7);

			await db
				.update(usageMetrics)
				.set({
					monthlyDownloads: sql`${usageMetrics.monthlyDownloads} + 1`,
					calculatedAt: new Date(),
				})
				.where(
					sql`${usageMetrics.organizationId} = ${organizationId} AND ${usageMetrics.month} = ${currentMonth}`,
				);

			// Invalidate cache
			await this.cache.delete(`usage:${organizationId}:${currentMonth}`);
		} catch (error) {
			console.error("Failed to increment download count:", error);
		}
	}

	async recordActiveUser(
		organizationId: string,
		userId: string,
	): Promise<void> {
		try {
			const currentMonth = new Date().toISOString().slice(0, 7);
			const cacheKey = `active_users:${organizationId}:${currentMonth}`;

			// Get current active users set from cache
			const activeUsers = (await this.cache.get<string[]>(cacheKey)) || [];

			if (!activeUsers.includes(userId)) {
				activeUsers.push(userId);

				// Cache for the remainder of the month
				const nextMonth = new Date();
				nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
				const ttl = Math.floor((nextMonth.getTime() - Date.now()) / 1000);

				await this.cache.set(cacheKey, activeUsers, { ttl });

				// Update database
				await db
					.update(usageMetrics)
					.set({
						monthlyActiveUsers: activeUsers.length,
						calculatedAt: new Date(),
					})
					.where(
						sql`${usageMetrics.organizationId} = ${organizationId} AND ${usageMetrics.month} = ${currentMonth}`,
					);
			}
		} catch (error) {
			console.error("Failed to record active user:", error);
		}
	}

	async getUsageHistory(
		organizationId: string,
		months: number = 12,
	): Promise<Array<UsageData & { month: string }>> {
		try {
			const result = await db
				.select()
				.from(usageMetrics)
				.where(sql`${usageMetrics.organizationId} = ${organizationId}`)
				.orderBy(sql`${usageMetrics.month} DESC`)
				.limit(months);

			return result.map((row) => ({
				totalAssets: row.totalAssets ?? 0,
				totalStorageBytes: row.totalStorageBytes ?? 0,
				totalUsers: row.totalUsers ?? 0,
				totalAssetGroups: row.totalAssetGroups ?? 0,
				monthlyDownloads: row.monthlyDownloads ?? 0,
				monthlyUploads: row.monthlyUploads ?? 0,
				monthlyActiveUsers: row.monthlyActiveUsers ?? 0,
				month: row.month || "",
			}));
		} catch (error) {
			console.error("Failed to get usage history:", error);
			return [];
		}
	}

	async getUsageSummary(organizationId: string): Promise<{
		current: UsageData;
		limits: UsageLimits;
		percentages: {
			assets: number;
			storage: number;
			users: number;
		};
		remaining: {
			assets: number;
			storageBytes: number;
			users: number;
		};
		trend: {
			uploadsThisMonth: number;
			downloadsThisMonth: number;
			activeUsersThisMonth: number;
		};
	}> {
		const [currentUsage, limits] = await Promise.all([
			this.getCurrentUsage(organizationId),
			this.getOrganizationLimits(organizationId),
		]);

		const maxStorageBytes = limits.maxStorageGB * 1024 * 1024 * 1024;

		return {
			current: currentUsage,
			limits,
			percentages: {
				assets: Math.round((currentUsage.totalAssets / limits.maxAssets) * 100),
				storage: Math.round(
					(currentUsage.totalStorageBytes / maxStorageBytes) * 100,
				),
				users: Math.round((currentUsage.totalUsers / limits.maxUsers) * 100),
			},
			remaining: {
				assets: Math.max(0, limits.maxAssets - currentUsage.totalAssets),
				storageBytes: Math.max(
					0,
					maxStorageBytes - currentUsage.totalStorageBytes,
				),
				users: Math.max(0, limits.maxUsers - currentUsage.totalUsers),
			},
			trend: {
				uploadsThisMonth: currentUsage.monthlyUploads,
				downloadsThisMonth: currentUsage.monthlyDownloads,
				activeUsersThisMonth: currentUsage.monthlyActiveUsers,
			},
		};
	}

	async scheduleUsageUpdate(organizationId: string): Promise<void> {
		// Queue for background processing
		await this.cache.set(
			`usage_update_queue:${organizationId}`,
			{ organizationId, queuedAt: new Date().toISOString() },
			{ ttl: 3600 }, // 1 hour TTL
		);
	}

	async processUsageUpdateQueue(): Promise<void> {
		try {
			const queuePattern = "usage_update_queue:*";
			// Note: This would need to be implemented in the CacheManager
			// For now, we'll skip this functionality until the cache interface is extended
			const queuedUpdates: string[] = [];

			for (const key of queuedUpdates) {
				const data = await this.cache.get<{
					organizationId: string;
					queuedAt: string;
				}>(key);
				if (data) {
					await this.updateUsageMetrics(data.organizationId);
					await this.cache.delete(key);
				}
			}
		} catch (error) {
			console.error("Failed to process usage update queue:", error);
		}
	}
}

export const usageTracker = new UsageTracker();
