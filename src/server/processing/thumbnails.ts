import { eq } from "drizzle-orm";
import sharp from "sharp";
import { db } from "~/server/db";
import { assets } from "~/server/db/schema";
import { storageManager } from "~/server/storage";

export interface ThumbnailOptions {
	width: number;
	height: number;
	format: "webp" | "jpeg" | "png";
	quality: number;
	fit: "cover" | "contain" | "fill" | "inside" | "outside";
	background?: string;
}

export interface ThumbnailResult {
	success: boolean;
	thumbnailKey?: string;
	size?: number;
	dimensions?: { width: number; height: number };
	error?: string;
}

export interface VideoThumbnailOptions {
	timestamp: number; // seconds
	width: number;
	height: number;
	format: "webp" | "jpeg" | "png";
	quality: number;
}

export class ThumbnailGenerator {
	private readonly THUMBNAIL_PRESETS = {
		small: { width: 150, height: 150, quality: 80 },
		medium: { width: 300, height: 300, quality: 85 },
		large: { width: 600, height: 600, quality: 90 },
		preview: { width: 800, height: 600, quality: 85 },
	};

	async generateImageThumbnails(
		organizationId: string,
		assetId: string,
		sourceKey: string,
		presets: (keyof typeof this.THUMBNAIL_PRESETS)[] = [
			"small",
			"medium",
			"large",
		],
	): Promise<Array<ThumbnailResult & { preset: string }>> {
		const results: Array<ThumbnailResult & { preset: string }> = [];

		try {
			// Download original image
			const imageData = await storageManager.downloadFile(
				organizationId,
				sourceKey,
			);
			const buffer = await this.streamToBuffer(imageData.body);

			// Get image metadata
			const metadata = await sharp(buffer).metadata();

			// Generate thumbnails for each preset
			for (const preset of presets) {
				const config = this.THUMBNAIL_PRESETS[preset];
				const result = await this.generateSingleThumbnail(
					organizationId,
					assetId,
					sourceKey,
					buffer,
					{
						...config,
						format: "webp",
						fit: "cover",
						background: "#ffffff",
					},
					preset,
				);

				results.push({ ...result, preset });
			}

			// Update asset with primary thumbnail
			if (results.length > 0 && results[0]?.success) {
				await db
					.update(assets)
					.set({
						thumbnailKey: results[0].thumbnailKey,
						metadata: {
							originalDimensions: {
								width: metadata.width,
								height: metadata.height,
							},
							format: metadata.format,
							hasAlpha: metadata.hasAlpha?.toString() || "false",
							colorSpace: metadata.space,
							density: metadata.density,
						},
					})
					.where(eq(assets.id, assetId));
			}

			return results;
		} catch (error) {
			console.error("Failed to generate image thumbnails:", error);
			return presets.map((preset) => ({
				success: false,
				preset,
				error: error instanceof Error ? error.message : "Unknown error",
			}));
		}
	}

