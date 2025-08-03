import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sql } from "drizzle-orm";
import { env } from "~/env";
import { db } from "~/server/db";
import { storageConfigs } from "~/server/db/schema";

export interface StorageConfig {
	provider: string;
	bucketName: string;
	region: string;
	endpoint?: string;
	accessKeyId: string;
	secretAccessKey: string;
	customDomain?: string;
	config?: Record<string, any>;
}

export interface UploadResult {
	key: string;
	url: string;
	size: number;
	etag?: string;
}

export interface PresignedUrls {
	uploadUrl: string;
	downloadUrl: string;
	key: string;
}

export class StorageManager {
	private clients = new Map<string, S3Client>();
	private defaultConfig: StorageConfig;

	constructor() {
		this.defaultConfig = {
			provider: "aws",
			bucketName: env.AWS_S3_BUCKET,
			region: env.AWS_REGION,
			accessKeyId: env.AWS_ACCESS_KEY_ID,
			secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
			...(env.AWS_ENDPOINT && {
				endpoint: env.AWS_ENDPOINT,
				config: { forcePathStyle: true }
			})
		};
	}

	private getS3Client(config: StorageConfig): S3Client {
		const clientKey = `${config.provider}-${config.bucketName}-${config.region}`;

		if (this.clients.has(clientKey)) {
			return this.clients.get(clientKey)!;
		}

		const clientConfig: any = {
			region: config.region,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
		};

		// Support for custom S3-compatible endpoints (MinIO, DigitalOcean Spaces, etc.)
		if (config.endpoint) {
			clientConfig.endpoint = config.endpoint;
			clientConfig.forcePathStyle = config.config?.forcePathStyle ?? true;
		}

		const client = new S3Client(clientConfig);
		this.clients.set(clientKey, client);

		return client;
	}

	async getOrganizationConfig(orgId: string): Promise<StorageConfig> {
		try {
			const [customConfig] = await db
				.select()
				.from(storageConfigs)
				.where(
					sql`${storageConfigs.organizationId} = ${orgId} AND ${storageConfigs.isActive} = true`,
				)
				.limit(1);

			if (customConfig) {
				return {
					provider: customConfig.provider,
					bucketName: customConfig.bucketName!,
					region: customConfig.region!,
					endpoint: customConfig.endpoint ?? undefined,
					accessKeyId: this.decryptValue(customConfig.accessKeyId!),
					secretAccessKey: this.decryptValue(customConfig.secretAccessKey!),
					customDomain: customConfig.customDomain ?? undefined,
					config: customConfig.config as Record<string, any>,
				};
			}

			return this.defaultConfig;
		} catch (error) {
			console.error("Failed to get organization storage config:", error);
			return this.defaultConfig;
		}
	}

	async generatePresignedUrls(
		orgId: string,
		key: string,
		contentType: string,
		expiresIn = 3600,
	): Promise<PresignedUrls> {
		const config = await this.getOrganizationConfig(orgId);
		const client = this.getS3Client(config);

		const uploadCommand = new PutObjectCommand({
			Bucket: config.bucketName,
			Key: key,
			ContentType: contentType,
		});

		const downloadCommand = new GetObjectCommand({
			Bucket: config.bucketName,
			Key: key,
		});

		const [uploadUrl, downloadUrl] = await Promise.all([
			getSignedUrl(client, uploadCommand, { expiresIn }),
			getSignedUrl(client, downloadCommand, { expiresIn }),
		]);

		return {
			uploadUrl,
			downloadUrl,
			key,
		};
	}

	async uploadFile(
		orgId: string,
		key: string,
		file: Buffer,
		contentType: string,
		metadata?: Record<string, string>,
	): Promise<UploadResult> {
		const config = await this.getOrganizationConfig(orgId);
		const client = this.getS3Client(config);

		const command = new PutObjectCommand({
			Bucket: config.bucketName,
			Key: key,
			Body: file,
			ContentType: contentType,
			Metadata: metadata,
		});

		const result = await client.send(command);

		const url = config.customDomain
			? `https://${config.customDomain}/${key}`
			: config.endpoint
				? `${config.endpoint}/${config.bucketName}/${key}`
				: `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${key}`;

		return {
			key,
			url,
			size: file.length,
			etag: result.ETag,
		};
	}

	async downloadFile(
		orgId: string,
		key: string,
	): Promise<{
		body: ReadableStream;
		contentType?: string;
		contentLength?: number;
	}> {
		const config = await this.getOrganizationConfig(orgId);
		const client = this.getS3Client(config);

		const command = new GetObjectCommand({
			Bucket: config.bucketName,
			Key: key,
		});

		const result = await client.send(command);

		return {
			body: result.Body as ReadableStream,
			contentType: result.ContentType,
			contentLength: result.ContentLength,
		};
	}

	async deleteFile(orgId: string, key: string): Promise<boolean> {
		try {
			const config = await this.getOrganizationConfig(orgId);
			const client = this.getS3Client(config);

			const command = new DeleteObjectCommand({
				Bucket: config.bucketName,
				Key: key,
			});

			await client.send(command);
			return true;
		} catch (error) {
			console.error("Failed to delete file:", error);
			return false;
		}
	}

	async getFileInfo(
		orgId: string,
		key: string,
	): Promise<{
		exists: boolean;
		size?: number;
		lastModified?: Date;
		contentType?: string;
		etag?: string;
	}> {
		try {
			const config = await this.getOrganizationConfig(orgId);
			const client = this.getS3Client(config);

			const command = new HeadObjectCommand({
				Bucket: config.bucketName,
				Key: key,
			});

			const result = await client.send(command);

			return {
				exists: true,
				size: result.ContentLength,
				lastModified: result.LastModified,
				contentType: result.ContentType,
				etag: result.ETag,
			};
		} catch (error) {
			return { exists: false };
		}
	}

	async generateDownloadUrl(
		orgId: string,
		key: string,
		expiresIn = 900, // 15 minutes
	): Promise<string> {
		const config = await this.getOrganizationConfig(orgId);
		const client = this.getS3Client(config);

		const command = new GetObjectCommand({
			Bucket: config.bucketName,
			Key: key,
		});

		return getSignedUrl(client, command, { expiresIn });
	}

	generateStorageKey(orgId: string, fileName: string, userId?: string): string {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 15);
		const userPrefix = userId ? `${userId}/` : "";

		return `orgs/${orgId}/${userPrefix}${timestamp}-${random}-${fileName}`;
	}

	generateThumbnailKey(originalKey: string, size: string): string {
		const parts = originalKey.split("/");
		const fileName = parts.pop()!;
		const path = parts.join("/");
		const [name, extension] = fileName.split(".");

		return `${path}/thumbnails/${name}-${size}.webp`;
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

	async testConnection(config: StorageConfig): Promise<{
		success: boolean;
		error?: string;
	}> {
		try {
			const client = this.getS3Client(config);

			// Test with a simple head bucket operation
			const command = new HeadObjectCommand({
				Bucket: config.bucketName,
				Key: "test-connection",
			});

			try {
				await client.send(command);
			} catch (error: any) {
				// If it's a 404, that's fine - bucket exists but object doesn't
				if (error.name !== "NotFound") {
					throw error;
				}
			}

			return { success: true };
		} catch (error: any) {
			return {
				success: false,
				error: error.message || "Unknown connection error",
			};
		}
	}
}

export const storageManager = new StorageManager();
