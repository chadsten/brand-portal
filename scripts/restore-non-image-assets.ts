#!/usr/bin/env tsx

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, isNotNull, ne, and, sql } from "drizzle-orm";
import postgres from "postgres";
import { assets } from "../src/server/db/schema";

// Load environment variables
config({ path: ".env.local" });

// Configuration
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

// Database connection
const connectionConfig = {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
} as const;

const conn = postgres(DATABASE_URL, connectionConfig);
const db = drizzle(conn, { schema: { assets } });

// Define what constitutes non-image file types
const NON_IMAGE_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'rtf', 'csv', 'json', 'xml', 'svg',
  'zip', 'rar', '7z', 'tar', 'gz',
  'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm',
  'mp3', 'wav', 'flac', 'aac', 'ogg',
  'ai', 'eps', 'psd', 'sketch', 'fig',
  'woff', 'woff2', 'ttf', 'otf', 'eot'
];

const NON_IMAGE_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/json',
  'application/xml',
  'text/xml',
  'image/svg+xml',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'audio/mpeg',
  'audio/wav',
  'font/woff',
  'font/woff2',
  'application/font-woff',
  'application/font-woff2'
];

function isNonImageAsset(asset: any): boolean {
  // Check file extension
  const fileName = asset.fileName || asset.originalFileName || '';
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (extension && NON_IMAGE_EXTENSIONS.includes(extension)) {
    return true;
  }
  
  // Check MIME type
  const mimeType = asset.mimeType?.toLowerCase();
  if (mimeType && NON_IMAGE_MIME_TYPES.includes(mimeType)) {
    return true;
  }
  
  // Check file type field
  const fileType = asset.fileType?.toLowerCase();
  if (fileType && NON_IMAGE_EXTENSIONS.includes(fileType)) {
    return true;
  }
  
  return false;
}

async function main() {
  try {
    console.log("🔍 Analyzing soft-deleted assets...\n");
    
    // Get all soft-deleted assets
    const deletedAssets = await db
      .select()
      .from(assets)
      .where(isNotNull(assets.deletedAt))
      .orderBy(assets.deletedAt);
    
    console.log(`Found ${deletedAssets.length} soft-deleted assets\n`);
    
    if (deletedAssets.length === 0) {
      console.log("✅ No soft-deleted assets found. Nothing to restore.");
      await conn.end();
      return;
    }
    
    // Categorize assets
    const nonImageAssets: any[] = [];
    const imageAssets: any[] = [];
    
    for (const asset of deletedAssets) {
      if (isNonImageAsset(asset)) {
        nonImageAssets.push(asset);
      } else {
        imageAssets.push(asset);
      }
    }
    
    console.log("📊 Asset breakdown:");
    console.log(`  Non-image assets (to restore): ${nonImageAssets.length}`);
    console.log(`  Image assets (keep deleted): ${imageAssets.length}\n`);
    
    // Show breakdown by file type for non-image assets
    if (nonImageAssets.length > 0) {
      console.log("📁 Non-image assets by type:");
      const typeCount: Record<string, number> = {};
      
      for (const asset of nonImageAssets) {
        const fileName = asset.fileName || asset.originalFileName || '';
        const extension = fileName.split('.').pop()?.toLowerCase() || 'unknown';
        const mimeType = asset.mimeType;
        const key = `${extension} (${mimeType})`;
        typeCount[key] = (typeCount[key] || 0) + 1;
      }
      
      for (const [type, count] of Object.entries(typeCount)) {
        console.log(`  ${type}: ${count} files`);
      }
      console.log();
    }
    
    // Show sample of files that will be restored
    if (nonImageAssets.length > 0) {
      console.log("📄 Sample files to be restored:");
      const sampleFiles = nonImageAssets.slice(0, 10);
      for (const asset of sampleFiles) {
        const fileName = asset.originalFileName || asset.fileName || 'Unknown';
        const deletedAt = asset.deletedAt?.toISOString().split('T')[0];
        console.log(`  ${fileName} (deleted: ${deletedAt})`);
      }
      if (nonImageAssets.length > 10) {
        console.log(`  ... and ${nonImageAssets.length - 10} more files`);
      }
      console.log();
    }
    
    // Confirm restoration
    if (nonImageAssets.length === 0) {
      console.log("✅ No non-image assets to restore.");
      await conn.end();
      return;
    }
    
    console.log("🔄 Restoring non-image assets...");
    
    // Restore non-image assets by setting deleted_at to NULL
    const assetIds = nonImageAssets.map(asset => asset.id);
    
    const result = await db
      .update(assets)
      .set({ deletedAt: null })
      .where(
        and(
          sql`${assets.id} = ANY(${assetIds})`,
          isNotNull(assets.deletedAt)
        )
      );
    
    console.log(`✅ Successfully restored ${result.rowCount || 0} non-image assets\n`);
    
    // Verify restoration
    const restoredAssets = await db
      .select()
      .from(assets)
      .where(
        and(
          sql`${assets.id} = ANY(${assetIds})`,
          sql`${assets.deletedAt} IS NULL`
        )
      );
    
    console.log(`✅ Verification: ${restoredAssets.length} assets are now active\n`);
    
    // Show remaining soft-deleted assets (should be mostly images)
    const remainingDeleted = await db
      .select()
      .from(assets)
      .where(isNotNull(assets.deletedAt));
    
    console.log(`📊 Summary:`);
    console.log(`  Restored non-image assets: ${result.rowCount || 0}`);
    console.log(`  Remaining soft-deleted assets: ${remainingDeleted.length}`);
    console.log(`  Total assets now active: ${deletedAssets.length - remainingDeleted.length} (restored) + existing active assets`);
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

// Handle CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}