import { CacheManager } from "~/server/redis/cache";
import { storageManager } from "~/server/storage";

export interface CDNProvider {
	id: string;
	name: string;
	baseUrl: string;
	regions: string[];
	features: CDNFeature[];
}

export interface CDNFeature {
	name: string;
	enabled: boolean;
	config?: Record<string, any>;
}

export interface CDNConfig {
	enabled: boolean;
	provider: CDNProvider;
	cacheRules: CacheRule[];
	compressionEnabled: boolean;
	imageOptimization: boolean;
	videoOptimization: boolean;
	geoBlocking?: string[];
	customDomains: string[];
}

export interface CacheRule {
	pattern: string;
	ttl: number;
	browserCache: number;
	edgeCache: number;
	behaviors: CacheBehavior[];
}

export interface CacheBehavior {
	type: "compress" | "optimize" | "watermark" | "resize" | "format";
	config: Record<string, any>;
}

export interface CDNUrl {
	url: string;
	expiresAt?: Date;
	regions: string[];
	cached: boolean;
	optimized: boolean;
}

export interface CDNAnalytics {
	requests: number;
	bandwidth: number;
	cacheHitRatio: number;
	topFiles: Array<{ file: string; requests: number; bandwidth: number }>;
	regionStats: Array<{ region: string; requests: number; bandwidth: number }>;
}

export class CDNManager {
	private cache: CacheManager;
	private readonly CDN_PROVIDERS: CDNProvider[] = [
		{
			id: "cloudflare",
			name: "Cloudflare",
			baseUrl: "https://assets.brand-portal.com",
			regions: ["global"],
			features: [
				{ name: "image_optimization", enabled: true },
				{ name: "video_optimization", enabled: true },
				{ name: "compression", enabled: true },
				{ name: "watermarking", enabled: false },
			],
		},
		{
			id: "aws_cloudfront",
			name: "AWS CloudFront",
			baseUrl: "https://d123456789abcd.cloudfront.net",
			regions: ["us-east-1", "eu-west-1", "ap-southeast-1"],
			features: [
				{ name: "image_optimization", enabled: true },
				{ name: "compression", enabled: true },
				{ name: "signed_urls", enabled: true },
			],
		},
		{
			id: "fastly",
			name: "Fastly",
			baseUrl: "https://assets.fastly-edge.com",
			regions: ["global"],
			features: [
				{ name: "real_time_optimization", enabled: true },
				{ name: "edge_compute", enabled: true },
				{ name: "instant_purge", enabled: true },
			],
		},
	];

	private readonly DEFAULT_CACHE_RULES: CacheRule[] = [
		{
			pattern: "*.{jpg,jpeg,png,gif,webp,avif}",
			ttl: 31536000, // 1 year
			browserCache: 86400, // 1 day
			edgeCache: 2592000, // 30 days
			behaviors: [
				{ type: "compress", config: { quality: 85 } },
				{ type: "optimize", config: { format: "webp" } },
			],
		},
		{
			pattern: "*.{mp4,webm,mov}",
			ttl: 31536000, // 1 year
			browserCache: 3600, // 1 hour
			edgeCache: 604800, // 7 days
			behaviors: [{ type: "compress", config: { quality: 80 } }],
		},
		{
			pattern: "*.{pdf,doc,docx,xls,xlsx}",
			ttl: 86400, // 1 day
			browserCache: 3600, // 1 hour
			edgeCache: 86400, // 1 day
			behaviors: [{ type: "compress", config: { enabled: true } }],
		},
		{
			pattern: "/thumbnails/*",
			ttl: 604800, // 7 days
			browserCache: 86400, // 1 day
			edgeCache: 604800, // 7 days
			behaviors: [
				{ type: "optimize", config: { format: "webp", quality: 85 } },
				{ type: "compress", config: { enabled: true } },
			],
		},
	];

	constructor() {
		this.cache = new CacheManager();
	}

