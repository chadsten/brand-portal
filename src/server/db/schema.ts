import { relations, sql } from "drizzle-orm";
import {
	bigint,
	boolean,
	decimal,
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
import type { AdapterAccount } from "next-auth/adapters";

export const createTable = pgTableCreator((name) => `brand_portal_${name}`);

// Tiers table - defines feature sets and limits
export const tiers = createTable("tiers", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: varchar("name", { length: 50 }).unique().notNull(),
	displayName: varchar("display_name", { length: 100 }).notNull(),

	limits: jsonb("limits").notNull().default({
		maxUsers: 10,
		maxAssets: 1000,
		maxStorageGB: 10,
		maxFileSizeMB: 100,
		maxAssetGroups: 50,
	}),

	features: jsonb("features").notNull().default({
		customS3: false,
		passwordProtectedSharing: false,
		colorPalettes: false,
		fontManagement: false,
		advancedAnalytics: false,
		apiAccess: false,
		customBranding: false,
		ssoIntegration: false,
	}),

	monthlyPriceUSD: decimal("monthly_price_usd", { precision: 10, scale: 2 }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at").defaultNow(),
});

// Organizations table - multi-tenant core
export const organizations = createTable(
	"organizations",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		name: varchar("name", { length: 255 }).notNull(),
		slug: varchar("slug", { length: 255 }).unique().notNull(),

		tierId: uuid("tier_id")
			.references(() => tiers.id)
			.notNull(),
		tierOverrides: jsonb("tier_overrides").default({}),

		logoUrl: varchar("logo_url", { length: 500 }),
		primaryColor: varchar("primary_color", { length: 7 }),
		secondaryColor: varchar("secondary_color", { length: 7 }),
		customDomain: varchar("custom_domain", { length: 255 }),

		settings: jsonb("settings").default({
			allowPublicSharing: true,
			requireMfa: false,
			allowedDomains: [],
			defaultUserRole: "user",
		}),

		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
		deletedAt: timestamp("deleted_at"),
		createdBy: uuid("created_by"),
	},
	(t) => [index("org_slug_idx").on(t.slug), index("org_tier_idx").on(t.tierId)],
);

// Users table - enhanced for Brand Portal
export const users = createTable(
	"users",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		email: varchar("email", { length: 255 }).unique().notNull(),
		password: varchar("password", { length: 255 }),
		name: varchar("name", { length: 255 }),
		image: varchar("image", { length: 255 }),
		organizationId: uuid("organization_id").references(() => organizations.id),
		provider: varchar("provider", { length: 50 }),
		providerId: varchar("provider_id", { length: 255 }),
		emailVerified: timestamp("email_verified"),
		isSuperAdmin: boolean("is_super_admin").default(false),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [
		index("user_email_idx").on(t.email),
		index("user_org_idx").on(t.organizationId),
		index("user_super_admin_idx").on(t.isSuperAdmin),
	],
);

// Roles table
export const roles = createTable("roles", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: varchar("name", { length: 50 }).unique().notNull(),
	permissions: jsonb("permissions"),
	createdAt: timestamp("created_at").defaultNow(),
});

// User-role junction table
export const userRoles = createTable(
	"user_roles",
	{
		userId: uuid("user_id")
			.references(() => users.id)
			.notNull(),
		roleId: uuid("role_id")
			.references(() => roles.id)
			.notNull(),
		grantedAt: timestamp("granted_at").defaultNow(),
		grantedBy: uuid("granted_by").references(() => users.id),
	},
	(t) => [
		primaryKey({ columns: [t.userId, t.roleId] }),
		index("user_roles_user_idx").on(t.userId),
		index("user_roles_role_idx").on(t.roleId),
	],
);

// Usage metrics table
export const usageMetrics = createTable(
	"usage_metrics",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.references(() => organizations.id)
			.notNull(),

		totalAssets: integer("total_assets").default(0),
		totalStorageBytes: bigint("total_storage_bytes", {
			mode: "number",
		}).default(0),
		totalUsers: integer("total_users").default(0),
		totalAssetGroups: integer("total_asset_groups").default(0),

		monthlyDownloads: integer("monthly_downloads").default(0),
		monthlyUploads: integer("monthly_uploads").default(0),
		monthlyActiveUsers: integer("monthly_active_users").default(0),

		calculatedAt: timestamp("calculated_at").defaultNow(),
		month: varchar("month", { length: 7 }),
	},
	(t) => [
		index("usage_org_idx").on(t.organizationId),
		index("usage_month_idx").on(t.month),
	],
);

