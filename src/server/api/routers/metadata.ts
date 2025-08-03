import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { assets, autoTagRules, tagGroups, tags } from "~/server/db/schema";
import { metadataExtractor } from "~/server/services/metadata/extractor";
import { searchIndexingService } from "~/server/services/metadata/search";
import { taggingService } from "~/server/services/metadata/tagging";

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

// Tag schemas
const createTagSchema = z.object({
	name: z.string().min(1).max(100),
	parentId: z.string().uuid().optional(),
	color: z
		.string()
		.regex(/^#[0-9A-F]{6}$/i)
		.optional(),
	icon: z.string().max(50).optional(),
	description: z.string().optional(),
	metadata: z.record(z.any()).optional(),
});

const applyTagsSchema = z.object({
	assetId: z.string().uuid(),
	tagIds: z.array(z.string().uuid()),
	source: z.enum(["manual", "ai", "auto", "system"]).default("manual"),
	confidence: z.number().min(0).max(100).default(100),
});

const tagGroupSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().optional(),
	color: z
		.string()
		.regex(/^#[0-9A-F]{6}$/i)
		.optional(),
	icon: z.string().max(50).optional(),
	isExclusive: z.boolean().default(false),
	tagIds: z.array(z.string().uuid()).optional(),
});

const autoTagRuleSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().optional(),
	conditions: z.object({
		all: z
			.array(
				z.object({
					field: z.string(),
					operator: z.enum([
						"equals",
						"contains",
						"startsWith",
						"endsWith",
						"regex",
						"gt",
						"lt",
					]),
					value: z.any(),
					caseSensitive: z.boolean().optional(),
				}),
			)
			.optional(),
		any: z
			.array(
				z.object({
					field: z.string(),
					operator: z.enum([
						"equals",
						"contains",
						"startsWith",
						"endsWith",
						"regex",
						"gt",
						"lt",
					]),
					value: z.any(),
					caseSensitive: z.boolean().optional(),
				}),
			)
			.optional(),
	}),
	tagIds: z.array(z.string().uuid()),
	metadata: z.record(z.any()).optional(),
	priority: z.number().default(0),
	isActive: z.boolean().default(true),
	applyToExisting: z.boolean().default(false),
});

