import { z } from "zod";
import { db } from "~/server/db";
import { assets } from "~/server/db/schema";
import { CacheManager } from "~/server/redis/cache";
import { storageManager } from "~/server/storage";
import { usageTracker } from "~/server/storage/usage";
import {
	validateFileName,
	validateFileSize,
	validateFileType,
} from "~/server/storage/validation";

export interface ChunkUploadSession {
	sessionId: string;
	organizationId: string;
	userId: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	totalChunks: number;
	chunkSize: number;
	uploadedChunks: Set<number>;
	storageKey: string;
	expiresAt: Date;
	metadata?: Record<string, any>;
}

export interface ChunkUploadResult {
	success: boolean;
	chunkIndex: number;
	uploadUrl?: string;
	error?: string;
	isComplete?: boolean;
	assetId?: string;
}

export interface ChunkMergeResult {
	success: boolean;
	assetId?: string;
	downloadUrl?: string;
	error?: string;
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CHUNKS = 1000; // Maximum chunks per file

export class ChunkedUploadManager {
	private cache: CacheManager;

	constructor() {
		this.cache = new CacheManager();
	}

	async initializeUpload(
		organizationId: string,
		userId: string,
		fileName: string,
		fileSize: number,
		mimeType: string,
		metadata?: Record<string, any>,
	): Promise<{ sessionId: string; totalChunks: number; chunkSize: number }> {
		// Validate file
		const nameValidation = validateFileName(fileName);
		if (!nameValidation.isValid) {
			throw new Error(nameValidation.error);
		}

		const typeValidation = validateFileType(fileName, mimeType);
		if (!typeValidation.isValid) {
			throw new Error(typeValidation.error);
		}

		const sizeValidation = validateFileSize(fileSize, 1000); // 1GB max per file
		if (!sizeValidation.isValid) {
			throw new Error(sizeValidation.error);
		}

		// Check usage limits
		const usageValidation = await usageTracker.validateAssetUpload(
			organizationId,
			fileSize,
		);
		if (!usageValidation.allowed) {
			throw new Error(usageValidation.reason || "Upload not allowed");
		}

		// Calculate chunks
		const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
		if (totalChunks > MAX_CHUNKS) {
			throw new Error(`File too large. Maximum ${MAX_CHUNKS} chunks allowed.`);
		}

		// Generate session ID and storage key
		const sessionId = `upload_${Date.now()}_${Math.random().toString(36).substring(2)}`;
		const storageKey = storageManager.generateStorageKey(
			organizationId,
			fileName,
			userId,
		);

		// Create upload session
		const session: ChunkUploadSession = {
			sessionId,
			organizationId,
			userId,
			fileName,
			fileSize,
			mimeType,
			totalChunks,
			chunkSize: CHUNK_SIZE,
			uploadedChunks: new Set(),
			storageKey,
			expiresAt: new Date(Date.now() + SESSION_EXPIRY),
			metadata,
		};

		// Cache the session
		await this.cache.set(
			`upload_session:${sessionId}`,
			{
				...session,
				uploadedChunks: Array.from(session.uploadedChunks),
			},
			{ ttl: SESSION_EXPIRY / 1000 },
		);

		return {
			sessionId,
			totalChunks,
			chunkSize: CHUNK_SIZE,
		};
	}

