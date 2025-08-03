import { sql } from "drizzle-orm";
import { db } from "~/server/db";
import { organizations, storageConfigs, tiers } from "~/server/db/schema";
import { type StorageConfig, storageManager } from "./index";

export interface StorageConfigInput {
	provider: string;
	bucketName: string;
	region: string;
	endpoint?: string;
	accessKeyId: string;
	secretAccessKey: string;
	customDomain?: string;
	config?: Record<string, any>;
}

export class StorageConfigManager {
	async createOrganizationStorageConfig(
		organizationId: string,
		config: StorageConfigInput,
	): Promise<string> {
		try {
			// Validate the configuration by testing connection
			const testResult = await storageManager.testConnection({
				...config,
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			});

			if (!testResult.success) {
				throw new Error(
					`Storage configuration test failed: ${testResult.error}`,
				);
			}

			// Check if organization has custom S3 feature enabled
			const orgWithTier = await db
				.select({
					tierId: organizations.tierId,
					tierFeatures: tiers.features,
				})
				.from(organizations)
				.leftJoin(tiers, sql`${organizations.tierId} = ${tiers.id}`)
				.where(sql`${organizations.id} = ${organizationId}`)
				.limit(1);

			if (!orgWithTier[0]) {
				throw new Error("Organization not found");
			}

			const features = orgWithTier[0].tierFeatures as any;
			if (!features?.customS3) {
				throw new Error("Custom S3 storage not available in current tier");
			}

			// Encrypt sensitive values
			const encryptedConfig = {
				...config,
				accessKeyId: this.encryptValue(config.accessKeyId),
				secretAccessKey: this.encryptValue(config.secretAccessKey),
			};

			// Disable any existing config
			await db
				.update(storageConfigs)
				.set({ isActive: false })
				.where(sql`${storageConfigs.organizationId} = ${organizationId}`);

			// Create new config
			const [newConfig] = await db
				.insert(storageConfigs)
				.values({
					organizationId,
					...encryptedConfig,
					isActive: true,
				})
				.returning({ id: storageConfigs.id });

			return newConfig!.id;
		} catch (error) {
			console.error("Failed to create storage config:", error);
			throw error;
		}
	}

	async updateOrganizationStorageConfig(
		configId: string,
		organizationId: string,
		updates: Partial<StorageConfigInput>,
	): Promise<void> {
		try {
			// Get existing config
			const [existingConfig] = await db
				.select()
				.from(storageConfigs)
				.where(
					sql`${storageConfigs.id} = ${configId} AND ${storageConfigs.organizationId} = ${organizationId}`,
				)
				.limit(1);

			if (!existingConfig) {
				throw new Error("Storage configuration not found");
			}

			// Merge with existing values for testing
			const testConfig: StorageConfig = {
				provider: updates.provider || existingConfig.provider,
				bucketName: updates.bucketName || existingConfig.bucketName!,
				region: updates.region || existingConfig.region!,
				endpoint: updates.endpoint || existingConfig.endpoint || undefined,
				accessKeyId:
					updates.accessKeyId || this.decryptValue(existingConfig.accessKeyId!),
				secretAccessKey:
					updates.secretAccessKey ||
					this.decryptValue(existingConfig.secretAccessKey!),
				customDomain:
					updates.customDomain || existingConfig.customDomain || undefined,
				config:
					updates.config || (existingConfig.config as Record<string, any>),
			};

			// Test the updated configuration
			const testResult = await storageManager.testConnection(testConfig);
			if (!testResult.success) {
				throw new Error(
					`Storage configuration test failed: ${testResult.error}`,
				);
			}

			// Encrypt sensitive values if they're being updated
			const updateData: any = { ...updates };
			if (updates.accessKeyId) {
				updateData.accessKeyId = this.encryptValue(updates.accessKeyId);
			}
			if (updates.secretAccessKey) {
				updateData.secretAccessKey = this.encryptValue(updates.secretAccessKey);
			}

			// Update the configuration
			await db
				.update(storageConfigs)
				.set({
					...updateData,
					updatedAt: new Date(),
				})
				.where(
					sql`${storageConfigs.id} = ${configId} AND ${storageConfigs.organizationId} = ${organizationId}`,
				);
		} catch (error) {
			console.error("Failed to update storage config:", error);
			throw error;
		}
	}

