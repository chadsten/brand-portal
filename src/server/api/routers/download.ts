import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import { cdnManager } from "~/server/cdn/manager";
import { downloadManager } from "~/server/download/manager";

// Utility function to get organization ID from context
function getOrganizationId(ctx: {
	session: { user: { organizationId?: string } };
}): string {
	const orgId = ctx.session.user.organizationId;
	if (!orgId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "User must belong to an organization",
		});
	}
	return orgId;
}

const downloadOptionsSchema = z.object({
	assetId: z.string().min(1),
	format: z.enum(["original", "thumbnail", "optimized"]).default("original"),
	quality: z.enum(["low", "medium", "high", "original"]).default("original"),
	size: z.enum(["small", "medium", "large", "preview"]).optional(),
	watermark: z.boolean().default(false),
	expiresIn: z.number().min(60).max(86400).default(3600),
	trackDownload: z.boolean().default(true),
});

const bulkDownloadSchema = z.object({
	assetIds: z.array(z.string().min(1)).min(1).max(100),
	format: z.enum(["zip", "tar"]).default("zip"),
});

const shareOptionsSchema = z.object({
	assetId: z.string().min(1),
	expiresIn: z.number().min(300).max(2592000).default(86400), // 5 min to 30 days
	password: z.string().min(4).optional(),
	allowDownload: z.boolean().default(true),
	watermark: z.boolean().default(false),
});

const cdnUrlSchema = z.object({
	assetId: z.string().min(1),
	storageKey: z.string().min(1),
	optimization: z.boolean().default(true),
	compression: z.boolean().default(true),
	watermark: z.boolean().default(false),
	resize: z
		.object({
			width: z.number().min(1).max(4000).optional(),
			height: z.number().min(1).max(4000).optional(),
			quality: z.number().min(1).max(100).optional(),
		})
		.optional(),
	format: z.enum(["webp", "avif", "jpeg", "png"]).optional(),
	region: z.string().optional(),
	signed: z.boolean().default(false),
	expiresIn: z.number().min(60).max(86400).default(3600),
});

const responsiveUrlSchema = z.object({
	assetId: z.string().min(1),
	storageKey: z.string().min(1),
	breakpoints: z
		.array(
			z.object({
				width: z.number().min(1).max(4000),
				height: z.number().min(1).max(4000).optional(),
				quality: z.number().min(1).max(100).optional(),
			}),
		)
		.optional(),
});