	async getChunkUploadUrl(
		sessionId: string,
		chunkIndex: number,
	): Promise<ChunkUploadResult> {
		try {
			// Get session
			const sessionData = await this.cache.get<any>(
				`upload_session:${sessionId}`,
			);
			if (!sessionData) {
				return {
					success: false,
					chunkIndex,
					error: "Upload session not found or expired",
				};
			}

			const session: ChunkUploadSession = {
				...sessionData,
				uploadedChunks: new Set(sessionData.uploadedChunks),
				expiresAt: new Date(sessionData.expiresAt),
			};

			// Validate chunk index
			if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
				return {
					success: false,
					chunkIndex,
					error: `Invalid chunk index. Expected 0-${session.totalChunks - 1}`,
				};
			}

			// Check if chunk already uploaded
			if (session.uploadedChunks.has(chunkIndex)) {
				return {
					success: true,
					chunkIndex,
					isComplete: session.uploadedChunks.size === session.totalChunks,
				};
			}

			// Generate presigned URL for chunk
			const chunkKey = `${session.storageKey}.chunk.${chunkIndex}`;
			const uploadUrl = await storageManager.generatePresignedUrls(
				session.organizationId,
				chunkKey,
				"application/octet-stream",
				3600, // 1 hour expiry
			);

			return {
				success: true,
				chunkIndex,
				uploadUrl: uploadUrl.uploadUrl,
			};
		} catch (error) {
			return {
				success: false,
				chunkIndex,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	async confirmChunkUpload(
		sessionId: string,
		chunkIndex: number,
		etag: string,
	): Promise<ChunkUploadResult> {
		try {
			// Get session
			const sessionData = await this.cache.get<any>(
				`upload_session:${sessionId}`,
			);
			if (!sessionData) {
				return {
					success: false,
					chunkIndex,
					error: "Upload session not found or expired",
				};
			}

			const session: ChunkUploadSession = {
				...sessionData,
				uploadedChunks: new Set(sessionData.uploadedChunks),
				expiresAt: new Date(sessionData.expiresAt),
			};

			// Mark chunk as uploaded
			session.uploadedChunks.add(chunkIndex);

			// Update session in cache
			await this.cache.set(
				`upload_session:${sessionId}`,
				{
					...session,
					uploadedChunks: Array.from(session.uploadedChunks),
				},
				{ ttl: SESSION_EXPIRY / 1000 },
			);

			// Check if upload is complete
			const isComplete = session.uploadedChunks.size === session.totalChunks;

			if (isComplete) {
				// Trigger merge process
				const mergeResult = await this.mergeChunks(sessionId);
				return {
					success: mergeResult.success,
					chunkIndex,
					isComplete: true,
					assetId: mergeResult.assetId,
					error: mergeResult.error,
				};
			}

			return {
				success: true,
				chunkIndex,
				isComplete: false,
			};
		} catch (error) {
			return {
				success: false,
				chunkIndex,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private async mergeChunks(sessionId: string): Promise<ChunkMergeResult> {
		try {
			// Get session
			const sessionData = await this.cache.get<any>(
				`upload_session:${sessionId}`,
			);
			if (!sessionData) {
				return {
					success: false,
					error: "Upload session not found",
				};
			}

			const session: ChunkUploadSession = {
				...sessionData,
				uploadedChunks: new Set(sessionData.uploadedChunks),
				expiresAt: new Date(sessionData.expiresAt),
			};

			// Verify all chunks are uploaded
			if (session.uploadedChunks.size !== session.totalChunks) {
				return {
					success: false,
					error: "Not all chunks uploaded",
				};
			}

			// Use S3 multipart upload completion
			// Note: This is a simplified version. In production, you'd use S3's multipart upload API
			const chunkKeys = Array.from(
				{ length: session.totalChunks },
				(_, i) => `${session.storageKey}.chunk.${i}`,
			);

			// Create asset record in database
			const [asset] = await db
				.insert(assets)
				.values({
					organizationId: session.organizationId,
					uploadedBy: session.userId,
					fileName: session.fileName,
					originalFileName: session.fileName,
					fileType: session.mimeType.split("/")[0] || "other",
					mimeType: session.mimeType,
					fileSize: session.fileSize,
					storageKey: session.storageKey,
					title: session.fileName.split(".")[0] || session.fileName,
					description: session.metadata?.description,
					tags: session.metadata?.tags || [],
					metadata: session.metadata || {},
					processingStatus: "processing",
				})
				.returning({ id: assets.id });

			// Schedule background processing for chunk merging and cleanup
			await this.scheduleChunkMerging(sessionId, asset!.id, chunkKeys);

			// Update usage metrics
			await usageTracker.incrementUploadCount(session.organizationId);

			// Clean up session
			await this.cache.delete(`upload_session:${sessionId}`);

			return {
				success: true,
				assetId: asset!.id,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to merge chunks",
			};
		}
	}

	private async scheduleChunkMerging(
		sessionId: string,
		assetId: string,
		chunkKeys: string[],
	): Promise<void> {
		// Queue for background processing
		await this.cache.set(
			`chunk_merge_queue:${assetId}`,
			{
				sessionId,
				assetId,
				chunkKeys,
				queuedAt: new Date().toISOString(),
			},
			{ ttl: 3600 }, // 1 hour TTL
		);
	}

	async processChunkMergeQueue(): Promise<void> {
		try {
			// This would be called by a background worker
			// For now, we'll implement a simple queue processor

			// Note: In production, this should be implemented with a proper job queue
			// like Bull/BullMQ, or AWS SQS, or similar
			console.log("Chunk merge queue processing would run here");

			// Implementation would:
			// 1. Get all queued merge jobs
			// 2. For each job, merge chunks using S3 multipart completion
			// 3. Update asset status to 'completed' or 'failed'
			// 4. Clean up chunk files
			// 5. Generate thumbnails if needed
		} catch (error) {
			console.error("Failed to process chunk merge queue:", error);
		}
	}

	async getUploadProgress(sessionId: string): Promise<{
		uploadedChunks: number;
		totalChunks: number;
		percentComplete: number;
		isComplete: boolean;
	} | null> {
		try {
			const sessionData = await this.cache.get<any>(
				`upload_session:${sessionId}`,
			);
			if (!sessionData) {
				return null;
			}

			const uploadedChunks = sessionData.uploadedChunks.length;
			const totalChunks = sessionData.totalChunks;
			const percentComplete = Math.round((uploadedChunks / totalChunks) * 100);

			return {
				uploadedChunks,
				totalChunks,
				percentComplete,
				isComplete: uploadedChunks === totalChunks,
			};
		} catch (error) {
			return null;
		}
	}

	async cancelUpload(sessionId: string): Promise<boolean> {
		try {
			// Get session to get chunk information
			const sessionData = await this.cache.get<any>(
				`upload_session:${sessionId}`,
			);
			if (!sessionData) {
				return false;
			}

			// Clean up uploaded chunks
			const session: ChunkUploadSession = {
				...sessionData,
				uploadedChunks: new Set(sessionData.uploadedChunks),
			};

			// Delete chunk files from storage
			const deletePromises = Array.from(session.uploadedChunks).map(
				(chunkIndex) => {
					const chunkKey = `${session.storageKey}.chunk.${chunkIndex}`;
					return storageManager.deleteFile(session.organizationId, chunkKey);
				},
			);

			await Promise.allSettled(deletePromises);

			// Remove session from cache
			await this.cache.delete(`upload_session:${sessionId}`);

			return true;
		} catch (error) {
			console.error("Failed to cancel upload:", error);
			return false;
		}
	}

	async cleanupExpiredSessions(): Promise<void> {
		try {
			// This would be called by a background cleanup job
			// Implementation would scan for expired sessions and clean them up
			console.log("Expired session cleanup would run here");
		} catch (error) {
			console.error("Failed to cleanup expired sessions:", error);
		}
	}
}

export const chunkedUploadManager = new ChunkedUploadManager();
