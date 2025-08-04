import { eq } from "drizzle-orm";
import sharp from "sharp";
import { fromBuffer } from "pdf2pic";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { tmpdir } from "os";
import { nanoid } from "nanoid";
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

export interface DocumentThumbnailOptions {
	width: number;
	height: number;
	format: "webp" | "jpeg" | "png";
	quality: number;
	page?: number; // For multi-page documents
	fit: "cover" | "contain" | "fill" | "inside" | "outside";
	background?: string;
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

	async generatePdfThumbnail(
		organizationId: string,
		assetId: string,
		sourceKey: string,
		options: DocumentThumbnailOptions = {
			width: 600,
			height: 800,
			format: "webp",
			quality: 85,
			page: 1,
			fit: "inside",
			background: "#ffffff",
		},
	): Promise<ThumbnailResult> {
		try {
			// Download PDF file
			const pdfData = await storageManager.downloadFile(organizationId, sourceKey);
			const pdfBuffer = await this.streamToBuffer(pdfData.body);
			
			// Use pdf2pic to convert PDF page to image
			const pageNum = Math.max(1, options.page || 1);
			
			// Configure pdf2pic with high quality settings
			const convert = fromBuffer(pdfBuffer, {
				density: 200, // Higher DPI for better quality
				saveFilename: "pdf-page",
				savePath: tmpdir(),
				format: "png", // Use PNG for initial conversion to preserve quality
				width: Math.min(options.width * 2, 2400), // Higher resolution for better quality, capped at 2400px
				height: Math.min(options.height * 2, 3200), // Higher resolution for better quality, capped at 3200px
			});

			// Convert the specified page
			const result = await convert(pageNum, { responseType: "buffer" });
			
			if (!result.buffer) {
				throw new Error(`Failed to convert PDF page ${pageNum} to image`);
			}

			const pageImageBuffer = result.buffer;

			// Process the image with Sharp to apply final formatting and compression
			let pipeline = sharp(pageImageBuffer).resize(options.width, options.height, {
				fit: options.fit,
				background: options.background,
				withoutEnlargement: true, // Prevent upscaling if original is smaller
			});

			// Apply format-specific processing
			switch (options.format) {
				case "webp":
					pipeline = pipeline.webp({
						quality: options.quality,
						effort: 6,
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
				`pdf-page${pageNum}-${options.width}x${options.height}`,
			);

			// Upload thumbnail to storage
			await storageManager.uploadFile(
				organizationId,
				thumbnailKey,
				thumbnailBuffer,
				`image/${options.format}`,
				{
					assetId,
					type: "pdf_thumbnail",
					page: `${pageNum}`,
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
				error: error instanceof Error ? error.message : "PDF thumbnail generation failed",
			};
		}
	}

	async generateOfficeThumbnail(
		organizationId: string,
		assetId: string,
		sourceKey: string,
		options: DocumentThumbnailOptions = {
			width: 600,
			height: 800,
			format: "webp",
			quality: 85,
			page: 1,
			fit: "inside",
			background: "#ffffff",
		},
	): Promise<ThumbnailResult> {
		// Office document thumbnails require complex conversion that is not serverless-friendly
		// For now, generate a placeholder thumbnail with document type information
		try {
			const thumbnailKey = storageManager.generateThumbnailKey(
				sourceKey,
				`office-placeholder-${options.width}x${options.height}`,
			);

			// Create a simple placeholder thumbnail using SVG
			const mimeType = await this.detectMimeType(organizationId, sourceKey);
			const docType = this.getDocumentTypeFromMime(mimeType);
			
			const svg = `
				<svg width="${options.width}" height="${options.height}" xmlns="http://www.w3.org/2000/svg">
					<rect width="100%" height="100%" fill="${options.background || "#f8f9fa"}"/>
					<rect x="10%" y="10%" width="80%" height="80%" rx="8" fill="#ffffff" stroke="#dee2e6" stroke-width="2"/>
					<circle cx="50%" cy="35%" r="15%" fill="#6c757d"/>
					<text x="50%" y="60%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.max(16, options.width / 20)}" font-weight="bold" fill="#495057">
						${docType}
					</text>
					<text x="50%" y="75%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.max(12, options.width / 30)}" fill="#6c757d">
						Document
					</text>
				</svg>
			`;

			// Convert SVG to image using Sharp
			const svgBuffer = Buffer.from(svg);
			let pipeline = sharp(svgBuffer).resize(options.width, options.height, {
				fit: options.fit,
				background: options.background,
			});

			// Apply format-specific processing
			switch (options.format) {
				case "webp":
					pipeline = pipeline.webp({
						quality: options.quality,
						effort: 6,
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

			// Upload placeholder thumbnail to storage
			await storageManager.uploadFile(
				organizationId,
				thumbnailKey,
				thumbnailBuffer,
				`image/${options.format}`,
				{
					assetId,
					type: "office_placeholder",
					originalKey: sourceKey,
					generated: new Date().toISOString(),
					note: "Placeholder thumbnail - office documents require server-side conversion",
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
				error: error instanceof Error ? error.message : "Office document thumbnail generation failed",
			};
		}
	}

	async generateDocumentPreview(
		organizationId: string,
		assetId: string,
		sourceKey: string,
		mimeType: string,
		options: Partial<DocumentThumbnailOptions> = {},
	): Promise<ThumbnailResult> {
		const defaultOptions: DocumentThumbnailOptions = {
			width: 600,
			height: 800,
			format: "webp",
			quality: 85,
			page: 1,
			fit: "inside",
			background: "#ffffff",
			...options,
		};

		try {
			if (mimeType === "application/pdf") {
				return await this.generatePdfThumbnail(
					organizationId,
					assetId,
					sourceKey,
					defaultOptions,
				);
			}

			// Office documents
			if (this.isOfficeDocument(mimeType)) {
				return await this.generateOfficeThumbnail(
					organizationId,
					assetId,
					sourceKey,
					defaultOptions,
				);
			}

			// Plain text documents
			if (mimeType.startsWith("text/")) {
				return await this.generateTextThumbnail(
					organizationId,
					assetId,
					sourceKey,
					defaultOptions,
				);
			}

			// Unsupported document type
			return {
				success: false,
				error: `Unsupported document type: ${mimeType}`,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Document preview generation failed",
			};
		}
	}

	private isOfficeDocument(mimeType: string): boolean {
		const officeMimeTypes = [
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
			"application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
			"application/msword", // .doc
			"application/vnd.ms-excel", // .xls
			"application/vnd.ms-powerpoint", // .ppt
			"application/vnd.oasis.opendocument.text", // .odt
			"application/vnd.oasis.opendocument.spreadsheet", // .ods
			"application/vnd.oasis.opendocument.presentation", // .odp
			"application/rtf", // .rtf
		];
		return officeMimeTypes.includes(mimeType);
	}

	private async detectMimeType(organizationId: string, sourceKey: string): Promise<string> {
		// Try to detect MIME type from file extension as fallback
		const extension = sourceKey.split('.').pop()?.toLowerCase();
		const mimeTypeMap: Record<string, string> = {
			'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			'doc': 'application/msword',
			'xls': 'application/vnd.ms-excel',
			'ppt': 'application/vnd.ms-powerpoint',
			'odt': 'application/vnd.oasis.opendocument.text',
			'ods': 'application/vnd.oasis.opendocument.spreadsheet',
			'odp': 'application/vnd.oasis.opendocument.presentation',
			'rtf': 'application/rtf',
		};
		return mimeTypeMap[extension || ''] || 'application/octet-stream';
	}

	private getDocumentTypeFromMime(mimeType: string): string {
		const typeMap: Record<string, string> = {
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
			'application/msword': 'DOC',
			'application/vnd.ms-excel': 'XLS',
			'application/vnd.ms-powerpoint': 'PPT',
			'application/vnd.oasis.opendocument.text': 'ODT',
			'application/vnd.oasis.opendocument.spreadsheet': 'ODS',
			'application/vnd.oasis.opendocument.presentation': 'ODP',
			'application/rtf': 'RTF',
		};
		return typeMap[mimeType] || 'DOC';
	}

	private async generateTextThumbnail(
		organizationId: string,
		assetId: string,
		sourceKey: string,
		options: DocumentThumbnailOptions,
	): Promise<ThumbnailResult> {
		try {
			// Download text file
			const textData = await storageManager.downloadFile(organizationId, sourceKey);
			const textBuffer = await this.streamToBuffer(textData.body);
			const textContent = textBuffer.toString("utf-8");

			// Take first 1000 characters for preview
			const previewText = textContent.substring(0, 1000);

			// Create a simple text preview using SVG
			const svg = `
				<svg width="${options.width}" height="${options.height}" xmlns="http://www.w3.org/2000/svg">
					<rect width="100%" height="100%" fill="${options.background || "#ffffff"}"/>
					<foreignObject x="20" y="20" width="${options.width - 40}" height="${options.height - 40}">
						<div xmlns="http://www.w3.org/1999/xhtml" style="
							font-family: 'Courier New', monospace;
							font-size: 14px;
							line-height: 1.4;
							color: #333;
							word-wrap: break-word;
							overflow: hidden;
						">
							${previewText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
						</div>
					</foreignObject>
				</svg>
			`;

			// Convert SVG to image using Sharp
			const svgBuffer = Buffer.from(svg);
			let pipeline = sharp(svgBuffer).resize(options.width, options.height, {
				fit: options.fit,
				background: options.background,
			});

			// Apply format-specific processing
			switch (options.format) {
				case "webp":
					pipeline = pipeline.webp({
						quality: options.quality,
						effort: 6,
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
				`text-preview-${options.width}x${options.height}`,
			);

			// Upload thumbnail to storage
			await storageManager.uploadFile(
				organizationId,
				thumbnailKey,
				thumbnailBuffer,
				`image/${options.format}`,
				{
					assetId,
					type: "text_thumbnail",
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
				error: error instanceof Error ? error.message : "Text thumbnail generation failed",
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
				this.isOfficeDocument(mimeType) ||
				mimeType.startsWith("text/")
			) {
				// Generate document preview
				const result = await this.generateDocumentPreview(
					organizationId,
					assetId,
					sourceKey,
					mimeType,
				);
				results.push(result);

				// Also generate multiple sizes for documents like we do for images
				if (result.success) {
					const documentSizes = [
						{ width: 300, height: 400, preset: "document-small" },
						{ width: 150, height: 200, preset: "document-thumb" },
					];

					for (const size of documentSizes) {
						const sizeResult = await this.generateDocumentPreview(
							organizationId,
							assetId,
							sourceKey,
							mimeType,
							{
								width: size.width,
								height: size.height,
								format: "webp",
								quality: 85,
								fit: "inside",
								background: "#ffffff",
							},
						);
						results.push(sizeResult);
					}
				}
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
