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
	assetPermissions,
	assets,
	assetVersions,
	organizations,
	users,
} from "~/server/db/schema";
import { usageTracker } from "~/server/storage/usage";

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

// Utility function to check asset permissions
async function checkAssetPermission(
	ctx: { db: any; session: { user: { id: string; organizationId?: string } } },
	assetId: string,
	permission: "view" | "download" | "edit" | "delete",
): Promise<boolean> {
	const organizationId = getOrganizationId(ctx);
	const userId = ctx.session.user.id;

	// Check if asset exists and belongs to organization
	const asset = await ctx.db.query.assets.findFirst({
		where: and(
			eq(assets.id, assetId),
			eq(assets.organizationId, organizationId),
			isNull(assets.deletedAt),
		),
	});

	if (!asset) {
		return false;
	}

	// Check if user is the uploader (has all permissions)
	if (asset.uploadedBy === userId) {
		return true;
	}

	// Check explicit permissions
	const userPermission = await ctx.db.query.assetPermissions.findFirst({
		where: and(
			eq(assetPermissions.assetId, assetId),
			eq(assetPermissions.userId, userId),
		),
	});

	if (userPermission) {
		switch (permission) {
			case "view":
				return userPermission.canView;
			case "download":
				return userPermission.canDownload;
			case "edit":
				return userPermission.canEdit;
			case "delete":
				return userPermission.canDelete;
		}
	}

	// Check role-based permissions (simplified - assumes user has roles)
	// In a full implementation, you'd check user roles and role permissions
	return permission === "view"; // Default: allow viewing for org members
}

const createAssetSchema = z.object({
	fileName: z.string().min(1),
	originalFileName: z.string().min(1),
	fileType: z.string().min(1),
	mimeType: z.string().min(1),
	fileSize: z.number().positive(),
	storageKey: z.string().min(1),
	thumbnailKey: z.string().optional(),
	storageProvider: z.string().default("default"),
	title: z.string().min(1),
	description: z.string().optional(),
	tags: z.array(z.string()).default([]),
	metadata: z.record(z.any()).default({}),
});

const updateAssetSchema = z.object({
	id: z.string().uuid(),
	title: z.string().min(1).optional(),
	description: z.string().optional(),
	tags: z.array(z.string()).optional(),
	metadata: z.record(z.any()).optional(),
});

const searchAssetsSchema = z.object({
	query: z.string().optional(),
	fileTypes: z.array(z.string()).optional(),
	tags: z.array(z.string()).optional(),
	uploadedBy: z.string().uuid().optional(),
	sortBy: z
		.enum(["createdAt", "updatedAt", "title", "fileSize", "fileName"])
		.default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
});

const assetPermissionSchema = z.object({
	assetId: z.string().uuid(),
	userId: z.string().uuid().optional(),
	roleId: z.string().uuid().optional(),
	canView: z.boolean().default(true),
	canDownload: z.boolean().default(true),
	canEdit: z.boolean().default(false),
	canDelete: z.boolean().default(false),
});

const createVersionSchema = z.object({
	assetId: z.string().uuid(),
	storageKey: z.string().min(1),
	fileSize: z.number().positive(),
	changeLog: z.string().optional(),
});

