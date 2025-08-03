import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { storageManager } from "~/server/storage";
import { usageTracker } from "~/server/storage/usage";
import {
	formatFileSize,
	validateBulkUpload,
	validateFileName,
	validateFileSize,
	validateFileType,
} from "~/server/storage/validation";
import { chunkedUploadManager } from "~/server/upload/chunked";

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

const initializeUploadSchema = z.object({
	fileName: z.string().min(1),
	fileSize: z.number().positive(),
	mimeType: z.string().min(1),
	metadata: z.record(z.any()).optional(),
});

const chunkUploadSchema = z.object({
	sessionId: z.string().min(1),
	chunkIndex: z.number().min(0),
});

const confirmChunkSchema = z.object({
	sessionId: z.string().min(1),
	chunkIndex: z.number().min(0),
	etag: z.string().min(1),
});

const bulkUploadSchema = z.object({
	files: z
		.array(
			z.object({
				name: z.string().min(1),
				size: z.number().positive(),
				type: z.string().min(1),
			}),
		)
		.min(1)
		.max(50), // Max 50 files per bulk upload
	metadata: z.record(z.any()).optional(),
});

const directUploadSchema = z.object({
	fileName: z.string().min(1),
	fileSize: z.number().positive(),
	mimeType: z.string().min(1),
	metadata: z.record(z.any()).optional(),
});

