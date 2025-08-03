import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import sharp from "sharp";
import { db } from "~/server/db";
import { assets, assetVersions } from "~/server/db/schema";
import { storageManager } from "~/server/storage";

export interface ImageTransformation {
	width?: number;
	height?: number;
	quality?: number;
	format?: "jpeg" | "png" | "webp" | "avif";
	fit?: "cover" | "contain" | "fill" | "inside" | "outside";
	position?: "center" | "top" | "bottom" | "left" | "right";
	background?: string;
	blur?: number;
	sharpen?: number;
	brightness?: number;
	contrast?: number;
	saturation?: number;
	hue?: number;
	grayscale?: boolean;
	sepia?: boolean;
	negate?: boolean;
	rotate?: number;
	flip?: boolean;
	flop?: boolean;
}

export interface CropParams {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface VideoTransformation {
	width?: number;
	height?: number;
	quality?: "low" | "medium" | "high" | "ultra";
	format?: "mp4" | "webm" | "avi";
	startTime?: number; // seconds
	duration?: number; // seconds
	fps?: number;
	bitrate?: string;
	codec?: "h264" | "h265" | "vp9";
}

export interface ThumbnailOptions {
	timestamps?: number[]; // For video thumbnails
	width?: number;
	height?: number;
	format?: "jpeg" | "png" | "webp";
	quality?: number;
}

export interface TransformationJob {
	id: string;
	assetId: string;
	transformations: (ImageTransformation | VideoTransformation)[];
	status: "pending" | "processing" | "completed" | "failed";
	progress: number;
	resultUrls?: string[];
	error?: string;
	createdAt: Date;
	completedAt?: Date;
}

export class AssetTransformationService {
	private jobs = new Map<string, TransformationJob>();

	// Transform image with sharp
	async transformImage(
		assetId: string,
		organizationId: string,
		transformation: ImageTransformation,
		userId: string,
	): Promise<{
		success: boolean;
		transformedUrl?: string;
		metadata?: any;
		error?: string;
	}> {
		try {
			// Get asset
			const asset = await db.query.assets.findFirst({
				where: and(
					eq(assets.id, assetId),
					eq(assets.organizationId, organizationId),
					isNull(assets.deletedAt),
				),
			});

			if (!asset) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Asset not found",
				});
			}

