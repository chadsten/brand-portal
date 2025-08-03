import { and, eq, or, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { assetPermissions, assets, roles, userRoles } from "~/server/db/schema";
import { CacheManager } from "~/server/redis/cache";
import { storageManager } from "~/server/storage";
import { usageTracker } from "~/server/storage/usage";

export interface DownloadOptions {
	assetId: string;
	userId: string;
	organizationId: string;
	format?: "original" | "thumbnail" | "optimized";
	quality?: "low" | "medium" | "high" | "original";
	size?: string; // For thumbnails: 'small', 'medium', 'large', 'preview'
	watermark?: boolean;
	expiresIn?: number; // seconds
	trackDownload?: boolean;
}

export interface DownloadResult {
	success: boolean;
	downloadUrl?: string;
	filename?: string;
	contentType?: string;
	size?: number;
	expiresAt?: Date;
	cached?: boolean;
	error?: string;
}

export interface StreamingOptions {
	range?: string; // HTTP Range header
	quality?: "low" | "medium" | "high" | "original";
	format?: string;
}

export interface CDNConfig {
	enabled: boolean;
	baseUrl: string;
	signedUrlTTL: number;
	cacheControlMaxAge: number;
	regions: string[];
	invalidationEnabled: boolean;
}

export class DownloadManager {
	private cache: CacheManager;
	private readonly DEFAULT_EXPIRY = 3600; // 1 hour
	private readonly MAX_EXPIRY = 86400; // 24 hours
	private readonly CACHE_TTL = 1800; // 30 minutes

	constructor() {
		this.cache = new CacheManager();
	}

	async generateDownloadUrl(options: DownloadOptions): Promise<DownloadResult> {
		try {
			// Validate permissions
			const hasPermission = await this.checkDownloadPermission(
				options.assetId,
				options.userId,
				options.organizationId,
			);

			if (!hasPermission) {
				return {
					success: false,
					error: "Access denied: insufficient permissions",
				};
			}

			// Get asset information
			const asset = await this.getAssetInfo(options.assetId);
			if (!asset) {
				return {
					success: false,
					error: "Asset not found",
				};
			}

			// Check if URL is cached
			const cacheKey = this.generateCacheKey(options);
			const cachedUrl = await this.cache.get<string>(cacheKey);

			if (cachedUrl) {
				return {
					success: true,
					downloadUrl: cachedUrl,
					filename: asset.originalFileName,
					contentType: asset.mimeType,
					size: asset.fileSize,
					cached: true,
				};
			}

			// Determine storage key based on format
			const storageKey = this.getStorageKey(asset, options);

			// Generate signed URL
			const expiresIn = Math.min(
				options.expiresIn || this.DEFAULT_EXPIRY,
				this.MAX_EXPIRY,
			);
			const downloadUrl = await storageManager.generateDownloadUrl(
				options.organizationId,
				storageKey,
				expiresIn,
			);

			// Cache the URL (shorter TTL than the actual URL expiry)
			await this.cache.set(cacheKey, downloadUrl, {
				ttl: Math.min(this.CACHE_TTL, expiresIn - 300), // 5 min buffer
			});

			// Track download if enabled
			if (options.trackDownload !== false) {
				await this.trackDownload(
					options.assetId,
					options.userId,
					options.organizationId,
				);
			}

			return {
				success: true,
				downloadUrl,
				filename: this.generateFilename(asset, options),
				contentType: this.getContentType(asset, options),
				size: asset.fileSize,
				expiresAt: new Date(Date.now() + expiresIn * 1000),
				cached: false,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Download URL generation failed",
			};
		}
	}

	async generateStreamingUrl(
		assetId: string,
		userId: string,
		organizationId: string,
		options: StreamingOptions = {},
	): Promise<DownloadResult> {
		try {
			// Check permissions
			const hasPermission = await this.checkDownloadPermission(
				assetId,
				userId,
				organizationId,
			);
			if (!hasPermission) {
				return {
					success: false,
					error: "Access denied: insufficient permissions",
				};
			}

			const asset = await this.getAssetInfo(assetId);
			if (!asset) {
				return {
					success: false,
					error: "Asset not found",
				};
			}

			// Streaming is primarily for video files
			if (!asset.mimeType.startsWith("video/")) {
				return {
					success: false,
					error: "Streaming is only available for video files",
				};
			}

			// Generate streaming URL with longer expiry
			const streamingUrl = await storageManager.generateDownloadUrl(
				organizationId,
				asset.storageKey,
				7200, // 2 hours for streaming
			);

			return {
				success: true,
				downloadUrl: streamingUrl,
				filename: asset.originalFileName,
				contentType: asset.mimeType,
				size: asset.fileSize,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Streaming URL generation failed",
			};
		}
	}

	async generateBulkDownloadUrl(
		assetIds: string[],
		userId: string,
		organizationId: string,
		format: "zip" | "tar" = "zip",
	): Promise<DownloadResult> {
		try {
			if (assetIds.length === 0) {
				return {
					success: false,
					error: "No assets specified for bulk download",
				};
			}

			if (assetIds.length > 100) {
				return {
					success: false,
					error: "Bulk download limited to 100 assets",
				};
			}

			// Check permissions for all assets
			const permissionChecks = await Promise.all(
				assetIds.map((assetId) =>
					this.checkDownloadPermission(assetId, userId, organizationId),
				),
			);

			const allowedAssetIds = assetIds.filter(
				(_, index) => permissionChecks[index],
			);

			if (allowedAssetIds.length === 0) {
				return {
					success: false,
					error: "Access denied: no permissions for any assets",
				};
			}

			// Generate bulk download job
			const bulkJobId = `bulk_${Date.now()}_${Math.random().toString(36).substring(2)}`;

			// Queue bulk download processing
			await this.queueBulkDownload(
				bulkJobId,
				allowedAssetIds,
				organizationId,
				format,
			);

			// Return job tracking URL
			return {
				success: true,
				downloadUrl: `/api/download/bulk/${bulkJobId}`,
				filename: `assets_${new Date().toISOString().slice(0, 10)}.${format}`,
				contentType: format === "zip" ? "application/zip" : "application/x-tar",
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Bulk download failed",
			};
		}
	}

	async generatePublicShareUrl(
		assetId: string,
		userId: string,
		organizationId: string,
		options: {
			expiresIn?: number;
			password?: string;
			allowDownload?: boolean;
			watermark?: boolean;
		} = {},
	): Promise<{
		success: boolean;
		shareUrl?: string;
		shareId?: string;
		error?: string;
	}> {
		try {
			// Check if user can share this asset
			const hasPermission = await this.checkSharePermission(
				assetId,
				userId,
				organizationId,
			);
			if (!hasPermission) {
				return {
					success: false,
					error: "Access denied: insufficient permissions to share",
				};
			}

			const asset = await this.getAssetInfo(assetId);
			if (!asset) {
				return {
					success: false,
					error: "Asset not found",
				};
			}

			// Generate share ID
			const shareId = `share_${Date.now()}_${Math.random().toString(36).substring(2)}`;

			// Store share configuration
			const shareConfig = {
				assetId,
				userId,
				organizationId,
				expiresAt: new Date(Date.now() + (options.expiresIn || 86400) * 1000),
				password: options.password,
				allowDownload: options.allowDownload ?? true,
				watermark: options.watermark ?? false,
				createdAt: new Date(),
				accessCount: 0,
			};

			await this.cache.set(`share:${shareId}`, shareConfig, {
				ttl: options.expiresIn || 86400,
			});

			return {
				success: true,
				shareUrl: `/api/share/${shareId}`,
				shareId,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Share URL generation failed",
			};
		}
	}

	private async checkDownloadPermission(
		assetId: string,
		userId: string,
		organizationId: string,
	): Promise<boolean> {
		try {
			// Check if user owns the asset
			const [asset] = await db
				.select({ uploadedBy: assets.uploadedBy })
				.from(assets)
				.where(
					and(
						eq(assets.id, assetId),
						eq(assets.organizationId, organizationId),
					),
				)
				.limit(1);

			if (!asset) {
				return false;
			}

			if (asset.uploadedBy === userId) {
				return true;
			}

			// Check role-based permissions
			const hasRolePermission = await db
				.select({ canDownload: assetPermissions.canDownload })
				.from(assetPermissions)
				.innerJoin(userRoles, eq(assetPermissions.roleId, userRoles.roleId))
				.where(
					and(
						eq(assetPermissions.assetId, assetId),
						eq(userRoles.userId, userId),
						eq(assetPermissions.canDownload, true),
					),
				)
				.limit(1);

			if (hasRolePermission.length > 0) {
				return true;
			}

			// Check direct user permissions
			const hasUserPermission = await db
				.select({ canDownload: assetPermissions.canDownload })
				.from(assetPermissions)
				.where(
					and(
						eq(assetPermissions.assetId, assetId),
						eq(assetPermissions.userId, userId),
						eq(assetPermissions.canDownload, true),
					),
				)
				.limit(1);

			return hasUserPermission.length > 0;
		} catch (error) {
			console.error("Permission check failed:", error);
			return false;
		}
	}

	private async checkSharePermission(
		assetId: string,
		userId: string,
		organizationId: string,
	): Promise<boolean> {
		// For now, use download permission logic
		// In future, could have separate share permissions
		return await this.checkDownloadPermission(assetId, userId, organizationId);
	}

	private async getAssetInfo(assetId: string) {
		const [asset] = await db
			.select()
			.from(assets)
			.where(eq(assets.id, assetId))
			.limit(1);

		return asset || null;
	}

	private getStorageKey(asset: any, options: DownloadOptions): string {
		switch (options.format) {
			case "thumbnail": {
				if (asset.thumbnailKey) {
					return asset.thumbnailKey;
				}
				// Generate thumbnail key based on size
				const size = options.size || "medium";
				return storageManager.generateThumbnailKey(asset.storageKey, size);
			}

			case "optimized":
				// Return optimized version if available
				return `${asset.storageKey}.optimized.webp`;

			case "original":
			default:
				return asset.storageKey;
		}
	}

	private generateFilename(asset: any, options: DownloadOptions): string {
		const baseName = asset.originalFileName.split(".")[0];
		const extension = asset.originalFileName.split(".").pop();

		switch (options.format) {
			case "thumbnail": {
				const size = options.size || "medium";
				return `${baseName}_${size}.webp`;
			}

			case "optimized":
				return `${baseName}_optimized.webp`;

			case "original":
			default:
				return asset.originalFileName;
		}
	}

	private getContentType(asset: any, options: DownloadOptions): string {
		switch (options.format) {
			case "thumbnail":
			case "optimized":
				return "image/webp";

			case "original":
			default:
				return asset.mimeType;
		}
	}

	private generateCacheKey(options: DownloadOptions): string {
		const parts = [
			"download",
			options.assetId,
			options.format || "original",
			options.size || "",
			options.quality || "",
			options.watermark ? "wm" : "",
		].filter(Boolean);

		return parts.join(":");
	}

	private async trackDownload(
		assetId: string,
		userId: string,
		organizationId: string,
	): Promise<void> {
		try {
			// Increment download counter for usage tracking
			await usageTracker.incrementDownloadCount(organizationId);

			// Record user activity
			await usageTracker.recordActiveUser(organizationId, userId);

			// Could also store detailed download analytics here
			await this.cache.set(
				`download_event:${assetId}:${userId}:${Date.now()}`,
				{
					assetId,
					userId,
					organizationId,
					timestamp: new Date().toISOString(),
				},
				{ ttl: 86400 }, // Keep for 24 hours for analytics
			);
		} catch (error) {
			console.error("Failed to track download:", error);
			// Don't fail the download if tracking fails
		}
	}

	private async queueBulkDownload(
		jobId: string,
		assetIds: string[],
		organizationId: string,
		format: string,
	): Promise<void> {
		const bulkJob = {
			jobId,
			assetIds,
			organizationId,
			format,
			status: "queued",
			createdAt: new Date().toISOString(),
			progress: 0,
		};

		await this.cache.set(`bulk_download:${jobId}`, bulkJob, { ttl: 86400 });
	}

	async getBulkDownloadStatus(jobId: string): Promise<{
		status: "queued" | "processing" | "completed" | "failed";
		progress: number;
		downloadUrl?: string;
		error?: string;
	}> {
		const job = await this.cache.get<any>(`bulk_download:${jobId}`);

		if (!job) {
			return {
				status: "failed",
				progress: 0,
				error: "Job not found or expired",
			};
		}

		return {
			status: job.status,
			progress: job.progress,
			downloadUrl: job.downloadUrl,
			error: job.error,
		};
	}

	async invalidateCache(assetId: string): Promise<void> {
		// Invalidate all cached URLs for this asset
		const patterns = [`download:${assetId}:*`, `share:*:${assetId}`];

		for (const pattern of patterns) {
			// In a real implementation, you'd use Redis SCAN or similar
			// For now, we'll implement a basic cache invalidation
			await this.cache.delete(pattern);
		}
	}

	async getDownloadAnalytics(
		organizationId: string,
		period: "day" | "week" | "month" = "week",
	): Promise<{
		totalDownloads: number;
		uniqueUsers: number;
		popularAssets: Array<{
			assetId: string;
			downloads: number;
			assetName: string;
		}>;
		downloadsByDay: Array<{ date: string; downloads: number }>;
	}> {
		// This would integrate with a proper analytics system
		// For now, return mock data structure
		return {
			totalDownloads: 0,
			uniqueUsers: 0,
			popularAssets: [],
			downloadsByDay: [],
		};
	}
}

export const downloadManager = new DownloadManager();