// NextAuth tables (kept for compatibility)
export const accounts = createTable(
	"account",
	{
		userId: uuid("user_id")
			.references(() => users.id)
			.notNull(),
		type: varchar("type", { length: 255 })
			.$type<AdapterAccount["type"]>()
			.notNull(),
		provider: varchar("provider", { length: 255 }).notNull(),
		providerAccountId: varchar("provider_account_id", {
			length: 255,
		}).notNull(),
		refresh_token: text("refresh_token"),
		access_token: text("access_token"),
		expires_at: integer("expires_at"),
		token_type: varchar("token_type", { length: 255 }),
		scope: varchar("scope", { length: 255 }),
		id_token: text("id_token"),
		session_state: varchar("session_state", { length: 255 }),
	},
	(t) => [
		primaryKey({ columns: [t.provider, t.providerAccountId] }),
		index("account_user_id_idx").on(t.userId),
	],
);

export const sessions = createTable(
	"session",
	{
		sessionToken: varchar("session_token", { length: 255 })
			.notNull()
			.primaryKey(),
		userId: uuid("user_id")
			.references(() => users.id)
			.notNull(),
		expires: timestamp("expires", {
			mode: "date",
			withTimezone: true,
		}).notNull(),
	},
	(t) => [index("session_user_id_idx").on(t.userId)],
);

export const verificationTokens = createTable(
	"verification_token",
	{
		identifier: varchar("identifier", { length: 255 }).notNull(),
		token: varchar("token", { length: 255 }).notNull(),
		expires: timestamp("expires", {
			mode: "date",
			withTimezone: true,
		}).notNull(),
	},
	(t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// Relations
export const tiersRelations = relations(tiers, ({ many }) => ({
	organizations: many(organizations),
}));

export const organizationsRelations = relations(
	organizations,
	({ one, many }) => ({
		tier: one(tiers, {
			fields: [organizations.tierId],
			references: [tiers.id],
		}),
		users: many(users),
		usageMetrics: many(usageMetrics),
	}),
);

export const usersRelations = relations(users, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [users.organizationId],
		references: [organizations.id],
	}),
	accounts: many(accounts),
	sessions: many(sessions),
	userRoles: many(userRoles),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
	userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
	user: one(users, { fields: [userRoles.userId], references: [users.id] }),
	role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const usageMetricsRelations = relations(usageMetrics, ({ one }) => ({
	organization: one(organizations, {
		fields: [usageMetrics.organizationId],
		references: [organizations.id],
	}),
}));

// Storage configurations table - for custom S3 support
export const storageConfigs = createTable(
	"storage_configs",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.references(() => organizations.id)
			.unique()
			.notNull(),

		provider: varchar("provider", { length: 50 }).notNull(), // 'aws', 'gcs', 'azure', 'minio'
		bucketName: varchar("bucket_name", { length: 255 }),
		region: varchar("region", { length: 50 }),
		endpoint: varchar("endpoint", { length: 500 }), // For custom S3-compatible endpoints
		accessKeyId: varchar("access_key_id", { length: 255 }), // Encrypted
		secretAccessKey: text("secret_access_key"), // Encrypted
		customDomain: varchar("custom_domain", { length: 255 }),

		// Configuration options
		config: jsonb("config").default({
			forcePathStyle: false,
			signatureVersion: "v4",
			publicRead: false,
		}),

		isActive: boolean("is_active").default(true),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [index("storage_config_org_idx").on(t.organizationId)],
);

// Assets table - core asset management
export const assets = createTable(
	"assets",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.references(() => organizations.id)
			.notNull(),
		uploadedBy: uuid("uploaded_by")
			.references(() => users.id)
			.notNull(),

		// File information
		fileName: varchar("file_name", { length: 255 }).notNull(),
		originalFileName: varchar("original_file_name", { length: 255 }).notNull(),
		fileType: varchar("file_type", { length: 50 }).notNull(),
		mimeType: varchar("mime_type", { length: 100 }).notNull(),
		fileSize: bigint("file_size", { mode: "number" }).notNull(),

		// Storage
		storageKey: varchar("storage_key", { length: 500 }).unique().notNull(),
		thumbnailKey: varchar("thumbnail_key", { length: 500 }),
		storageProvider: varchar("storage_provider", { length: 50 }).default(
			"default",
		), // 'default' or 'custom'

		// Metadata
		title: varchar("title", { length: 255 }).notNull(),
		description: text("description"),
		tags: jsonb("tags").default([]),
		metadata: jsonb("metadata").default({}),

		// Processing status
		processingStatus: varchar("processing_status", { length: 50 }).default(
			"pending",
		), // 'pending', 'processing', 'completed', 'failed'
		processingError: text("processing_error"),

		// Timestamps
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
		deletedAt: timestamp("deleted_at"), // Soft delete
	},
	(t) => [
		index("assets_org_idx").on(t.organizationId),
		index("assets_uploader_idx").on(t.uploadedBy),
		index("assets_type_idx").on(t.fileType),
		index("assets_created_idx").on(t.createdAt),
		index("assets_storage_key_idx").on(t.storageKey),
	],
);