			if (!asset.fileType.startsWith("image/")) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Asset is not an image",
				});
			}

			// Get file from storage
			const downloadUrl = await storageManager.generatePresignedUrls(
				organizationId,
				asset.storageKey,
				asset.mimeType,
				3600, // 1 hour
			);

			// Download file
			const response = await fetch(downloadUrl.downloadUrl);
			if (!response.ok) {
				throw new Error("Failed to download original file");
			}

			const buffer = await response.arrayBuffer();
			let image = sharp(Buffer.from(buffer));

			// Apply transformations
			if (transformation.rotate) {
				image = image.rotate(transformation.rotate);
			}

			if (transformation.flip) {
				image = image.flip();
			}

			if (transformation.flop) {
				image = image.flop();
			}

			if (transformation.width || transformation.height) {
				image = image.resize({
					width: transformation.width,
					height: transformation.height,
					fit: transformation.fit || "cover",
					position: transformation.position || "center",
					background: transformation.background || {
						r: 255,
						g: 255,
						b: 255,
						alpha: 1,
					},
				});
			}

			if (transformation.blur) {
				image = image.blur(transformation.blur);
			}

			if (transformation.sharpen) {
				image = image.sharpen(transformation.sharpen);
			}

			if (
				transformation.brightness ||
				transformation.saturation ||
				transformation.hue
			) {
				image = image.modulate({
					brightness: transformation.brightness,
					saturation: transformation.saturation,
					hue: transformation.hue,
				});
			}

			if (transformation.contrast) {
				// Apply contrast separately using linear() method
				const a = transformation.contrast || 1;
				const b = 128 * (1 - a);
				image = image.linear(a, b);
			}

			if (transformation.grayscale) {
				image = image.grayscale();
			}

			if (transformation.sepia) {
				image = image.tint({ r: 255, g: 240, b: 196 });
			}

			if (transformation.negate) {
				image = image.negate();
			}

			// Set format and quality
			const format = transformation.format || "jpeg";
			const quality = transformation.quality || 85;

			switch (format) {
				case "jpeg":
					image = image.jpeg({ quality });
					break;
				case "png":
					image = image.png({ quality });
					break;
				case "webp":
					image = image.webp({ quality });
					break;
				case "avif":
					image = image.avif({ quality });
					break;
			}

			// Get transformed buffer
			const transformedBuffer = await image.toBuffer();
			const metadata = await image.metadata();

			// Generate storage key for transformed image
			const transformedKey = `${asset.storageKey.replace(/\.[^/.]+$/, "")}_transformed_${Date.now()}.${format}`;

			// Upload transformed image
			const uploadUrls = await storageManager.generatePresignedUrls(
				organizationId,
				transformedKey,
				`image/${format}`,
				3600,
			);

			const uploadResponse = await fetch(uploadUrls.uploadUrl, {
				method: "PUT",
				body: transformedBuffer,
				headers: {
					"Content-Type": `image/${format}`,
				},
			});

			if (!uploadResponse.ok) {
				throw new Error("Failed to upload transformed image");
			}

			return {
				success: true,
				transformedUrl: uploadUrls.downloadUrl,
				metadata: {
					width: metadata.width,
					height: metadata.height,
					format: metadata.format,
					size: transformedBuffer.length,
					channels: metadata.channels,
				},
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Transformation failed",
			};
		}
	}

	// Generate multiple image variants
	async generateImageVariants(
		assetId: string,
		organizationId: string,
		variants: Array<{ name: string; transformation: ImageTransformation }>,
		userId: string,
	): Promise<{
		success: boolean;
		variants?: Array<{ name: string; url: string; metadata: any }>;
		error?: string;
	}> {
		try {
			const results: Array<{ name: string; url: string; metadata: any }> = [];

			for (const variant of variants) {
				const result = await this.transformImage(
					assetId,
					organizationId,
					variant.transformation,
					userId,
				);

				if (result.success && result.transformedUrl) {
					results.push({
						name: variant.name,
						url: result.transformedUrl,
						metadata: result.metadata || {},
					});
				}
			}

			return {
				success: true,
				variants: results,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Variant generation failed",
			};
		}
	}

	// Crop image
	async cropImage(
		assetId: string,
		organizationId: string,
		cropParams: CropParams,
		userId: string,
		options?: {
			format?: "jpeg" | "png" | "webp";
			quality?: number;
		},
	): Promise<{
		success: boolean;
		croppedUrl?: string;
		metadata?: any;
		error?: string;
	}> {
		const transformation: ImageTransformation = {
			format: options?.format || "jpeg",
			quality: options?.quality || 85,
		};

		try {
			// Get asset
			const asset = await db.query.assets.findFirst({
				where: and(
					eq(assets.id, assetId),
					eq(assets.organizationId, organizationId),
					isNull(assets.deletedAt),
				),
			});

			if (!asset) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Asset not found",
				});
			}

			// Get file and apply crop
			const downloadUrl = await storageManager.generatePresignedUrls(
				organizationId,
				asset.storageKey,
				asset.mimeType,
				3600,
			);

			const response = await fetch(downloadUrl.downloadUrl);
			const buffer = await response.arrayBuffer();

			const croppedBuffer = await sharp(Buffer.from(buffer))
				.extract({
					left: cropParams.x,
					top: cropParams.y,
					width: cropParams.width,
					height: cropParams.height,
				})
				.jpeg({ quality: transformation.quality })
				.toBuffer();

			const metadata = await sharp(croppedBuffer).metadata();

			// Upload cropped image
			const croppedKey = `${asset.storageKey.replace(/\.[^/.]+$/, "")}_cropped_${Date.now()}.${transformation.format}`;
			const uploadUrls = await storageManager.generatePresignedUrls(
				organizationId,
				croppedKey,
				`image/${transformation.format}`,
				3600,
			);

			const uploadResponse = await fetch(uploadUrls.uploadUrl, {
				method: "PUT",
				body: croppedBuffer,
				headers: {
					"Content-Type": `image/${transformation.format}`,
				},
			});

			if (!uploadResponse.ok) {
				throw new Error("Failed to upload cropped image");
			}

			return {
				success: true,
				croppedUrl: uploadUrls.downloadUrl,
				metadata: {
					width: metadata.width,
					height: metadata.height,
					format: metadata.format,
					size: croppedBuffer.length,
				},
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Crop failed",
			};
		}
	}

	// Generate thumbnails for video (placeholder - requires ffmpeg)
	async generateVideoThumbnails(
		assetId: string,
		organizationId: string,
		options: ThumbnailOptions,
		userId: string,
	): Promise<{
		success: boolean;
		thumbnails?: Array<{ timestamp: number; url: string }>;
		error?: string;
	}> {
		try {
			// Get asset
			const asset = await db.query.assets.findFirst({
				where: and(
					eq(assets.id, assetId),
					eq(assets.organizationId, organizationId),
					isNull(assets.deletedAt),
				),
			});

			if (!asset) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Asset not found",
				});
			}

			if (!asset.fileType.startsWith("video/")) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Asset is not a video",
				});
			}

			// TODO: Implement video thumbnail generation using ffmpeg
			// This would involve:
			// 1. Download video file
			// 2. Use ffmpeg to extract frames at specified timestamps
			// 3. Upload thumbnails to storage
			// 4. Return thumbnail URLs

			// For now, return placeholder
			const timestamps = options.timestamps || [0, 10, 30, 60];
			const thumbnails = timestamps.map((timestamp) => ({
				timestamp,
				url: "/placeholder-thumbnail.jpg",
			}));

			return {
				success: true,
				thumbnails,
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

	// Convert asset format
	async convertFormat(
		assetId: string,
		organizationId: string,
		targetFormat: string,
		quality: number,
		userId: string,
	): Promise<{
		success: boolean;
		convertedUrl?: string;
		metadata?: any;
		error?: string;
	}> {
		try {
			// Get asset
			const asset = await db.query.assets.findFirst({
				where: and(
					eq(assets.id, assetId),
					eq(assets.organizationId, organizationId),
					isNull(assets.deletedAt),
				),
			});

			if (!asset) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Asset not found",
				});
			}

			// For images, use sharp
			if (asset.fileType.startsWith("image/")) {
				return await this.transformImage(
					assetId,
					organizationId,
					{
						format: targetFormat as "jpeg" | "png" | "webp" | "avif",
						quality,
					},
					userId,
				);
			}

			// For videos/other formats, would need appropriate libraries
			// TODO: Implement video format conversion using ffmpeg
			// TODO: Implement document format conversion using appropriate tools

			return {
				success: false,
				error: "Format conversion not supported for this file type",
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Format conversion failed",
			};
		}
	}

	// Batch transform multiple assets
	async batchTransform(
		assetIds: string[],
		organizationId: string,
		transformation: ImageTransformation,
		userId: string,
		options?: {
			concurrency?: number;
			onProgress?: (completed: number, total: number) => void;
		},
	): Promise<{
		success: boolean;
		results: Array<{
			assetId: string;
			success: boolean;
			url?: string;
			error?: string;
		}>;
	}> {
		const concurrency = options?.concurrency || 3;
		const results: Array<{
			assetId: string;
			success: boolean;
			url?: string;
			error?: string;
		}> = [];

		// Process in batches
		for (let i = 0; i < assetIds.length; i += concurrency) {
			const batch = assetIds.slice(i, i + concurrency);

			const batchResults = await Promise.all(
				batch.map(async (assetId) => {
					try {
						const result = await this.transformImage(
							assetId,
							organizationId,
							transformation,
							userId,
						);

						return {
							assetId,
							success: result.success,
							url: result.transformedUrl,
							error: result.error,
						};
					} catch (error) {
						return {
							assetId,
							success: false,
							error:
								error instanceof Error ? error.message : "Transform failed",
						};
					}
				}),
			);

			results.push(...batchResults);

			// Report progress
			options?.onProgress?.(results.length, assetIds.length);
		}

		const successCount = results.filter((r) => r.success).length;

		return {
			success: successCount > 0,
			results,
		};
	}

	// Apply filter presets
	async applyFilterPreset(
		assetId: string,
		organizationId: string,
		filterName: string,
		userId: string,
	): Promise<{
		success: boolean;
		filteredUrl?: string;
		error?: string;
	}> {
		// Define filter presets
		const filterPresets: Record<string, ImageTransformation> = {
			vintage: {
				sepia: true,
				contrast: 1.1,
				saturation: 0.8,
				brightness: 0.9,
			},
			dramatic: {
				contrast: 1.3,
				saturation: 1.2,
				sharpen: 1.5,
			},
			soft: {
				blur: 0.5,
				brightness: 1.1,
				contrast: 0.9,
			},
			blackAndWhite: {
				grayscale: true,
				contrast: 1.1,
			},
			vibrant: {
				saturation: 1.4,
				contrast: 1.1,
				sharpen: 1.2,
			},
		};

		const preset = filterPresets[filterName];
		if (!preset) {
			return {
				success: false,
				error: "Filter preset not found",
			};
		}

		return await this.transformImage(assetId, organizationId, preset, userId);
	}

	// Get transformation job status
	getJobStatus(jobId: string): TransformationJob | null {
		return this.jobs.get(jobId) || null;
	}

	// Create transformation job (for async processing)
	createTransformationJob(
		assetId: string,
		transformations: (ImageTransformation | VideoTransformation)[],
	): string {
		const jobId = crypto.randomUUID();
		const job: TransformationJob = {
			id: jobId,
			assetId,
			transformations,
			status: "pending",
			progress: 0,
			createdAt: new Date(),
		};

		this.jobs.set(jobId, job);
		return jobId;
	}

	// Get available filter presets
	getFilterPresets(): Array<{
		name: string;
		description: string;
		preview?: string;
	}> {
		return [
			{
				name: "vintage",
				description: "Warm, nostalgic sepia tones",
				preview: "/filter-previews/vintage.jpg",
			},
			{
				name: "dramatic",
				description: "High contrast and saturation",
				preview: "/filter-previews/dramatic.jpg",
			},
			{
				name: "soft",
				description: "Gentle blur and soft lighting",
				preview: "/filter-previews/soft.jpg",
			},
			{
				name: "blackAndWhite",
				description: "Classic monochrome",
				preview: "/filter-previews/bw.jpg",
			},
			{
				name: "vibrant",
				description: "Enhanced colors and sharpness",
				preview: "/filter-previews/vibrant.jpg",
			},
		];
	}
}

export const assetTransformer = new AssetTransformationService();
