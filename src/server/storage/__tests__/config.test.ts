import { beforeEach, describe, expect, it, jest } from "@jest/globals";

// Mock dependencies
jest.mock("~/server/db");
jest.mock("../index");

import { StorageConfigManager } from "../config";

describe("StorageConfigManager", () => {
	let configManager: StorageConfigManager;

	beforeEach(() => {
		jest.clearAllMocks();
		configManager = new StorageConfigManager();
	});

	describe("initialization", () => {
		it("should create instance successfully", () => {
			expect(configManager).toBeInstanceOf(StorageConfigManager);
		});
	});

	describe("listStorageProviders", () => {
		it("should return list of storage providers", async () => {
			const result = await configManager.listStorageProviders();

			expect(result).toHaveLength(5);
			expect(result[0]).toEqual({
				id: "aws",
				name: "Amazon S3",
				description: "Amazon Simple Storage Service",
				regions: expect.arrayContaining(["us-east-1", "us-west-2"]),
				features: expect.arrayContaining([
					"CDN Integration",
					"Cross-Region Replication",
				]),
			});
		});

		it("should include all major providers", async () => {
			const result = await configManager.listStorageProviders();
			const providerIds = result.map((p) => p.id);

			expect(providerIds).toContain("aws");
			expect(providerIds).toContain("digitalocean");
			expect(providerIds).toContain("cloudflare");
			expect(providerIds).toContain("wasabi");
			expect(providerIds).toContain("minio");
		});
	});

	describe("encryption methods", () => {
		it("should encrypt and decrypt values correctly", async () => {
			const originalValue = "test-secret-key";

			// Access private methods via type assertion for testing
			const configManagerAny = configManager as any;
			const encrypted = configManagerAny.encryptValue(originalValue);
			const decrypted = configManagerAny.decryptValue(encrypted);

			expect(encrypted).not.toBe(originalValue);
			expect(decrypted).toBe(originalValue);
		});

		it("should produce consistent encryption", async () => {
			const value = "consistent-test";
			const configManagerAny = configManager as any;

			const encrypted1 = configManagerAny.encryptValue(value);
			const encrypted2 = configManagerAny.encryptValue(value);

			expect(encrypted1).toBe(encrypted2);
		});
	});
});
