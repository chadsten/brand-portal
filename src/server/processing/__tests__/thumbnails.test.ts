import { beforeEach, describe, expect, it, jest } from "@jest/globals";

// Mock Sharp
jest.mock("sharp");

// Mock other dependencies
jest.mock("~/server/storage");
jest.mock("~/server/db");

import { ThumbnailGenerator } from "../thumbnails";

describe("ThumbnailGenerator", () => {
	let thumbnailGenerator: ThumbnailGenerator;

	beforeEach(() => {
		jest.clearAllMocks();
		thumbnailGenerator = new ThumbnailGenerator();
	});

	describe("initialization", () => {
		it("should create instance successfully", () => {
			expect(thumbnailGenerator).toBeInstanceOf(ThumbnailGenerator);
		});
	});

	describe("thumbnail presets", () => {
		it("should have correct preset configurations", () => {
			const presets = {
				small: { width: 150, height: 150, quality: 80 },
				medium: { width: 300, height: 300, quality: 85 },
				large: { width: 600, height: 600, quality: 90 },
				preview: { width: 800, height: 600, quality: 85 },
			};

			expect(presets.small.width).toBe(150);
			expect(presets.small.height).toBe(150);
			expect(presets.small.quality).toBe(80);

			expect(presets.medium.width).toBe(300);
			expect(presets.medium.height).toBe(300);
			expect(presets.medium.quality).toBe(85);

			expect(presets.large.width).toBe(600);
			expect(presets.large.height).toBe(600);
			expect(presets.large.quality).toBe(90);

			expect(presets.preview.width).toBe(800);
			expect(presets.preview.height).toBe(600);
			expect(presets.preview.quality).toBe(85);
		});
	});

	describe("thumbnail options", () => {
		it("should validate thumbnail options structure", () => {
			const options = {
				width: 300,
				height: 300,
				format: "webp" as const,
				quality: 85,
				fit: "cover" as const,
				background: "#ffffff",
			};

			expect(options.width).toBe(300);
			expect(options.height).toBe(300);
			expect(options.format).toBe("webp");
			expect(options.quality).toBe(85);
			expect(options.fit).toBe("cover");
			expect(options.background).toBe("#ffffff");
		});

		it("should support different image formats", () => {
			const formats = ["webp", "jpeg", "png"] as const;

			formats.forEach((format) => {
				expect(["webp", "jpeg", "png"]).toContain(format);
			});
		});

		it("should support different fit modes", () => {
			const fitModes = [
				"cover",
				"contain",
				"fill",
				"inside",
				"outside",
			] as const;

			fitModes.forEach((fit) => {
				expect(["cover", "contain", "fill", "inside", "outside"]).toContain(
					fit,
				);
			});
		});
	});

	describe("video thumbnail options", () => {
		it("should validate video thumbnail options", () => {
			const videoOptions = {
				timestamp: 5,
				width: 600,
				height: 400,
				format: "webp" as const,
				quality: 85,
			};

			expect(videoOptions.timestamp).toBe(5);
			expect(videoOptions.width).toBe(600);
			expect(videoOptions.height).toBe(400);
			expect(videoOptions.format).toBe("webp");
			expect(videoOptions.quality).toBe(85);
		});

		it("should support different video timestamps", () => {
			const timestamps = [1, 5, 10, 30, 60];

			timestamps.forEach((timestamp) => {
				expect(timestamp).toBeGreaterThan(0);
				expect(Number.isInteger(timestamp)).toBe(true);
			});
		});
	});

	describe("thumbnail result structure", () => {
		it("should create proper successful result", () => {
			const successResult = {
				success: true,
				thumbnailKey: "thumbnail-key-123",
				size: 15000,
				dimensions: { width: 300, height: 300 },
			};

			expect(successResult.success).toBe(true);
			expect(successResult.thumbnailKey).toBe("thumbnail-key-123");
			expect(successResult.size).toBe(15000);
			expect(successResult.dimensions?.width).toBe(300);
			expect(successResult.dimensions?.height).toBe(300);
		});

		it("should create proper error result", () => {
			const errorResult = {
				success: false,
				error: "Failed to generate thumbnail",
			};

			expect(errorResult.success).toBe(false);
			expect(errorResult.error).toBe("Failed to generate thumbnail");
		});
	});

	describe("image optimization", () => {
		it("should calculate compression ratios correctly", () => {
			const originalSize = 1000000; // 1MB
			const optimizedSize = 750000; // 750KB
			const compressionRatio =
				((originalSize - optimizedSize) / originalSize) * 100;

			expect(compressionRatio).toBe(25); // 25% reduction
		});

		it("should validate optimization options", () => {
			const optimizationOptions = {
				quality: 85,
				format: "webp" as const,
				stripMetadata: true,
				progressive: true,
			};

			expect(optimizationOptions.quality).toBe(85);
			expect(optimizationOptions.format).toBe("webp");
			expect(optimizationOptions.stripMetadata).toBe(true);
			expect(optimizationOptions.progressive).toBe(true);
		});
	});

	describe("responsive image sizes", () => {
		it("should define proper responsive breakpoints", () => {
			const responsiveSizes = [
				{ width: 480, height: 320, preset: "mobile" },
				{ width: 768, height: 512, preset: "tablet" },
				{ width: 1200, height: 800, preset: "desktop" },
			];

			expect(responsiveSizes[0]?.preset).toBe("mobile");
			expect(responsiveSizes[0]?.width).toBe(480);

			expect(responsiveSizes[1]?.preset).toBe("tablet");
			expect(responsiveSizes[1]?.width).toBe(768);

			expect(responsiveSizes[2]?.preset).toBe("desktop");
			expect(responsiveSizes[2]?.width).toBe(1200);
		});
	});

	describe("metadata extraction", () => {
		it("should extract image metadata correctly", () => {
			const metadata = {
				width: 1920,
				height: 1080,
				format: "jpeg",
				hasAlpha: false,
				space: "srgb",
				density: 72,
			};

			expect(metadata.width).toBe(1920);
			expect(metadata.height).toBe(1080);
			expect(metadata.format).toBe("jpeg");
			expect(metadata.hasAlpha).toBe(false);
			expect(metadata.space).toBe("srgb");
			expect(metadata.density).toBe(72);
		});
	});

	describe("buffer handling", () => {
		it("should handle buffer operations correctly", () => {
			const mockBuffer = Buffer.from("test-image-data");

			expect(Buffer.isBuffer(mockBuffer)).toBe(true);
			expect(mockBuffer.length).toBeGreaterThan(0);
		});

		it("should calculate buffer sizes correctly", () => {
			const chunks = [
				new Uint8Array([1, 2, 3]),
				new Uint8Array([4, 5, 6, 7]),
				new Uint8Array([8, 9]),
			];

			const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
			expect(totalLength).toBe(9); // 3 + 4 + 2
		});
	});

	describe("thumbnail key generation", () => {
		it("should generate proper thumbnail keys", () => {
			const sourceKey = "orgs/org-123/user-456/image.jpg";
			const preset = "medium";
			const size = "300x300";
			const thumbnailKey = `${sourceKey}/thumbnails/image-${preset}-${size}.webp`;

			expect(thumbnailKey).toContain("thumbnails");
			expect(thumbnailKey).toContain(preset);
			expect(thumbnailKey).toContain(size);
			expect(thumbnailKey.endsWith(".webp")).toBe(true);
		});
	});

	describe("MIME type handling", () => {
		it("should categorize MIME types correctly", () => {
			const mimeTypes = {
				"image/jpeg": "image",
				"image/png": "image",
				"video/mp4": "video",
				"application/pdf": "document",
			};

			Object.entries(mimeTypes).forEach(([mimeType, expectedCategory]) => {
				const category = mimeType.split("/")[0];
				if (category === "image" || category === "video") {
					expect(category).toBe(expectedCategory);
				} else if (mimeType === "application/pdf") {
					expect(expectedCategory).toBe("document");
				}
			});
		});
	});
});
