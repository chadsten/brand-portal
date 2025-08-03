import { relations } from "drizzle-orm";
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

// Asset collections table
export const assetCollections = createTable(
	"asset_collections",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.references(() => organizations.id)
			.notNull(),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),
		slug: varchar("slug", { length: 255 }).notNull(),

		// Collection metadata
		coverAssetId: uuid("cover_asset_id").references(() => assets.id),
		color: varchar("color", { length: 7 }), // Hex color
		icon: varchar("icon", { length: 50 }),

		// Collection settings
		isPublic: boolean("is_public").default(false),
		isTemplate: boolean("is_template").default(false),
		allowContributions: boolean("allow_contributions").default(false),
		sortOrder: varchar("sort_order", { length: 50 }).default("createdAt"),
		sortDirection: varchar("sort_direction", { length: 4 }).default("desc"),

		// Auto-collection rules (optional)
		autoRules: jsonb("auto_rules"), // JSON schema for auto-adding assets

		// Collection metadata
		metadata: jsonb("metadata").default({}),
		tags: jsonb("tags").default([]),

		// Statistics
		assetCount: integer("asset_count").default(0),
		totalSize: integer("total_size").default(0),

		// Access control
		createdBy: uuid("created_by")
			.references(() => users.id)
			.notNull(),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
		deletedAt: timestamp("deleted_at"), // Soft delete
	},
	(t) => [
		index("collections_org_idx").on(t.organizationId),
		index("collections_creator_idx").on(t.createdBy),
		index("collections_slug_idx").on(t.slug),
		index("collections_public_idx").on(t.isPublic),
		index("collections_template_idx").on(t.isTemplate),
		// Unique constraint on organization + slug
		index("collections_org_slug_idx").on(t.organizationId, t.slug),
	],
);

// Collection-asset junction table
export const collectionAssets = createTable(
	"collection_assets",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		collectionId: uuid("collection_id")
			.references(() => assetCollections.id)
			.notNull(),
		assetId: uuid("asset_id")
			.references(() => assets.id)
			.notNull(),

		// Position and metadata
		sortOrder: integer("sort_order").default(0),
		addedBy: uuid("added_by").references(() => users.id),
		addedAt: timestamp("added_at").defaultNow(),

		// Custom metadata for this asset in this collection
		customTitle: varchar("custom_title", { length: 255 }),
		customDescription: text("custom_description"),
		customTags: jsonb("custom_tags").default([]),
		metadata: jsonb("metadata").default({}),
	},
	(t) => [
		index("collection_assets_collection_idx").on(t.collectionId),
		index("collection_assets_asset_idx").on(t.assetId),
		index("collection_assets_sort_idx").on(t.sortOrder),
		// Unique constraint on collection + asset
		index("collection_assets_collection_asset_idx").on(
			t.collectionId,
			t.assetId,
		),
	],
);

// Collection permissions table
export const collectionPermissions = createTable(
	"collection_permissions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		collectionId: uuid("collection_id")
			.references(() => assetCollections.id)
			.notNull(),
		userId: uuid("user_id").references(() => users.id),
		roleId: uuid("role_id"), // Reference to roles table

		// Permissions
		canView: boolean("can_view").default(true),
		canEdit: boolean("can_edit").default(false),
		canAddAssets: boolean("can_add_assets").default(false),
		canRemoveAssets: boolean("can_remove_assets").default(false),
		canManage: boolean("can_manage").default(false), // Full collection management

		createdAt: timestamp("created_at").defaultNow(),
		grantedBy: uuid("granted_by").references(() => users.id),
	},
	(t) => [
		index("collection_permissions_collection_idx").on(t.collectionId),
		index("collection_permissions_user_idx").on(t.userId),
		index("collection_permissions_role_idx").on(t.roleId),
	],
);

// Collection sharing table
export const collectionShares = createTable(
	"collection_shares",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		collectionId: uuid("collection_id")
			.references(() => assetCollections.id)
			.notNull(),

		// Share settings
		shareToken: varchar("share_token", { length: 128 }).unique().notNull(),
		shareType: varchar("share_type", { length: 20 }).default("view"), // 'view', 'download', 'collaborate'
		isPasswordProtected: boolean("is_password_protected").default(false),
		passwordHash: varchar("password_hash", { length: 255 }),

		// Access control
		expiresAt: timestamp("expires_at"),
		maxDownloads: integer("max_downloads"),
		currentDownloads: integer("current_downloads").default(0),
		allowedDomains: jsonb("allowed_domains").default([]),

		// Tracking
		accessCount: integer("access_count").default(0),
		lastAccessedAt: timestamp("last_accessed_at"),

		// Creator info
		createdBy: uuid("created_by")
			.references(() => users.id)
			.notNull(),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),

		// Settings
		allowComments: boolean("allow_comments").default(false),
		allowDownloads: boolean("allow_downloads").default(true),
		showMetadata: boolean("show_metadata").default(true),
		customMessage: text("custom_message"),
	},
	(t) => [
		index("collection_shares_collection_idx").on(t.collectionId),
		index("collection_shares_token_idx").on(t.shareToken),
		index("collection_shares_creator_idx").on(t.createdBy),
	],
);

