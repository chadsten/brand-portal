import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { and, count, desc, eq, ilike, inArray, isNull, sql } from "drizzle-orm";
import slugify from "slugify";
import { db } from "~/server/db";
import {
	assetCollections,
	assets,
	collectionActivity,
	collectionAssets,
	collectionPermissions,
	collectionShares,
	collectionTemplates,
	users,
} from "~/server/db/schema";

export interface CollectionCreateData {
	name: string;
	description?: string;
	coverAssetId?: string;
	color?: string;
	icon?: string;
	isPublic?: boolean;
	allowContributions?: boolean;
	sortOrder?: string;
	sortDirection?: "asc" | "desc";
	autoRules?: Record<string, any>;
	metadata?: Record<string, any>;
	tags?: string[];
	assetIds?: string[];
}

export interface CollectionUpdateData {
	name?: string;
	description?: string;
	coverAssetId?: string;
	color?: string;
	icon?: string;
	isPublic?: boolean;
	allowContributions?: boolean;
	sortOrder?: string;
	sortDirection?: "asc" | "desc";
	autoRules?: Record<string, any>;
	metadata?: Record<string, any>;
	tags?: string[];
}

export interface CollectionSearchOptions {
	query?: string;
	createdBy?: string;
	isPublic?: boolean;
	isTemplate?: boolean;
	tags?: string[];
	sortBy?: "name" | "createdAt" | "updatedAt" | "assetCount";
	sortOrder?: "asc" | "desc";
	page?: number;
	pageSize?: number;
	// Legacy support for offset-based queries
	limit?: number;
	offset?: number;
}

export interface CollectionShareOptions {
	shareType: "view" | "download" | "collaborate";
	expiresAt?: Date;
	isPasswordProtected?: boolean;
	password?: string;
	maxDownloads?: number;
	allowedDomains?: string[];
	allowComments?: boolean;
	allowDownloads?: boolean;
	showMetadata?: boolean;
	customMessage?: string;
}