export const uploadRouter = createTRPCRouter({
	// Initialize chunked upload session
	initializeChunkedUpload: protectedProcedure
		.input(initializeUploadSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			try {
				const result = await chunkedUploadManager.initializeUpload(
					organizationId,
					userId,
					input.fileName,
					input.fileSize,
					input.mimeType,
					input.metadata,
				);

				return {
					success: true,
					...result,
				};
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						error instanceof Error
							? error.message
							: "Failed to initialize upload",
				});
			}
		}),

	// Get presigned URL for chunk upload
	getChunkUploadUrl: protectedProcedure
		.input(chunkUploadSchema)
		.mutation(async ({ ctx, input }) => {
			getOrganizationId(ctx); // Verify user has organization

			const result = await chunkedUploadManager.getChunkUploadUrl(
				input.sessionId,
				input.chunkIndex,
			);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error || "Failed to get chunk upload URL",
				});
			}

			return result;
		}),

	// Confirm chunk upload completion
	confirmChunkUpload: protectedProcedure
		.input(confirmChunkSchema)
		.mutation(async ({ ctx, input }) => {
			getOrganizationId(ctx); // Verify user has organization

			const result = await chunkedUploadManager.confirmChunkUpload(
				input.sessionId,
				input.chunkIndex,
				input.etag,
			);

			if (!result.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: result.error || "Failed to confirm chunk upload",
				});
			}

			return result;
		}),

	// Get upload progress
	getUploadProgress: protectedProcedure
		.input(z.object({ sessionId: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			getOrganizationId(ctx); // Verify user has organization

			const progress = await chunkedUploadManager.getUploadProgress(
				input.sessionId,
			);

			if (!progress) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Upload session not found",
				});
			}

			return progress;
		}),

	// Cancel upload
	cancelUpload: protectedProcedure
		.input(z.object({ sessionId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			getOrganizationId(ctx); // Verify user has organization

			const success = await chunkedUploadManager.cancelUpload(input.sessionId);

			if (!success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Failed to cancel upload",
				});
			}

			return { success: true };
		}),

	// Direct upload for small files (< 5MB)
	directUpload: protectedProcedure
		.input(directUploadSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);
			const userId = ctx.session.user.id;

			// Validate file
			const nameValidation = validateFileName(input.fileName);
			if (!nameValidation.isValid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: nameValidation.error,
				});
			}

			const typeValidation = validateFileType(input.fileName, input.mimeType);
			if (!typeValidation.isValid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: typeValidation.error,
				});
			}

			const sizeValidation = validateFileSize(input.fileSize, 5); // 5MB limit for direct upload
			if (!sizeValidation.isValid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: sizeValidation.error,
				});
			}

			// Check usage limits
			const usageValidation = await usageTracker.validateAssetUpload(
				organizationId,
				input.fileSize,
			);
			if (!usageValidation.allowed) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: usageValidation.reason || "Upload not allowed",
				});
			}

			// Generate storage key and presigned URLs
			const storageKey = storageManager.generateStorageKey(
				organizationId,
				input.fileName,
				userId,
			);

			const urls = await storageManager.generatePresignedUrls(
				organizationId,
				storageKey,
				input.mimeType,
				3600, // 1 hour expiry
			);

			return {
				uploadUrl: urls.uploadUrl,
				downloadUrl: urls.downloadUrl,
				storageKey,
				validation: {
					fileType: typeValidation.fileType,
					category: typeValidation.category,
				},
			};
		}),

	// Validate bulk upload
	validateBulkUpload: protectedProcedure
		.input(bulkUploadSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// Get organization limits
			const limits = await usageTracker.getOrganizationLimits(organizationId);

			// Validate all files
			const validation = validateBulkUpload(input.files, {
				maxFileSizeMB: limits.maxFileSizeMB,
				maxStorageGB: limits.maxStorageGB,
				allowedFileTypes: ["image/*", "video/*", "document/*", "design/*"],
				maxFilesPerUpload: 50,
			});

			if (!validation.isValid) {
				return {
					success: false,
					errors: validation.errors,
					validFiles: validation.validFiles,
					totalSize: validation.totalSize,
					formattedSize: formatFileSize(validation.totalSize),
				};
			}

			// Check storage quota for total upload size
			const currentUsage = await usageTracker.getCurrentUsage(organizationId);
			const maxStorageBytes = limits.maxStorageGB * 1024 * 1024 * 1024;
			const newTotal = currentUsage.totalStorageBytes + validation.totalSize;

			if (newTotal > maxStorageBytes) {
				const remainingBytes = maxStorageBytes - currentUsage.totalStorageBytes;
				return {
					success: false,
					errors: [
						`Total upload size exceeds storage quota. Remaining: ${formatFileSize(remainingBytes)}`,
					],
					validFiles: validation.validFiles,
					totalSize: validation.totalSize,
					formattedSize: formatFileSize(validation.totalSize),
				};
			}

			const remainingBytes = maxStorageBytes - currentUsage.totalStorageBytes;
			return {
				success: true,
				errors: [],
				validFiles: validation.validFiles,
				totalSize: validation.totalSize,
				formattedSize: formatFileSize(validation.totalSize),
				remaining: {
					storageBytes: remainingBytes,
					storageFormatted: formatFileSize(remainingBytes),
					assets: limits.maxAssets - currentUsage.totalAssets,
				},
			};
		}),

	// Get upload recommendations
	getUploadRecommendations: protectedProcedure
		.input(
			z.object({
				fileName: z.string().min(1),
				fileSize: z.number().positive(),
				mimeType: z.string().min(1),
			}),
		)
		.query(async ({ ctx, input }) => {
			const organizationId = getOrganizationId(ctx);

			// Get organization limits and current usage
			const [limits, usage] = await Promise.all([
				usageTracker.getOrganizationLimits(organizationId),
				usageTracker.getCurrentUsage(organizationId),
			]);

			const recommendations: string[] = [];
			const warnings: string[] = [];

			// File size recommendations
			if (input.fileSize > 50 * 1024 * 1024) {
				// > 50MB
				recommendations.push(
					"Use chunked upload for files larger than 50MB for better reliability",
				);
			} else if (input.fileSize < 5 * 1024 * 1024) {
				// < 5MB
				recommendations.push(
					"Use direct upload for small files for faster processing",
				);
			}

			// Storage quota warnings
			const maxStorageBytes = limits.maxStorageGB * 1024 * 1024 * 1024;
			const usagePercentage = (usage.totalStorageBytes / maxStorageBytes) * 100;

			if (usagePercentage > 90) {
				warnings.push(
					"Storage quota is nearly full (>90%). Consider upgrading your plan.",
				);
			} else if (usagePercentage > 75) {
				warnings.push(
					"Storage quota is over 75% full. Monitor usage carefully.",
				);
			}

			// File type recommendations
			const fileTypeValidation = validateFileType(
				input.fileName,
				input.mimeType,
			);
			if (fileTypeValidation.category === "image") {
				recommendations.push(
					"Images will be automatically optimized and thumbnails generated",
				);
			} else if (fileTypeValidation.category === "video") {
				recommendations.push(
					"Video files may take longer to process and generate previews",
				);
			}

			// Asset count warnings
			const assetUsagePercentage = (usage.totalAssets / limits.maxAssets) * 100;
			if (assetUsagePercentage > 90) {
				warnings.push(
					"Asset limit nearly reached. Consider upgrading your plan.",
				);
			}

			return {
				recommendedMethod:
					input.fileSize > 5 * 1024 * 1024 ? "chunked" : "direct",
				recommendations,
				warnings,
				estimatedProcessingTime: estimateProcessingTime(
					input.fileSize,
					fileTypeValidation.category || "other",
				),
				currentUsage: {
					storagePercentage: Math.round(usagePercentage),
					assetsPercentage: Math.round(assetUsagePercentage),
					remainingStorage: formatFileSize(
						maxStorageBytes - usage.totalStorageBytes,
					),
					remainingAssets: limits.maxAssets - usage.totalAssets,
				},
			};
		}),

	// Get upload statistics
	getUploadStats: protectedProcedure.query(async ({ ctx }) => {
		const organizationId = getOrganizationId(ctx);

		const usage = await usageTracker.getCurrentUsage(organizationId);
		const limits = await usageTracker.getOrganizationLimits(organizationId);

		return {
			thisMonth: {
				uploads: usage.monthlyUploads,
				downloads: usage.monthlyDownloads,
				activeUsers: usage.monthlyActiveUsers,
			},
			totals: {
				assets: usage.totalAssets,
				storageUsed: formatFileSize(usage.totalStorageBytes),
				storageLimit: formatFileSize(limits.maxStorageGB * 1024 * 1024 * 1024),
			},
			limits: {
				maxFileSize: formatFileSize(limits.maxFileSizeMB * 1024 * 1024),
				maxAssets: limits.maxAssets,
				maxUsers: limits.maxUsers,
			},
		};
	}),
});

// Helper method for processing time estimation
function estimateProcessingTime(fileSize: number, category: string): string {
	const sizeMB = fileSize / (1024 * 1024);

	if (category === "image") {
		return sizeMB < 10 ? "< 30 seconds" : "1-2 minutes";
	} else if (category === "video") {
		return sizeMB < 50 ? "2-5 minutes" : "5-15 minutes";
	} else {
		return sizeMB < 50 ? "< 1 minute" : "1-3 minutes";
	}
}