	async generateCDNUrl(
		organizationId: string,
		storageKey: string,
		options: {
			optimization?: boolean;
			compression?: boolean;
			watermark?: boolean;
			resize?: { width?: number; height?: number; quality?: number };
			format?: "webp" | "avif" | "jpeg" | "png";
			region?: string;
			signed?: boolean;
			expiresIn?: number;
		} = {},
	): Promise<CDNUrl> {
		try {
			// Get CDN configuration for organization
			const cdnConfig = await this.getCDNConfig(organizationId);

			if (!cdnConfig.enabled) {
				// Fallback to direct storage URL
				const directUrl = await storageManager.generateDownloadUrl(
					organizationId,
					storageKey,
					options.expiresIn || 3600,
				);

				return {
					url: directUrl,
					regions: ["origin"],
					cached: false,
					optimized: false,
				};
			}

			// Check cache for existing CDN URL
			const cacheKey = this.generateCacheKey(storageKey, options);
			const cachedUrl = await this.cache.get<CDNUrl>(cacheKey);

			if (cachedUrl && this.isUrlValid(cachedUrl)) {
				return { ...cachedUrl, cached: true };
			}

			// Build CDN URL with transformations
			const cdnUrl = this.buildCDNUrl(cdnConfig, storageKey, options);

			// Apply cache rules
			const cacheRule = this.findMatchingCacheRule(
				storageKey,
				cdnConfig.cacheRules,
			);
			const ttl = cacheRule?.ttl || 3600;

			const result: CDNUrl = {
				url: cdnUrl,
				expiresAt: new Date(Date.now() + ttl * 1000),
				regions: cdnConfig.provider.regions,
				cached: false,
				optimized: options.optimization !== false,
			};

			// Cache the CDN URL
			await this.cache.set(cacheKey, result, { ttl: Math.min(ttl, 3600) });

			return result;
		} catch (error) {
			// Fallback to direct storage URL on error
			const directUrl = await storageManager.generateDownloadUrl(
				organizationId,
				storageKey,
				options.expiresIn || 3600,
			);

			return {
				url: directUrl,
				regions: ["origin"],
				cached: false,
				optimized: false,
			};
		}
	}

	async generateResponsiveUrls(
		organizationId: string,
		storageKey: string,
		breakpoints: Array<{ width: number; height?: number; quality?: number }> = [
			{ width: 480, quality: 80 },
			{ width: 768, quality: 85 },
			{ width: 1200, quality: 90 },
			{ width: 1920, quality: 95 },
		],
	): Promise<Array<CDNUrl & { width: number; height?: number }>> {
		const responsiveUrls: Array<CDNUrl & { width: number; height?: number }> =
			[];

		for (const breakpoint of breakpoints) {
			const cdnUrl = await this.generateCDNUrl(organizationId, storageKey, {
				optimization: true,
				resize: breakpoint,
				format: "webp",
			});

			responsiveUrls.push({
				...cdnUrl,
				width: breakpoint.width,
				height: breakpoint.height,
			});
		}

		return responsiveUrls;
	}

	async generateVideoStreamingUrls(
		organizationId: string,
		storageKey: string,
		qualities: Array<"240p" | "360p" | "480p" | "720p" | "1080p"> = [
			"480p",
			"720p",
			"1080p",
		],
	): Promise<Array<CDNUrl & { quality: string; bitrate: number }>> {
		const qualityMapping = {
			"240p": { bitrate: 500000, width: 426, height: 240 },
			"360p": { bitrate: 1000000, width: 640, height: 360 },
			"480p": { bitrate: 2000000, width: 854, height: 480 },
			"720p": { bitrate: 4000000, width: 1280, height: 720 },
			"1080p": { bitrate: 8000000, width: 1920, height: 1080 },
		};

		const streamingUrls: Array<CDNUrl & { quality: string; bitrate: number }> =
			[];

		for (const quality of qualities) {
			const config = qualityMapping[quality];
			const cdnUrl = await this.generateCDNUrl(organizationId, storageKey, {
				optimization: true,
				resize: { width: config.width, height: config.height, quality: 85 },
			});

			streamingUrls.push({
				...cdnUrl,
				quality,
				bitrate: config.bitrate,
			});
		}

		return streamingUrls;
	}

	async purgeCache(
		organizationId: string,
		paths: string[] | "all",
	): Promise<{ success: boolean; purgedPaths?: string[]; error?: string }> {
		try {
			const cdnConfig = await this.getCDNConfig(organizationId);

			if (!cdnConfig.enabled) {
				return { success: false, error: "CDN not enabled" };
			}

			// In a real implementation, this would call the CDN provider's purge API
			// For now, we'll clear our local cache and simulate the purge

			if (paths === "all") {
				// Purge all cache for organization
				await this.cache.delete(`cdn:${organizationId}:*`);
				return { success: true, purgedPaths: ["/*"] };
			} else {
				// Purge specific paths
				const purgedPaths: string[] = [];
				for (const path of paths) {
					await this.cache.delete(`cdn:${organizationId}:${path}`);
					purgedPaths.push(path);
				}
				return { success: true, purgedPaths };
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Purge failed",
			};
		}
	}

	async getAnalytics(
		organizationId: string,
		period: "hour" | "day" | "week" | "month" = "day",
	): Promise<CDNAnalytics> {
		// In a real implementation, this would fetch analytics from the CDN provider
		// For now, return simulated data
		return {
			requests: 0,
			bandwidth: 0,
			cacheHitRatio: 0,
			topFiles: [],
			regionStats: [],
		};
	}

