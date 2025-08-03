import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { assets } from "~/server/db/schema";
import { CacheManager } from "~/server/redis/cache";
import { storageManager } from "~/server/storage";
import { usageTracker } from "~/server/storage/usage";
import { thumbnailGenerator } from "~/server/processing/thumbnails";

export interface ProcessingJob {
	id: string;
	assetId: string;
	organizationId: string;
	type: ProcessingJobType;
	status: ProcessingJobStatus;
	priority: ProcessingPriority;
	metadata: Record<string, any>;
	createdAt: Date;
	startedAt?: Date;
	completedAt?: Date;
	error?: string;
	retryCount: number;
	maxRetries: number;
}

export enum ProcessingJobType {
	CHUNK_MERGE = "chunk_merge",
	THUMBNAIL_GENERATION = "thumbnail_generation",
	METADATA_EXTRACTION = "metadata_extraction",
	VIRUS_SCAN = "virus_scan",
	OPTIMIZATION = "optimization",
	PREVIEW_GENERATION = "preview_generation",
}

export enum ProcessingJobStatus {
	QUEUED = "queued",
	PROCESSING = "processing",
	COMPLETED = "completed",
	FAILED = "failed",
	CANCELLED = "cancelled",
}

export enum ProcessingPriority {
	LOW = 1,
	NORMAL = 2,
	HIGH = 3,
	CRITICAL = 4,
}

export interface ProcessingResult {
	success: boolean;
	data?: Record<string, any>;
	error?: string;
	nextJobs?: ProcessingJob[];
}

export class FileProcessingPipeline {
	private cache: CacheManager;
	private isProcessing = false;

	constructor() {
		this.cache = new CacheManager();
	}

	async queueJob(
		assetId: string,
		organizationId: string,
		type: ProcessingJobType,
		metadata: Record<string, any> = {},
		priority: ProcessingPriority = ProcessingPriority.NORMAL,
	): Promise<string> {
		const jobId = `job_${type}_${assetId}_${Date.now()}`;

		const job: ProcessingJob = {
			id: jobId,
			assetId,
			organizationId,
			type,
			status: ProcessingJobStatus.QUEUED,
			priority,
			metadata,
			createdAt: new Date(),
			retryCount: 0,
			maxRetries: this.getMaxRetries(type),
		};

		// Store job in cache with priority-based TTL
		const ttl = priority === ProcessingPriority.CRITICAL ? 86400 : 3600; // 24h for critical, 1h for others
		await this.cache.set(`processing_job:${jobId}`, job, { ttl });

		// Add to priority queue
		await this.addToQueue(job);

		return jobId;
	}

	private getMaxRetries(type: ProcessingJobType): number {
		switch (type) {
			case ProcessingJobType.CHUNK_MERGE:
				return 3;
			case ProcessingJobType.THUMBNAIL_GENERATION:
				return 2;
			case ProcessingJobType.METADATA_EXTRACTION:
				return 1;
			case ProcessingJobType.VIRUS_SCAN:
				return 2;
			case ProcessingJobType.OPTIMIZATION:
				return 1;
			case ProcessingJobType.PREVIEW_GENERATION:
				return 2;
			default:
				return 1;
		}
	}

	private async addToQueue(job: ProcessingJob): Promise<void> {
		const queueKey = `processing_queue:priority_${job.priority}`;
		const queueData = (await this.cache.get<string[]>(queueKey)) || [];
		queueData.push(job.id);
		await this.cache.set(queueKey, queueData, { ttl: 3600 });
	}

	async processQueue(): Promise<void> {
		if (this.isProcessing) {
			return;
		}

		this.isProcessing = true;

		try {
			// Process jobs by priority (highest first)
			for (
				let priority = ProcessingPriority.CRITICAL;
				priority >= ProcessingPriority.LOW;
				priority--
			) {
				const processed = await this.processQueueByPriority(priority);
				if (processed > 0) {
					break; // Process one priority level at a time
				}
			}
		} finally {
			this.isProcessing = false;
		}
	}