export const downloadRouter = createTRPCRouter({
	// Generate download URL for an asset
	generateUrl: protectedProcedure
		.input(downloadOptionsSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			const result = await downloadManager.generateDownloadUrl({
				...input,
				userId,
				organizationId,
			});

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error || "Failed to generate download URL",
				});
			}

			return result;
		}),

	// Generate streaming URL for video assets
	generateStreamingUrl: protectedProcedure
		.input(
			z.object({
				assetId: z.string().min(1),
				quality: z
					.enum(["low", "medium", "high", "original"])
					.default("medium"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			const result = await downloadManager.generateStreamingUrl(
				input.assetId,
				userId,
				organizationId,
				{ quality: input.quality },
			);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error || "Failed to generate streaming URL",
				});
			}

			return result;
		}),

	// Generate bulk download URL
	generateBulkDownload: protectedProcedure
		.input(bulkDownloadSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			const result = await downloadManager.generateBulkDownloadUrl(
				input.assetIds,
				userId,
				organizationId,
				input.format,
			);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error || "Failed to generate bulk download",
				});
			}

			return result;
		}),

	// Get bulk download status
	getBulkDownloadStatus: protectedProcedure
		.input(z.object({ jobId: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			getOrganizationId(ctx); // Verify user has organization

			const status = await downloadManager.getBulkDownloadStatus(input.jobId);
			return status;
		}),

	// Generate public share URL
	generateShareUrl: protectedProcedure
		.input(shareOptionsSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			const result = await downloadManager.generatePublicShareUrl(
				input.assetId,
				userId,
				organizationId,
				input,
			);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error || "Failed to generate share URL",
				});
			}

			return result;
		}),

	// Access shared asset (public endpoint)
	accessSharedAsset: publicProcedure
		.input(
			z.object({
				shareId: z.string().min(1),
				password: z.string().optional(),
			}),
		)
		.query(async ({ input }) => {
			// This would implement share URL access logic
			// For now, return a placeholder
			return {
				success: false,
				error: "Share access not implemented",
			};
		}),

	// Generate CDN URL for optimized delivery
	generateCDNUrl: protectedProcedure
		.input(cdnUrlSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			const cdnUrl = await cdnManager.generateCDNUrl(
				organizationId,
				input.storageKey,
				{
					optimization: input.optimization,
					compression: input.compression,
					watermark: input.watermark,
					resize: input.resize,
					format: input.format,
					region: input.region,
					signed: input.signed,
					expiresIn: input.expiresIn,
				},
			);

			return cdnUrl;
		}),

	// Generate responsive image URLs
	generateResponsiveUrls: protectedProcedure
		.input(responsiveUrlSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			const responsiveUrls = await cdnManager.generateResponsiveUrls(
				organizationId,
				input.storageKey,
				input.breakpoints,
			);

			return responsiveUrls;
		}),

	// Generate video streaming URLs for different qualities
	generateVideoStreamingUrls: protectedProcedure
		.input(
			z.object({
				assetId: z.string().min(1),
				storageKey: z.string().min(1),
				qualities: z
					.array(z.enum(["240p", "360p", "480p", "720p", "1080p"]))
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			const streamingUrls = await cdnManager.generateVideoStreamingUrls(
				organizationId,
				input.storageKey,
				input.qualities,
			);

			return streamingUrls;
		}),

	// Purge CDN cache
	purgeCDNCache: protectedProcedure
		.input(
			z.object({
				paths: z.union([z.array(z.string()), z.literal("all")]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			const result = await cdnManager.purgeCache(organizationId, input.paths);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error || "Failed to purge cache",
				});
			}

			return result;
		}),

	// Get CDN analytics
	getCDNAnalytics: protectedProcedure
		.input(
			z.object({
				period: z.enum(["hour", "day", "week", "month"]).default("day"),
			}),
		)
		.query(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			const analytics = await cdnManager.getAnalytics(
				organizationId,
				input.period,
			);
			return analytics;
		}),

	// Configure CDN settings
	configureCDN: protectedProcedure
		.input(
			z.object({
				enabled: z.boolean().optional(),
				providerId: z.string().optional(),
				compressionEnabled: z.boolean().optional(),
				imageOptimization: z.boolean().optional(),
				videoOptimization: z.boolean().optional(),
				customDomains: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// Convert providerId to provider if specified
			const configInput: any = { ...input };
			if (input.providerId) {
				const providers = cdnManager.getAvailableProviders();
				const provider = providers.find((p) => p.id === input.providerId);
				if (provider) {
					configInput.provider = provider;
					delete configInput.providerId;
				}
			}

			const result = await cdnManager.configureCDN(organizationId, configInput);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error || "Failed to configure CDN",
				});
			}

			return result;
		}),

	// Get available CDN providers
	getCDNProviders: protectedProcedure.query(async ({ ctx }) => {
		getOrganizationId(ctx); // Verify user has organization

		return cdnManager.getAvailableProviders();
	}),

	// Get download analytics
	getDownloadAnalytics: protectedProcedure
		.input(
			z.object({
				period: z.enum(["day", "week", "month"]).default("week"),
			}),
		)
		.query(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			const analytics = await downloadManager.getDownloadAnalytics(
				organizationId,
				input.period,
			);

			return analytics;
		}),

	// Invalidate download cache for an asset
	invalidateCache: protectedProcedure
		.input(
			z.object({
				assetId: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			getOrganizationId(ctx); // Verify user has organization

			await downloadManager.invalidateCache(input.assetId);

			return { success: true };
		}),

	// Get optimized URL for specific region
	getRegionalUrl: protectedProcedure
		.input(
			z.object({
				assetId: z.string().min(1),
				storageKey: z.string().min(1),
				region: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			const cdnUrl = await cdnManager.optimizeForRegion(
				organizationId,
				input.storageKey,
				input.region,
			);

			return cdnUrl;
		}),

	// Batch generate multiple download URLs
	generateBatchUrls: protectedProcedure
		.input(
			z.object({
				requests: z.array(downloadOptionsSchema).min(1).max(50),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			const results = await Promise.allSettled(
				input.requests.map((request) =>
					downloadManager.generateDownloadUrl({
						...request,
						userId,
						organizationId,
					}),
				),
			);

			return results.map((result, index) => ({
				index,
				success: result.status === "fulfilled",
				data: result.status === "fulfilled" ? result.value : null,
				error: result.status === "rejected" ? result.reason?.message : null,
			}));
		}),
});
