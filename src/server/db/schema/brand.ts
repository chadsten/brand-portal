import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTableCreator,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { assets, organizations, users } from "../schema";

export const createTable = pgTableCreator((name) => `brand_portal_${name}`);

// Brand guidelines table
export const brandGuidelines = createTable(
	"brand_guidelines",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.references(() => organizations.id)
			.notNull(),

		// Basic information
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),
		version: varchar("version", { length: 50 }).default("1.0.0"),

		// Brand identity
		primaryColors: jsonb("primary_colors").default([]), // Array of hex colors
		secondaryColors: jsonb("secondary_colors").default([]),
		fonts: jsonb("fonts").default([]), // Font families and rules
		logoVariations: jsonb("logo_variations").default([]), // Logo asset references

		// Usage rules
		colorRules: jsonb("color_rules").default({}), // Color usage guidelines
		typographyRules: jsonb("typography_rules").default({}),
		logoRules: jsonb("logo_rules").default({}),
		spacingRules: jsonb("spacing_rules").default({}),

		// Asset requirements
		requiredAssets: jsonb("required_assets").default([]), // Required brand assets
		forbiddenElements: jsonb("forbidden_elements").default([]), // Prohibited usage

		// Compliance settings
		isActive: boolean("is_active").default(true),
		enforceCompliance: boolean("enforce_compliance").default(false),
		autoApproval: boolean("auto_approval").default(false),

		// Metadata
		tags: jsonb("tags").default([]),
		metadata: jsonb("metadata").default({}),

		// Audit trail
		createdBy: uuid("created_by")
			.references(() => users.id)
			.notNull(),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
		approvedBy: uuid("approved_by").references(() => users.id),
		approvedAt: timestamp("approved_at"),
	},
	(t) => [
		index("brand_guidelines_org_idx").on(t.organizationId),
		index("brand_guidelines_active_idx").on(t.isActive),
		index("brand_guidelines_creator_idx").on(t.createdBy),
		index("brand_guidelines_version_idx").on(t.version),
	],
);

// Brand asset approval workflow
export const brandApprovals = createTable(
	"brand_approvals",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.references(() => organizations.id)
			.notNull(),
		assetId: uuid("asset_id")
			.references(() => assets.id)
			.notNull(),
		guidelineId: uuid("guideline_id")
			.references(() => brandGuidelines.id)
			.notNull(),

		// Approval status
		status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected, revision_required
		priority: varchar("priority", { length: 10 }).default("normal"), // low, normal, high, urgent

		// Review details
		submittedBy: uuid("submitted_by")
			.references(() => users.id)
			.notNull(),
		assignedTo: uuid("assigned_to").references(() => users.id),
		reviewedBy: uuid("reviewed_by").references(() => users.id),

		// Compliance check results
		complianceScore: integer("compliance_score"), // 0-100
		complianceReport: jsonb("compliance_report").default({}),
		autoComplianceCheck: boolean("auto_compliance_check").default(true),

		// Review feedback
		reviewNotes: text("review_notes"),
		rejectionReason: text("rejection_reason"),
		revisionRequests: jsonb("revision_requests").default([]),

		// Timeline
		submittedAt: timestamp("submitted_at").defaultNow(),
		assignedAt: timestamp("assigned_at"),
		reviewedAt: timestamp("reviewed_at"),
		deadline: timestamp("deadline"),

		// Metadata
		metadata: jsonb("metadata").default({}),

		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [
		index("brand_approvals_org_idx").on(t.organizationId),
		index("brand_approvals_asset_idx").on(t.assetId),
		index("brand_approvals_guideline_idx").on(t.guidelineId),
		index("brand_approvals_status_idx").on(t.status),
		index("brand_approvals_submitted_idx").on(t.submittedBy),
		index("brand_approvals_assigned_idx").on(t.assignedTo),
		index("brand_approvals_deadline_idx").on(t.deadline),
	],
);