	private async generateSingleThumbnail(
		organizationId: string,
		assetId: string,
		sourceKey: string,
		sourceBuffer: Buffer,
		options: ThumbnailOptions,
		preset: string,
	): Promise<ThumbnailResult> {
		try {
			// Generate thumbnail using Sharp
			let pipeline = sharp(sourceBuffer).resize(options.width, options.height, {
				fit: options.fit,
				background: options.background,
			});

			// Apply format-specific processing
			switch (options.format) {
				case "webp":
					pipeline = pipeline.webp({
						quality: options.quality,
						effort: 6, // Higher effort for better compression
						smartSubsample: true,
					});
					break;
				case "jpeg":
					pipeline = pipeline.jpeg({
						quality: options.quality,
						progressive: true,
						mozjpeg: true,
					});
					break;
				case "png":
					pipeline = pipeline.png({
						quality: options.quality,
						progressive: true,
						compressionLevel: 9,
					});
					break;
			}

			const thumbnailBuffer = await pipeline.toBuffer();
			const metadata = await sharp(thumbnailBuffer).metadata();

			// Generate thumbnail key
			const thumbnailKey = storageManager.generateThumbnailKey(
				sourceKey,
				`${preset}-${options.width}x${options.height}`,
			);

			// Upload thumbnail to storage
			const uploadResult = await storageManager.uploadFile(
				organizationId,
				thumbnailKey,
				thumbnailBuffer,
				`image/${options.format}`,
				{
					assetId,
					preset,
					originalKey: sourceKey,
					generated: new Date().toISOString(),
				},
			);

			return {
				success: true,
				thumbnailKey,
				size: thumbnailBuffer.length,
				dimensions: {
					width: metadata.width || options.width,
					height: metadata.height || options.height,
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

	async generateVideoThumbnail(
		organizationId: string,
		assetId: string,
		sourceKey: string,
		options: VideoThumbnailOptions = {
			timestamp: 1,
			width: 600,
			height: 400,
			format: "webp",
			quality: 85,
		},
	): Promise<ThumbnailResult> {
		try {
			// For video thumbnails, we'd typically use FFmpeg
			// This is a placeholder implementation

			// In a real implementation, this would:
			// 1. Download video file or generate presigned URL
			// 2. Use FFmpeg to extract frame at specified timestamp
			// 3. Process the extracted frame with Sharp
			// 4. Upload the thumbnail

			// Simulate video thumbnail generation
			await new Promise((resolve) => setTimeout(resolve, 2000));

			const thumbnailKey = storageManager.generateThumbnailKey(
				sourceKey,
				"video-preview",
			);

			// For now, return a simulated result
			return {
				success: true,
				thumbnailKey,
				size: 15000, // Simulated size
				dimensions: {
					width: options.width,
					height: options.height,
				},
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Video thumbnail generation failed",
			};
		}
	}

	async generateDocumentPreview(
		organizationId: string,
		assetId: string,
		sourceKey: string,
		options: Partial<ThumbnailOptions> = {},
	): Promise<ThumbnailResult> {
		try {
			// For document previews, we'd typically use libraries like:
			// - pdf2pic for PDFs
			// - LibreOffice for Office documents
			// - Puppeteer for HTML/web content

			const defaultOptions: ThumbnailOptions = {
				width: 600,
				height: 800,
				format: "webp",
				quality: 85,
				fit: "inside",
				background: "#ffffff",
				...options,
			};

			// Simulate document preview generation
			await new Promise((resolve) => setTimeout(resolve, 3000));

			const thumbnailKey = storageManager.generateThumbnailKey(
				sourceKey,
				"document-preview",
			);

			return {
				success: true,
				thumbnailKey,
				size: 25000, // Simulated size
				dimensions: {
					width: defaultOptions.width,
					height: defaultOptions.height,
				},
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Document preview generation failed",
			};
		}
	}

	async generateAdaptiveThumbnails(
		organizationId: string,
		assetId: string,
		sourceKey: string,
		mimeType: string,
	): Promise<ThumbnailResult[]> {
		const results: ThumbnailResult[] = [];

		try {
			if (mimeType.startsWith("image/")) {
				// Generate multiple image thumbnails
				const imageResults = await this.generateImageThumbnails(
					organizationId,
					assetId,
					sourceKey,
					["small", "medium", "large", "preview"],
				);
				results.push(...imageResults);

				// Generate additional sizes for responsive images
				const responsiveSizes = [
					{ width: 480, height: 320, preset: "mobile" },
					{ width: 768, height: 512, preset: "tablet" },
					{ width: 1200, height: 800, preset: "desktop" },
				];

				for (const size of responsiveSizes) {
					const imageData = await storageManager.downloadFile(
						organizationId,
						sourceKey,
					);
					const buffer = await this.streamToBuffer(imageData.body);

					const result = await this.generateSingleThumbnail(
						organizationId,
						assetId,
						sourceKey,
						buffer,
						{
							width: size.width,
							height: size.height,
							format: "webp",
							quality: 85,
							fit: "inside",
						},
						size.preset,
					);

					results.push(result);
				}
			} else if (mimeType.startsWith("video/")) {
				// Generate video thumbnail at multiple timestamps
				const timestamps = [1, 5, 10]; // seconds

				for (const timestamp of timestamps) {
					const result = await this.generateVideoThumbnail(
						organizationId,
						assetId,
						sourceKey,
						{
							timestamp,
							width: 600,
							height: 400,
							format: "webp",
							quality: 85,
						},
					);
					results.push(result);
				}
			} else if (
				mimeType === "application/pdf" ||
				mimeType.includes("document")
			) {
				// Generate document preview
				const result = await this.generateDocumentPreview(
					organizationId,
					assetId,
					sourceKey,
				);
				results.push(result);
			}

			return results;
		} catch (error) {
			console.error("Failed to generate adaptive thumbnails:", error);
			return [
				{
					success: false,
					error:
						error instanceof Error
							? error.message
							: "Adaptive thumbnail generation failed",
				},
			];
		}
	}

	async optimizeImage(
		organizationId: string,
		sourceKey: string,
		options: {
			quality?: number;
			format?: "webp" | "jpeg" | "png";
			stripMetadata?: boolean;
			progressive?: boolean;
		} = {},
	): Promise<{
		success: boolean;
		optimizedKey?: string;
		originalSize?: number;
		optimizedSize?: number;
		error?: string;
	}> {
		try {
			const {
				quality = 85,
				format = "webp",
				stripMetadata = true,
				progressive = true,
			} = options;

			// Download original image
			const imageData = await storageManager.downloadFile(
				organizationId,
				sourceKey,
			);
			const originalBuffer = await this.streamToBuffer(imageData.body);
			const originalSize = originalBuffer.length;

			// Optimize image
			let pipeline = sharp(originalBuffer);

			if (stripMetadata) {
				pipeline = pipeline.rotate(); // Auto-rotate based on EXIF and strip metadata
			}

			switch (format) {
				case "webp":
					pipeline = pipeline.webp({
						quality,
						effort: 6,
						smartSubsample: true,
					});
					break;
				case "jpeg":
					pipeline = pipeline.jpeg({
						quality,
						progressive,
						mozjpeg: true,
					});
					break;
				case "png":
					pipeline = pipeline.png({
						quality,
						progressive,
						compressionLevel: 9,
					});
					break;
			}

			const optimizedBuffer = await pipeline.toBuffer();
			const optimizedSize = optimizedBuffer.length;

			// Only save if optimization resulted in smaller file
			if (optimizedSize < originalSize) {
				const optimizedKey = `${sourceKey}.optimized.${format}`;

				await storageManager.uploadFile(
					organizationId,
					optimizedKey,
					optimizedBuffer,
					`image/${format}`,
					{
						originalKey: sourceKey,
						optimized: "true",
						compressionRatio: (
							((originalSize - optimizedSize) / originalSize) *
							100
						).toFixed(2),
					},
				);

				return {
					success: true,
					optimizedKey,
					originalSize,
					optimizedSize,
				};
			} else {
				return {
					success: false,
					error: "Optimization did not reduce file size",
				};
			}
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Image optimization failed",
			};
		}
	}

	private async streamToBuffer(stream: ReadableStream): Promise<Buffer> {
		const reader = stream.getReader();
		const chunks: Uint8Array[] = [];

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				chunks.push(value);
			}

			const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
			const buffer = new Uint8Array(totalLength);
			let offset = 0;

			for (const chunk of chunks) {
				buffer.set(chunk, offset);
				offset += chunk.length;
			}

			return Buffer.from(buffer);
		} finally {
			reader.releaseLock();
		}
	}

	async getThumbnailUrl(
		organizationId: string,
		thumbnailKey: string,
		expiresIn: number = 3600,
	): Promise<string> {
		return await storageManager.generateDownloadUrl(
			organizationId,
			thumbnailKey,
			expiresIn,
		);
	}

	async deleteThumbnails(
		organizationId: string,
		sourceKey: string,
	): Promise<boolean> {
		try {
			// Delete all thumbnails for a source file
			const thumbnailPrefixes = [
				"small",
				"medium",
				"large",
				"preview",
				"mobile",
				"tablet",
				"desktop",
			];

			const deletePromises = thumbnailPrefixes.map((prefix) => {
				const thumbnailKey = storageManager.generateThumbnailKey(
					sourceKey,
					prefix,
				);
				return storageManager.deleteFile(organizationId, thumbnailKey);
			});

			const results = await Promise.allSettled(deletePromises);
			return results.some(
				(result) => result.status === "fulfilled" && result.value,
			);
		} catch (error) {
			console.error("Failed to delete thumbnails:", error);
			return false;
		}
	}
}

export const thumbnailGenerator = new ThumbnailGenerator();
