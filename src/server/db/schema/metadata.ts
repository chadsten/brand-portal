import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTableCreator,
	primaryKey,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { assets, organizations, users } from "../schema";

export const createTable = pgTableCreator((name) => `brand_portal_${name}`);

// Tags table - for hierarchical tag management
export const tags = createTable(
	"tags",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.references(() => organizations.id)
			.notNull(),
		name: varchar("name", { length: 100 }).notNull(),
		slug: varchar("slug", { length: 100 }).notNull(),
		parentId: uuid("parent_id"),
		color: varchar("color", { length: 7 }), // Hex color
		icon: varchar("icon", { length: 50 }), // Icon identifier
		description: text("description"),
		metadata: jsonb("metadata").default({}),
		usageCount: integer("usage_count").default(0),
		isSystem: boolean("is_system").default(false), // System-generated tags
		createdBy: uuid("created_by").references(() => users.id),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [
		index("tags_org_idx").on(t.organizationId),
		index("tags_parent_idx").on(t.parentId),
		index("tags_slug_idx").on(t.slug),
		index("tags_name_idx").on(t.name),
		// Unique constraint on org + slug
		// Note: Using named unique() method instead of index().unique()
		index("tags_org_slug_idx").on(t.organizationId, t.slug),
	],
);

// Tag hierarchy self-reference
export const tagRelations = relations(tags, ({ one, many }) => ({
	parent: one(tags, {
		fields: [tags.parentId],
		references: [tags.id],
		relationName: "tagHierarchy",
	}),
	children: many(tags, { relationName: "tagHierarchy" }),
	organization: one(organizations, {
		fields: [tags.organizationId],
		references: [organizations.id],
	}),
	creator: one(users, {
		fields: [tags.createdBy],
		references: [users.id],
	}),
	assetTags: many(assetTags),
}));

// Asset-tag junction table
export const assetTags = createTable(
	"asset_tags",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		assetId: uuid("asset_id")
			.references(() => assets.id)
			.notNull(),
		tagId: uuid("tag_id")
			.references(() => tags.id)
			.notNull(),
		addedBy: uuid("added_by").references(() => users.id),
		confidence: integer("confidence").default(100), // For AI-suggested tags (0-100)
		source: varchar("source", { length: 50 }).default("manual"), // 'manual', 'ai', 'auto', 'system'
		createdAt: timestamp("created_at").defaultNow(),
	},
	(t) => [
		index("asset_tags_asset_idx").on(t.assetId),
		index("asset_tags_tag_idx").on(t.tagId),
		index("asset_tags_source_idx").on(t.source),
		// Unique constraint on asset + tag
		index("asset_tags_asset_tag_idx").on(t.assetId, t.tagId),
	],
);

export const assetTagsRelations = relations(assetTags, ({ one }) => ({
	asset: one(assets, {
		fields: [assetTags.assetId],
		references: [assets.id],
	}),
	tag: one(tags, {
		fields: [assetTags.tagId],
		references: [tags.id],
	}),
	addedByUser: one(users, {
		fields: [assetTags.addedBy],
		references: [users.id],
	}),
}));

// Metadata templates - for consistent metadata across asset types
export const metadataTemplates = createTable(
	"metadata_templates",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.references(() => organizations.id)
			.notNull(),
		name: varchar("name", { length: 100 }).notNull(),
		description: text("description"),
		fileTypes: jsonb("file_types").default([]), // Array of mime types
		schema: jsonb("schema").notNull(), // JSON schema for validation
		defaultValues: jsonb("default_values").default({}),
		isActive: boolean("is_active").default(true),
		createdBy: uuid("created_by").references(() => users.id),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [
		index("metadata_templates_org_idx").on(t.organizationId),
		index("metadata_templates_active_idx").on(t.isActive),
	],
);

export const metadataTemplatesRelations = relations(
	metadataTemplates,
	({ one }) => ({
		organization: one(organizations, {
			fields: [metadataTemplates.organizationId],
			references: [organizations.id],
		}),
		creator: one(users, {
			fields: [metadataTemplates.createdBy],
			references: [users.id],
		}),
	}),
);

// Extended metadata for specific asset types
export const assetMetadata = createTable(
	"asset_metadata",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		assetId: uuid("asset_id")
			.references(() => assets.id)
			.unique()
			.notNull(),

		// Common metadata
		width: integer("width"),
		height: integer("height"),
		duration: integer("duration"), // For videos/audio in seconds
		pageCount: integer("page_count"), // For documents

		// EXIF data for images
		exifData: jsonb("exif_data"),

		// Color data
		dominantColors: jsonb("dominant_colors"), // Array of hex colors
		colorPalette: jsonb("color_palette"),

		// Technical metadata
		codec: varchar("codec", { length: 50 }),
		bitrate: integer("bitrate"),
		frameRate: integer("frame_rate"),
		sampleRate: integer("sample_rate"),
		channels: integer("channels"),

		// Content metadata
		hasTransparency: boolean("has_transparency"),
		isAnimated: boolean("is_animated"),

		// Extracted text (for documents, OCR)
		extractedText: text("extracted_text"),
		language: varchar("language", { length: 10 }),

		// AI-extracted metadata
		aiDescription: text("ai_description"),
		aiTags: jsonb("ai_tags").default([]),
		objects: jsonb("objects"), // Detected objects in images/videos
		faces: jsonb("faces"), // Face detection data
		scenes: jsonb("scenes"), // Scene detection for videos

		// Custom metadata from templates
		customMetadata: jsonb("custom_metadata").default({}),

		// Processing info
		extractedAt: timestamp("extracted_at"),
		extractionVersion: varchar("extraction_version", { length: 20 }),
	},
	(t) => [
		index("asset_metadata_asset_idx").on(t.assetId),
		index("asset_metadata_extracted_idx").on(t.extractedAt),
	],
);