// Search schema
const searchSchema = z.object({
	query: z.string().min(1),
	filters: z
		.object({
			fileTypes: z.array(z.string()).optional(),
			tags: z.array(z.string().uuid()).optional(),
			uploadedBy: z.string().uuid().optional(),
			dateFrom: z.date().optional(),
			dateTo: z.date().optional(),
			hasMetadata: z.boolean().optional(),
			minSize: z.number().positive().optional(),
			maxSize: z.number().positive().optional(),
		})
		.optional(),
	sortBy: z
		.enum(["relevance", "createdAt", "updatedAt", "name", "size"])
		.default("relevance"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
	includeDeleted: z.boolean().default(false),
});

export const metadataRouter = createTRPCRouter({
	// Tag Management
	createTag: protectedProcedure
		.input(createTagSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			return await taggingService.createTag(organizationId, input, userId);
		}),

	getTagHierarchy: protectedProcedure.query(async ({ ctx }) => {
		const organizationId = getOrganizationId(ctx);
		return await taggingService.getTagHierarchy(organizationId);
	}),

	searchTags: protectedProcedure
		.input(
			z.object({
				query: z.string(),
				limit: z.number().min(1).max(50).default(20),
				parentId: z.string().uuid().optional(),
				excludeIds: z.array(z.string().uuid()).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			return await taggingService.searchTags(organizationId, input.query, {
				limit: input.limit,
				parentId: input.parentId,
				excludeIds: input.excludeIds,
			});
		}),

	applyTags: protectedProcedure
		.input(applyTagsSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			// Verify asset belongs to organization
			const asset = await ctx.db.query.assets.findFirst({
				where: and(
					eq(assets.id, input.assetId),
					eq(assets.organizationId, organizationId),
				),
			});

			if (!asset) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Asset not found",
				});
			}

			await taggingService.applyTags(
				input.assetId,
				input.tagIds,
				userId,
				input.source,
				input.confidence,
			);

			// Reindex asset for search
			await searchIndexingService.indexAsset(input.assetId);

			return { success: true };
		}),

	removeTags: protectedProcedure
		.input(
			z.object({
				assetId: z.string().uuid(),
				tagIds: z.array(z.string().uuid()),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// Verify asset belongs to organization
			const asset = await ctx.db.query.assets.findFirst({
				where: and(
					eq(assets.id, input.assetId),
					eq(assets.organizationId, organizationId),
				),
			});

			if (!asset) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Asset not found",
				});
			}

			await taggingService.removeTags(input.assetId, input.tagIds);

			// Reindex asset for search
			await searchIndexingService.indexAsset(input.assetId);

			return { success: true };
		}),

	getTagSuggestions: protectedProcedure
		.input(
			z.object({
				assetId: z.string().uuid(),
				limit: z.number().min(1).max(20).default(10),
				includeAI: z.boolean().default(false),
				includeAutoRules: z.boolean().default(true),
			}),
		)
		.query(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// Verify asset belongs to organization
			const asset = await ctx.db.query.assets.findFirst({
				where: and(
					eq(assets.id, input.assetId),
					eq(assets.organizationId, organizationId),
				),
			});

			if (!asset) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Asset not found",
				});
			}

			return await taggingService.getTagSuggestions(input.assetId, {
				limit: input.limit,
				includeAI: input.includeAI,
				includeAutoRules: input.includeAutoRules,
			});
		}),

	// Tag Groups
	createTagGroup: protectedProcedure
		.input(tagGroupSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			return await taggingService.createTagGroup(organizationId, input, userId);
		}),

	getTagGroups: protectedProcedure.query(async ({ ctx }) => {
		const organizationId = getOrganizationId(ctx);

		return await ctx.db.query.tagGroups.findMany({
			where: eq(tagGroups.organizationId, organizationId),
			with: {
				groupTags: {
					with: {
						tag: true,
					},
				},
			},
			orderBy: [tagGroups.sortOrder],
		});
	}),

	// Auto-tag Rules
	createAutoTagRule: protectedProcedure
		.input(autoTagRuleSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			const [rule] = await ctx.db
				.insert(autoTagRules)
				.values({
					organizationId,
					name: input.name,
					description: input.description,
					conditions: input.conditions,
					tagIds: input.tagIds,
					metadata: input.metadata,
					priority: input.priority,
					isActive: input.isActive,
					applyToExisting: input.applyToExisting,
					createdBy: userId,
				})
				.returning();

			// Apply to existing assets if requested
			if (input.applyToExisting) {
				// TODO: Queue background job to apply rule to existing assets
			}

			return rule;
		}),

	getAutoTagRules: protectedProcedure.query(async ({ ctx }) => {
		const organizationId = getOrganizationId(ctx);

		return await ctx.db.query.autoTagRules.findMany({
			where: eq(autoTagRules.organizationId, organizationId),
			orderBy: [autoTagRules.priority],
		});
	}),

	// Metadata Extraction
	extractMetadata: protectedProcedure
		.input(
			z.object({
				assetId: z.string().uuid(),
				filePath: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// Verify asset belongs to organization
			const asset = await ctx.db.query.assets.findFirst({
				where: and(
					eq(assets.id, input.assetId),
					eq(assets.organizationId, organizationId),
				),
			});

			if (!asset) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Asset not found",
				});
			}

			const metadata = await metadataExtractor.extractMetadata(
				input.assetId,
				input.filePath,
				asset.mimeType,
			);

			return {
				success: true,
				metadata,
			};
		}),

	reprocessMetadata: protectedProcedure
		.input(
			z.object({
				assetIds: z.array(z.string().uuid()),
				concurrency: z.number().min(1).max(10).default(5),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// Verify all assets belong to organization
			const assetCount = await ctx.db
				.select({ count: sql<number>`count(*)::integer` })
				.from(assets)
				.where(
					and(
						sql`${assets.id} = ANY(${input.assetIds})`,
						eq(assets.organizationId, organizationId),
					),
				);

			if (assetCount[0]?.count !== input.assetIds.length) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "One or more assets not found or not accessible",
				});
			}

			const results = await metadataExtractor.batchExtractMetadata(
				input.assetIds,
				{ concurrency: input.concurrency },
			);

			return {
				success: true,
				processed: results.size,
				results: Array.from(results.entries()),
			};
		}),

	// Search
	search: protectedProcedure
		.input(searchSchema)
		.query(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			return await searchIndexingService.search({
				...input,
				organizationId,
			});
		}),

	getSearchSuggestions: protectedProcedure
		.input(
			z.object({
				prefix: z.string().min(1).max(50),
				limit: z.number().min(1).max(20).default(10),
			}),
		)
		.query(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			return await searchIndexingService.getSearchSuggestions(
				organizationId,
				input.prefix,
				input.limit,
			);
		}),

	reindexAssets: protectedProcedure
		.input(
			z.object({
				batchSize: z.number().min(10).max(500).default(100),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			const result = await searchIndexingService.reindexOrganization(
				organizationId,
				{ batchSize: input.batchSize },
			);

			return {
				success: true,
				...result,
			};
		}),

	// Metadata Templates
	getMetadataTemplates: protectedProcedure.query(async ({ ctx }) => {
		const organizationId = getOrganizationId(ctx);

		// TODO: Implement metadata templates table and query
		// return await ctx.db.query.metadataTemplates.findMany({
		// 	where: and(
		// 		eq(metadataTemplates.organizationId, organizationId),
		// 		eq(metadataTemplates.isActive, true)
		// 	),
		// });
		return [];
	}),

	// Asset Metadata
	getAssetMetadata: protectedProcedure
		.input(z.object({ assetId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// Verify asset belongs to organization
			const asset = await ctx.db.query.assets.findFirst({
				where: and(
					eq(assets.id, input.assetId),
					eq(assets.organizationId, organizationId),
				),
				// TODO: Fix with clauses - metadata and assetTags relations need to be properly defined
				// with: {
				// 	metadata: true,
				// 	assetTags: {
				// 		with: {
				// 			tag: true,
				// 		},
				// 	},
				// },
			});

			if (!asset) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Asset not found",
				});
			}

			return {
				asset,
				metadata: asset.metadata,
				tags: [], // TODO: Load asset tags separately when relation is fixed
			};
		}),

	// Update custom metadata
	updateCustomMetadata: protectedProcedure
		.input(
			z.object({
				assetId: z.string().uuid(),
				customMetadata: z.record(z.any()),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// Verify asset belongs to organization
			const asset = await ctx.db.query.assets.findFirst({
				where: and(
					eq(assets.id, input.assetId),
					eq(assets.organizationId, organizationId),
				),
			});

			if (!asset) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Asset not found",
				});
			}

			// TODO: Implement asset metadata table operations
			// Update or create metadata
			// const existing = await ctx.db.query.assetMetadata.findFirst({
			// 	where: eq(assetMetadata.assetId, input.assetId),
			// });

			// if (existing) {
			// 	await ctx.db
			// 		.update(assetMetadata)
			// 		.set({
			// 			customMetadata: {
			// 				...(existing.customMetadata as Record<string, any>),
			// 				...input.customMetadata,
			// 			},
			// 		})
			// 		.where(eq(assetMetadata.assetId, input.assetId));
			// } else {
			// 	await ctx.db.insert(assetMetadata).values({
			// 		assetId: input.assetId,
			// 		customMetadata: input.customMetadata,
			// 		extractedAt: new Date(),
			// 		extractionVersion: "1.0.0",
			// 	});
			// }

			// Reindex for search
			await searchIndexingService.indexAsset(input.assetId);

			return { success: true };
		}),
});