// Brand compliance violations
export const brandViolations = createTable(
	"brand_violations",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.references(() => organizations.id)
			.notNull(),
		assetId: uuid("asset_id")
			.references(() => assets.id)
			.notNull(),
		guidelineId: uuid("guideline_id")
			.references(() => brandGuidelines.id)
			.notNull(),
		approvalId: uuid("approval_id").references(() => brandApprovals.id),

		// Violation details
		violationType: varchar("violation_type", { length: 50 }).notNull(), // color, typography, logo, spacing, etc.
		severity: varchar("severity", { length: 10 }).default("medium"), // low, medium, high, critical
		description: text("description").notNull(),

		// Detection
		detectedBy: varchar("detected_by", { length: 20 }).default("automatic"), // automatic, manual, user_report
		detectorUserId: uuid("detector_user_id").references(() => users.id),

		// Violation specifics
		violationData: jsonb("violation_data").default({}), // Specific violation details
		suggestedFix: text("suggested_fix"),

		// Resolution
		status: varchar("status", { length: 20 }).default("open"), // open, acknowledged, fixed, dismissed
		resolvedBy: uuid("resolved_by").references(() => users.id),
		resolvedAt: timestamp("resolved_at"),
		resolutionNotes: text("resolution_notes"),

		// Metadata
		metadata: jsonb("metadata").default({}),

		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [
		index("brand_violations_org_idx").on(t.organizationId),
		index("brand_violations_asset_idx").on(t.assetId),
		index("brand_violations_guideline_idx").on(t.guidelineId),
		index("brand_violations_type_idx").on(t.violationType),
		index("brand_violations_severity_idx").on(t.severity),
		index("brand_violations_status_idx").on(t.status),
		index("brand_violations_detected_idx").on(t.detectedBy),
	],
);

// Brand asset usage tracking
export const brandUsageTracking = createTable(
	"brand_usage_tracking",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.references(() => organizations.id)
			.notNull(),
		assetId: uuid("asset_id")
			.references(() => assets.id)
			.notNull(),
		userId: uuid("user_id")
			.references(() => users.id)
			.notNull(),

		// Usage context
		usageType: varchar("usage_type", { length: 50 }).notNull(), // download, view, share, embed, edit
		usageContext: varchar("usage_context", { length: 100 }), // web, print, social, email, etc.
		platform: varchar("platform", { length: 50 }), // website, instagram, facebook, etc.

		// Compliance status at time of use
		wasCompliant: boolean("was_compliant").default(true),
		complianceVersion: varchar("compliance_version", { length: 50 }),

		// Geographic and demographic data
		country: varchar("country", { length: 2 }), // ISO country code
		region: varchar("region", { length: 100 }),
		userAgent: text("user_agent"),
		ipAddress: varchar("ip_address", { length: 45 }),

		// Usage metadata
		metadata: jsonb("metadata").default({}),

		createdAt: timestamp("created_at").defaultNow(),
	},
	(t) => [
		index("brand_usage_org_idx").on(t.organizationId),
		index("brand_usage_asset_idx").on(t.assetId),
		index("brand_usage_user_idx").on(t.userId),
		index("brand_usage_type_idx").on(t.usageType),
		index("brand_usage_context_idx").on(t.usageContext),
		index("brand_usage_compliant_idx").on(t.wasCompliant),
		index("brand_usage_created_idx").on(t.createdAt),
	],
);

// Brand portal roles and permissions
export const brandRoles = createTable(
	"brand_roles",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.references(() => organizations.id)
			.notNull(),

		// Role definition
		name: varchar("name", { length: 100 }).notNull(),
		description: text("description"),
		color: varchar("color", { length: 7 }).default("#6366f1"), // Hex color
		icon: varchar("icon", { length: 50 }),

		// Permissions
		permissions: jsonb("permissions").notNull(), // Comprehensive permission object

		// Role hierarchy - commented out to avoid circular reference issues
		// parentRoleId: uuid("parent_role_id").references(() => brandRoles.id),
		priority: integer("priority").default(0), // Higher number = higher priority

		// Role settings
		isBuiltIn: boolean("is_built_in").default(false),
		isActive: boolean("is_active").default(true),
		maxUsers: integer("max_users"), // Optional user limit

		// Metadata
		metadata: jsonb("metadata").default({}),

		createdBy: uuid("created_by")
			.references(() => users.id)
			.notNull(),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [
		index("brand_roles_org_idx").on(t.organizationId),
		// index("brand_roles_parent_idx").on(t.parentRoleId),
		index("brand_roles_active_idx").on(t.isActive),
		index("brand_roles_priority_idx").on(t.priority),
	],
);

