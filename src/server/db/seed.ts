#!/usr/bin/env tsx

/**
 * Database seeding script for development
 * Inserts test data into the real database tables
 */

import { config } from "dotenv";
config();

// Skip env validation for seeding
process.env.SKIP_ENV_VALIDATION = "true";

import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import fs from "fs";
import path from "path";
import { fileTypeFromFile } from "file-type";
import sharp from "sharp";
// import probe from "probe-image-size"; // Not used in current implementation
import mimeTypes from "mime-types";
// @ts-ignore - No types available for exif-parser
import exifParser from "exif-parser";
// @ts-ignore - No types available for ffprobe-static
import ffprobeStatic from "ffprobe-static";
import { spawn } from "child_process";
import { promisify } from "util";

// Direct database connection for seeding (bypassing env validation)
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5433/brand_portal";
const sql = postgres(databaseUrl);
const db = drizzle(sql, { schema });
import {
	assets,
	assetVersions,
	assetPermissions,
	assetCollections,
	collectionAssets,
	collectionPermissions,
	collectionShares,
	collectionActivity,
	collectionTemplates,
	organizations,
	tiers,
	users,
	roles,
	userRoles,
} from "./schema";

// Helper functions for generating test data
const randomFromArray = <T>(array: readonly T[]): T => {
	return array[Math.floor(Math.random() * array.length)] as T;
};

const randomDate = (daysBack: number = 30) => {
	const date = new Date();
	date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
	return date;
};

const randomNumber = (min: number, max: number) => {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRealisticFileSize = (fileType: string, fileName: string): number => {
	// Base sizes for realistic file sizes based on type and content
	const fileSizeMap: Record<string, number> = {
		// Small images (icons, logos)
		"Brand Logo Primary.svg": 15 * 1024, // 15KB
		"Brand Logo Secondary.ai": 250 * 1024, // 250KB
		"Email Header.gif": 85 * 1024, // 85KB
		"Instagram Story Template.jpg": 45 * 1024, // 45KB
		
		// Medium images
		"Hero Banner Image.jpg": 180 * 1024, // 180KB
		"Product Photo - Main.jpg": 320 * 1024, // 320KB
		"Team Member Portrait.jpg": 95 * 1024, // 95KB
		"Marketing Campaign Visual.png": 420 * 1024, // 420KB
		"Social Media Banner.jpg": 65 * 1024, // 65KB
		"Website Header Image.png": 125 * 1024, // 125KB
		"Product Catalog Photo.jpg": 280 * 1024, // 280KB
		"Business Card Template.psd": 1.2 * 1024 * 1024, // 1.2MB
		"Infographic Design.ai": 890 * 1024, // 890KB
		
		// Documents
		"Marketing Brief.docx": 85 * 1024, // 85KB
		"Product Specification.pdf": 340 * 1024, // 340KB
		"User Manual.pdf": 1.8 * 1024 * 1024, // 1.8MB
		"Brand Guidelines.pdf": 2.5 * 1024 * 1024, // 2.5MB
		"Contract Template.docx": 45 * 1024, // 45KB
		"Meeting Notes.docx": 28 * 1024, // 28KB
		"Technical Documentation.pdf": 950 * 1024, // 950KB
		"Training Materials.pptx": 3.2 * 1024 * 1024, // 3.2MB
		"Financial Report.xlsx": 180 * 1024, // 180KB
		"Project Timeline.xlsx": 95 * 1024, // 95KB
		
		// Videos
		"Product Demo Video.mp4": 12 * 1024 * 1024, // 12MB
		"Training Video.mp4": 25 * 1024 * 1024, // 25MB
		"Company Introduction.mov": 8.5 * 1024 * 1024, // 8.5MB
		"Tutorial Screencast.mp4": 15 * 1024 * 1024, // 15MB
		"Event Highlights.mp4": 18 * 1024 * 1024, // 18MB
		"Testimonial Video.mp4": 6.2 * 1024 * 1024, // 6.2MB
		
		// Audio
		"Background Music.mp3": 3.8 * 1024 * 1024, // 3.8MB
		"Podcast Episode.mp3": 22 * 1024 * 1024, // 22MB
		"Sound Effects Pack.mp3": 5.5 * 1024 * 1024, // 5.5MB
		"Voice Over Recording.wav": 8.2 * 1024 * 1024, // 8.2MB
		"Conference Call Recording.mp3": 18 * 1024 * 1024, // 18MB
		"Notification Sound.mp3": 25 * 1024, // 25KB
	};
	
	// Return specific size if mapped, otherwise return reasonable defaults by type
	if (fileSizeMap[fileName]) {
		return Math.floor(fileSizeMap[fileName]);
	}
	
	// Fallback defaults by file type
	switch (fileType) {
		case "image":
			return randomNumber(50 * 1024, 500 * 1024); // 50KB - 500KB
		case "video":
			return randomNumber(5 * 1024 * 1024, 30 * 1024 * 1024); // 5MB - 30MB
		case "document":
			return randomNumber(20 * 1024, 2 * 1024 * 1024); // 20KB - 2MB
		case "audio":
			return randomNumber(1 * 1024 * 1024, 25 * 1024 * 1024); // 1MB - 25MB
		default:
			return randomNumber(10 * 1024, 1 * 1024 * 1024); // 10KB - 1MB
	}
};

// Configuration for the dynamic seed assets scanner
const SEED_ASSETS_DIR = "seed-assets";

// File type mappings for categorization
const FILE_TYPE_CATEGORIES = {
	image: ["jpg", "jpeg", "png", "gif", "svg", "webp", "ico", "bmp", "tiff", "ai", "psd", "sketch", "figma"],
	video: ["mp4", "mov", "avi", "webm", "mkv", "flv", "wmv", "m4v"],
	audio: ["mp3", "wav", "aac", "flac", "ogg", "m4a", "wma"],
	document: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "rtf", "html", "css", "xml", "md", "odt", "ods", "odp"]
};