	private async processQueueByPriority(
		priority: ProcessingPriority,
	): Promise<number> {
		const queueKey = `processing_queue:priority_${priority}`;
		const queueData = (await this.cache.get<string[]>(queueKey)) || [];

		if (queueData.length === 0) {
			return 0;
		}

		let processedCount = 0;
		const maxConcurrent = this.getMaxConcurrentJobs(priority);

		// Process jobs concurrently based on priority
		const processingPromises = queueData
			.slice(0, maxConcurrent)
			.map(async (jobId) => {
				try {
					await this.processJob(jobId);
					processedCount++;

					// Remove from queue
					const updatedQueue = queueData.filter((id) => id !== jobId);
					await this.cache.set(queueKey, updatedQueue, { ttl: 3600 });
				} catch (error) {
					console.error(`Failed to process job ${jobId}:`, error);
				}
			});

		await Promise.allSettled(processingPromises);
		return processedCount;
	}

	private getMaxConcurrentJobs(priority: ProcessingPriority): number {
		switch (priority) {
			case ProcessingPriority.CRITICAL:
				return 5;
			case ProcessingPriority.HIGH:
				return 3;
			case ProcessingPriority.NORMAL:
				return 2;
			case ProcessingPriority.LOW:
				return 1;
			default:
				return 1;
		}
	}

	private async processJob(jobId: string): Promise<void> {
		const job = await this.cache.get<ProcessingJob>(`processing_job:${jobId}`);
		if (!job) {
			console.warn(`Job ${jobId} not found`);
			return;
		}

		// Update job status
		job.status = ProcessingJobStatus.PROCESSING;
		job.startedAt = new Date();
		await this.cache.set(`processing_job:${jobId}`, job, { ttl: 3600 });

		try {
			const result = await this.executeJob(job);

			if (result.success) {
				// Job completed successfully
				job.status = ProcessingJobStatus.COMPLETED;
				job.completedAt = new Date();

				// Update asset if there's data to update
				if (result.data) {
					await this.updateAssetWithResult(job.assetId, result.data);
				}

				// Queue next jobs if any
				if (result.nextJobs) {
					for (const nextJob of result.nextJobs) {
						await this.queueJob(
							nextJob.assetId,
							nextJob.organizationId,
							nextJob.type,
							nextJob.metadata,
							nextJob.priority,
						);
					}
				}
			} else {
				// Job failed, check if retry is needed
				if (job.retryCount < job.maxRetries) {
					job.retryCount++;
					job.status = ProcessingJobStatus.QUEUED;
					job.error = result.error;

					// Re-queue with exponential backoff
					setTimeout(
						async () => {
							await this.addToQueue(job);
						},
						2 ** job.retryCount * 1000,
					);
				} else {
					job.status = ProcessingJobStatus.FAILED;
					job.error = result.error;
					job.completedAt = new Date();

					// Update asset status to failed
					await this.updateAssetStatus(job.assetId, "failed", result.error);
				}
			}
		} catch (error) {
			job.status = ProcessingJobStatus.FAILED;
			job.error = error instanceof Error ? error.message : "Unknown error";
			job.completedAt = new Date();

			await this.updateAssetStatus(job.assetId, "failed", job.error);
		}

		// Update job in cache
		await this.cache.set(`processing_job:${jobId}`, job, { ttl: 3600 });
	}

	private async executeJob(job: ProcessingJob): Promise<ProcessingResult> {
		switch (job.type) {
			case ProcessingJobType.CHUNK_MERGE:
				return await this.mergeChunks(job);
			case ProcessingJobType.THUMBNAIL_GENERATION:
				return await this.generateThumbnails(job);
			case ProcessingJobType.METADATA_EXTRACTION:
				return await this.extractMetadata(job);
			case ProcessingJobType.VIRUS_SCAN:
				return await this.scanForVirus(job);
			case ProcessingJobType.OPTIMIZATION:
				return await this.optimizeFile(job);
			case ProcessingJobType.PREVIEW_GENERATION:
				return await this.generatePreview(job);
			default:
				return {
					success: false,
					error: `Unknown job type: ${job.type}`,
				};
		}
	}

