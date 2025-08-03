import { beforeEach, describe, expect, it, jest } from "@jest/globals";

// Mock AWS SDK
jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/s3-request-presigner");
jest.mock("~/server/db");

import { StorageManager } from "../index";

describe("StorageManager", () => {
	let storageManager: StorageManager;

	beforeEach(() => {
		jest.clearAllMocks();
		storageManager = new StorageManager();
	});

	describe("initialization", () => {
		it("should create instance successfully", () => {
			expect(storageManager).toBeInstanceOf(StorageManager);
		});
	});

	describe("generateStorageKey", () => {
		it("should generate storage key with user prefix", () => {
			const result = storageManager.generateStorageKey(
				"org-123",
				"test.jpg",
				"user-456",
			);

			expect(result).toMatch(
				/^orgs\/org-123\/user-456\/\d+-[a-z0-9]+-test\.jpg$/,
			);
		});

		it("should generate storage key without user prefix", () => {
			const result = storageManager.generateStorageKey("org-123", "test.jpg");

			expect(result).toMatch(/^orgs\/org-123\/\d+-[a-z0-9]+-test\.jpg$/);
		});
	});

	describe("generateThumbnailKey", () => {
		it("should generate thumbnail key", () => {
			const originalKey = "orgs/org-123/user-456/12345-abc-test.jpg";
			const result = storageManager.generateThumbnailKey(
				originalKey,
				"150x150",
			);

			expect(result).toBe(
				"orgs/org-123/user-456/thumbnails/12345-abc-test-150x150.webp",
			);
		});

		it("should handle nested paths", () => {
			const originalKey = "orgs/org-123/subfolder/user-456/12345-abc-test.png";
			const result = storageManager.generateThumbnailKey(
				originalKey,
				"300x300",
			);

			expect(result).toBe(
				"orgs/org-123/subfolder/user-456/thumbnails/12345-abc-test-300x300.webp",
			);
		});
	});

	describe("encryption helpers", () => {
		it("should have encryption and decryption methods", () => {
			const storageManagerAny = storageManager as any;

			expect(typeof storageManagerAny.encryptValue).toBe("function");
			expect(typeof storageManagerAny.decryptValue).toBe("function");
		});
	});
});
