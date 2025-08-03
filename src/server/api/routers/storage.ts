import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { organizations, tiers, usageMetrics } from "~/server/db/schema";
import { storageManager } from "~/server/storage";
import { storageConfigManager } from "~/server/storage/config";
import {
	checkStorageQuota,
	formatFileSize,
	validateFileName,
	validateFileSize,
	validateFileType,
} from "~/server/storage/validation";

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

const storageConfigInputSchema = z.object({
	provider: z.enum(["aws", "digitalocean", "cloudflare", "wasabi", "minio"]),
	bucketName: z.string().min(1),
	region: z.string().min(1),
	endpoint: z.string().url().optional(),
	accessKeyId: z.string().min(1),
	secretAccessKey: z.string().min(1),
	customDomain: z.string().optional(),
	config: z.record(z.any()).optional(),
});

const presignedUrlSchema = z.object({
	fileName: z.string().min(1),
	contentType: z.string().min(1),
	fileSize: z.number().positive(),
	expiresIn: z.number().positive().max(7200).default(3600),
});

export const storageRouter = createTRPCRouter({
	// Get organization's storage configuration
	getConfig: protectedProcedure.query(async ({ ctx }) => {
		const organizationId = getOrganizationId(ctx);
		return await storageConfigManager.getOrganizationStorageConfig(
			organizationId,
		);
	}),

	// Create or update storage configuration
	updateConfig: protectedProcedure
		.input(storageConfigInputSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// Check if user has admin permissions
			// TODO: Implement proper role checking once roles are set up

			const existingConfig =
				await storageConfigManager.getOrganizationStorageConfig(organizationId);

			if (existingConfig) {
				await storageConfigManager.updateOrganizationStorageConfig(
					existingConfig.id,
					organizationId,
					input,
				);
				return { success: true, id: existingConfig.id };
			} else {
				const configId =
					await storageConfigManager.createOrganizationStorageConfig(
						organizationId,
						input,
					);
				return { success: true, id: configId };
			}
		}),

	// Test storage configuration
	testConfig: protectedProcedure.query(async ({ ctx }) => {
		const organizationId = getOrganizationId(ctx);

		return await storageConfigManager.testOrganizationStorageConfig(
			organizationId,
		);
	}),

	// Delete storage configuration
	deleteConfig: protectedProcedure.mutation(async ({ ctx }) => {
		const organizationId = getOrganizationId(ctx);

		const existingConfig =
			await storageConfigManager.getOrganizationStorageConfig(organizationId);

		if (!existingConfig) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Storage configuration not found",
			});
		}

		await storageConfigManager.deleteOrganizationStorageConfig(
			existingConfig.id,
			organizationId,
		);

		return { success: true };
	}),

	// Get storage providers list
	getProviders: protectedProcedure.query(async () => {
		return await storageConfigManager.listStorageProviders();
	}),

	// Generate presigned URLs for file upload
	generatePresignedUrls: protectedProcedure
		.input(presignedUrlSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// Get organization limits
			const [orgData] = await db
				.select({
					tierId: organizations.tierId,
					tierLimits: tiers.limits,
					tierFeatures: tiers.features,
				})
				.from(organizations)
				.leftJoin(tiers, sql`${organizations.tierId} = ${tiers.id}`)
				.where(sql`${organizations.id} = ${organizationId}`)
				.limit(1);

			if (!orgData) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Organization not found",
				});
			}

			const limits = orgData.tierLimits as any;
			const features = orgData.tierFeatures as any;

			// Validate file name
			const nameValidation = validateFileName(input.fileName);
			if (!nameValidation.isValid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: nameValidation.error,
				});
			}

			// Validate file type (get from organization tier limits if available)
			const typeValidation = validateFileType(
				input.fileName,
				input.contentType,
				limits?.allowedFileTypes || [],
			);
			if (!typeValidation.isValid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: typeValidation.error,
				});
			}

			// Validate file size
			const sizeValidation = validateFileSize(
				input.fileSize,
				limits?.maxFileSizeMB || 100,
			);
			if (!sizeValidation.isValid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: sizeValidation.error,
				});
			}

			// Check storage quota
			const [usage] = await db
				.select({
					totalStorageBytes: usageMetrics.totalStorageBytes,
				})
				.from(usageMetrics)
				.where(sql`${usageMetrics.organizationId} = ${organizationId}`)
				.orderBy(sql`${usageMetrics.calculatedAt} DESC`)
				.limit(1);

			const currentStorageBytes = usage?.totalStorageBytes || 0;
			const quotaValidation = checkStorageQuota(
				currentStorageBytes,
				input.fileSize,
				limits?.maxStorageGB || 10,
			);
			if (!quotaValidation.isValid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: quotaValidation.error,
				});
			}

			// Generate storage key
			const storageKey = storageManager.generateStorageKey(
				organizationId,
				input.fileName,
				ctx.session.user.id,
			);

			// Generate presigned URLs
			const urls = await storageManager.generatePresignedUrls(
				organizationId,
				storageKey,
				input.contentType,
				input.expiresIn,
			);

			return {
				...urls,
				storageKey,
				validation: {
					fileType: typeValidation.fileType,
					category: typeValidation.category,
				},
			};
		}),

	// Get file information
	getFileInfo: protectedProcedure
		.input(
			z.object({
				storageKey: z.string().min(1),
			}),
		)
		.query(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			const fileInfo = await storageManager.getFileInfo(
				organizationId,
				input.storageKey,
			);

			if (!fileInfo.exists) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "File not found",
				});
			}

			return {
				...fileInfo,
				formattedSize: fileInfo.size
					? formatFileSize(fileInfo.size)
					: undefined,
			};
		}),

	// Generate download URL
	generateDownloadUrl: protectedProcedure
		.input(
			z.object({
				storageKey: z.string().min(1),
				expiresIn: z.number().positive().max(7200).default(900),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// TODO: Check asset permissions once asset system is implemented

			const downloadUrl = await storageManager.generateDownloadUrl(
				organizationId,
				input.storageKey,
				input.expiresIn,
			);

			return { downloadUrl };
		}),

	// Delete file from storage
	deleteFile: protectedProcedure
		.input(
			z.object({
				storageKey: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// TODO: Check permissions and update asset record once asset system is implemented

			const success = await storageManager.deleteFile(
				organizationId,
				input.storageKey,
			);

			if (!success) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete file",
				});
			}

			return { success: true };
		}),

	// Get storage usage statistics
	getUsageStats: protectedProcedure.query(async ({ ctx }) => {
		const organizationId = getOrganizationId(ctx);

		// Get organization limits
		const [orgData] = await db
			.select({
				tierLimits: tiers.limits,
			})
			.from(organizations)
			.leftJoin(tiers, sql`${organizations.tierId} = ${tiers.id}`)
			.where(sql`${organizations.id} = ${organizationId}`)
			.limit(1);

		const limits = orgData?.tierLimits as any;

		// Get current usage
		const [usage] = await db
			.select()
			.from(usageMetrics)
			.where(sql`${usageMetrics.organizationId} = ${organizationId}`)
			.orderBy(sql`${usageMetrics.calculatedAt} DESC`)
			.limit(1);

		const maxStorageBytes = (limits?.maxStorageGB || 10) * 1024 * 1024 * 1024;
		const currentStorageBytes = usage?.totalStorageBytes || 0;
		const usagePercentage = (currentStorageBytes / maxStorageBytes) * 100;

		return {
			limits: {
				maxStorageGB: limits?.maxStorageGB || 10,
				maxFileSizeMB: limits?.maxFileSizeMB || 100,
				maxAssets: limits?.maxAssets || 1000,
				allowedFileTypes: limits?.allowedFileTypes || [
					"image/*",
					"video/*",
					"application/pdf",
				],
			},
			usage: {
				totalAssets: usage?.totalAssets || 0,
				totalStorageBytes: currentStorageBytes,
				totalStorageFormatted: formatFileSize(currentStorageBytes),
				usagePercentage: Math.round(usagePercentage * 100) / 100,
				monthlyDownloads: usage?.monthlyDownloads || 0,
				monthlyUploads: usage?.monthlyUploads || 0,
				monthlyActiveUsers: usage?.monthlyActiveUsers || 0,
			},
			remaining: {
				storageBytes: maxStorageBytes - currentStorageBytes,
				storageFormatted: formatFileSize(maxStorageBytes - currentStorageBytes),
				assets: (limits?.maxAssets || 1000) - (usage?.totalAssets || 0),
			},
		};
	}),
});