// Asset versions table
export const assetVersions = createTable(
	"asset_versions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		assetId: uuid("asset_id")
			.references(() => assets.id)
			.notNull(),
		versionNumber: integer("version_number").notNull(),
		uploadedBy: uuid("uploaded_by")
			.references(() => users.id)
			.notNull(),

		// Version specific data
		storageKey: varchar("storage_key", { length: 500 }).unique().notNull(),
		fileSize: bigint("file_size", { mode: "number" }).notNull(),
		changeLog: text("change_log"),

		createdAt: timestamp("created_at").defaultNow(),
	},
	(t) => [
		index("asset_versions_asset_idx").on(t.assetId),
		index("asset_versions_version_idx").on(t.versionNumber),
	],
);

// Asset permissions table
export const assetPermissions = createTable(
	"asset_permissions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		assetId: uuid("asset_id")
			.references(() => assets.id)
			.notNull(),
		roleId: uuid("role_id").references(() => roles.id),
		userId: uuid("user_id").references(() => users.id),

		canView: boolean("can_view").default(true),
		canDownload: boolean("can_download").default(true),
		canEdit: boolean("can_edit").default(false),
		canDelete: boolean("can_delete").default(false),

		createdAt: timestamp("created_at").defaultNow(),
	},
	(t) => [
		index("asset_permissions_asset_idx").on(t.assetId),
		index("asset_permissions_role_idx").on(t.roleId),
		index("asset_permissions_user_idx").on(t.userId),
	],
);

// Storage configurations relations
export const storageConfigsRelations = relations(storageConfigs, ({ one }) => ({
	organization: one(organizations, {
		fields: [storageConfigs.organizationId],
		references: [organizations.id],
	}),
}));

// Assets relations
export const assetsRelations = relations(assets, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [assets.organizationId],
		references: [organizations.id],
	}),
	uploader: one(users, { fields: [assets.uploadedBy], references: [users.id] }),
	versions: many(assetVersions),
	permissions: many(assetPermissions),
}));

export const assetVersionsRelations = relations(assetVersions, ({ one }) => ({
	asset: one(assets, {
		fields: [assetVersions.assetId],
		references: [assets.id],
	}),
	uploader: one(users, {
		fields: [assetVersions.uploadedBy],
		references: [users.id],
	}),
}));

export const assetPermissionsRelations = relations(
	assetPermissions,
	({ one }) => ({
		asset: one(assets, {
			fields: [assetPermissions.assetId],
			references: [assets.id],
		}),
		role: one(roles, {
			fields: [assetPermissions.roleId],
			references: [roles.id],
		}),
		user: one(users, {
			fields: [assetPermissions.userId],
			references: [users.id],
		}),
	}),
);

// Export collections schema tables
export * from "./schema/collections";
// Export metadata schema tables
export * from "./schema/metadata";