export const assetMetadataRelations = relations(assetMetadata, ({ one }) => ({
	asset: one(assets, {
		fields: [assetMetadata.assetId],
		references: [assets.id],
	}),
}));

// Search index for full-text search
export const assetSearchIndex = createTable(
	"asset_search_index",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		assetId: uuid("asset_id")
			.references(() => assets.id)
			.unique()
			.notNull(),

		// Denormalized searchable fields
		content: text("content"), // Combined searchable text

		// Search metadata
		lastIndexed: timestamp("last_indexed").defaultNow(),
		indexVersion: varchar("index_version", { length: 20 }),
	},
	(t) => [index("asset_search_asset_idx").on(t.assetId)],
);

export const assetSearchIndexRelations = relations(
	assetSearchIndex,
	({ one }) => ({
		asset: one(assets, {
			fields: [assetSearchIndex.assetId],
			references: [assets.id],
		}),
	}),
);

// Tag suggestions and auto-tagging rules
export const autoTagRules = createTable(
	"auto_tag_rules",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.references(() => organizations.id)
			.notNull(),
		name: varchar("name", { length: 100 }).notNull(),
		description: text("description"),

		// Rule conditions
		conditions: jsonb("conditions").notNull(), // JSON schema for conditions

		// Actions
		tagIds: jsonb("tag_ids").default([]), // Tags to apply
		metadata: jsonb("metadata").default({}), // Metadata to apply

		// Rule settings
		priority: integer("priority").default(0),
		isActive: boolean("is_active").default(true),
		applyToExisting: boolean("apply_to_existing").default(false),

		// Stats
		appliedCount: integer("applied_count").default(0),
		lastApplied: timestamp("last_applied"),

		createdBy: uuid("created_by").references(() => users.id),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [
		index("auto_tag_rules_org_idx").on(t.organizationId),
		index("auto_tag_rules_active_idx").on(t.isActive),
		index("auto_tag_rules_priority_idx").on(t.priority),
	],
);

export const autoTagRulesRelations = relations(autoTagRules, ({ one }) => ({
	organization: one(organizations, {
		fields: [autoTagRules.organizationId],
		references: [organizations.id],
	}),
	creator: one(users, {
		fields: [autoTagRules.createdBy],
		references: [users.id],
	}),
}));

// Tag groups for organizing tags
export const tagGroups = createTable(
	"tag_groups",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.references(() => organizations.id)
			.notNull(),
		name: varchar("name", { length: 100 }).notNull(),
		description: text("description"),
		color: varchar("color", { length: 7 }),
		icon: varchar("icon", { length: 50 }),
		sortOrder: integer("sort_order").default(0),
		isExclusive: boolean("is_exclusive").default(false), // Only one tag from group can be applied
		createdBy: uuid("created_by").references(() => users.id),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [
		index("tag_groups_org_idx").on(t.organizationId),
		index("tag_groups_sort_idx").on(t.sortOrder),
	],
);

export const tagGroupsRelations = relations(tagGroups, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [tagGroups.organizationId],
		references: [organizations.id],
	}),
	creator: one(users, {
		fields: [tagGroups.createdBy],
		references: [users.id],
	}),
	groupTags: many(tagGroupMembers),
}));

// Tag group members junction table
export const tagGroupMembers = createTable(
	"tag_group_members",
	{
		groupId: uuid("group_id")
			.references(() => tagGroups.id)
			.notNull(),
		tagId: uuid("tag_id")
			.references(() => tags.id)
			.notNull(),
		sortOrder: integer("sort_order").default(0),
		addedAt: timestamp("added_at").defaultNow(),
	},
	(t) => [
		primaryKey({ columns: [t.groupId, t.tagId] }),
		index("tag_group_members_group_idx").on(t.groupId),
		index("tag_group_members_tag_idx").on(t.tagId),
	],
);

export const tagGroupMembersRelations = relations(
	tagGroupMembers,
	({ one }) => ({
		group: one(tagGroups, {
			fields: [tagGroupMembers.groupId],
			references: [tagGroups.id],
		}),
		tag: one(tags, {
			fields: [tagGroupMembers.tagId],
			references: [tags.id],
		}),
	}),
);