// User role assignments
export const userBrandRoles = createTable(
	"user_brand_roles",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id")
			.references(() => users.id)
			.notNull(),
		roleId: uuid("role_id")
			.references(() => brandRoles.id)
			.notNull(),
		organizationId: uuid("organization_id")
			.references(() => organizations.id)
			.notNull(),

		// Assignment details
		assignedBy: uuid("assigned_by")
			.references(() => users.id)
			.notNull(),
		assignedAt: timestamp("assigned_at").defaultNow(),
		expiresAt: timestamp("expires_at"), // Optional role expiration

		// Role customization
		customPermissions: jsonb("custom_permissions").default({}), // Override specific permissions
		restrictions: jsonb("restrictions").default({}), // Additional restrictions

		// Status
		isActive: boolean("is_active").default(true),

		// Metadata
		metadata: jsonb("metadata").default({}),

		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [
		index("user_brand_roles_user_idx").on(t.userId),
		index("user_brand_roles_role_idx").on(t.roleId),
		index("user_brand_roles_org_idx").on(t.organizationId),
		index("user_brand_roles_assigned_idx").on(t.assignedBy),
		index("user_brand_roles_active_idx").on(t.isActive),
		index("user_brand_roles_expires_idx").on(t.expiresAt),
	],
);

// Relations
export const brandGuidelinesRelations = relations(
	brandGuidelines,
	({ one, many }) => ({
		organization: one(organizations, {
			fields: [brandGuidelines.organizationId],
			references: [organizations.id],
		}),
		creator: one(users, {
			fields: [brandGuidelines.createdBy],
			references: [users.id],
		}),
		approver: one(users, {
			fields: [brandGuidelines.approvedBy],
			references: [users.id],
		}),
		approvals: many(brandApprovals),
		violations: many(brandViolations),
	}),
);

export const brandApprovalsRelations = relations(brandApprovals, ({ one }) => ({
	organization: one(organizations, {
		fields: [brandApprovals.organizationId],
		references: [organizations.id],
	}),
	asset: one(assets, {
		fields: [brandApprovals.assetId],
		references: [assets.id],
	}),
	guideline: one(brandGuidelines, {
		fields: [brandApprovals.guidelineId],
		references: [brandGuidelines.id],
	}),
	submitter: one(users, {
		fields: [brandApprovals.submittedBy],
		references: [users.id],
	}),
	assignee: one(users, {
		fields: [brandApprovals.assignedTo],
		references: [users.id],
	}),
	reviewer: one(users, {
		fields: [brandApprovals.reviewedBy],
		references: [users.id],
	}),
}));

export const brandViolationsRelations = relations(
	brandViolations,
	({ one }) => ({
		organization: one(organizations, {
			fields: [brandViolations.organizationId],
			references: [organizations.id],
		}),
		asset: one(assets, {
			fields: [brandViolations.assetId],
			references: [assets.id],
		}),
		guideline: one(brandGuidelines, {
			fields: [brandViolations.guidelineId],
			references: [brandGuidelines.id],
		}),
		approval: one(brandApprovals, {
			fields: [brandViolations.approvalId],
			references: [brandApprovals.id],
		}),
		detector: one(users, {
			fields: [brandViolations.detectorUserId],
			references: [users.id],
		}),
		resolver: one(users, {
			fields: [brandViolations.resolvedBy],
			references: [users.id],
		}),
	}),
);

export const brandUsageTrackingRelations = relations(
	brandUsageTracking,
	({ one }) => ({
		organization: one(organizations, {
			fields: [brandUsageTracking.organizationId],
			references: [organizations.id],
		}),
		asset: one(assets, {
			fields: [brandUsageTracking.assetId],
			references: [assets.id],
		}),
		user: one(users, {
			fields: [brandUsageTracking.userId],
			references: [users.id],
		}),
	}),
);

export const brandRolesRelations = relations(brandRoles, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [brandRoles.organizationId],
		references: [organizations.id],
	}),
	creator: one(users, {
		fields: [brandRoles.createdBy],
		references: [users.id],
	}),
	// Commenting out self-reference to avoid TypeScript issues
	// parentRole: one(brandRoles, {
	// 	fields: [brandRoles.parentRoleId],
	// 	references: [brandRoles.id],
	// }),
	// childRoles: many(brandRoles),
	userAssignments: many(userBrandRoles),
}));

export const userBrandRolesRelations = relations(userBrandRoles, ({ one }) => ({
	user: one(users, {
		fields: [userBrandRoles.userId],
		references: [users.id],
	}),
	role: one(brandRoles, {
		fields: [userBrandRoles.roleId],
		references: [brandRoles.id],
	}),
	organization: one(organizations, {
		fields: [userBrandRoles.organizationId],
		references: [organizations.id],
	}),
	assigner: one(users, {
		fields: [userBrandRoles.assignedBy],
		references: [users.id],
	}),
}));
