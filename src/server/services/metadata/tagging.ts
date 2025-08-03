import { TRPCError } from "@trpc/server";
import { and, eq, ilike, inArray, isNull, sql } from "drizzle-orm";
import slugify from "slugify";
import { db } from "~/server/db";
import {
	assets,
	assetTags,
	autoTagRules,
	organizations,
	tagGroupMembers,
	tagGroups,
	tags,
} from "~/server/db/schema";

export interface TagHierarchy {
	id: string;
	name: string;
	slug: string;
	color?: string;
	icon?: string;
	description?: string;
	usageCount: number;
	children: TagHierarchy[];
}

export interface TagSuggestion {
	tagId: string;
	name: string;
	confidence: number;
	source: "manual" | "ai" | "auto" | "system";
	reason?: string;
}

export interface AutoTagCondition {
	field: string;
	operator:
		| "equals"
		| "contains"
		| "startsWith"
		| "endsWith"
		| "regex"
		| "gt"
		| "lt";
	value: any;
	caseSensitive?: boolean;
}

export interface AutoTagRule {
	id: string;
	name: string;
	conditions: {
		all?: AutoTagCondition[];
		any?: AutoTagCondition[];
	};
	tagIds: string[];
	metadata?: Record<string, any>;
}

export class TaggingService {
	// Create a new tag
	async createTag(
		organizationId: string,
		data: {
			name: string;
			parentId?: string;
			color?: string;
			icon?: string;
			description?: string;
			metadata?: Record<string, any>;
		},
		createdBy: string,
	): Promise<typeof tags.$inferSelect> {
		// Generate slug
		const baseSlug = slugify(data.name, { lower: true, strict: true });

		// Check for existing slug and make unique if necessary
		let slug = baseSlug;
		let counter = 1;
		while (true) {
			const existing = await db.query.tags.findFirst({
				where: and(
					eq(tags.organizationId, organizationId),
					eq(tags.slug, slug),
				),
			});

			if (!existing) break;
			slug = `${baseSlug}-${counter}`;
			counter++;
		}

		// Validate parent tag if provided
		if (data.parentId) {
			const parentTag = await db.query.tags.findFirst({
				where: and(
					eq(tags.id, data.parentId),
					eq(tags.organizationId, organizationId),
				),
			});

			if (!parentTag) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Parent tag not found",
				});
			}
		}

		const [newTag] = await db
			.insert(tags)
			.values({
				organizationId,
				name: data.name,
				slug,
				parentId: data.parentId,
				color: data.color,
				icon: data.icon,
				description: data.description,
				metadata: data.metadata || {},
				createdBy,
			})
			.returning();

		return newTag!;
	}

	// Get tag hierarchy for organization
	async getTagHierarchy(organizationId: string): Promise<TagHierarchy[]> {
		// Get all tags for the organization
		const allTags = await db.query.tags.findMany({
			where: eq(tags.organizationId, organizationId),
			with: {
				assetTags: true,
			},
		});

		// Build hierarchy
		const tagMap = new Map<string, TagHierarchy>();
		const rootTags: TagHierarchy[] = [];

		// First pass: create all tag nodes
		allTags.forEach((tag) => {
			tagMap.set(tag.id, {
				id: tag.id,
				name: tag.name,
				slug: tag.slug,
				color: tag.color || undefined,
				icon: tag.icon || undefined,
				description: tag.description || undefined,
				usageCount: tag.assetTags.length,
				children: [],
			});
		});

		// Second pass: build hierarchy
		allTags.forEach((tag) => {
			const tagNode = tagMap.get(tag.id)!;

			if (tag.parentId) {
				const parentNode = tagMap.get(tag.parentId);
				if (parentNode) {
					parentNode.children.push(tagNode);
				} else {
					// Parent not found, treat as root
					rootTags.push(tagNode);
				}
			} else {
				rootTags.push(tagNode);
			}
		});

		// Sort by usage count and name
		const sortTags = (tags: TagHierarchy[]) => {
			tags.sort((a, b) => {
				if (b.usageCount !== a.usageCount) {
					return b.usageCount - a.usageCount;
				}
				return a.name.localeCompare(b.name);
			});

			tags.forEach((tag) => sortTags(tag.children));
		};

		sortTags(rootTags);
		return rootTags;
	}

	// Apply tags to an asset
	async applyTags(
		assetId: string,
		tagIds: string[],
		addedBy: string,
		source: "manual" | "ai" | "auto" | "system" = "manual",
		confidence: number = 100,
	): Promise<void> {
		// Validate asset exists
		const asset = await db.query.assets.findFirst({
			where: eq(assets.id, assetId),
		});

		if (!asset) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Asset not found",
			});
		}

		// Validate all tags exist and belong to the organization
		const validTags = await db.query.tags.findMany({
			where: and(
				inArray(tags.id, tagIds),
				eq(tags.organizationId, asset.organizationId),
			),
		});

		if (validTags.length !== tagIds.length) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "One or more tags are invalid",
			});
		}

		// Check for exclusive tag groups
		const tagGroupMemberships = await db.query.tagGroupMembers.findMany({
			where: inArray(tagGroupMembers.tagId, tagIds),
			with: {
				group: true,
			},
		});

		// Group tags by their groups
		const exclusiveGroups = new Map<string, string[]>();
		tagGroupMemberships.forEach((membership) => {
			if (membership.group.isExclusive) {
				const groupTags = exclusiveGroups.get(membership.groupId) || [];
				groupTags.push(membership.tagId);
				exclusiveGroups.set(membership.groupId, groupTags);
			}
		});

		// Check if multiple tags from exclusive groups
		for (const [groupId, groupTagIds] of exclusiveGroups) {
			if (groupTagIds.length > 1) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot apply multiple tags from an exclusive group",
				});
			}
		}

		// Remove existing tags from exclusive groups if applying new ones
		if (exclusiveGroups.size > 0) {
			const exclusiveGroupIds = Array.from(exclusiveGroups.keys());

			// Get all tags in these exclusive groups
			const allExclusiveGroupTags = await db.query.tagGroupMembers.findMany({
				where: inArray(tagGroupMembers.groupId, exclusiveGroupIds),
			});

			const tagsToRemove = allExclusiveGroupTags
				.map((m) => m.tagId)
				.filter((tagId) => !tagIds.includes(tagId));

			if (tagsToRemove.length > 0) {
				await db
					.delete(assetTags)
					.where(
						and(
							eq(assetTags.assetId, assetId),
							inArray(assetTags.tagId, tagsToRemove),
						),
					);
			}
		}

		// Apply tags (upsert to handle duplicates)
		for (const tagId of tagIds) {
			await db
				.insert(assetTags)
				.values({
					assetId,
					tagId,
					addedBy,
					source,
					confidence,
				})
				.onConflictDoUpdate({
					target: [assetTags.assetId, assetTags.tagId],
					set: {
						addedBy,
						source,
						confidence,
						createdAt: new Date(),
					},
				});
		}

		// Update tag usage counts
		await this.updateTagUsageCounts(tagIds);

		// Update asset's tags field for quick access
		const updatedTags = await db.query.assetTags.findMany({
			where: eq(assetTags.assetId, assetId),
			with: {
				tag: true,
			},
		});

		const tagNames = updatedTags.map((at) => at.tag.name);
		await db
			.update(assets)
			.set({
				tags: tagNames,
				updatedAt: new Date(),
			})
			.where(eq(assets.id, assetId));
	}

	// Remove tags from an asset
	async removeTags(assetId: string, tagIds: string[]): Promise<void> {
		await db
			.delete(assetTags)
			.where(
				and(eq(assetTags.assetId, assetId), inArray(assetTags.tagId, tagIds)),
			);

		// Update tag usage counts
		await this.updateTagUsageCounts(tagIds);

		// Update asset's tags field
		const remainingTags = await db.query.assetTags.findMany({
			where: eq(assetTags.assetId, assetId),
			with: {
				tag: true,
			},
		});

		const tagNames = remainingTags.map((at) => at.tag.name);
		await db
			.update(assets)
			.set({
				tags: tagNames,
				updatedAt: new Date(),
			})
			.where(eq(assets.id, assetId));
	}

	// Update tag usage counts
	private async updateTagUsageCounts(tagIds: string[]): Promise<void> {
		for (const tagId of tagIds) {
			const [count] = await db
				.select({ count: sql<number>`count(*)::integer` })
				.from(assetTags)
				.where(eq(assetTags.tagId, tagId));

			await db
				.update(tags)
				.set({
					usageCount: count?.count || 0,
					updatedAt: new Date(),
				})
				.where(eq(tags.id, tagId));
		}
	}

	// Get tag suggestions for an asset
	async getTagSuggestions(
		assetId: string,
		options?: {
			limit?: number;
			includeAI?: boolean;
			includeAutoRules?: boolean;
		},
	): Promise<TagSuggestion[]> {
		const suggestions: TagSuggestion[] = [];
		const limit = options?.limit || 10;

		// Get asset details
		const asset = await db.query.assets.findFirst({
			where: eq(assets.id, assetId),
			// TODO: Fix with clauses - assetTags and metadata relations need to be properly defined
			// with: {
			// 	assetTags: {
			// 		with: {
			// 			tag: true,
			// 		},
			// 	},
			// 	metadata: true,
			// },
		});

		if (!asset) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Asset not found",
			});
		}

		// TODO: Load existing tags separately when relation is fixed
		// Get existing tag IDs to exclude
		const existingTagIds: string[] = []; // asset.assetTags.map(at => at.tagId);

		// 1. Suggest based on file type
		const fileTypeTags = await this.suggestByFileType(
			asset.fileType,
			asset.organizationId,
			existingTagIds,
		);
		suggestions.push(...fileTypeTags);

		// 2. Suggest based on similar assets
		if (existingTagIds.length > 0) {
			const similarAssetTags = await this.suggestBySimilarAssets(
				assetId,
				existingTagIds,
				asset.organizationId,
			);
			suggestions.push(...similarAssetTags);
		}

		// 3. Apply auto-tagging rules
		if (options?.includeAutoRules) {
			const autoRuleTags = await this.applyAutoTagRules(asset);
			suggestions.push(...autoRuleTags);
		}

		// 4. AI-based suggestions (placeholder)
		if (options?.includeAI && asset.metadata) {
			const aiTags = await this.suggestByAI(asset);
			suggestions.push(...aiTags);
		}

		// Sort by confidence and deduplicate
		const uniqueSuggestions = new Map<string, TagSuggestion>();
		suggestions.forEach((suggestion) => {
			const existing = uniqueSuggestions.get(suggestion.tagId);
			if (!existing || existing.confidence < suggestion.confidence) {
				uniqueSuggestions.set(suggestion.tagId, suggestion);
			}
		});

		return Array.from(uniqueSuggestions.values())
			.sort((a, b) => b.confidence - a.confidence)
			.slice(0, limit);
	}

	// Suggest tags based on file type
	private async suggestByFileType(
		fileType: string,
		organizationId: string,
		excludeIds: string[],
	): Promise<TagSuggestion[]> {
		// Map file types to common tags
		const fileTypeTagMap: Record<string, string[]> = {
			image: ["photo", "image", "graphic"],
			video: ["video", "footage", "clip"],
			pdf: ["document", "pdf", "printable"],
			doc: ["document", "word", "text"],
			xls: ["spreadsheet", "excel", "data"],
		};

		const suggestedNames = fileTypeTagMap[fileType] || [];
		if (suggestedNames.length === 0) return [];

		const matchingTags = await db.query.tags.findMany({
			where: and(
				eq(tags.organizationId, organizationId),
				inArray(tags.name, suggestedNames),
				excludeIds.length > 0
					? sql`${tags.id} NOT IN (${sql.join(excludeIds, sql`, `)})`
					: undefined,
			),
		});

		return matchingTags.map((tag) => ({
			tagId: tag.id,
			name: tag.name,
			confidence: 80,
			source: "system" as const,
			reason: `Common tag for ${fileType} files`,
		}));
	}

	// Suggest tags based on similar assets
	private async suggestBySimilarAssets(
		assetId: string,
		existingTagIds: string[],
		organizationId: string,
	): Promise<TagSuggestion[]> {
		// Find assets with similar tags
		const similarAssets = await db
			.select({
				tagId: assetTags.tagId,
				tagName: tags.name,
				count: sql<number>`count(distinct ${assetTags.assetId})::integer`,
			})
			.from(assetTags)
			.innerJoin(tags, eq(assetTags.tagId, tags.id))
			.where(
				and(
					sql`${assetTags.assetId} IN (
						SELECT DISTINCT asset_id 
						FROM ${assetTags} 
						WHERE tag_id = ANY(${existingTagIds})
						AND asset_id != ${assetId}
					)`,
					sql`${assetTags.tagId} NOT IN (${sql.join(existingTagIds, sql`, `)})`,
					eq(tags.organizationId, organizationId),
				),
			)
			.groupBy(assetTags.tagId, tags.name)
			.orderBy(sql`count(distinct ${assetTags.assetId}) DESC`)
			.limit(5);

		return similarAssets.map((result) => ({
			tagId: result.tagId,
			name: result.tagName,
			confidence: Math.min(90, 50 + result.count * 5),
			source: "auto" as const,
			reason: `Used by ${result.count} similar assets`,
		}));
	}

	// Apply auto-tagging rules
	private async applyAutoTagRules(asset: any): Promise<TagSuggestion[]> {
		const rules = await db.query.autoTagRules.findMany({
			where: and(
				eq(autoTagRules.organizationId, asset.organizationId),
				eq(autoTagRules.isActive, true),
			),
			orderBy: [autoTagRules.priority],
		});

		const suggestions: TagSuggestion[] = [];

		for (const rule of rules) {
			const conditions = rule.conditions as {
				all?: AutoTagCondition[];
				any?: AutoTagCondition[];
			};

			let matches = true;

			// Check "all" conditions
			if (conditions.all) {
				matches = conditions.all.every((condition) =>
					this.evaluateCondition(asset, condition),
				);
			}

			// Check "any" conditions
			if (matches && conditions.any) {
				matches = conditions.any.some((condition) =>
					this.evaluateCondition(asset, condition),
				);
			}

			if (matches) {
				const ruleTags = await db.query.tags.findMany({
					where: inArray(tags.id, rule.tagIds as string[]),
				});

				suggestions.push(
					...ruleTags.map((tag) => ({
						tagId: tag.id,
						name: tag.name,
						confidence: 85,
						source: "auto" as const,
						reason: `Matched rule: ${rule.name}`,
					})),
				);

				// Update rule stats
				await db
					.update(autoTagRules)
					.set({
						appliedCount: sql`${autoTagRules.appliedCount} + 1`,
						lastApplied: new Date(),
					})
					.where(eq(autoTagRules.id, rule.id));
			}
		}

		return suggestions;
	}

	// Evaluate a single condition
	private evaluateCondition(asset: any, condition: AutoTagCondition): boolean {
		const value = this.getFieldValue(asset, condition.field);
		const conditionValue = condition.value;

		switch (condition.operator) {
			case "equals":
				return value === conditionValue;
			case "contains":
				return String(value).includes(String(conditionValue));
			case "startsWith":
				return String(value).startsWith(String(conditionValue));
			case "endsWith":
				return String(value).endsWith(String(conditionValue));
			case "regex":
				return new RegExp(conditionValue).test(String(value));
			case "gt":
				return Number(value) > Number(conditionValue);
			case "lt":
				return Number(value) < Number(conditionValue);
			default:
				return false;
		}
	}

	// Get field value from asset
	private getFieldValue(asset: any, field: string): any {
		const parts = field.split(".");
		let value = asset;

		for (const part of parts) {
			value = value?.[part];
			if (value === undefined) break;
		}

		return value;
	}

	// AI-based tag suggestions (placeholder)
	private async suggestByAI(asset: any): Promise<TagSuggestion[]> {
		// TODO: Implement AI-based suggestions
		// This would use:
		// - Image recognition for images
		// - OCR and NLP for documents
		// - Audio/video analysis for media files

		const suggestions: TagSuggestion[] = [];

		// For now, return AI tags from metadata if available
		if (asset.metadata?.aiTags) {
			const aiTagNames = asset.metadata.aiTags as string[];

			// Find or create these tags
			for (const tagName of aiTagNames) {
				const existingTag = await db.query.tags.findFirst({
					where: and(
						eq(tags.organizationId, asset.organizationId),
						eq(tags.name, tagName),
					),
				});

				if (existingTag) {
					suggestions.push({
						tagId: existingTag.id,
						name: existingTag.name,
						confidence: 75,
						source: "ai",
						reason: "AI-detected content",
					});
				}
			}
		}

		return suggestions;
	}

	// Create tag group
	async createTagGroup(
		organizationId: string,
		data: {
			name: string;
			description?: string;
			color?: string;
			icon?: string;
			isExclusive?: boolean;
			tagIds?: string[];
		},
		createdBy: string,
	): Promise<typeof tagGroups.$inferSelect> {
		const [group] = await db
			.insert(tagGroups)
			.values({
				organizationId,
				name: data.name,
				description: data.description,
				color: data.color,
				icon: data.icon,
				isExclusive: data.isExclusive || false,
				createdBy,
			})
			.returning();

		// Add tags to group if provided
		if (data.tagIds && data.tagIds.length > 0) {
			await this.addTagsToGroup(group!.id, data.tagIds);
		}

		return group!;
	}

	// Add tags to a group
	async addTagsToGroup(groupId: string, tagIds: string[]): Promise<void> {
		const values = tagIds.map((tagId, index) => ({
			groupId,
			tagId,
			sortOrder: index,
		}));

		await db.insert(tagGroupMembers).values(values).onConflictDoNothing();
	}

	// Search tags
	async searchTags(
		organizationId: string,
		query: string,
		options?: {
			limit?: number;
			parentId?: string;
			excludeIds?: string[];
		},
	): Promise<(typeof tags.$inferSelect)[]> {
		const conditions = [
			eq(tags.organizationId, organizationId),
			ilike(tags.name, `%${query}%`),
		];

		if (options?.parentId) {
			conditions.push(eq(tags.parentId, options.parentId));
		}

		if (options?.excludeIds && options.excludeIds.length > 0) {
			conditions.push(
				sql`${tags.id} NOT IN (${sql.join(options.excludeIds, sql`, `)})`,
			);
		}

		return await db.query.tags.findMany({
			where: and(...conditions),
			orderBy: [tags.usageCount],
			limit: options?.limit || 20,
		});
	}
}

export const taggingService = new TaggingService();