export const assetRouter = createTRPCRouter({
	// Get all assets
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const organizationId = getOrganizationId(ctx);
		
		const results = await ctx.db.query.assets.findMany({
			where: and(
				eq(assets.organizationId, organizationId),
				isNull(assets.deletedAt),
			),
			limit: 50,
			orderBy: [desc(assets.createdAt)],
			with: {
				uploader: {
					columns: {
						id: true,
						name: true,
						email: true,
						image: true,
					},
				},
			},
		});

		return {
			assets: results,
			total: results.length,
			hasMore: false,
		};
	}),

	// Create a new asset
	create: protectedProcedure
		.input(createAssetSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			try {
				// Validate upload against organization limits
				const validation = await usageTracker.validateAssetUpload(
					organizationId,
					input.fileSize,
				);

				if (!validation.allowed) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: validation.reason || "Upload not allowed",
					});
				}

				// Create the asset
				const newAsset = await ctx.db
					.insert(assets)
					.values({
						organizationId,
						uploadedBy: userId,
						fileName: input.fileName,
						originalFileName: input.originalFileName,
						fileType: input.fileType,
						mimeType: input.mimeType,
						fileSize: input.fileSize,
						storageKey: input.storageKey,
						thumbnailKey: input.thumbnailKey,
						storageProvider: input.storageProvider,
						title: input.title,
						description: input.description,
						tags: input.tags,
						metadata: input.metadata,
					})
					.returning();

				// Update usage metrics
				await usageTracker.incrementUploadCount(organizationId);
				await usageTracker.scheduleUsageUpdate(organizationId);

				return {
					success: true,
					asset: newAsset[0],
				};
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error ? error.message : "Failed to create asset",
				});
			}
		}),

	// Get asset by ID
	getById: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// Check permissions
			const hasPermission = await checkAssetPermission(ctx, input.id, "view");
			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to view this asset",
				});
			}

			const asset = await ctx.db.query.assets.findFirst({
				where: and(
					eq(assets.id, input.id),
					eq(assets.organizationId, organizationId),
					isNull(assets.deletedAt),
				),
				with: {
					uploader: {
						columns: {
							id: true,
							name: true,
							email: true,
							image: true,
						},
					},
					versions: {
						orderBy: [desc(assetVersions.versionNumber)],
						with: {
							uploader: {
								columns: {
									id: true,
									name: true,
								},
							},
						},
					},
				},
			});

			if (!asset) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Asset not found",
				});
			}

			return asset;
		}),

	// Search and filter assets
	search: protectedProcedure
		.input(searchAssetsSchema)
		.query(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// Build the where clause
			const whereConditions = [
				eq(assets.organizationId, organizationId),
				isNull(assets.deletedAt),
			];

			// Text search
			if (input.query) {
				whereConditions.push(
					or(
						ilike(assets.title, `%${input.query}%`),
						ilike(assets.fileName, `%${input.query}%`),
						ilike(assets.originalFileName, `%${input.query}%`),
						ilike(assets.description, `%${input.query}%`),
					)!,
				);
			}

			// File type filter (using MIME types)
			if (input.fileTypes && input.fileTypes.length > 0) {
				whereConditions.push(inArray(assets.mimeType, input.fileTypes));
			}

			// Uploader filter
			if (input.uploadedBy) {
				whereConditions.push(eq(assets.uploadedBy, input.uploadedBy));
			}

			// Tag filter (using JSON operations)
			if (input.tags && input.tags.length > 0) {
				for (const tag of input.tags) {
					whereConditions.push(sql`${assets.tags} @> ${JSON.stringify([tag])}`);
				}
			}

			// Count total results
			const totalCount = await ctx.db
				.select({ count: count() })
				.from(assets)
				.where(and(...whereConditions));

			// Get paginated results
			const orderByField = assets[input.sortBy];
			const orderDirection =
				input.sortOrder === "asc" ? orderByField : desc(orderByField);

			const results = await ctx.db.query.assets.findMany({
				where: and(...whereConditions),
				orderBy: [orderDirection],
				limit: input.limit,
				offset: input.offset,
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

			return {
				assets: results,
				total: totalCount[0]?.count || 0,
				hasMore: input.offset + input.limit < (totalCount[0]?.count || 0),
			};
		}),

	// Update asset metadata
	update: protectedProcedure
		.input(updateAssetSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// Check permissions
			const hasPermission = await checkAssetPermission(ctx, input.id, "edit");
			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to edit this asset",
				});
			}

			// Prepare update data
			const updateData: Partial<typeof assets.$inferInsert> = {
				updatedAt: new Date(),
			};

			if (input.title !== undefined) updateData.title = input.title;
			if (input.description !== undefined)
				updateData.description = input.description;
			if (input.tags !== undefined) updateData.tags = input.tags;
			if (input.metadata !== undefined) updateData.metadata = input.metadata;

			const updatedAsset = await ctx.db
				.update(assets)
				.set(updateData)
				.where(
					and(
						eq(assets.id, input.id),
						eq(assets.organizationId, organizationId),
						isNull(assets.deletedAt),
					),
				)
				.returning();

			if (updatedAsset.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Asset not found or not updated",
				});
			}

			return {
				success: true,
				asset: updatedAsset[0],
			};
		}),

	// Soft delete asset
	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// Check permissions
			const hasPermission = await checkAssetPermission(ctx, input.id, "delete");
			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to delete this asset",
				});
			}

			const deletedAsset = await ctx.db
				.update(assets)
				.set({
					deletedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(assets.id, input.id),
						eq(assets.organizationId, organizationId),
						isNull(assets.deletedAt),
					),
				)
				.returning();

			if (deletedAsset.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Asset not found",
				});
			}

			// Update usage metrics to recalculate after deletion
			await usageTracker.scheduleUsageUpdate(organizationId);

			return {
				success: true,
				message: "Asset deleted successfully",
			};
		}),

	// Create asset version
	createVersion: protectedProcedure
		.input(createVersionSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			// Check permissions
			const hasPermission = await checkAssetPermission(
				ctx,
				input.assetId,
				"edit",
			);
			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"You don't have permission to create versions for this asset",
				});
			}

			// Get current highest version number
			const latestVersion = await ctx.db.query.assetVersions.findFirst({
				where: eq(assetVersions.assetId, input.assetId),
				orderBy: [desc(assetVersions.versionNumber)],
			});

			const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

			const newVersion = await ctx.db
				.insert(assetVersions)
				.values({
					assetId: input.assetId,
					versionNumber: newVersionNumber,
					uploadedBy: userId,
					storageKey: input.storageKey,
					fileSize: input.fileSize,
					changeLog: input.changeLog,
				})
				.returning();

			return {
				success: true,
				version: newVersion[0],
			};
		}),

	// Get asset versions
	getVersions: protectedProcedure
		.input(z.object({ assetId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			// Check permissions
			const hasPermission = await checkAssetPermission(
				ctx,
				input.assetId,
				"view",
			);
			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to view this asset",
				});
			}

			const versions = await ctx.db.query.assetVersions.findMany({
				where: eq(assetVersions.assetId, input.assetId),
				orderBy: [desc(assetVersions.versionNumber)],
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

			return versions;
		}),

	// Set asset permissions
	setPermissions: protectedProcedure
		.input(assetPermissionSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// Check if user has permission to manage permissions (edit permission required)
			const hasPermission = await checkAssetPermission(
				ctx,
				input.assetId,
				"edit",
			);
			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"You don't have permission to manage permissions for this asset",
				});
			}

			// Validate that either userId or roleId is provided
			if (!input.userId && !input.roleId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Either userId or roleId must be provided",
				});
			}

			// Check if permission already exists
			const existingPermission = await ctx.db.query.assetPermissions.findFirst({
				where: and(
					eq(assetPermissions.assetId, input.assetId),
					input.userId ? eq(assetPermissions.userId, input.userId) : undefined,
					input.roleId ? eq(assetPermissions.roleId, input.roleId) : undefined,
				),
			});

			let result;
			if (existingPermission) {
				// Update existing permission
				result = await ctx.db
					.update(assetPermissions)
					.set({
						canView: input.canView,
						canDownload: input.canDownload,
						canEdit: input.canEdit,
						canDelete: input.canDelete,
					})
					.where(eq(assetPermissions.id, existingPermission.id))
					.returning();
			} else {
				// Create new permission
				result = await ctx.db
					.insert(assetPermissions)
					.values({
						assetId: input.assetId,
						userId: input.userId,
						roleId: input.roleId,
						canView: input.canView,
						canDownload: input.canDownload,
						canEdit: input.canEdit,
						canDelete: input.canDelete,
					})
					.returning();
			}

			return {
				success: true,
				permission: result[0],
			};
		}),

	// Get asset permissions
	getPermissions: protectedProcedure
		.input(z.object({ assetId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			// Check permissions
			const hasPermission = await checkAssetPermission(
				ctx,
				input.assetId,
				"view",
			);
			if (!hasPermission) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to view this asset",
				});
			}

			const permissions = await ctx.db.query.assetPermissions.findMany({
				where: eq(assetPermissions.assetId, input.assetId),
				with: {
					user: {
						columns: {
							id: true,
							name: true,
							email: true,
							image: true,
						},
					},
					role: {
						columns: {
							id: true,
							name: true,
						},
					},
				},
			});

			return permissions;
		}),

	// Get asset statistics for organization
	getStats: protectedProcedure.query(async ({ ctx }) => {
		const organizationId = getOrganizationId(ctx);

		const stats = await ctx.db
			.select({
				totalAssets: count(),
				totalSize: sql<number>`sum(${assets.fileSize})`,
				imageCount: sql<number>`count(*) filter (where ${assets.fileType} like 'image%')`,
				videoCount: sql<number>`count(*) filter (where ${assets.fileType} like 'video%')`,
				documentCount: sql<number>`count(*) filter (where ${assets.fileType} in ('pdf', 'doc', 'docx', 'xls', 'xlsx'))`,
			})
			.from(assets)
			.where(
				and(
					eq(assets.organizationId, organizationId),
					isNull(assets.deletedAt),
				),
			);

		const recentAssets = await ctx.db.query.assets.findMany({
			where: and(
				eq(assets.organizationId, organizationId),
				isNull(assets.deletedAt),
			),
			orderBy: [desc(assets.createdAt)],
			limit: 5,
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

		return {
			...stats[0],
			recentAssets,
		};
	}),

	// Get popular tags
	getPopularTags: protectedProcedure
		.input(z.object({ limit: z.number().min(1).max(50).default(20) }))
		.query(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// This is a complex query that would require custom SQL
			// For now, we'll return a simplified version
			const assetsWithTags = await ctx.db.query.assets.findMany({
				where: and(
					eq(assets.organizationId, organizationId),
					isNull(assets.deletedAt),
					sql`${assets.tags} != '[]'`,
				),
				columns: {
					tags: true,
				},
			});

			// Process tags in memory (in production, this should be done in the database)
			const tagCounts = new Map<string, number>();

			for (const asset of assetsWithTags) {
				const tags = asset.tags as string[];
				for (const tag of tags) {
					tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
				}
			}

			const popularTags = Array.from(tagCounts.entries())
				.sort(([, a], [, b]) => b - a)
				.slice(0, input.limit)
				.map(([tag, count]) => ({ tag, count }));

			return popularTags;
		}),
});