	private async mergeChunks(job: ProcessingJob): Promise<ProcessingResult> {
		try {
			const { chunkKeys } = job.metadata;

			// Get asset info
			const [asset] = await db
				.select()
				.from(assets)
				.where(eq(assets.id, job.assetId))
				.limit(1);

			if (!asset) {
				return { success: false, error: "Asset not found" };
			}

			// In a real implementation, this would use S3's multipart upload completion
			// For now, we'll simulate the merge process

			// 1. Download all chunks
			// 2. Merge them in order
			// 3. Upload the final file
			// 4. Delete chunk files
			// 5. Update asset with final file info

			// Simulate processing time
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Clean up chunk files
			const deletePromises = chunkKeys.map((chunkKey: string) =>
				storageManager.deleteFile(asset.organizationId, chunkKey),
			);
			await Promise.allSettled(deletePromises);

			// Queue next processing jobs
			const nextJobs: ProcessingJob[] = [
				{
					id: "",
					assetId: job.assetId,
					organizationId: job.organizationId,
					type: ProcessingJobType.METADATA_EXTRACTION,
					status: ProcessingJobStatus.QUEUED,
					priority: ProcessingPriority.NORMAL,
					metadata: {},
					createdAt: new Date(),
					retryCount: 0,
					maxRetries: 1,
				},
			];

			// Add thumbnail generation for images and videos
			if (asset.fileType === "image" || asset.fileType === "video") {
				nextJobs.push({
					id: "",
					assetId: job.assetId,
					organizationId: job.organizationId,
					type: ProcessingJobType.THUMBNAIL_GENERATION,
					status: ProcessingJobStatus.QUEUED,
					priority: ProcessingPriority.HIGH,
					metadata: {},
					createdAt: new Date(),
					retryCount: 0,
					maxRetries: 2,
				} as ProcessingJob);
			}

			return {
				success: true,
				data: {
					processingStatus: "completed",
					processedAt: new Date(),
				},
				nextJobs,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Chunk merge failed",
			};
		}
	}

	private async generateThumbnails(
		job: ProcessingJob,
	): Promise<ProcessingResult> {
		try {
			// Get asset info
			const [asset] = await db
				.select()
				.from(assets)
				.where(eq(assets.id, job.assetId))
				.limit(1);

			if (!asset) {
				return { success: false, error: "Asset not found" };
			}

			// Only generate thumbnails for images
			if (!asset.mimeType.startsWith("image/")) {
				return {
					success: true,
					data: {},
				};
			}

			// Generate actual thumbnails using the ThumbnailGenerator
			const thumbnailResults = await thumbnailGenerator.generateImageThumbnails(
				asset.organizationId,
				asset.id,
				asset.storageKey,
				["small", "medium", "large"], // Use the predefined presets
			);

			// Check if any thumbnails were generated successfully
			const successfulThumbnails = thumbnailResults.filter(result => result.success);
			
			if (successfulThumbnails.length === 0) {
				return {
					success: false,
					error: "Failed to generate any thumbnails",
				};
			}

			// Return the first successful thumbnail as the primary one
			const primaryThumbnail = successfulThumbnails[0]!;

			return {
				success: true,
				data: {
					thumbnailKey: primaryThumbnail.thumbnailKey,
					thumbnails: successfulThumbnails.map((result) => ({
						key: result.thumbnailKey,
						preset: result.preset,
						size: result.size,
						dimensions: result.dimensions,
					})),
				},
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Thumbnail generation failed",
			};
		}
	}

