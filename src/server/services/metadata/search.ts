import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
	assetMetadata,
	assetSearchIndex,
	assets,
	assetTags,
	tags,
} from "~/server/db/schema";

export interface SearchOptions {
	query: string;
	organizationId: string;
	filters?: {
		fileTypes?: string[];
		tags?: string[];
		uploadedBy?: string;
		dateFrom?: Date;
		dateTo?: Date;
		hasMetadata?: boolean;
		minSize?: number;
		maxSize?: number;
	};
	sortBy?: "relevance" | "createdAt" | "updatedAt" | "name" | "size";
	sortOrder?: "asc" | "desc";
	limit?: number;
	offset?: number;
	includeDeleted?: boolean;
}

export interface SearchResult {
	asset: typeof assets.$inferSelect;
	score: number;
	highlights?: {
		title?: string[];
		description?: string[];
		content?: string[];
	};
	metadata?: typeof assetMetadata.$inferSelect;
}

export interface SearchAggregations {
	totalCount: number;
	fileTypes: Array<{ type: string; count: number }>;
	tags: Array<{ id: string; name: string; count: number }>;
	dateRange: { min: Date; max: Date };
	sizeRange: { min: number; max: number };
}

export class SearchIndexingService {
	// Index an asset for search
	async indexAsset(assetId: string): Promise<void> {
		try {
			// Get asset with all related data
			const asset = await db.query.assets.findFirst({
				where: eq(assets.id, assetId),
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
				throw new Error("Asset not found");
			}

			// Build searchable content
			const searchContent = this.buildSearchContent(asset);

			// Create or update search index
			await db
				.insert(assetSearchIndex)
				.values({
					assetId,
					content: searchContent,
					lastIndexed: new Date(),
					indexVersion: "1.0.0",
				})
				.onConflictDoUpdate({
					target: assetSearchIndex.assetId,
					set: {
						content: searchContent,
						lastIndexed: new Date(),
						indexVersion: "1.0.0",
					},
				});
		} catch (error) {
			console.error(`Failed to index asset ${assetId}:`, error);
			throw error;
		}
	}

	// Build searchable content from asset data
	private buildSearchContent(asset: any): string {
		const parts: string[] = [];

		// Add basic fields
		parts.push(asset.title);
		if (asset.description) parts.push(asset.description);
		parts.push(asset.fileName);
		parts.push(asset.originalFileName);

		// Add tags
		if (asset.assetTags) {
			const tagNames = asset.assetTags.map((at: any) => at.tag.name);
			parts.push(...tagNames);
		}

		// Add metadata content
		if (asset.metadata) {
			// Extracted text from documents
			if (asset.metadata.extractedText) {
				parts.push(asset.metadata.extractedText);
			}

			// AI descriptions
			if (asset.metadata.aiDescription) {
				parts.push(asset.metadata.aiDescription);
			}

			// Custom metadata fields
			if (asset.metadata.customMetadata) {
				const metadataValues = Object.values(asset.metadata.customMetadata)
					.filter((v) => typeof v === "string")
					.map((v) => String(v));
				parts.push(...metadataValues);
			}
		}

		// Add file type info
		parts.push(asset.fileType);
		parts.push(asset.mimeType.split("/").join(" "));

		return parts.filter(Boolean).join(" ");
	}

	// Perform full-text search
	async search(options: SearchOptions): Promise<{
		results: SearchResult[];
		aggregations: SearchAggregations;
		hasMore: boolean;
	}> {
		const limit = options.limit || 20;
		const offset = options.offset || 0;

		// Build WHERE conditions for text search
		const conditions = [
			eq(assets.organizationId, options.organizationId),
			or(
				ilike(assets.title, `%${options.query}%`),
				ilike(assets.description, `%${options.query}%`),
				ilike(assets.fileName, `%${options.query}%`),
				ilike(assetSearchIndex.content, `%${options.query}%`),
			)!,
		];

		if (!options.includeDeleted) {
			conditions.push(sql`${assets.deletedAt} IS NULL`);
		}

		// Apply filters
		if (options.filters) {
			if (options.filters.fileTypes?.length) {
				conditions.push(
					sql`${assets.fileType} = ANY(${options.filters.fileTypes})`,
				);
			}

			if (options.filters.uploadedBy) {
				conditions.push(eq(assets.uploadedBy, options.filters.uploadedBy));
			}

			if (options.filters.dateFrom) {
				conditions.push(
					sql`${assets.createdAt} >= ${options.filters.dateFrom}`,
				);
			}

			if (options.filters.dateTo) {
				conditions.push(sql`${assets.createdAt} <= ${options.filters.dateTo}`);
			}

			if (options.filters.minSize) {
				conditions.push(sql`${assets.fileSize} >= ${options.filters.minSize}`);
			}

			if (options.filters.maxSize) {
				conditions.push(sql`${assets.fileSize} <= ${options.filters.maxSize}`);
			}
		}

		// Apply tag filters
		if (options.filters?.tags?.length) {
			const tagCondition = sql`
				EXISTS (
					SELECT 1 FROM ${assetTags}
					WHERE ${assetTags.assetId} = ${assets.id}
					AND ${assetTags.tagId} = ANY(${options.filters.tags})
				)
			`;
			conditions.push(tagCondition);
		}

		// Calculate simple relevance score based on matches
		const relevanceScore = sql<number>`
			CASE 
				WHEN LOWER(${assets.title}) LIKE LOWER('%' || ${options.query} || '%') THEN 3
				WHEN LOWER(${assets.description}) LIKE LOWER('%' || ${options.query} || '%') THEN 2
				WHEN LOWER(${assets.fileName}) LIKE LOWER('%' || ${options.query} || '%') THEN 1
				ELSE 0
			END
		`.as("score");

		// Execute search query
		const searchResults = await db
			.select({
				asset: assets,
				metadata: assetMetadata,
				score: relevanceScore,
			})
			.from(assets)
			.innerJoin(assetSearchIndex, eq(assets.id, assetSearchIndex.assetId))
			.leftJoin(assetMetadata, eq(assets.id, assetMetadata.assetId))
			.where(and(...conditions))
			.orderBy(
				options.sortBy === "relevance"
					? desc(relevanceScore)
					: options.sortBy === "createdAt"
						? desc(assets.createdAt)
						: options.sortBy === "updatedAt"
							? desc(assets.updatedAt)
							: options.sortBy === "name"
								? assets.title
								: options.sortBy === "size"
									? desc(assets.fileSize)
									: desc(relevanceScore),
			)
			.limit(limit + 1)
			.offset(offset);

		// Check if there are more results
		const hasMore = searchResults.length > limit;
		const results = searchResults.slice(0, limit);

		// Get aggregations
		const aggregations = await this.getSearchAggregations(options);

		// Generate highlights
		const resultsWithHighlights = await Promise.all(
			results.map(async (result) => {
				const highlights = await this.generateHighlights(
					result.asset,
					options.query,
				);

				return {
					asset: result.asset,
					score: result.score,
					highlights,
					metadata: result.metadata || undefined,
				};
			}),
		);

		return {
			results: resultsWithHighlights,
			aggregations,
			hasMore,
		};
	}

	// Get search aggregations
	private async getSearchAggregations(
		options: SearchOptions,
	): Promise<SearchAggregations> {
		// Build base conditions (same as search)
		const conditions = [eq(assets.organizationId, options.organizationId)];

		if (!options.includeDeleted) {
			conditions.push(sql`${assets.deletedAt} IS NULL`);
		}

		// Get total count
		const [countResult] = await db
			.select({ count: sql<number>`count(*)::integer` })
			.from(assets)
			.where(and(...conditions));

		// Get file type distribution
		const fileTypes = await db
			.select({
				type: assets.fileType,
				count: sql<number>`count(*)::integer`,
			})
			.from(assets)
			.where(and(...conditions))
			.groupBy(assets.fileType)
			.orderBy(desc(sql`count(*)`))
			.limit(10);

		// Get popular tags
		const popularTags = await db
			.select({
				id: tags.id,
				name: tags.name,
				count: sql<number>`count(distinct ${assetTags.assetId})::integer`,
			})
			.from(tags)
			.innerJoin(assetTags, eq(tags.id, assetTags.tagId))
			.innerJoin(assets, eq(assetTags.assetId, assets.id))
			.where(and(...conditions))
			.groupBy(tags.id, tags.name)
			.orderBy(desc(sql`count(distinct ${assetTags.assetId})`))
			.limit(20);

		// Get date range
		const [dateRange] = await db
			.select({
				min: sql<Date>`min(${assets.createdAt})`,
				max: sql<Date>`max(${assets.createdAt})`,
			})
			.from(assets)
			.where(and(...conditions));

		// Get size range
		const [sizeRange] = await db
			.select({
				min: sql<number>`min(${assets.fileSize})::bigint`,
				max: sql<number>`max(${assets.fileSize})::bigint`,
			})
			.from(assets)
			.where(and(...conditions));

		return {
			totalCount: countResult?.count || 0,
			fileTypes,
			tags: popularTags,
			dateRange: {
				min: dateRange?.min || new Date(),
				max: dateRange?.max || new Date(),
			},
			sizeRange: {
				min: sizeRange?.min || 0,
				max: sizeRange?.max || 0,
			},
		};
	}

	// Generate search highlights
	private async generateHighlights(
		asset: typeof assets.$inferSelect,
		query: string,
	): Promise<SearchResult["highlights"]> {
		const highlights: SearchResult["highlights"] = {};
		const queryTerms = query.toLowerCase().split(/\s+/);

		// Highlight title
		if (asset.title) {
			const titleHighlights = this.highlightText(asset.title, queryTerms);
			if (titleHighlights.length > 0) {
				highlights.title = titleHighlights;
			}
		}

		// Highlight description
		if (asset.description) {
			const descHighlights = this.highlightText(asset.description, queryTerms);
			if (descHighlights.length > 0) {
				highlights.description = descHighlights;
			}
		}

		// Get and highlight content from search index
		const searchIndex = await db.query.assetSearchIndex.findFirst({
			where: eq(assetSearchIndex.assetId, asset.id),
		});

		if (searchIndex?.content) {
			const contentHighlights = this.highlightText(
				searchIndex.content,
				queryTerms,
			);
			if (contentHighlights.length > 0) {
				highlights.content = contentHighlights.slice(0, 3); // Limit to 3 excerpts
			}
		}

		return highlights;
	}

	// Highlight text with query terms
	private highlightText(text: string, queryTerms: string[]): string[] {
		const highlights: string[] = [];
		const lowerText = text.toLowerCase();
		const excerptLength = 150;
		const highlightPadding = 50;

		queryTerms.forEach((term) => {
			let index = lowerText.indexOf(term);
			while (index !== -1) {
				const start = Math.max(0, index - highlightPadding);
				const end = Math.min(
					text.length,
					index + term.length + highlightPadding,
				);

				let excerpt = text.slice(start, end);

				// Add ellipsis if truncated
				if (start > 0) excerpt = "..." + excerpt;
				if (end < text.length) excerpt = excerpt + "...";

				// Wrap matched term in <mark> tags
				const regex = new RegExp(`(${term})`, "gi");
				excerpt = excerpt.replace(regex, "<mark>$1</mark>");

				highlights.push(excerpt);

				// Find next occurrence
				index = lowerText.indexOf(term, index + 1);
			}
		});

		// Remove duplicates and limit length
		return [...new Set(highlights)].slice(0, 5);
	}

	// Reindex all assets for an organization
	async reindexOrganization(
		organizationId: string,
		options?: { batchSize?: number },
	): Promise<{ indexed: number; failed: number }> {
		const batchSize = options?.batchSize || 100;
		let indexed = 0;
		let failed = 0;

		// Get all assets for organization
		const totalAssets = await db
			.select({ id: assets.id })
			.from(assets)
			.where(
				and(
					eq(assets.organizationId, organizationId),
					sql`${assets.deletedAt} IS NULL`,
				),
			);

		// Process in batches
		for (let i = 0; i < totalAssets.length; i += batchSize) {
			const batch = totalAssets.slice(i, i + batchSize);

			const results = await Promise.allSettled(
				batch.map((asset) => this.indexAsset(asset.id)),
			);

			results.forEach((result) => {
				if (result.status === "fulfilled") {
					indexed++;
				} else {
					failed++;
					console.error("Failed to index asset:", result.reason);
				}
			});
		}

		return { indexed, failed };
	}

	// Remove asset from search index
	async removeFromIndex(assetId: string): Promise<void> {
		await db
			.delete(assetSearchIndex)
			.where(eq(assetSearchIndex.assetId, assetId));
	}

	// Search suggestions (autocomplete)
	async getSearchSuggestions(
		organizationId: string,
		prefix: string,
		limit: number = 10,
	): Promise<string[]> {
		// Get suggestions from asset titles
		const titleSuggestions = await db
			.select({ title: assets.title })
			.from(assets)
			.where(
				and(
					eq(assets.organizationId, organizationId),
					ilike(assets.title, `${prefix}%`),
					sql`${assets.deletedAt} IS NULL`,
				),
			)
			.limit(limit);

		// Get suggestions from tags
		const tagSuggestions = await db
			.select({ name: tags.name })
			.from(tags)
			.where(
				and(
					eq(tags.organizationId, organizationId),
					ilike(tags.name, `${prefix}%`),
				),
			)
			.limit(limit);

		// Combine and deduplicate
		const allSuggestions = [
			...titleSuggestions.map((s) => s.title),
			...tagSuggestions.map((s) => s.name),
		];

		return [...new Set(allSuggestions)].slice(0, limit);
	}
}

export const searchIndexingService = new SearchIndexingService();
