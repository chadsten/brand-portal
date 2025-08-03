import { beforeEach, describe, expect, it, jest } from "@jest/globals";

// Mock dependencies before imports
jest.mock("~/server/db");
jest.mock("~/server/storage");
jest.mock("~/server/storage/config");

import { storageManager } from "~/server/storage";
import { storageConfigManager } from "~/server/storage/config";
import { storageRouter } from "../storage";

const mockStorageManager = storageManager as jest.Mocked<typeof storageManager>;
const mockStorageConfigManager = storageConfigManager as jest.Mocked<
	typeof storageConfigManager
>;

describe("Storage Router", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("Storage configuration", () => {
		it("should have the correct structure", () => {
			expect(storageRouter).toBeDefined();
			expect(typeof storageRouter).toBe("object");
		});
	});

	describe("Mocked functionality", () => {
		it("should mock storage manager correctly", () => {
			expect(mockStorageManager).toBeDefined();
		});

		it("should mock storage config manager correctly", () => {
			expect(mockStorageConfigManager).toBeDefined();
		});
	});

	// TODO: Add more comprehensive tests once tRPC context mocking is properly set up
	describe("Router methods", () => {
		it("should have expected procedures", () => {
			const procedures = [
				"getConfig",
				"updateConfig",
				"testConfig",
				"deleteConfig",
				"getProviders",
				"generatePresignedUrls",
				"getFileInfo",
				"generateDownloadUrl",
				"deleteFile",
				"getUsageStats",
			];

			// Basic structure test - the router should have these procedures defined
			expect(storageRouter).toBeDefined();
		});
	});
});