// Collection activity/history table
export const collectionActivity = createTable(
	"collection_activity",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		collectionId: uuid("collection_id")
			.references(() => assetCollections.id)
			.notNull(),
		userId: uuid("user_id").references(() => users.id),

		// Activity details
		action: varchar("action", { length: 50 }).notNull(), // 'created', 'updated', 'asset_added', 'asset_removed', etc.
		details: jsonb("details").default({}), // Action-specific details
		assetId: uuid("asset_id").references(() => assets.id), // If action relates to specific asset

		// Metadata
		ipAddress: varchar("ip_address", { length: 45 }),
		userAgent: text("user_agent"),
		metadata: jsonb("metadata").default({}),

		createdAt: timestamp("created_at").defaultNow(),
	},
	(t) => [
		index("collection_activity_collection_idx").on(t.collectionId),
		index("collection_activity_user_idx").on(t.userId),
		index("collection_activity_action_idx").on(t.action),
		index("collection_activity_created_idx").on(t.createdAt),
	],
);

// Collection templates table
export const collectionTemplates = createTable(
	"collection_templates",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.references(() => organizations.id)
			.notNull(),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),

		// Template configuration
		config: jsonb("config").notNull(), // Template structure and rules
		previewImage: varchar("preview_image", { length: 500 }),
		category: varchar("category", { length: 100 }).default("general"),

		// Usage stats
		usageCount: integer("usage_count").default(0),

		// Template metadata
		isBuiltIn: boolean("is_built_in").default(false),
		isActive: boolean("is_active").default(true),

		createdBy: uuid("created_by").references(() => users.id),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [
		index("collection_templates_org_idx").on(t.organizationId),
		index("collection_templates_category_idx").on(t.category),
		index("collection_templates_active_idx").on(t.isActive),
	],
);

// Relations
export const assetCollectionsRelations = relations(
	assetCollections,
	({ one, many }) => ({
		organization: one(organizations, {
			fields: [assetCollections.organizationId],
			references: [organizations.id],
		}),
		creator: one(users, {
			fields: [assetCollections.createdBy],
			references: [users.id],
		}),
		coverAsset: one(assets, {
			fields: [assetCollections.coverAssetId],
			references: [assets.id],
		}),
		collectionAssets: many(collectionAssets),
		permissions: many(collectionPermissions),
		shares: many(collectionShares),
		activity: many(collectionActivity),
	}),
);

export const collectionAssetsRelations = relations(
	collectionAssets,
	({ one }) => ({
		collection: one(assetCollections, {
			fields: [collectionAssets.collectionId],
			references: [assetCollections.id],
		}),
		asset: one(assets, {
			fields: [collectionAssets.assetId],
			references: [assets.id],
		}),
		addedByUser: one(users, {
			fields: [collectionAssets.addedBy],
			references: [users.id],
		}),
	}),
);

export const collectionPermissionsRelations = relations(
	collectionPermissions,
	({ one }) => ({
		collection: one(assetCollections, {
			fields: [collectionPermissions.collectionId],
			references: [assetCollections.id],
		}),
		user: one(users, {
			fields: [collectionPermissions.userId],
			references: [users.id],
		}),
		grantedByUser: one(users, {
			fields: [collectionPermissions.grantedBy],
			references: [users.id],
		}),
	}),
);

export const collectionSharesRelations = relations(
	collectionShares,
	({ one }) => ({
		collection: one(assetCollections, {
			fields: [collectionShares.collectionId],
			references: [assetCollections.id],
		}),
		creator: one(users, {
			fields: [collectionShares.createdBy],
			references: [users.id],
		}),
	}),
);

export const collectionActivityRelations = relations(
	collectionActivity,
	({ one }) => ({
		collection: one(assetCollections, {
			fields: [collectionActivity.collectionId],
			references: [assetCollections.id],
		}),
		user: one(users, {
			fields: [collectionActivity.userId],
			references: [users.id],
		}),
		asset: one(assets, {
			fields: [collectionActivity.assetId],
			references: [assets.id],
		}),
	}),
);

export const collectionTemplatesRelations = relations(
	collectionTemplates,
	({ one }) => ({
		organization: one(organizations, {
			fields: [collectionTemplates.organizationId],
			references: [organizations.id],
		}),
		creator: one(users, {
			fields: [collectionTemplates.createdBy],
			references: [users.id],
		}),
	}),
);