	async optimizeForRegion(
		organizationId: string,
		storageKey: string,
		region: string,
	): Promise<CDNUrl> {
		return await this.generateCDNUrl(organizationId, storageKey, {
			optimization: true,
			region,
			compression: true,
		});
	}

	async configureCDN(
		organizationId: string,
		config: Partial<CDNConfig>,
	): Promise<{ success: boolean; error?: string }> {
		try {
			const currentConfig = await this.getCDNConfig(organizationId);
			const newConfig = { ...currentConfig, ...config };

			// Validate configuration
			if (newConfig.enabled && !newConfig.provider) {
				return { success: false, error: "CDN provider required when enabled" };
			}

			// Store configuration
			await this.cache.set(`cdn_config:${organizationId}`, newConfig, {
				ttl: 0,
			}); // No expiry

			// Purge cache to apply new configuration
			await this.purgeCache(organizationId, "all");

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Configuration failed",
			};
		}
	}

	private async getCDNConfig(organizationId: string): Promise<CDNConfig> {
		const cached = await this.cache.get<CDNConfig>(
			`cdn_config:${organizationId}`,
		);

		if (cached) {
			return cached;
		}

		// Default configuration
		const defaultConfig: CDNConfig = {
			enabled: false,
			provider: this.CDN_PROVIDERS[0]!, // Cloudflare as default
			cacheRules: this.DEFAULT_CACHE_RULES,
			compressionEnabled: true,
			imageOptimization: true,
			videoOptimization: false,
			customDomains: [],
		};

		// Store default configuration
		await this.cache.set(`cdn_config:${organizationId}`, defaultConfig, {
			ttl: 0,
		});

		return defaultConfig;
	}

	private buildCDNUrl(
		config: CDNConfig,
		storageKey: string,
		options: any,
	): string {
		const baseUrl = config.provider.baseUrl;
		let url = `${baseUrl}/${storageKey}`;

		// Add transformation parameters based on provider
		const params: string[] = [];

		if (options.resize) {
			if (config.provider.id === "cloudflare") {
				if (options.resize.width) params.push(`w=${options.resize.width}`);
				if (options.resize.height) params.push(`h=${options.resize.height}`);
				if (options.resize.quality) params.push(`q=${options.resize.quality}`);
			} else if (config.provider.id === "aws_cloudfront") {
				// AWS CloudFront with Lambda@Edge transformations
				if (options.resize.width) params.push(`width=${options.resize.width}`);
				if (options.resize.height)
					params.push(`height=${options.resize.height}`);
			}
		}

		if (options.format && config.imageOptimization) {
			params.push(`f=${options.format}`);
		}

		if (options.compression !== false && config.compressionEnabled) {
			params.push("compress=true");
		}

		if (options.watermark) {
			params.push("watermark=true");
		}

		if (params.length > 0) {
			url += `?${params.join("&")}`;
		}

		return url;
	}

	private findMatchingCacheRule(
		storageKey: string,
		rules: CacheRule[],
	): CacheRule | null {
		for (const rule of rules) {
			if (this.matchesPattern(storageKey, rule.pattern)) {
				return rule;
			}
		}
		return null;
	}

	private matchesPattern(path: string, pattern: string): boolean {
		// Simple pattern matching - in production, use a proper glob library
		const regexPattern = pattern
			.replace(/\./g, "\\.")
			.replace(/\*/g, ".*")
			.replace(/\{([^}]+)\}/g, "($1)");

		const regex = new RegExp(`^${regexPattern}$`, "i");
		return regex.test(path);
	}

	private generateCacheKey(storageKey: string, options: any): string {
		const optionsHash = JSON.stringify(options);
		return `cdn:${storageKey}:${Buffer.from(optionsHash).toString("base64")}`;
	}

	private isUrlValid(cdnUrl: CDNUrl): boolean {
		if (!cdnUrl.expiresAt) {
			return true; // No expiry
		}
		return new Date() < cdnUrl.expiresAt;
	}

	async enableImageOptimization(organizationId: string): Promise<void> {
		const config = await this.getCDNConfig(organizationId);
		config.imageOptimization = true;
		await this.configureCDN(organizationId, config);
	}

	async enableVideoOptimization(organizationId: string): Promise<void> {
		const config = await this.getCDNConfig(organizationId);
		config.videoOptimization = true;
		await this.configureCDN(organizationId, config);
	}

	async addCustomDomain(organizationId: string, domain: string): Promise<void> {
		const config = await this.getCDNConfig(organizationId);
		if (!config.customDomains.includes(domain)) {
			config.customDomains.push(domain);
			await this.configureCDN(organizationId, config);
		}
	}

	getAvailableProviders(): CDNProvider[] {
		return this.CDN_PROVIDERS;
	}
}

export const cdnManager = new CDNManager();
