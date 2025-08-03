// @ts-ignore - no types available for exif-parser\nimport * as exifParser from "exif-parser";

import { eq } from "drizzle-orm";
import { getAverageColor } from "fast-average-color-node";
import sharp from "sharp";
import { db } from "~/server/db";
import { assetMetadata, assets } from "~/server/db/schema";

type AssetType = typeof assets.$inferSelect;

export interface ExtractedMetadata {
	// Dimensions
	width?: number;
	height?: number;
	duration?: number;
	pageCount?: number;

	// EXIF data
	exifData?: Record<string, any>;

	// Colors
	dominantColors?: string[];
	colorPalette?: string[];

	// Technical
	codec?: string;
	bitrate?: number;
	frameRate?: number;
	sampleRate?: number;
	channels?: number;

	// Content
	hasTransparency?: boolean;
	isAnimated?: boolean;
	extractedText?: string;
	language?: string;

	// Custom metadata
	customMetadata?: Record<string, any>;
}

export interface MetadataExtractor {
	supportedMimeTypes: string[];
	extract(filePath: string, mimeType: string): Promise<ExtractedMetadata>;
}

// Image metadata extractor
export class ImageMetadataExtractor implements MetadataExtractor {
	supportedMimeTypes = [
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
		"image/svg+xml",
		"image/tiff",
		"image/bmp",
	];

	async extract(
		filePath: string,
		mimeType: string,
	): Promise<ExtractedMetadata> {
		const metadata: ExtractedMetadata = {};

		try {
			// Get basic image info using sharp
			const image = sharp(filePath);
			const info = await image.metadata();

			metadata.width = info.width;
			metadata.height = info.height;
			metadata.hasTransparency = info.hasAlpha;
			metadata.isAnimated = info.pages ? info.pages > 1 : false;

			// Extract EXIF data for JPEG images
			if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
				try {
					const buffer = await image.toBuffer();
					// @ts-ignore\n					const parser = exifParser.create(buffer);
					const exifResult = parser.parse();
					metadata.exifData = exifResult.tags;
				} catch (exifError) {
					console.warn("Failed to extract EXIF data:", exifError);
				}
			}

			// Extract dominant colors
			try {
				const color = await getAverageColor(filePath);
				metadata.dominantColors = [color.hex];

				// Generate a simple color palette
				const palette = await this.generateColorPalette(filePath);
				metadata.colorPalette = palette;
			} catch (colorError) {
				console.warn("Failed to extract colors:", colorError);
			}

			// Add custom metadata based on image characteristics
			metadata.customMetadata = {
				aspectRatio:
					info.width && info.height
						? (info.width / info.height).toFixed(2)
						: null,
				megapixels:
					info.width && info.height
						? ((info.width * info.height) / 1000000).toFixed(2)
						: null,
				format: info.format,
				space: info.space,
				density: info.density,
			};
		} catch (error) {
			console.error("Error extracting image metadata:", error);
			throw error;
		}

		return metadata;
	}

	private async generateColorPalette(filePath: string): Promise<string[]> {
		try {
			// Resize image for faster processing
			const buffer = await sharp(filePath)
				.resize(100, 100, { fit: "inside" })
				.raw()
				.toBuffer();

			// Simple color quantization
			const colors = new Set<string>();
			const pixelCount = buffer.length / 3;
			const step = Math.max(1, Math.floor(pixelCount / 10));

			for (let i = 0; i < buffer.length; i += step * 3) {
				const r = Math.round(buffer[i]! / 51) * 51;
				const g = Math.round(buffer[i + 1]! / 51) * 51;
				const b = Math.round(buffer[i + 2]! / 51) * 51;
				const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
				colors.add(hex);
			}

			return Array.from(colors).slice(0, 8);
		} catch (error) {
			console.warn("Failed to generate color palette:", error);
			return [];
		}
	}
}

// Video metadata extractor (placeholder - requires ffmpeg)
export class VideoMetadataExtractor implements MetadataExtractor {
	supportedMimeTypes = [
		"video/mp4",
		"video/webm",
		"video/quicktime",
		"video/x-msvideo",
		"video/x-matroska",
		"video/ogg",
	];

	async extract(
		filePath: string,
		mimeType: string,
	): Promise<ExtractedMetadata> {
		const metadata: ExtractedMetadata = {};

		// TODO: Implement video metadata extraction using ffmpeg-fluent or similar
		// This would extract:
		// - Duration, width, height
		// - Codec, bitrate, frameRate
		// - First frame as thumbnail
		// - Scene detection

		metadata.customMetadata = {
			videoFormat: mimeType.split("/")[1],
			requiresTranscoding: false,
		};

		return metadata;
	}
}

// Document metadata extractor (placeholder - requires pdf-parse, etc.)
export class DocumentMetadataExtractor implements MetadataExtractor {
	supportedMimeTypes = [
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"text/plain",
		"text/csv",
	];