	async deleteOrganizationStorageConfig(
		configId: string,
		organizationId: string,
	): Promise<void> {
		try {
			await db
				.delete(storageConfigs)
				.where(
					sql`${storageConfigs.id} = ${configId} AND ${storageConfigs.organizationId} = ${organizationId}`,
				);
		} catch (error) {
			console.error("Failed to delete storage config:", error);
			throw error;
		}
	}

	async getOrganizationStorageConfig(organizationId: string): Promise<{
		id: string;
		provider: string;
		bucketName: string;
		region: string;
		endpoint?: string;
		customDomain?: string;
		config?: Record<string, any>;
		isActive: boolean;
		createdAt: Date;
		updatedAt: Date;
	} | null> {
		try {
			const [config] = await db
				.select({
					id: storageConfigs.id,
					provider: storageConfigs.provider,
					bucketName: storageConfigs.bucketName,
					region: storageConfigs.region,
					endpoint: storageConfigs.endpoint,
					customDomain: storageConfigs.customDomain,
					config: storageConfigs.config,
					isActive: storageConfigs.isActive,
					createdAt: storageConfigs.createdAt,
					updatedAt: storageConfigs.updatedAt,
				})
				.from(storageConfigs)
				.where(
					sql`${storageConfigs.organizationId} = ${organizationId} AND ${storageConfigs.isActive} = true`,
				)
				.limit(1);

			if (!config || !config.bucketName || !config.region) {
				return null;
			}

			return {
				...config,
				bucketName: config.bucketName,
				region: config.region,
				endpoint: config.endpoint || undefined,
				customDomain: config.customDomain || undefined,
				config: (config.config as Record<string, any>) || {},
				isActive: config.isActive ?? true,
				createdAt: config.createdAt ?? new Date(),
				updatedAt: config.updatedAt ?? new Date(),
			};
		} catch (error) {
			console.error("Failed to get storage config:", error);
			return null;
		}
	}

	async testOrganizationStorageConfig(organizationId: string): Promise<{
		success: boolean;
		error?: string;
	}> {
		try {
			const config = await storageManager.getOrganizationConfig(organizationId);
			return await storageManager.testConnection(config);
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	async listStorageProviders(): Promise<
		Array<{
			id: string;
			name: string;
			description: string;
			regions: string[];
			features: string[];
		}>
	> {
		return [
			{
				id: "aws",
				name: "Amazon S3",
				description: "Amazon Simple Storage Service",
				regions: [
					"us-east-1",
					"us-east-2",
					"us-west-1",
					"us-west-2",
					"eu-west-1",
					"eu-west-2",
					"eu-central-1",
					"ap-southeast-1",
					"ap-southeast-2",
					"ap-northeast-1",
				],
				features: ["CDN Integration", "Cross-Region Replication", "Versioning"],
			},
			{
				id: "digitalocean",
				name: "DigitalOcean Spaces",
				description: "DigitalOcean's S3-compatible object storage",
				regions: ["nyc3", "fra1", "sgp1", "sfo3"],
				features: ["CDN Integration", "Lower Cost", "Simple Setup"],
			},
			{
				id: "cloudflare",
				name: "Cloudflare R2",
				description: "Cloudflare's S3-compatible storage with zero egress fees",
				regions: ["auto"],
				features: ["Zero Egress Fees", "Global CDN", "S3 Compatible"],
			},
			{
				id: "wasabi",
				name: "Wasabi Hot Storage",
				description: "High-performance cloud storage",
				regions: ["us-east-1", "us-west-1", "eu-central-1"],
				features: ["Fast Performance", "Predictable Pricing", "No API Charges"],
			},
			{
				id: "minio",
				name: "MinIO",
				description: "Self-hosted S3-compatible storage",
				regions: ["custom"],
				features: ["Self-Hosted", "Open Source", "Kubernetes Native"],
			},
		];
	}

	private encryptValue(value: string): string {
		// In production, use proper encryption (AES-256-GCM)
		// For now, using base64 encoding as placeholder
		return Buffer.from(value).toString("base64");
	}

	private decryptValue(encryptedValue: string): string {
		// In production, use proper decryption
		// For now, using base64 decoding as placeholder
		return Buffer.from(encryptedValue, "base64").toString();
	}
}

export const storageConfigManager = new StorageConfigManager();