// Title generators based on file names
const TITLE_GENERATORS = {
	"sample": "Sample Asset",
	"landscape": "Landscape Photography",
	"dinosaur": "Team Member Portrait",
	"brand": "Brand Asset",
	"logo": "Logo Design",
	"marketing": "Marketing Material",
	"product": "Product Content",
	"social": "Social Media Asset",
	"website": "Website Resource",
	"default": "Imported Asset"
};

// Metadata extraction functions

/**
 * Extracts metadata from an image file using Sharp and EXIF data
 */
async function extractImageMetadata(filePath: string): Promise<Record<string, any>> {
	try {
		const metadata: Record<string, any> = {};
		
		// Skip unsupported formats for Sharp
		const extension = path.extname(filePath).toLowerCase();
		if (extension === '.ico' || extension === '.tiff') {
			console.debug(`Skipping Sharp metadata for unsupported format: ${filePath}`);
			return {
				unsupportedFormat: true,
				extension,
				message: `${extension} format not supported by Sharp`
			};
		}
		
		// Use Sharp for basic image metadata
		const sharpMetadata = await sharp(filePath).metadata();
		metadata.width = sharpMetadata.width;
		metadata.height = sharpMetadata.height;
		metadata.channels = sharpMetadata.channels;
		metadata.colorSpace = sharpMetadata.space;
		metadata.hasProfile = sharpMetadata.hasProfile;
		metadata.hasAlpha = sharpMetadata.hasAlpha;
		
		// Try to extract EXIF data for JPEG files
		if (filePath.toLowerCase().endsWith(".jpg") || filePath.toLowerCase().endsWith(".jpeg")) {
			try {
				const buffer = fs.readFileSync(filePath);
				const parser = exifParser.create(buffer);
				const exifData = parser.parse();
				
				if (exifData.tags) {
					metadata.exif = {
						camera: exifData.tags.Make || null,
						model: exifData.tags.Model || null,
						dateTime: exifData.tags.DateTime || null,
						iso: exifData.tags.ISO || null,
						focalLength: exifData.tags.FocalLength || null,
						aperture: exifData.tags.FNumber || null,
						exposureTime: exifData.tags.ExposureTime || null
					};
				}
			} catch (exifError) {
				// EXIF extraction failed, continue without it
				console.debug(`No EXIF data found in ${filePath}`);
			}
		}
		
		return metadata;
	} catch (error) {
		console.warn(`Failed to extract image metadata for ${filePath}:`, error);
		return {};
	}
}

/**
 * Extracts metadata from a video file using ffprobe
 */
async function extractVideoMetadata(filePath: string): Promise<Record<string, any>> {
	return new Promise((resolve) => {
		const metadata: Record<string, any> = {};
		
		// Check if ffprobe binary exists
		if (!ffprobeStatic || typeof ffprobeStatic !== 'string') {
			console.warn(`ffprobe binary not available for ${filePath}`);
			resolve(metadata);
			return;
		}
		
		const ffprobe = spawn(ffprobeStatic, [
			"-v", "quiet",
			"-print_format", "json",
			"-show_format",
			"-show_streams",
			filePath
		]);
		
		let output = "";
		ffprobe.stdout.on("data", (data) => {
			output += data.toString();
		});
		
		ffprobe.on("close", (code) => {
			if (code === 0 && output) {
				try {
					const probeData = JSON.parse(output);
					
					if (probeData.format) {
						metadata.duration = parseFloat(probeData.format.duration) || null;
						metadata.bitRate = parseInt(probeData.format.bit_rate) || null;
					}
					
					const videoStream = probeData.streams?.find((s: any) => s.codec_type === "video");
					if (videoStream) {
						metadata.width = videoStream.width;
						metadata.height = videoStream.height;
						metadata.fps = videoStream.r_frame_rate ? parseFloat(eval(videoStream.r_frame_rate)) : null;
						metadata.codec = videoStream.codec_name;
					}
					
					const audioStream = probeData.streams?.find((s: any) => s.codec_type === "audio");
					if (audioStream) {
						metadata.audioCodec = audioStream.codec_name;
						metadata.sampleRate = audioStream.sample_rate;
						metadata.channels = audioStream.channels;
					}
				} catch (parseError) {
					console.warn(`Failed to parse ffprobe output for ${filePath}`);
				}
			}
			
			resolve(metadata);
		});
		
		ffprobe.on("error", (error) => {
			console.warn(`ffprobe failed for ${filePath}:`, error.message);
			resolve(metadata);
		});
	});
}

/**
 * Extracts metadata from an audio file using ffprobe
 */
async function extractAudioMetadata(filePath: string): Promise<Record<string, any>> {
	return new Promise((resolve) => {
		const metadata: Record<string, any> = {};
		
		// Check if ffprobe binary exists
		if (!ffprobeStatic || typeof ffprobeStatic !== 'string') {
			console.warn(`ffprobe binary not available for ${filePath}`);
			resolve(metadata);
			return;
		}
		
		const ffprobe = spawn(ffprobeStatic, [
			"-v", "quiet",
			"-print_format", "json",
			"-show_format",
			"-show_streams",
			filePath
		]);
		
		let output = "";
		ffprobe.stdout.on("data", (data) => {
			output += data.toString();
		});
		
		ffprobe.on("close", (code) => {
			if (code === 0 && output) {
				try {
					const probeData = JSON.parse(output);
					
					if (probeData.format) {
						metadata.duration = parseFloat(probeData.format.duration) || null;
						metadata.bitRate = parseInt(probeData.format.bit_rate) || null;
						metadata.title = probeData.format.tags?.title || null;
						metadata.artist = probeData.format.tags?.artist || null;
						metadata.album = probeData.format.tags?.album || null;
						metadata.genre = probeData.format.tags?.genre || null;
						metadata.year = probeData.format.tags?.date || null;
					}
					
					const audioStream = probeData.streams?.find((s: any) => s.codec_type === "audio");
					if (audioStream) {
						metadata.codec = audioStream.codec_name;
						metadata.sampleRate = audioStream.sample_rate;
						metadata.channels = audioStream.channels;
						metadata.channelLayout = audioStream.channel_layout;
					}
				} catch (parseError) {
					console.warn(`Failed to parse ffprobe output for ${filePath}`);
				}
			}
			
			resolve(metadata);
		});
		
		ffprobe.on("error", (error) => {
			console.warn(`ffprobe failed for ${filePath}:`, error.message);
			resolve(metadata);
		});
	});
}

