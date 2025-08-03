import { TRPCError } from "@trpc/server";
import {
	and,
	count,
	desc,
	eq,
	ilike,
	inArray,
	isNull,
	or,
	sql,
} from "drizzle-orm";
import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import {
	assetCollections,
	assets,
	collectionActivity,
	collectionAssets,
	collectionShares,
	users,
} from "~/server/db/schema";
import { assetTransformer } from "~/server/services/assets/transformer";
import { collectionManager } from "~/server/services/collections/manager";
import { searchIndexingService } from "~/server/services/metadata/search";

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

// Collection schemas
const createCollectionSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().optional(),
	coverAssetId: z.string().uuid().optional(),
	color: z
		.string()
		.regex(/^#[0-9A-F]{6}$/i)
		.optional(),
	icon: z.string().max(50).optional(),
	isPublic: z.boolean().default(false),
	allowContributions: z.boolean().default(false),
	sortOrder: z.string().default("createdAt"),
	sortDirection: z.enum(["asc", "desc"]).default("desc"),
	autoRules: z.record(z.any()).optional(),
	metadata: z.record(z.any()).optional(),
	tags: z.array(z.string()).default([]),
	assetIds: z.array(z.string().uuid()).optional(),
});

const updateCollectionSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(255).optional(),
	description: z.string().optional(),
	coverAssetId: z.string().uuid().optional(),
	color: z
		.string()
		.regex(/^#[0-9A-F]{6}$/i)
		.optional(),
	icon: z.string().max(50).optional(),
	isPublic: z.boolean().optional(),
	allowContributions: z.boolean().optional(),
	sortOrder: z.string().optional(),
	sortDirection: z.enum(["asc", "desc"]).optional(),
	autoRules: z.record(z.any()).optional(),
	metadata: z.record(z.any()).optional(),
	tags: z.array(z.string()).optional(),
});

const searchCollectionsSchema = z.object({
	query: z.string().optional(),
	createdBy: z.string().uuid().optional(),
	isPublic: z.boolean().optional(),
	isTemplate: z.boolean().optional(),
	tags: z.array(z.string()).optional(),
	sortBy: z
		.enum(["name", "createdAt", "updatedAt", "assetCount"])
		.default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
});

const shareCollectionSchema = z.object({
	collectionId: z.string().uuid(),
	shareType: z.enum(["view", "download", "collaborate"]),
	expiresAt: z.date().optional(),
	isPasswordProtected: z.boolean().default(false),
	password: z.string().optional(),
	maxDownloads: z.number().positive().optional(),
	allowedDomains: z.array(z.string()).optional(),
	allowComments: z.boolean().default(false),
	allowDownloads: z.boolean().default(true),
	showMetadata: z.boolean().default(true),
	customMessage: z.string().optional(),
});

// Transformation schemas
const imageTransformationSchema = z.object({
	width: z.number().positive().optional(),
	height: z.number().positive().optional(),
	quality: z.number().min(1).max(100).optional(),
	format: z.enum(["jpeg", "png", "webp", "avif"]).optional(),
	fit: z.enum(["cover", "contain", "fill", "inside", "outside"]).optional(),
	position: z.enum(["center", "top", "bottom", "left", "right"]).optional(),
	background: z.string().optional(),
	blur: z.number().min(0).max(100).optional(),
	sharpen: z.number().min(0).max(10).optional(),
	brightness: z.number().min(0).max(2).optional(),
	contrast: z.number().min(0).max(2).optional(),
	saturation: z.number().min(0).max(2).optional(),
	hue: z.number().min(-180).max(180).optional(),
	grayscale: z.boolean().optional(),
	sepia: z.boolean().optional(),
	negate: z.boolean().optional(),
	rotate: z.number().optional(),
	flip: z.boolean().optional(),
	flop: z.boolean().optional(),
});

const cropParamsSchema = z.object({
	x: z.number().min(0),
	y: z.number().min(0),
	width: z.number().positive(),
	height: z.number().positive(),
});