	async extract(
		filePath: string,
		mimeType: string,
	): Promise<ExtractedMetadata> {
		const metadata: ExtractedMetadata = {};

		// TODO: Implement document metadata extraction
		// This would extract:
		// - Page count
		// - Text content for search
		// - Author, title, creation date from document properties
		// - Language detection

		metadata.customMetadata = {
			documentType: mimeType.includes("pdf") ? "pdf" : "office",
			isSearchable: true,
		};

		return metadata;
	}
}

// Main metadata extraction service
export class MetadataExtractionService {
	private extractors: Map<string, MetadataExtractor>;

	constructor() {
		this.extractors = new Map();

		// Register extractors
		const imageExtractor = new ImageMetadataExtractor();
		const videoExtractor = new VideoMetadataExtractor();
		const documentExtractor = new DocumentMetadataExtractor();

		// Register each extractor for its supported mime types
		imageExtractor.supportedMimeTypes.forEach((type) =>
			this.extractors.set(type, imageExtractor),
		);
		videoExtractor.supportedMimeTypes.forEach((type) =>
			this.extractors.set(type, videoExtractor),
		);
		documentExtractor.supportedMimeTypes.forEach((type) =>
			this.extractors.set(type, documentExtractor),
		);
	}

	async extractMetadata(
		assetId: string,
		filePath: string,
		mimeType: string,
	): Promise<ExtractedMetadata | null> {
		try {
			const extractor = this.extractors.get(mimeType);
			if (!extractor) {
				console.warn(
					`No metadata extractor available for mime type: ${mimeType}`,
				);
				return null;
			}

			const metadata = await extractor.extract(filePath, mimeType);

			// Store metadata in database
			await this.storeMetadata(assetId, metadata);

			return metadata;
		} catch (error) {
			console.error(`Failed to extract metadata for asset ${assetId}:`, error);
			return null;
		}
	}

	private async storeMetadata(
		assetId: string,
		metadata: ExtractedMetadata,
	): Promise<void> {
		try {
			// Check if metadata already exists
			const existing = await db.query.assetMetadata.findFirst({
				where: eq(assetMetadata.assetId, assetId),
			});

			const metadataData = {
				assetId,
				width: metadata.width,
				height: metadata.height,
				duration: metadata.duration,
				pageCount: metadata.pageCount,
				exifData: metadata.exifData,
				dominantColors: metadata.dominantColors,
				colorPalette: metadata.colorPalette,
				codec: metadata.codec,
				bitrate: metadata.bitrate,
				frameRate: metadata.frameRate,
				sampleRate: metadata.sampleRate,
				channels: metadata.channels,
				hasTransparency: metadata.hasTransparency,
				isAnimated: metadata.isAnimated,
				extractedText: metadata.extractedText,
				language: metadata.language,
				customMetadata: metadata.customMetadata,
				extractedAt: new Date(),
				extractionVersion: "1.0.0",
			};

			if (existing) {
				await db
					.update(assetMetadata)
					.set(metadataData)
					.where(eq(assetMetadata.assetId, assetId));
			} else {
				await db.insert(assetMetadata).values(metadataData);
			}

			// Update asset processing status
			await db
				.update(assets)
				.set({
					processingStatus: "completed",
					updatedAt: new Date(),
				})
				.where(eq(assets.id, assetId));
		} catch (error) {
			console.error(`Failed to store metadata for asset ${assetId}:`, error);

			// Update asset with error status
			await db
				.update(assets)
				.set({
					processingStatus: "failed",
					processingError:
						error instanceof Error
							? error.message
							: "Metadata extraction failed",
					updatedAt: new Date(),
				})
				.where(eq(assets.id, assetId));

			throw error;
		}
	}

	async reprocessAssetMetadata(
		assetId: string,
	): Promise<ExtractedMetadata | null> {
		try {
			// Get asset details
			const asset = await db.query.assets.findFirst({
				where: eq(assets.id, assetId),
			});

			if (!asset) {
				throw new Error("Asset not found");
			}

			// TODO: Get file path from storage service
			const filePath = ""; // This would come from storage service

			return await this.extractMetadata(assetId, filePath, asset.mimeType);
		} catch (error) {
			console.error(
				`Failed to reprocess metadata for asset ${assetId}:`,
				error,
			);
			return null;
		}
	}

	// Batch process multiple assets
	async batchExtractMetadata(
		assetIds: string[],
		options?: { concurrency?: number },
	): Promise<Map<string, ExtractedMetadata | null>> {
		const results = new Map<string, ExtractedMetadata | null>();
		const concurrency = options?.concurrency || 5;

		// Process in batches
		for (let i = 0; i < assetIds.length; i += concurrency) {
			const batch = assetIds.slice(i, i + concurrency);
			const batchResults = await Promise.all(
				batch.map((assetId) => this.reprocessAssetMetadata(assetId)),
			);

			batch.forEach((assetId, index) => {
				results.set(assetId, batchResults[index]!);
			});
		}

		return results;
	}
}

export const metadataExtractor = new MetadataExtractionService();