/**
 * Determines the file type category based on extension
 */
function categorizeFileType(filePath: string): string {
	const extension = path.extname(filePath).toLowerCase().slice(1);
	
	for (const [category, extensions] of Object.entries(FILE_TYPE_CATEGORIES)) {
		if (extensions.includes(extension)) {
			return category;
		}
	}
	
	return "other";
}

/**
 * Generates a user-friendly title from a filename
 */
function generateTitleFromFilename(filename: string): string {
	const basename = path.basename(filename, path.extname(filename));
	
	// Check for known patterns in the filename
	for (const [pattern, title] of Object.entries(TITLE_GENERATORS)) {
		if (pattern !== "default" && basename.toLowerCase().includes(pattern)) {
			return title;
		}
	}
	
	// Generate title from filename by making it title case and replacing underscores/dashes
	return basename
		.replace(/[-_]/g, " ")
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.split(" ")
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ") || TITLE_GENERATORS.default;
}

/**
 * Generates a description from a filename and file type
 */
function generateDescriptionFromFilename(filename: string, fileType: string): string {
	const basename = path.basename(filename, path.extname(filename));
	const extension = path.extname(filename).toUpperCase().slice(1);
	
	// Generate contextual description based on file type and name
	const typeDescriptions = {
		image: `${extension} image file imported via seed script`,
		video: `${extension} video content imported via seed script`,
		audio: `${extension} audio file imported via seed script`,
		document: `${extension} document imported via seed script`,
		other: `${extension} file imported via seed script`
	};
	
	return typeDescriptions[fileType as keyof typeof typeDescriptions] || typeDescriptions.other;
}

/**
 * Recursively scans a directory for all files
 */
function scanDirectoryRecursively(dirPath: string): string[] {
	const files: string[] = [];
	
	try {
		const entries = fs.readdirSync(dirPath, { withFileTypes: true });
		
		for (const entry of entries) {
			const fullPath = path.join(dirPath, entry.name);
			
			if (entry.isDirectory()) {
				// Recursively scan subdirectories
				files.push(...scanDirectoryRecursively(fullPath));
			} else if (entry.isFile()) {
				// Add file to list
				files.push(fullPath);
			}
		}
	} catch (error) {
		console.warn(`Failed to scan directory ${dirPath}:`, error);
	}
	
	return files;
}

/**
 * Dynamically discovers and processes all assets from the seed-assets directory
 */