	private async extractMetadata(job: ProcessingJob): Promise<ProcessingResult> {
		try {
			// Get asset info
			const [asset] = await db
				.select()
				.from(assets)
				.where(eq(assets.id, job.assetId))
				.limit(1);

			if (!asset) {
				return { success: false, error: "Asset not found" };
			}

			// Extract metadata based on file type
			const extractedMetadata: Record<string, any> = {
				extractedAt: new Date().toISOString(),
				fileSize: asset.fileSize,
				mimeType: asset.mimeType,
			};

			if (asset.fileType === "image") {
				// Extract EXIF data, dimensions, etc.
				extractedMetadata.dimensions = { width: 1920, height: 1080 }; // Simulated
				extractedMetadata.colorSpace = "sRGB";
				extractedMetadata.hasTransparency = false;
			} else if (asset.fileType === "video") {
				// Extract video metadata
				extractedMetadata.duration = 120; // seconds
				extractedMetadata.dimensions = { width: 1920, height: 1080 };
				extractedMetadata.frameRate = 30;
				extractedMetadata.bitrate = 5000000; // 5Mbps
			}

			return {
				success: true,
				data: {
					metadata: {
						...(typeof asset.metadata === "object" ? asset.metadata : {}),
						...extractedMetadata,
					},
				},
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Metadata extraction failed",
			};
		}
	}

	private async scanForVirus(job: ProcessingJob): Promise<ProcessingResult> {
		try {
			// Simulate virus scanning
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// In a real implementation, this would integrate with antivirus APIs
			const isSafe = true; // Simulated result

			if (!isSafe) {
				// Quarantine the file
				await this.updateAssetStatus(
					job.assetId,
					"quarantined",
					"Virus detected",
				);
				return {
					success: false,
					error: "Virus detected in file",
				};
			}

			return {
				success: true,
				data: {
					virusScanResult: {
						scannedAt: new Date().toISOString(),
						status: "clean",
						scanner: "simulated",
					},
				},
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Virus scan failed",
			};
		}
	}

	private async optimizeFile(job: ProcessingJob): Promise<ProcessingResult> {
		try {
			// File optimization based on type
			const optimizationResult = {
				originalSize: 0,
				optimizedSize: 0,
				compressionRatio: 0,
				optimizedAt: new Date().toISOString(),
			};

			// Simulate optimization
			await new Promise((resolve) => setTimeout(resolve, 1500));

			return {
				success: true,
				data: {
					optimization: optimizationResult,
				},
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "File optimization failed",
			};
		}
	}

	private async generatePreview(job: ProcessingJob): Promise<ProcessingResult> {
		try {
			// Generate previews for documents, videos, etc.
			await new Promise((resolve) => setTimeout(resolve, 3000));

			return {
				success: true,
				data: {
					previewGenerated: true,
					previewUrl: `preview_${job.assetId}`,
				},
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Preview generation failed",
			};
		}
	}

	private async updateAssetWithResult(
		assetId: string,
		data: Record<string, any>,
	): Promise<void> {
		const updateData: any = {};

		if (data.thumbnailKey) {
			updateData.thumbnailKey = data.thumbnailKey;
		}

		if (data.metadata) {
			updateData.metadata = data.metadata;
		}

		if (data.processingStatus) {
			updateData.processingStatus = data.processingStatus;
		}

		if (Object.keys(updateData).length > 0) {
			await db.update(assets).set(updateData).where(eq(assets.id, assetId));
		}
	}

	private async updateAssetStatus(
		assetId: string,
		status: string,
		error?: string,
	): Promise<void> {
		const updateData: any = { processingStatus: status };

		if (error) {
			updateData.processingError = error;
		}

		await db.update(assets).set(updateData).where(eq(assets.id, assetId));
	}

	async getJobStatus(jobId: string): Promise<ProcessingJob | null> {
		return await this.cache.get<ProcessingJob>(`processing_job:${jobId}`);
	}

	async cancelJob(jobId: string): Promise<boolean> {
		const job = await this.cache.get<ProcessingJob>(`processing_job:${jobId}`);
		if (!job || job.status === ProcessingJobStatus.COMPLETED) {
			return false;
		}

		job.status = ProcessingJobStatus.CANCELLED;
		job.completedAt = new Date();

		await this.cache.set(`processing_job:${jobId}`, job, { ttl: 3600 });
		return true;
	}

	async getQueueStats(): Promise<{
		queued: number;
		processing: number;
		completed: number;
		failed: number;
	}> {
		const stats = {
			queued: 0,
			processing: 0,
			completed: 0,
			failed: 0,
		};

		// This is a simplified implementation
		// In production, you'd maintain these stats in a more efficient way

		return stats;
	}
}

export const fileProcessingPipeline = new FileProcessingPipeline();