export class CollectionManager {
	// Create a new collection
	async createCollection(
		organizationId: string,
		data: CollectionCreateData,
		createdBy: string,
	): Promise<typeof assetCollections.$inferSelect> {
		// Generate unique slug
		const baseSlug = slugify(data.name, { lower: true, strict: true });
		let slug = baseSlug;
		let counter = 1;

		while (true) {
			const existing = await db.query.assetCollections.findFirst({
				where: and(
					eq(assetCollections.organizationId, organizationId),
					eq(assetCollections.slug, slug),
					isNull(assetCollections.deletedAt),
				),
			});

			if (!existing) break;
			slug = `${baseSlug}-${counter}`;
			counter++;
		}

		// Validate cover asset if provided
		if (data.coverAssetId) {
			const coverAsset = await db.query.assets.findFirst({
				where: and(
					eq(assets.id, data.coverAssetId),
					eq(assets.organizationId, organizationId),
					isNull(assets.deletedAt),
				),
			});

			if (!coverAsset) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cover asset not found or not accessible",
				});
			}
		}

		// Create collection
		const [collection] = await db
			.insert(assetCollections)
			.values({
				organizationId,
				name: data.name,
				description: data.description,
				slug,
				coverAssetId: data.coverAssetId,
				color: data.color,
				icon: data.icon,
				isPublic: data.isPublic || false,
				allowContributions: data.allowContributions || false,
				sortOrder: data.sortOrder || "createdAt",
				sortDirection: data.sortDirection || "desc",
				autoRules: data.autoRules,
				metadata: data.metadata || {},
				tags: data.tags || [],
				createdBy,
			})
			.returning();

		// Add assets if provided
		if (data.assetIds && data.assetIds.length > 0) {
			await this.addAssetsToCollection(
				collection!.id,
				data.assetIds,
				createdBy,
				organizationId,
			);
		}

		// Log activity
		await this.logActivity(collection!.id, createdBy, "created", {
			collectionName: data.name,
		});

		return collection!;
	}

	// Get collection by ID with assets
	async getCollection(
		collectionId: string,
		organizationId: string,
		options?: {
			includeAssets?: boolean;
			assetLimit?: number;
			assetOffset?: number;
		},
	): Promise<any> {
		const collection = await db.query.assetCollections.findFirst({
			where: and(
				eq(assetCollections.id, collectionId),
				eq(assetCollections.organizationId, organizationId),
				isNull(assetCollections.deletedAt),
			),
			with: {
				creator: {
					columns: {
						id: true,
						name: true,
						email: true,
						image: true,
					},
				},
				coverAsset: true,
			},
		});

		if (!collection) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Collection not found",
			});
		}

		let collectionAssetsList = null;
		if (options?.includeAssets) {
			const limit = options.assetLimit || 20;
			const offset = options.assetOffset || 0;

			collectionAssetsList = await db.query.collectionAssets.findMany({
				where: eq(collectionAssets.collectionId, collectionId),
				orderBy: [collectionAssets.sortOrder],
				limit: limit + 1, // Get one extra to check for more
				offset,
				with: {
					asset: {
						with: {
							uploader: {
								columns: {
									id: true,
									name: true,
									image: true,
								},
							},
						},
					},
					addedByUser: {
						columns: {
							id: true,
							name: true,
							image: true,
						},
					},
				},
			});

			// Check if there are more assets
			const hasMore = collectionAssetsList.length > limit;
			if (hasMore) {
				collectionAssetsList = collectionAssetsList.slice(0, limit);
			}

			return {
				...collection,
				assets: collectionAssetsList,
				hasMoreAssets: hasMore,
			};
		}

		return collection;
	}

	// Search collections
	async searchCollections(
		organizationId: string,
		options: CollectionSearchOptions,
	): Promise<{
		collections: any[];
		total: number;
		currentPage: number;
		pageSize: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
		hasMore: boolean; // Legacy support
	}> {
		// Calculate pagination parameters
		let limit: number;
		let offset: number;
		let currentPage: number;
		let pageSize: number;

		if (options.limit !== undefined && options.offset !== undefined) {
			// Legacy offset-based pagination
			limit = options.limit;
			offset = options.offset;
			pageSize = limit;
			currentPage = Math.floor(offset / limit) + 1;
		} else {
			// New page-based pagination
			currentPage = options.page || 1;
			pageSize = options.pageSize || 25;
			limit = pageSize;
			offset = (currentPage - 1) * pageSize;
		}

		// Build where conditions
		const conditions = [
			eq(assetCollections.organizationId, organizationId),
			isNull(assetCollections.deletedAt),
		];

		if (options.query) {
			conditions.push(ilike(assetCollections.name, `%${options.query}%`));
		}

		if (options.createdBy) {
			conditions.push(eq(assetCollections.createdBy, options.createdBy));
		}

		if (options.isPublic !== undefined) {
			conditions.push(eq(assetCollections.isPublic, options.isPublic));
		}

		if (options.isTemplate !== undefined) {
			conditions.push(eq(assetCollections.isTemplate, options.isTemplate));
		}

		if (options.tags && options.tags.length > 0) {
			for (const tag of options.tags) {
				conditions.push(
					sql`${assetCollections.tags} @> ${JSON.stringify([tag])}`,
				);
			}
		}

		// Get total count
		const [totalResult] = await db
			.select({ count: count() })
			.from(assetCollections)
			.where(and(...conditions));

		const total = totalResult?.count || 0;
		const totalPages = Math.ceil(total / pageSize);

		// Build order by
		const sortBy = options.sortBy || "createdAt";
		const sortOrder = options.sortOrder || "desc";
		const orderByField = assetCollections[sortBy];
		const orderDirection =
			sortOrder === "asc" ? orderByField : desc(orderByField);

		// Get collections
		const collections = await db.query.assetCollections.findMany({
			where: and(...conditions),
			orderBy: [orderDirection],
			limit,
			offset,
			with: {
				creator: {
					columns: {
						id: true,
						name: true,
						image: true,
					},
				},
				coverAsset: true,
			},
		});

		return {
			collections,
			total,
			currentPage,
			pageSize,
			totalPages,
			hasNextPage: currentPage < totalPages,
			hasPreviousPage: currentPage > 1,
			// Legacy support
			hasMore: offset + limit < total,
		};
	}

	// Update collection
	async updateCollection(
		collectionId: string,
		organizationId: string,
		data: CollectionUpdateData,
		updatedBy: string,
	): Promise<typeof assetCollections.$inferSelect> {
		// Verify collection exists and user has permission
		const existing = await db.query.assetCollections.findFirst({
			where: and(
				eq(assetCollections.id, collectionId),
				eq(assetCollections.organizationId, organizationId),
				isNull(assetCollections.deletedAt),
			),
		});

		if (!existing) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Collection not found",
			});
		}

		// Validate cover asset if provided
		if (data.coverAssetId) {
			const coverAsset = await db.query.assets.findFirst({
				where: and(
					eq(assets.id, data.coverAssetId),
					eq(assets.organizationId, organizationId),
					isNull(assets.deletedAt),
				),
			});

			if (!coverAsset) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cover asset not found or not accessible",
				});
			}
		}

		// Update slug if name changed
		let slug = existing.slug;
		if (data.name && data.name !== existing.name) {
			const baseSlug = slugify(data.name, { lower: true, strict: true });
			let newSlug = baseSlug;
			let counter = 1;

			while (true) {
				const slugExists = await db.query.assetCollections.findFirst({
					where: and(
						eq(assetCollections.organizationId, organizationId),
						eq(assetCollections.slug, newSlug),
						sql`${assetCollections.id} != ${collectionId}`,
						isNull(assetCollections.deletedAt),
					),
				});

				if (!slugExists) {
					slug = newSlug;
					break;
				}
				newSlug = `${baseSlug}-${counter}`;
				counter++;
			}
		}

		// Update collection
		const [updated] = await db
			.update(assetCollections)
			.set({
				...data,
				slug,
				updatedAt: new Date(),
			})
			.where(eq(assetCollections.id, collectionId))
			.returning();

		// Log activity
		await this.logActivity(collectionId, updatedBy, "updated", {
			changes: Object.keys(data),
		});

		return updated!;
	}

	// Delete collection (soft delete)
	async deleteCollection(
		collectionId: string,
		organizationId: string,
		deletedBy: string,
	): Promise<void> {
		const collection = await db.query.assetCollections.findFirst({
			where: and(
				eq(assetCollections.id, collectionId),
				eq(assetCollections.organizationId, organizationId),
				isNull(assetCollections.deletedAt),
			),
		});

		if (!collection) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Collection not found",
			});
		}

		await db
			.update(assetCollections)
			.set({
				deletedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(assetCollections.id, collectionId));

		// Log activity
		await this.logActivity(collectionId, deletedBy, "deleted", {
			collectionName: collection.name,
		});
	}

	// Add assets to collection
	async addAssetsToCollection(
		collectionId: string,
		assetIds: string[],
		addedBy: string,
		organizationId: string,
	): Promise<void> {
		// Verify collection exists
		const collection = await db.query.assetCollections.findFirst({
			where: and(
				eq(assetCollections.id, collectionId),
				eq(assetCollections.organizationId, organizationId),
				isNull(assetCollections.deletedAt),
			),
		});

		if (!collection) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Collection not found",
			});
		}

		// Verify all assets exist and belong to organization
		const validAssets = await db.query.assets.findMany({
			where: and(
				inArray(assets.id, assetIds),
				eq(assets.organizationId, organizationId),
				isNull(assets.deletedAt),
			),
		});

		if (validAssets.length !== assetIds.length) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "One or more assets not found or not accessible",
			});
		}

		// Get highest sort order
		const [maxSort] = await db
			.select({ max: sql<number>`max(${collectionAssets.sortOrder})` })
			.from(collectionAssets)
			.where(eq(collectionAssets.collectionId, collectionId));

		let sortOrder = (maxSort?.max || 0) + 1;

		// Add assets to collection (ignore duplicates)
		for (const assetId of assetIds) {
			await db
				.insert(collectionAssets)
				.values({
					collectionId,
					assetId,
					sortOrder: sortOrder++,
					addedBy,
				})
				.onConflictDoNothing();
		}

		// Update collection stats
		await this.updateCollectionStats(collectionId);

		// Log activity
		await this.logActivity(collectionId, addedBy, "assets_added", {
			assetCount: assetIds.length,
			assetIds,
		});
	}

	// Remove assets from collection
	async removeAssetsFromCollection(
		collectionId: string,
		assetIds: string[],
		removedBy: string,
		organizationId: string,
	): Promise<void> {
		// Verify collection exists
		const collection = await db.query.assetCollections.findFirst({
			where: and(
				eq(assetCollections.id, collectionId),
				eq(assetCollections.organizationId, organizationId),
				isNull(assetCollections.deletedAt),
			),
		});

		if (!collection) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Collection not found",
			});
		}

		// Remove assets
		await db
			.delete(collectionAssets)
			.where(
				and(
					eq(collectionAssets.collectionId, collectionId),
					inArray(collectionAssets.assetId, assetIds),
				),
			);

		// Update collection stats
		await this.updateCollectionStats(collectionId);

		// Log activity
		await this.logActivity(collectionId, removedBy, "assets_removed", {
			assetCount: assetIds.length,
			assetIds,
		});
	}

	// Create collection share
	async createShare(
		collectionId: string,
		organizationId: string,
		options: CollectionShareOptions,
		createdBy: string,
	): Promise<typeof collectionShares.$inferSelect> {
		// Verify collection exists
		const collection = await db.query.assetCollections.findFirst({
			where: and(
				eq(assetCollections.id, collectionId),
				eq(assetCollections.organizationId, organizationId),
				isNull(assetCollections.deletedAt),
			),
		});

		if (!collection) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Collection not found",
			});
		}

		// Generate share token
		const shareToken = crypto.randomBytes(32).toString("hex");

		// Hash password if provided
		let passwordHash = null;
		if (options.isPasswordProtected && options.password) {
			passwordHash = crypto
				.createHash("sha256")
				.update(options.password)
				.digest("hex");
		}

		const [share] = await db
			.insert(collectionShares)
			.values({
				collectionId,
				shareToken,
				shareType: options.shareType,
				isPasswordProtected: options.isPasswordProtected || false,
				passwordHash,
				expiresAt: options.expiresAt,
				maxDownloads: options.maxDownloads,
				allowedDomains: options.allowedDomains || [],
				allowComments: options.allowComments || false,
				allowDownloads: options.allowDownloads !== false,
				showMetadata: options.showMetadata !== false,
				customMessage: options.customMessage,
				createdBy,
			})
			.returning();

		// Log activity
		await this.logActivity(collectionId, createdBy, "share_created", {
			shareType: options.shareType,
			shareToken,
		});

		return share!;
	}

	// Update collection statistics
	private async updateCollectionStats(collectionId: string): Promise<void> {
		const [stats] = await db
			.select({
				count: sql<number>`count(*)::integer`,
				totalSize: sql<number>`sum(${assets.fileSize})::bigint`,
			})
			.from(collectionAssets)
			.innerJoin(assets, eq(collectionAssets.assetId, assets.id))
			.where(
				and(
					eq(collectionAssets.collectionId, collectionId),
					isNull(assets.deletedAt),
				),
			);

		await db
			.update(assetCollections)
			.set({
				assetCount: stats?.count || 0,
				totalSize: stats?.totalSize || 0,
				updatedAt: new Date(),
			})
			.where(eq(assetCollections.id, collectionId));
	}

	// Log collection activity
	private async logActivity(
		collectionId: string,
		userId: string,
		action: string,
		details: Record<string, any>,
	): Promise<void> {
		await db.insert(collectionActivity).values({
			collectionId,
			userId,
			action,
			details,
		});
	}

	// Duplicate collection
	async duplicateCollection(
		collectionId: string,
		organizationId: string,
		newName: string,
		createdBy: string,
		options?: {
			includeAssets?: boolean;
			includePermissions?: boolean;
		},
	): Promise<typeof assetCollections.$inferSelect> {
		// Get original collection
		const original = await db.query.assetCollections.findFirst({
			where: and(
				eq(assetCollections.id, collectionId),
				eq(assetCollections.organizationId, organizationId),
				isNull(assetCollections.deletedAt),
			),
		});

		if (!original) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Collection not found",
			});
		}

		// Create new collection
		const newCollection = await this.createCollection(
			organizationId,
			{
				name: newName,
				description: original.description || undefined,
				color: original.color || undefined,
				icon: original.icon || undefined,
				isPublic: original.isPublic || undefined,
				allowContributions: original.allowContributions || undefined,
				sortOrder: original.sortOrder || undefined,
				sortDirection: (original.sortDirection as "asc" | "desc") || undefined,
				autoRules: (original.autoRules as Record<string, any>) || undefined,
				metadata: (original.metadata as Record<string, any>) || undefined,
				tags: (original.tags as string[]) || undefined,
			},
			createdBy,
		);

		// Copy assets if requested
		if (options?.includeAssets) {
			const originalAssets = await db.query.collectionAssets.findMany({
				where: eq(collectionAssets.collectionId, collectionId),
			});

			if (originalAssets.length > 0) {
				const assetIds = originalAssets.map((ca) => ca.assetId);
				await this.addAssetsToCollection(
					newCollection.id,
					assetIds,
					createdBy,
					organizationId,
				);
			}
		}

		return newCollection;
	}

	// Get collection analytics
	async getCollectionAnalytics(
		collectionId: string,
		organizationId: string,
		timeRange?: { from: Date; to: Date },
	): Promise<{
		totalViews: number;
		totalDownloads: number;
		uniqueViewers: number;
		topAssets: any[];
		activityTimeline: any[];
	}> {
		// Verify collection exists
		const collection = await db.query.assetCollections.findFirst({
			where: and(
				eq(assetCollections.id, collectionId),
				eq(assetCollections.organizationId, organizationId),
				isNull(assetCollections.deletedAt),
			),
		});

		if (!collection) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Collection not found",
			});
		}

		// Build time range conditions
		const timeConditions = [];
		if (timeRange) {
			timeConditions.push(
				sql`${collectionActivity.createdAt} >= ${timeRange.from}`,
				sql`${collectionActivity.createdAt} <= ${timeRange.to}`,
			);
		}

		// Get activity stats
		const [activityStats] = await db
			.select({
				totalViews: sql<number>`count(*) filter (where ${collectionActivity.action} = 'viewed')::integer`,
				totalDownloads: sql<number>`count(*) filter (where ${collectionActivity.action} = 'downloaded')::integer`,
				uniqueViewers: sql<number>`count(distinct ${collectionActivity.userId}) filter (where ${collectionActivity.action} = 'viewed')::integer`,
			})
			.from(collectionActivity)
			.where(
				and(
					eq(collectionActivity.collectionId, collectionId),
					...timeConditions,
				),
			);

		// Get activity timeline
		const activityTimeline = await db
			.select({
				date: sql<string>`date(${collectionActivity.createdAt})`,
				action: collectionActivity.action,
				count: sql<number>`count(*)::integer`,
			})
			.from(collectionActivity)
			.where(
				and(
					eq(collectionActivity.collectionId, collectionId),
					...timeConditions,
				),
			)
			.groupBy(
				sql`date(${collectionActivity.createdAt})`,
				collectionActivity.action,
			)
			.orderBy(sql`date(${collectionActivity.createdAt})`);

		// Get top assets (most viewed/downloaded)
		const topAssets = await db
			.select({
				assetId: collectionActivity.assetId,
				viewCount: sql<number>`count(*) filter (where ${collectionActivity.action} = 'asset_viewed')::integer`,
				downloadCount: sql<number>`count(*) filter (where ${collectionActivity.action} = 'asset_downloaded')::integer`,
			})
			.from(collectionActivity)
			.where(
				and(
					eq(collectionActivity.collectionId, collectionId),
					sql`${collectionActivity.assetId} IS NOT NULL`,
					...timeConditions,
				),
			)
			.groupBy(collectionActivity.assetId)
			.orderBy(desc(sql`count(*)`))
			.limit(10);

		return {
			totalViews: activityStats?.totalViews || 0,
			totalDownloads: activityStats?.totalDownloads || 0,
			uniqueViewers: activityStats?.uniqueViewers || 0,
			topAssets,
			activityTimeline,
		};
	}
}

export const collectionManager = new CollectionManager();
