import { describe, expect, it } from "@jest/globals";
import {
	checkStorageQuota,
	formatFileSize,
	getFileCategory,
	getMimeTypeFromExtension,
	SUPPORTED_FILE_TYPES,
	sanitizeFileName,
	validateBulkUpload,
	validateFileName,
	validateFileSize,
	validateFileType,
} from "../validation";

describe("File Validation", () => {
	describe("validateFileType", () => {
		it("should validate supported image types", () => {
			const result = validateFileType("test.jpg", "image/jpeg");
			expect(result.isValid).toBe(true);
			expect(result.category).toBe("image");
		});

		it("should validate supported video types", () => {
			const result = validateFileType("test.mp4", "video/mp4");
			expect(result.isValid).toBe(true);
			expect(result.category).toBe("video");
		});

		it("should reject unsupported file types", () => {
			const result = validateFileType("test.exe", "application/octet-stream");
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("Unsupported file type");
		});

		it("should validate against specific allowed types", () => {
			const result = validateFileType("test.jpg", "image/jpeg", ["image/*"]);
			expect(result.isValid).toBe(true);
		});

		it("should reject files not in allowed types", () => {
			const result = validateFileType("test.mp4", "video/mp4", ["image/*"]);
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("File type not allowed");
		});

		it("should detect mime type mismatch", () => {
			const result = validateFileType("test.jpg", "video/mp4");
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("does not match content type");
		});
	});

	describe("validateFileSize", () => {
		it("should allow files within size limit", () => {
			const result = validateFileSize(5 * 1024 * 1024, 10); // 5MB file, 10MB limit
			expect(result.isValid).toBe(true);
		});

		it("should reject files exceeding size limit", () => {
			const result = validateFileSize(15 * 1024 * 1024, 10); // 15MB file, 10MB limit
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("File size exceeds limit");
		});
	});

	describe("validateFileName", () => {
		it("should allow valid file names", () => {
			const result = validateFileName("document.pdf");
			expect(result.isValid).toBe(true);
		});

		it("should reject files with invalid characters", () => {
			const result = validateFileName("file<name>.pdf");
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("invalid characters");
		});

		it("should reject files without extensions", () => {
			const result = validateFileName("filename");
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("valid extension");
		});

		it("should reject reserved system names", () => {
			const result = validateFileName("CON.txt");
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("reserved system name");
		});

		it("should reject overly long file names", () => {
			const longName = "a".repeat(250) + ".txt";
			const result = validateFileName(longName);
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("too long");
		});
	});

	describe("sanitizeFileName", () => {
		it("should replace invalid characters", () => {
			const result = sanitizeFileName("file<name>.pdf");
			expect(result).toBe("file_name_.pdf");
		});

		it("should truncate long file names", () => {
			const longName = "a".repeat(300) + ".txt";
			const result = sanitizeFileName(longName);
			expect(result.length).toBeLessThanOrEqual(255);
			expect(result.endsWith(".txt")).toBe(true);
		});
	});

	describe("getFileCategory", () => {
		it("should categorize image files", () => {
			expect(getFileCategory("image/jpeg")).toBe("image");
			expect(getFileCategory("image/png")).toBe("image");
		});

		it("should categorize video files", () => {
			expect(getFileCategory("video/mp4")).toBe("video");
			expect(getFileCategory("video/quicktime")).toBe("video");
		});

		it("should return 'other' for unknown types", () => {
			expect(getFileCategory("application/unknown")).toBe("other");
		});
	});

	describe("getMimeTypeFromExtension", () => {
		it("should detect common file types", () => {
			expect(getMimeTypeFromExtension("test.jpg")).toBe("image/jpeg");
			expect(getMimeTypeFromExtension("test.pdf")).toBe("application/pdf");
			expect(getMimeTypeFromExtension("test.mp4")).toBe("video/mp4");
		});

		it("should return null for unknown extensions", () => {
			expect(getMimeTypeFromExtension("test.unknown")).toBeNull();
		});
	});

	describe("checkStorageQuota", () => {
		it("should allow upload within quota", () => {
			const result = checkStorageQuota(
				500 * 1024 * 1024, // 500MB current
				100 * 1024 * 1024, // 100MB new file
				1, // 1GB limit
			);
			expect(result.isValid).toBe(true);
		});

		it("should reject upload exceeding quota", () => {
			const result = checkStorageQuota(
				900 * 1024 * 1024, // 900MB current
				200 * 1024 * 1024, // 200MB new file
				1, // 1GB limit
			);
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("Storage quota exceeded");
		});
	});

	describe("validateBulkUpload", () => {
		const validFiles = [
			{ name: "image1.jpg", size: 1024 * 1024, type: "image/jpeg" },
			{ name: "image2.png", size: 2 * 1024 * 1024, type: "image/png" },
			{ name: "document.pdf", size: 500 * 1024, type: "application/pdf" },
		];

		it("should validate all files in bulk", () => {
			const result = validateBulkUpload(validFiles, {
				maxFileSizeMB: 50,
				maxStorageGB: 10,
				allowedFileTypes: ["image/*", "application/pdf"],
				maxFilesPerUpload: 10,
			});

			expect(result.isValid).toBe(true);
			expect(result.validFiles).toBe(3);
			expect(result.errors).toHaveLength(0);
		});

		it("should reject bulk upload with too many files", () => {
			const result = validateBulkUpload(validFiles, {
				maxFileSizeMB: 50,
				maxStorageGB: 10,
				allowedFileTypes: ["image/*", "application/pdf"],
				maxFilesPerUpload: 2,
			});

			expect(result.isValid).toBe(false);
			expect(
				result.errors.some((error) => error.includes("Too many files")),
			).toBe(true);
		});

		it("should identify invalid files in bulk", () => {
			const filesWithInvalid = [
				...validFiles,
				{ name: "virus.exe", size: 1024, type: "application/octet-stream" },
				{ name: "large.mp4", size: 100 * 1024 * 1024, type: "video/mp4" },
			];

			const result = validateBulkUpload(filesWithInvalid, {
				maxFileSizeMB: 50,
				maxStorageGB: 10,
				allowedFileTypes: ["image/*", "application/pdf"],
				maxFilesPerUpload: 10,
			});

			expect(result.isValid).toBe(false);
			expect(result.validFiles).toBe(3);
			expect(result.errors.length).toBeGreaterThan(0);
		});
	});

	describe("formatFileSize", () => {
		it("should format bytes correctly", () => {
			expect(formatFileSize(1024)).toBe("1.0 KB");
			expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
			expect(formatFileSize(1024 * 1024 * 1024)).toBe("1.0 GB");
			expect(formatFileSize(500)).toBe("500 B");
		});

		it("should handle decimal values", () => {
			expect(formatFileSize(1536)).toBe("1.5 KB"); // 1.5KB
			expect(formatFileSize(2.5 * 1024 * 1024)).toBe("2.5 MB"); // 2.5MB
		});
	});

	describe("SUPPORTED_FILE_TYPES", () => {
		it("should have all required categories", () => {
			expect(SUPPORTED_FILE_TYPES).toHaveProperty("image");
			expect(SUPPORTED_FILE_TYPES).toHaveProperty("video");
			expect(SUPPORTED_FILE_TYPES).toHaveProperty("document");
			expect(SUPPORTED_FILE_TYPES).toHaveProperty("design");
			expect(SUPPORTED_FILE_TYPES).toHaveProperty("font");
		});

		it("should have consistent types and extensions", () => {
			Object.values(SUPPORTED_FILE_TYPES).forEach((category) => {
				expect(category).toHaveProperty("types");
				expect(category).toHaveProperty("extensions");
				expect(Array.isArray(category.types)).toBe(true);
				expect(Array.isArray(category.extensions)).toBe(true);
			});
		});
	});
});