async function discoverSeedAssets(): Promise<Array<{
	fileName: string;
	title: string;
	description: string;
	fileType: string;
	mimeType: string;
	localPath: string;
	fileSize: number;
	metadata: Record<string, any>;
}>> {
	console.log("🔍 Discovering seed assets dynamically...");
	
	const seedAssetsPath = path.resolve(SEED_ASSETS_DIR);
	
	if (!fs.existsSync(seedAssetsPath)) {
		console.warn(`⚠️ Seed assets directory not found: ${seedAssetsPath}`);
		return [];
	}
	
	// Scan all files recursively
	const allFiles = scanDirectoryRecursively(seedAssetsPath);
	console.log(`📁 Found ${allFiles.length} files to process`);
	
	const discoveredAssets = [];
	
	for (const filePath of allFiles) {
		try {
			console.log(`   🔄 Processing: ${path.basename(filePath)}`);
			
			// Get basic file info
			const stats = fs.statSync(filePath);
			const fileName = path.basename(filePath);
			const fileSize = stats.size;
			
			// Categorize file type
			const fileType = categorizeFileType(filePath);
			
			// Skip unsupported file types
			if (fileType === "other") {
				console.log(`      ⏭️ Skipping unsupported file type: ${fileName}`);
				continue;
			}
			
			// Detect MIME type
			let mimeType: string;
			try {
				const detectedType = await fileTypeFromFile(filePath);
				mimeType = detectedType?.mime || mimeTypes.lookup(filePath) || "application/octet-stream";
			} catch {
				mimeType = mimeTypes.lookup(filePath) || "application/octet-stream";
			}
			
			// Generate title and description
			const title = generateTitleFromFilename(fileName);
			const description = generateDescriptionFromFilename(fileName, fileType);
			
			// Extract file-specific metadata
			let metadata: Record<string, any> = {};
			try {
				switch (fileType) {
					case "image":
						metadata = await extractImageMetadata(filePath);
						break;
					case "video":
						metadata = await extractVideoMetadata(filePath);
						break;
					case "audio":
						metadata = await extractAudioMetadata(filePath);
						break;
					default:
						// For documents, just include basic file info
						metadata = {
							importedAt: new Date().toISOString(),
							originalPath: filePath
						};
				}
			} catch (metadataError) {
				console.warn(`      ⚠️ Failed to extract metadata: ${metadataError}`);
				metadata = { error: "Failed to extract metadata" };
			}
			
			// Add source information to metadata
			metadata.sourceFile = filePath;
			metadata.discoveredAt = new Date().toISOString();
			metadata.fileStats = {
				created: stats.birthtime,
				modified: stats.mtime,
				accessed: stats.atime
			};
			
			discoveredAssets.push({
				fileName,
				title,
				description,
				fileType,
				mimeType,
				localPath: filePath,
				fileSize,
				metadata
			});
			
			console.log(`      ✅ Processed: ${title} (${(fileSize / 1024).toFixed(1)} KB)`);
			
		} catch (error) {
			console.error(`      ❌ Failed to process ${filePath}:`, error);
		}
	}
	
	console.log(`\n✅ Successfully discovered ${discoveredAssets.length} assets`);
	
	// Log summary by type
	const summary = discoveredAssets.reduce((acc, asset) => {
		acc[asset.fileType] = (acc[asset.fileType] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);
	
	console.log("📊 Assets by type:");
	for (const [type, count] of Object.entries(summary)) {
		console.log(`   ${type}: ${count}`);
	}
	
	return discoveredAssets;
}


// Configuration flags
const SEED_CONFIG = {
	deleteAllFirst: false, // Set to true to clear all data before seeding
	downloadRealFiles: true, // Download real files from internet for accurate sizes
	assetsOnly: true, // Only add assets, skip org/user setup
};

async function seedDatabase() {
	console.log("🌱 Starting database seeding...");
	console.log(`⚙️ Config: deleteAllFirst=${SEED_CONFIG.deleteAllFirst}, downloadRealFiles=${SEED_CONFIG.downloadRealFiles}, assetsOnly=${SEED_CONFIG.assetsOnly}`);

	try {
		if (SEED_CONFIG.deleteAllFirst) {
			console.log("🧹 Clearing existing data...");
			await db.delete(collectionActivity);
			await db.delete(collectionShares);
			await db.delete(collectionPermissions);
			await db.delete(collectionAssets);
			await db.delete(collectionTemplates);
			await db.delete(assetCollections);
			await db.delete(assetPermissions);
			await db.delete(assetVersions);
			await db.delete(userRoles);
			await db.delete(assets);
			await db.delete(users);
			await db.delete(organizations);
			await db.delete(roles);
			await db.delete(tiers);
		} else {
			console.log("ℹ️ Preserving existing data, adding new assets...");
		}

		if (SEED_CONFIG.assetsOnly) {
			// Get existing org and users for assets
			console.log("🔍 Looking for existing organization and users...");
			const testOrg = await db.query.organizations.findFirst();
			const testUsers = await db.query.users.findMany({ limit: 6 });
			
			console.log(`📊 Found: ${testOrg ? 1 : 0} organization(s), ${testUsers.length} user(s)`);
			
			if (testOrg) {
				console.log(`🏢 Using organization: "${testOrg.name}" (ID: ${testOrg.id})`);
			}
			
			if (testUsers.length > 0) {
				console.log(`👥 Available users:`);
				testUsers.forEach(user => console.log(`   - ${user.email} (ID: ${user.id})`));
			}
			
			if (!testOrg || testUsers.length === 0) {
				throw new Error("No existing organization or users found. Run with assetsOnly=false first.");
			}

			// Skip to asset creation using dynamic discovery
			console.log(`\n📁 Adding dynamically discovered assets to existing org: ${testOrg.name}`);
			
			// Discover assets dynamically from the file system
			const discoveredAssets = await discoverSeedAssets();
			
			if (discoveredAssets.length === 0) {
				console.log("⚠️ No assets found to seed. Make sure files exist in the seed-assets/ directory.");
				return;
			}
			
			console.log(`\n🎯 Starting asset creation process...`);
			const createdAssets = [];
			
			for (let i = 0; i < discoveredAssets.length; i++) {
				const assetData = discoveredAssets[i];
				const uploader = testUsers[Math.floor(Math.random() * testUsers.length)]!;
				
				console.log(`\n📄 Creating asset ${i + 1}/${discoveredAssets.length}: ${assetData.title}`);
				console.log(`   📝 File: ${assetData.fileName}`);
				console.log(`   📊 Size: ${(assetData.fileSize / 1024).toFixed(1)} KB`);
				console.log(`   🏷️ Type: ${assetData.fileType} (${assetData.mimeType})`);
				console.log(`   👤 Uploader: ${uploader.email}`);
				console.log(`   🏢 Organization: ${testOrg.id}`);
				
				const assetId = randomUUID();
				const storageKey = `test-assets/${randomUUID()}-${assetData.fileName}`;
				
				console.log(`   🆔 Asset ID: ${assetId}`);
				console.log(`   🗂️ Storage Key: ${storageKey}`);
				
				try {
					const [asset] = await db.insert(assets).values({
						id: assetId,
						organizationId: testOrg.id,
						uploadedBy: uploader.id,
						fileName: assetData.fileName,
						originalFileName: assetData.fileName,
						fileType: assetData.fileType,
						mimeType: assetData.mimeType,
						fileSize: assetData.fileSize,
						storageKey: storageKey,
						thumbnailKey: assetData.fileType === "image" ? `test-thumbnails/${randomUUID()}-thumb.jpg` : null,
						storageProvider: "default",
						title: assetData.title,
						description: assetData.description,
						tags: generateRandomTags(),
						metadata: assetData.metadata,
						processingStatus: "completed",
						createdAt: randomDate(90),
						updatedAt: randomDate(30),
					}).returning();
					
					if (asset) {
						createdAssets.push(asset);
						console.log(`   ✅ Successfully created asset: ${asset.id}`);
					} else {
						console.log(`   ❌ Asset creation returned no data`);
					}
				} catch (error) {
					console.log(`   ❌ Failed to create asset: ${error}`);
				}
			}

			console.log(`\n🎉 Asset creation completed!`);
			console.log(`📊 Total assets created: ${createdAssets.length}/${discoveredAssets.length}`);
			
			// Verify assets were actually inserted
			console.log(`\n🔍 Verifying assets in database...`);
			const allAssetsInDb = await db.query.assets.findMany({
				where: (assets, { eq }) => eq(assets.organizationId, testOrg.id)
			});
			console.log(`📊 Total assets in database for org ${testOrg.id}: ${allAssetsInDb.length}`);
			
			return;
		}

		// 1. Get or create test tier
		console.log("📊 Getting or creating test tier...");
		let testTier = await db.query.tiers.findFirst({
			where: (tiers, { eq }) => eq(tiers.name, "development")
		});
		
		if (!testTier) {
			[testTier] = await db.insert(tiers).values({
				id: randomUUID(),
				name: "development",
				displayName: "Development Tier",
				limits: {
					maxUsers: 100,
					maxAssets: 10_000,
					maxStorageGB: 100,
					maxFileSizeMB: 500,
					maxAssetGroups: 200,
				},
				features: {
					customS3: true,
					passwordProtectedSharing: true,
					colorPalettes: true,
					fontManagement: true,
					advancedAnalytics: true,
					apiAccess: true,
					customBranding: true,
					ssoIntegration: true,
				},
				monthlyPriceUSD: "0.00",
				isActive: true,
			}).returning();
		}

		if (!testTier) throw new Error("Failed to get or create test tier");

		// 2. Create test organization
		console.log("🏢 Creating test organization...");
		const [testOrg] = await db.insert(organizations).values({
			id: randomUUID(),
			name: "Test Company",
			slug: "test-company",
			tierId: testTier.id,
			logoUrl: "/logo.png",
			primaryColor: "#0066cc",
			secondaryColor: "#4a90e2",
			settings: {
				allowPublicSharing: true,
				requireMfa: false,
				allowedDomains: ["test.com", "example.com"],
				defaultUserRole: "user",
			},
		}).returning();

		if (!testOrg) throw new Error("Failed to create test organization");

		// 3. Create test roles
		console.log("👥 Creating test roles...");
		const [adminRole] = await db.insert(roles).values({
			id: randomUUID(),
			name: "admin",
			permissions: {
				canManageUsers: true,
				canManageAssets: true,
				canManageSettings: true,
				canViewAnalytics: true,
			},
		}).returning();

		const [userRole] = await db.insert(roles).values({
			id: randomUUID(),
			name: "user",
			permissions: {
				canManageUsers: false,
				canManageAssets: true,
				canManageSettings: false,
				canViewAnalytics: false,
			},
		}).returning();

		if (!adminRole || !userRole) throw new Error("Failed to create test roles");

		// 4. Create test users
		console.log("👤 Creating test users...");
		const testUsers = [];
		
		// Admin user
		const [adminUser] = await db.insert(users).values({
			id: randomUUID(),
			email: "admin@test.com",
			name: "Test Admin",
			organizationId: testOrg.id,
			provider: "credentials",
			emailVerified: new Date(),
			isSuperAdmin: false,
		}).returning();

		if (!adminUser) throw new Error("Failed to create admin user");
		testUsers.push(adminUser);

		// Regular users
		for (let i = 0; i < 5; i++) {
			const [user] = await db.insert(users).values({
				id: randomUUID(),
				email: `user${i + 1}@test.com`,
				name: `Test User ${i + 1}`,
				organizationId: testOrg.id,
				provider: "credentials",
				emailVerified: new Date(),
				isSuperAdmin: false,
			}).returning();

			if (!user) throw new Error(`Failed to create test user ${i + 1}`);
			testUsers.push(user);
		}

		// 5. Assign roles to users
		console.log("🔐 Assigning roles to users...");
		// Make first user admin
		await db.insert(userRoles).values({
			userId: adminUser.id,
			roleId: adminRole.id,
			grantedBy: adminUser.id,
		});

		// Make other users regular users
		for (const user of testUsers.slice(1)) {
			await db.insert(userRoles).values({
				userId: user.id,
				roleId: userRole.id,
				grantedBy: adminUser.id,
			});
		}

		// 6. Create real test assets using dynamic discovery
		console.log("📁 Creating dynamically discovered test assets...");
		
		// Discover assets dynamically from the file system
		const discoveredAssets = await discoverSeedAssets();
		
		if (discoveredAssets.length === 0) {
			console.log("⚠️ No assets found to seed. Make sure files exist in the seed-assets/ directory.");
			console.log("Continuing with organization setup without assets...");
		}
		
		const createdAssets = [];
		
		for (const assetData of discoveredAssets) {
			const uploader = randomFromArray(testUsers);
			
			console.log(`   📄 Creating ${assetData.title}...`);
			console.log(`      Size: ${(assetData.fileSize / 1024).toFixed(1)} KB`);
			console.log(`      Type: ${assetData.fileType} (${assetData.mimeType})`);
			
			const [asset] = await db.insert(assets).values({
				id: randomUUID(),
				organizationId: testOrg.id,
				uploadedBy: uploader.id,
				fileName: assetData.fileName,
				originalFileName: assetData.fileName,
				fileType: assetData.fileType,
				mimeType: assetData.mimeType,
				fileSize: assetData.fileSize,
				storageKey: `test-assets/${randomUUID()}-${assetData.fileName}`,
				thumbnailKey: assetData.fileType === "image" ? `test-thumbnails/${randomUUID()}-thumb.jpg` : null,
				storageProvider: "default",
				title: assetData.title,
				description: assetData.description,
				tags: generateRandomTags(),
				metadata: assetData.metadata,
				processingStatus: "completed",
				createdAt: randomDate(90),
				updatedAt: randomDate(30),
			}).returning();
			
			if (asset) createdAssets.push(asset);
		}

		// 7. Create asset versions for some assets
		console.log("📝 Creating asset versions...");
		const assetsForVersions = createdAssets.slice(0, 15); // First 15 assets get versions
		
		for (const asset of assetsForVersions) {
			const numVersions = randomNumber(1, 3);
			for (let v = 1; v <= numVersions; v++) {
				const versionUploader = randomFromArray(testUsers);
				await db.insert(assetVersions).values({
					id: randomUUID(),
					assetId: asset.id,
					versionNumber: v + 1, // Start from version 2 (version 1 is the original)
					uploadedBy: versionUploader.id,
					storageKey: `test-assets/versions/${randomUUID()}-v${v + 1}-${asset.fileName}`,
					fileSize: asset.fileSize + randomNumber(-10_000, 10_000),
					changeLog: `Version ${v + 1}: ${randomFromArray([
						"Updated colors and typography",
						"Fixed layout issues",
						"Improved image quality",
						"Added new elements",
						"Client feedback incorporated",
						"Minor adjustments",
						"Final revisions"
					])}`,
					createdAt: new Date((asset.createdAt || new Date()).getTime() + (v * 24 * 60 * 60 * 1000)), // Days after original
				});
			}
		}

		// 8. Create asset permissions for some assets
		console.log("🔐 Creating asset permissions...");
		const assetsForPermissions = createdAssets.slice(10, 25); // Assets 10-25 get specific permissions
		
		for (const asset of assetsForPermissions) {
			// Give specific users permissions
			const permissionUsers = testUsers.slice(0, randomNumber(2, 4));
			for (const user of permissionUsers) {
				if (user.id !== asset.uploadedBy) { // Don't create permissions for uploader
					await db.insert(assetPermissions).values({
						id: randomUUID(),
						assetId: asset.id,
						userId: user.id,
						canView: true,
						canDownload: randomNumber(0, 1) === 1,
						canEdit: randomNumber(0, 3) === 1, // 25% chance
						canDelete: false, // Keep delete restricted
					});
				}
			}
		}

		// 9. Create asset collections
		console.log("📂 Creating asset collections...");
		const collectionData = [
			{
				name: "Brand Identity Kit",
				description: "Core brand assets including logos, colors, and typography",
				slug: "brand-identity-kit",
				color: "#0066cc",
				icon: "palette",
				isPublic: false,
				tags: ["brand", "identity", "logo", "guidelines"]
			},
			{
				name: "Marketing Materials",
				description: "Templates and assets for marketing campaigns",
				slug: "marketing-materials", 
				color: "#e74c3c",
				icon: "megaphone",
				isPublic: true,
				tags: ["marketing", "campaign", "social", "advertising"]
			},
			{
				name: "Product Photography",
				description: "High-quality product images and lifestyle shots",
				slug: "product-photography",
				color: "#2ecc71",
				icon: "camera",
				isPublic: true,
				tags: ["product", "photography", "images", "lifestyle"]
			},
			{
				name: "Social Media Assets",
				description: "Templates and graphics optimized for social platforms",
				slug: "social-media-assets",
				color: "#9b59b6",
				icon: "share-2",
				isPublic: true,
				tags: ["social", "media", "instagram", "facebook", "twitter"]
			},
			{
				name: "Print Materials",
				description: "Brochures, flyers, and other print-ready materials",
				slug: "print-materials",
				color: "#f39c12",
				icon: "printer",
				isPublic: false,
				tags: ["print", "brochure", "flyer", "offline"]
			},
			{
				name: "Website Resources",
				description: "Images, icons, and graphics for web use",
				slug: "website-resources",
				color: "#1abc9c",
				icon: "globe",
				isPublic: true,
				tags: ["web", "website", "digital", "online"]
			},
			{
				name: "Event Materials",
				description: "Assets for conferences, trade shows, and events",
				slug: "event-materials",
				color: "#34495e",
				icon: "calendar",
				isPublic: false,
				tags: ["event", "conference", "tradeshow", "presentation"]
			},
			{
				name: "Video Content",
				description: "Video assets for various marketing channels",
				slug: "video-content",
				color: "#e67e22",
				icon: "video",
				isPublic: true,
				tags: ["video", "content", "marketing", "multimedia"]
			}
		];

		const createdCollections = [];
		for (const collectionInfo of collectionData) {
			// Pick a random cover asset (prefer images)
			const imageAssets = createdAssets.filter(a => a.fileType === "image");
			const coverAsset = imageAssets.length > 0 ? randomFromArray(imageAssets) : randomFromArray(createdAssets);
			
			const [collection] = await db.insert(assetCollections).values({
				id: randomUUID(),
				organizationId: testOrg.id,
				name: collectionInfo.name,
				description: collectionInfo.description,
				slug: collectionInfo.slug,
				coverAssetId: coverAsset.id,
				color: collectionInfo.color,
				icon: collectionInfo.icon,
				isPublic: collectionInfo.isPublic,
				allowContributions: randomNumber(0, 1) === 1,
				sortOrder: "createdAt",
				sortDirection: "desc",
				tags: collectionInfo.tags,
				metadata: {
					category: randomFromArray(["brand", "marketing", "product", "content"]),
					priority: randomFromArray(["high", "medium", "low"]),
				},
				createdBy: randomFromArray(testUsers).id,
				createdAt: randomDate(60),
				updatedAt: randomDate(30),
			}).returning();
			
			if (collection) createdCollections.push(collection);
		}

		// 10. Populate collection assets (junction table)
		console.log("🔗 Adding assets to collections...");
		for (const collection of createdCollections) {
			// Each collection gets 8-15 assets
			const numAssets = randomNumber(8, 15);
			const shuffledAssets = [...createdAssets].sort(() => Math.random() - 0.5);
			const collectionAssetsList = shuffledAssets.slice(0, numAssets);
			
			for (let i = 0; i < collectionAssetsList.length; i++) {
				const asset = collectionAssetsList[i];
				if (!asset) continue;
				
				await db.insert(collectionAssets).values({
					id: randomUUID(),
					collectionId: collection.id,
					assetId: asset.id,
					sortOrder: i,
					addedBy: randomFromArray(testUsers).id,
					addedAt: randomDate(45),
					customTitle: randomNumber(0, 2) === 0 ? `${asset.title} - ${collection.name} Version` : null,
					customDescription: randomNumber(0, 3) === 0 ? `Custom description for ${asset.title} in ${collection.name}` : null,
					customTags: randomNumber(0, 2) === 0 ? [collection.slug, "curated"] : [],
					metadata: {
						featured: randomNumber(0, 4) === 0,
						position: i,
						addedReason: randomFromArray(["fits_theme", "client_request", "high_quality", "recent_upload"])
					}
				});
			}
		}

		// 11. Create collection permissions
		console.log("👥 Setting up collection permissions...");
		for (const collection of createdCollections) {
			// Give some users specific permissions
			const numUserPermissions = randomNumber(2, 4);
			const permissionUsers = [...testUsers].sort(() => Math.random() - 0.5).slice(0, numUserPermissions);
			
			for (const user of permissionUsers) {
				if (user.id !== collection.createdBy) { // Don't create permissions for creator
					await db.insert(collectionPermissions).values({
						id: randomUUID(),
						collectionId: collection.id,
						userId: user.id,
						canView: true,
						canEdit: randomNumber(0, 2) === 0, // 33% chance
						canAddAssets: randomNumber(0, 2) === 0, // 33% chance  
						canRemoveAssets: randomNumber(0, 3) === 0, // 25% chance
						canManage: randomNumber(0, 4) === 0, // 20% chance
						grantedBy: collection.createdBy,
					});
				}
			}
		}

		// 12. Create collection shares
		console.log("🔗 Creating collection shares...");
		const collectionsToShare = createdCollections.slice(0, 5); // First 5 collections get shares
		
		for (const collection of collectionsToShare) {
			const shareToken = randomUUID().replace(/-/g, '').substring(0, 32);
			const isPasswordProtected = randomNumber(0, 2) === 0; // 33% chance
			
			await db.insert(collectionShares).values({
				id: randomUUID(),
				collectionId: collection.id,
				shareToken,
				shareType: randomFromArray(["view", "download", "collaborate"]),
				isPasswordProtected,
				passwordHash: isPasswordProtected ? "hashed_test_password_123" : null,
				expiresAt: randomNumber(0, 1) === 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null, // 50% expire in 30 days
				maxDownloads: randomNumber(0, 1) === 0 ? randomNumber(10, 100) : null, // 50% have download limits
				currentDownloads: 0,
				allowedDomains: randomNumber(0, 2) === 0 ? ["test.com", "example.com"] : [],
				accessCount: randomNumber(0, 25),
				lastAccessedAt: randomNumber(0, 1) === 0 ? randomDate(7) : null,
				createdBy: collection.createdBy,
				allowComments: randomNumber(0, 1) === 0,
				allowDownloads: randomNumber(0, 4) !== 0, // 75% allow downloads
				showMetadata: randomNumber(0, 3) !== 0, // 75% show metadata
				customMessage: randomNumber(0, 2) === 0 ? `Check out our ${collection.name} collection!` : null,
			});
		}

		// 13. Generate collection activity logs
		console.log("📝 Creating collection activity logs...");
		for (const collection of createdCollections) {
			// Collection creation activity
			await db.insert(collectionActivity).values({
				id: randomUUID(),
				collectionId: collection.id,
				userId: collection.createdBy,
				action: "created",
				details: {
					collectionName: collection.name,
					initialAssetCount: 0
				},
				createdAt: collection.createdAt,
			});

			// Asset addition activities
			const collectionAssetsList = await db.query.collectionAssets.findMany({
				where: (collectionAssets, { eq }) => eq(collectionAssets.collectionId, collection.id),
				with: { asset: true }
			});

			for (const collectionAsset of collectionAssetsList.slice(0, 3)) { // Just first 3 to avoid too much data
				await db.insert(collectionActivity).values({
					id: randomUUID(),
					collectionId: collection.id,
					userId: collectionAsset.addedBy,
					action: "asset_added",
					details: {
						assetId: collectionAsset.assetId,
						assetTitle: collectionAsset.asset.title,
						assetType: collectionAsset.asset.fileType
					},
					assetId: collectionAsset.assetId,
					createdAt: collectionAsset.addedAt,
				});
			}

			// Random update activities
			const numUpdates = randomNumber(1, 3);
			for (let i = 0; i < numUpdates; i++) {
				await db.insert(collectionActivity).values({
					id: randomUUID(),
					collectionId: collection.id,
					userId: randomFromArray(testUsers).id,
					action: randomFromArray(["updated", "asset_removed", "permissions_changed"]),
					details: {
						changes: randomFromArray([
							"Updated collection description",
							"Changed collection settings", 
							"Modified permissions",
							"Removed outdated asset"
						])
					},
					createdAt: randomDate(20),
				});
			}
		}

		// 14. Create collection templates
		console.log("📋 Creating collection templates...");
		const templateData = [
			{
				name: "Brand Package Template",
				description: "Complete brand identity package with logos, colors, and guidelines",
				category: "brand",
				config: {
					requiredAssetTypes: ["image", "document"],
					sections: [
						{ name: "Primary Logo", assetCount: 1, fileTypes: ["svg", "ai"] },
						{ name: "Secondary Logos", assetCount: 3, fileTypes: ["svg", "png"] },
						{ name: "Color Palette", assetCount: 1, fileTypes: ["image", "document"] },
						{ name: "Typography Guide", assetCount: 1, fileTypes: ["pdf", "document"] },
						{ name: "Brand Guidelines", assetCount: 1, fileTypes: ["pdf"] }
					],
					tags: ["brand", "identity", "logo", "guidelines"],
					defaultSettings: {
						isPublic: false,
						allowContributions: false,
						sortOrder: "custom"
					}
				}
			},
			{
				name: "Campaign Assets Template",
				description: "Marketing campaign asset collection with social media and web graphics",
				category: "marketing",
				config: {
					requiredAssetTypes: ["image", "video"],
					sections: [
						{ name: "Hero Images", assetCount: 2, fileTypes: ["jpg", "png"] },
						{ name: "Social Media Graphics", assetCount: 5, fileTypes: ["jpg", "png", "gif"] },
						{ name: "Video Content", assetCount: 2, fileTypes: ["mp4", "mov"] },
						{ name: "Banner Ads", assetCount: 3, fileTypes: ["jpg", "png", "gif"] }
					],
					tags: ["campaign", "marketing", "social", "advertising"],
					defaultSettings: {
						isPublic: true,
						allowContributions: true,
						sortOrder: "createdAt"
					}
				}
			},
			{
				name: "Product Launch Template",
				description: "Complete product launch asset package with photos and marketing materials",
				category: "product",
				config: {
					requiredAssetTypes: ["image", "document", "video"],
					sections: [
						{ name: "Product Photos", assetCount: 8, fileTypes: ["jpg", "png"] },
						{ name: "Lifestyle Images", assetCount: 4, fileTypes: ["jpg", "png"] },
						{ name: "Product Demo Video", assetCount: 1, fileTypes: ["mp4"] },
						{ name: "Spec Sheets", assetCount: 2, fileTypes: ["pdf", "docx"] },
						{ name: "Press Release", assetCount: 1, fileTypes: ["pdf", "docx"] }
					],
					tags: ["product", "launch", "photography", "marketing"],
					defaultSettings: {
						isPublic: false,
						allowContributions: true,
						sortOrder: "custom"
					}
				}
			}
		];

		for (const template of templateData) {
			await db.insert(collectionTemplates).values({
				id: randomUUID(),
				organizationId: testOrg.id,
				name: template.name,
				description: template.description,
				config: template.config,
				category: template.category,
				usageCount: randomNumber(0, 15),
				isBuiltIn: false,
				isActive: true,
				createdBy: adminUser.id,
				createdAt: randomDate(30),
				updatedAt: randomDate(15),
			});
		}

		console.log("✅ Database seeding completed successfully!");
		console.log(`Created:`);
		console.log(`  - 1 test tier`);
		console.log(`  - 1 test organization`);
		console.log(`  - 2 roles (admin, user)`);
		console.log(`  - ${testUsers.length} test users`);
		console.log(`  - ${createdAssets.length} dynamically discovered assets (diverse file types)`);
		console.log(`  - ${assetsForVersions.length} assets with versions (2-4 versions each)`);
		console.log(`  - ${assetsForPermissions.length} assets with custom permissions`);
		console.log(`  - ${createdCollections.length} asset collections`);
		console.log(`  - Collection assets junction (8-15 assets per collection)`);
		console.log(`  - Collection permissions for users`);
		console.log(`  - ${collectionsToShare.length} public collection shares`);
		console.log(`  - Collection activity logs`);
		console.log(`  - 3 collection templates`);
		console.log(`\nTest users:`);
		console.log(`  - admin@test.com (admin role)`);
		for (let i = 1; i < testUsers.length; i++) {
			console.log(`  - user${i}@test.com (user role)`);
		}
		console.log(`\nCollections created:`);
		for (const collection of createdCollections) {
			console.log(`  - ${collection.name} (${collection.isPublic ? 'public' : 'private'})`);
		}

	} catch (error) {
		console.error("❌ Database seeding failed:", error);
		process.exit(1);
	}
}

// Helper functions

function generateRandomTags(): string[] {
	const allTags = [
		"brand", "marketing", "social", "web", "print", "logo", "banner",
		"product", "campaign", "event", "corporate", "design", "photography",
		"illustration", "typography", "color", "identity", "guidelines"
	];
	
	const numTags = randomNumber(1, 5);
	const selectedTags: string[] = [];
	
	for (let i = 0; i < numTags; i++) {
		const tag = randomFromArray(allTags);
		if (!selectedTags.includes(tag)) {
			selectedTags.push(tag);
		}
	}
	
	return selectedTags;
}

function generateMetadata(fileType: string) {
	switch (fileType) {
		case "image":
			return {
				width: randomNumber(800, 4000),
				height: randomNumber(600, 3000),
				colorProfile: randomFromArray(["sRGB", "Adobe RGB", "ProPhoto RGB"]),
				dpi: randomFromArray([72, 150, 300]),
			};
		case "video":
			return {
				duration: randomNumber(30, 300), // 30 seconds to 5 minutes
				width: randomFromArray([1920, 1280, 854]),
				height: randomFromArray([1080, 720, 480]),
				fps: randomFromArray([24, 30, 60]),
				codec: randomFromArray(["H.264", "H.265", "VP9"]),
			};
		case "document":
			return {
				pages: randomNumber(1, 50),
				author: randomFromArray(["Test Admin", "Test User 1", "Test User 2"]),
				createdWith: randomFromArray(["Adobe Acrobat", "Microsoft Word", "Google Docs"]),
			};
		case "audio":
			return {
				duration: randomNumber(60, 3600), // 1 minute to 1 hour
				bitrate: randomFromArray([128, 192, 256, 320]),
				sampleRate: randomFromArray([44100, 48000]),
				channels: randomFromArray([1, 2]),
			};
		default:
			return {};
	}
}

// Run the seeding when this file is imported as a module
seedDatabase().finally(() => {
	process.exit(0);
});

export { seedDatabase };