export const assetApiRouter = createTRPCRouter({
	// ==================== COLLECTION MANAGEMENT ====================

	// Create collection
	createCollection: protectedProcedure
		.input(createCollectionSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			return await collectionManager.createCollection(
				organizationId,
				input,
				userId,
			);
		}),

	// Get collection by ID
	getCollection: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				includeAssets: z.boolean().default(true),
				assetLimit: z.number().min(1).max(100).default(20),
				assetOffset: z.number().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			return await collectionManager.getCollection(input.id, organizationId, {
				includeAssets: input.includeAssets,
				assetLimit: input.assetLimit,
				assetOffset: input.assetOffset,
			});
		}),

	// Search collections
	searchCollections: protectedProcedure
		.input(searchCollectionsSchema)
		.query(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			return await collectionManager.searchCollections(organizationId, input);
		}),

	// Update collection
	updateCollection: protectedProcedure
		.input(updateCollectionSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			const { id, ...updateData } = input;
			return await collectionManager.updateCollection(
				id,
				organizationId,
				updateData,
				userId,
			);
		}),

	// Delete collection
	deleteCollection: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			await collectionManager.deleteCollection(
				input.id,
				organizationId,
				userId,
			);
			return { success: true };
		}),

	// Add assets to collection
	addAssetsToCollection: protectedProcedure
		.input(
			z.object({
				collectionId: z.string().uuid(),
				assetIds: z.array(z.string().uuid()),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			await collectionManager.addAssetsToCollection(
				input.collectionId,
				input.assetIds,
				userId,
				organizationId,
			);

			return { success: true };
		}),

	// Remove assets from collection
	removeAssetsFromCollection: protectedProcedure
		.input(
			z.object({
				collectionId: z.string().uuid(),
				assetIds: z.array(z.string().uuid()),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			await collectionManager.removeAssetsFromCollection(
				input.collectionId,
				input.assetIds,
				userId,
				organizationId,
			);

			return { success: true };
		}),

	// Duplicate collection
	duplicateCollection: protectedProcedure
		.input(
			z.object({
				collectionId: z.string().uuid(),
				newName: z.string().min(1).max(255),
				includeAssets: z.boolean().default(true),
				includePermissions: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			return await collectionManager.duplicateCollection(
				input.collectionId,
				organizationId,
				input.newName,
				userId,
				{
					includeAssets: input.includeAssets,
					includePermissions: input.includePermissions,
				},
			);
		}),

	// Share collection
	shareCollection: protectedProcedure
		.input(shareCollectionSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			const { collectionId, ...shareOptions } = input;
			return await collectionManager.createShare(
				collectionId,
				organizationId,
				shareOptions,
				userId,
			);
		}),

	// Get collection analytics
	getCollectionAnalytics: protectedProcedure
		.input(
			z.object({
				collectionId: z.string().uuid(),
				timeRange: z
					.object({
						from: z.date(),
						to: z.date(),
					})
					.optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			return await collectionManager.getCollectionAnalytics(
				input.collectionId,
				organizationId,
				input.timeRange,
			);
		}),

	// ==================== ASSET TRANSFORMATIONS ====================

	// Transform image
	transformImage: protectedProcedure
		.input(
			z.object({
				assetId: z.string().uuid(),
				transformation: imageTransformationSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			return await assetTransformer.transformImage(
				input.assetId,
				organizationId,
				input.transformation,
				userId,
			);
		}),

	// Generate image variants
	generateImageVariants: protectedProcedure
		.input(
			z.object({
				assetId: z.string().uuid(),
				variants: z.array(
					z.object({
						name: z.string(),
						transformation: imageTransformationSchema,
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			return await assetTransformer.generateImageVariants(
				input.assetId,
				organizationId,
				input.variants,
				userId,
			);
		}),

	// Crop image
	cropImage: protectedProcedure
		.input(
			z.object({
				assetId: z.string().uuid(),
				cropParams: cropParamsSchema,
				options: z
					.object({
						format: z.enum(["jpeg", "png", "webp"]).optional(),
						quality: z.number().min(1).max(100).optional(),
					})
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			return await assetTransformer.cropImage(
				input.assetId,
				organizationId,
				input.cropParams,
				userId,
				input.options,
			);
		}),

	// Generate video thumbnails
	generateVideoThumbnails: protectedProcedure
		.input(
			z.object({
				assetId: z.string().uuid(),
				options: z
					.object({
						timestamps: z.array(z.number()).optional(),
						width: z.number().positive().optional(),
						height: z.number().positive().optional(),
						format: z.enum(["jpeg", "png", "webp"]).optional(),
						quality: z.number().min(1).max(100).optional(),
					})
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			return await assetTransformer.generateVideoThumbnails(
				input.assetId,
				organizationId,
				input.options || {},
				userId,
			);
		}),

	// Convert format
	convertFormat: protectedProcedure
		.input(
			z.object({
				assetId: z.string().uuid(),
				targetFormat: z.string(),
				quality: z.number().min(1).max(100).default(85),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			return await assetTransformer.convertFormat(
				input.assetId,
				organizationId,
				input.targetFormat,
				input.quality,
				userId,
			);
		}),

	// Apply filter preset
	applyFilterPreset: protectedProcedure
		.input(
			z.object({
				assetId: z.string().uuid(),
				filterName: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			return await assetTransformer.applyFilterPreset(
				input.assetId,
				organizationId,
				input.filterName,
				userId,
			);
		}),

	// Batch transform
	batchTransform: protectedProcedure
		.input(
			z.object({
				assetIds: z.array(z.string().uuid()),
				transformation: imageTransformationSchema,
				concurrency: z.number().min(1).max(10).default(3),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			return await assetTransformer.batchTransform(
				input.assetIds,
				organizationId,
				input.transformation,
				userId,
				{ concurrency: input.concurrency },
			);
		}),

	// Get filter presets
	getFilterPresets: protectedProcedure.query(async () => {
		return assetTransformer.getFilterPresets();
	}),

	// ==================== ADVANCED ANALYTICS ====================

	// Get asset performance analytics
	getAssetPerformance: protectedProcedure
		.input(
			z.object({
				assetId: z.string().uuid(),
				timeRange: z
					.object({
						from: z.date(),
						to: z.date(),
					})
					.optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// Get download and view statistics
			const [downloadStats] = await ctx.db
				.select({
					totalDownloads: sql<number>`count(*)::integer`,
					uniqueUsers: sql<number>`count(distinct user_id)::integer`,
				})
				.from(collectionActivity)
				.where(
					and(
						eq(collectionActivity.assetId, input.assetId),
						eq(collectionActivity.action, "asset_downloaded"),
						input.timeRange
							? sql`${collectionActivity.createdAt} >= ${input.timeRange.from}`
							: undefined,
						input.timeRange
							? sql`${collectionActivity.createdAt} <= ${input.timeRange.to}`
							: undefined,
					),
				);

			const [viewStats] = await ctx.db
				.select({
					totalViews: sql<number>`count(*)::integer`,
					uniqueViewers: sql<number>`count(distinct user_id)::integer`,
				})
				.from(collectionActivity)
				.where(
					and(
						eq(collectionActivity.assetId, input.assetId),
						eq(collectionActivity.action, "asset_viewed"),
						input.timeRange
							? sql`${collectionActivity.createdAt} >= ${input.timeRange.from}`
							: undefined,
						input.timeRange
							? sql`${collectionActivity.createdAt} <= ${input.timeRange.to}`
							: undefined,
					),
				);

			return {
				downloads: {
					total: downloadStats?.totalDownloads || 0,
					uniqueUsers: downloadStats?.uniqueUsers || 0,
				},
				views: {
					total: viewStats?.totalViews || 0,
					uniqueUsers: viewStats?.uniqueViewers || 0,
				},
			};
		}),

	// Get usage patterns
	getUsagePatterns: protectedProcedure
		.input(
			z.object({
				timeRange: z.object({
					from: z.date(),
					to: z.date(),
				}),
			}),
		)
		.query(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// Get hourly usage patterns
			const hourlyPattern = await ctx.db
				.select({
					hour: sql<number>`extract(hour from ${collectionActivity.createdAt})::integer`,
					activityCount: sql<number>`count(*)::integer`,
				})
				.from(collectionActivity)
				.innerJoin(
					assetCollections,
					eq(collectionActivity.collectionId, assetCollections.id),
				)
				.where(
					and(
						eq(assetCollections.organizationId, organizationId),
						sql`${collectionActivity.createdAt} >= ${input.timeRange.from}`,
						sql`${collectionActivity.createdAt} <= ${input.timeRange.to}`,
					),
				)
				.groupBy(sql`extract(hour from ${collectionActivity.createdAt})`)
				.orderBy(sql`extract(hour from ${collectionActivity.createdAt})`);

			// Get daily usage patterns
			const dailyPattern = await ctx.db
				.select({
					date: sql<string>`date(${collectionActivity.createdAt})`,
					activityCount: sql<number>`count(*)::integer`,
				})
				.from(collectionActivity)
				.innerJoin(
					assetCollections,
					eq(collectionActivity.collectionId, assetCollections.id),
				)
				.where(
					and(
						eq(assetCollections.organizationId, organizationId),
						sql`${collectionActivity.createdAt} >= ${input.timeRange.from}`,
						sql`${collectionActivity.createdAt} <= ${input.timeRange.to}`,
					),
				)
				.groupBy(sql`date(${collectionActivity.createdAt})`)
				.orderBy(sql`date(${collectionActivity.createdAt})`);

			return {
				hourlyPattern,
				dailyPattern,
			};
		}),

	// Get popular assets
	getPopularAssets: protectedProcedure
		.input(
			z.object({
				timeRange: z
					.object({
						from: z.date(),
						to: z.date(),
					})
					.optional(),
				limit: z.number().min(1).max(50).default(10),
			}),
		)
		.query(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			const timeConditions = input.timeRange
				? [
						sql`${collectionActivity.createdAt} >= ${input.timeRange.from}`,
						sql`${collectionActivity.createdAt} <= ${input.timeRange.to}`,
					]
				: [];

			const popularAssets = await ctx.db
				.select({
					assetId: collectionActivity.assetId,
					activityCount: sql<number>`count(*)::integer`,
					downloadCount: sql<number>`count(*) filter (where ${collectionActivity.action} = 'asset_downloaded')::integer`,
					viewCount: sql<number>`count(*) filter (where ${collectionActivity.action} = 'asset_viewed')::integer`,
				})
				.from(collectionActivity)
				.innerJoin(
					assetCollections,
					eq(collectionActivity.collectionId, assetCollections.id),
				)
				.where(
					and(
						eq(assetCollections.organizationId, organizationId),
						sql`${collectionActivity.assetId} IS NOT NULL`,
						...timeConditions,
					),
				)
				.groupBy(collectionActivity.assetId)
				.orderBy(desc(sql`count(*)`))
				.limit(input.limit);

			// Get asset details
			const assetIds = popularAssets.map((p) => p.assetId!);
			if (assetIds.length === 0) return [];

			const assetDetails = await ctx.db.query.assets.findMany({
				where: inArray(assets.id, assetIds),
				with: {
					uploader: {
						columns: {
							id: true,
							name: true,
							image: true,
						},
					},
				},
			});

			// Combine stats with asset details
			return popularAssets.map((stat) => ({
				...stat,
				asset: assetDetails.find((a) => a.id === stat.assetId),
			}));
		}),

	// ==================== ADVANCED SEARCH ====================

	// Enhanced asset search with collection filtering
	enhancedSearch: protectedProcedure
		.input(
			z.object({
				query: z.string(),
				filters: z
					.object({
						fileTypes: z.array(z.string()).optional(),
						tags: z.array(z.string()).optional(),
						collections: z.array(z.string().uuid()).optional(),
						uploadedBy: z.string().uuid().optional(),
						dateFrom: z.date().optional(),
						dateTo: z.date().optional(),
						minSize: z.number().positive().optional(),
						maxSize: z.number().positive().optional(),
						hasMetadata: z.boolean().optional(),
					})
					.optional(),
				sortBy: z
					.enum(["relevance", "createdAt", "updatedAt", "name", "size"])
					.default("relevance"),
				sortOrder: z.enum(["asc", "desc"]).default("desc"),
				limit: z.number().min(1).max(100).default(20),
				offset: z.number().min(0).default(0),
				includeCollections: z.boolean().default(false),
			}),
		)
		.query(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// Use existing search service as base
			const searchResults = await searchIndexingService.search({
				...input,
				organizationId,
				includeDeleted: false,
			});

			// If collection filtering is requested
			if (input.filters?.collections && input.filters.collections.length > 0) {
				const filteredResults = [];

				for (const result of searchResults.results) {
					const isInCollections = await ctx.db.query.collectionAssets.findFirst(
						{
							where: and(
								eq(collectionAssets.assetId, result.asset.id),
								inArray(
									collectionAssets.collectionId,
									input.filters.collections,
								),
							),
						},
					);

					if (isInCollections) {
						filteredResults.push(result);
					}
				}

				searchResults.results = filteredResults;
			}

			// Include collection information if requested
			if (input.includeCollections) {
				for (const result of searchResults.results) {
					const assetCollectionsList =
						await ctx.db.query.collectionAssets.findMany({
							where: eq(collectionAssets.assetId, result.asset.id),
							with: {
								collection: {
									columns: {
										id: true,
										name: true,
										slug: true,
										color: true,
										icon: true,
									},
								},
							},
						});

					(result as any).collections = assetCollectionsList.map(
						(ca) => ca.collection,
					);
				}
			}

			return searchResults;
		}),
});
