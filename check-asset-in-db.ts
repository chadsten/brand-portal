#!/usr/bin/env tsx

/**
 * Check the database for assets and their storage info
 * Run with: SKIP_ENV_VALIDATION=true DATABASE_URL="your_db_url" npx tsx check-asset-in-db.ts
 */

import { db } from "./src/server/db";
import { assets } from "./src/server/db/schema";
import { like, desc } from "drizzle-orm";

async function checkAssets() {
  console.log("🔍 Checking assets in database...\n");

  try {
    // Get all assets, focusing on images
    const allAssets = await db
      .select({
        id: assets.id,
        title: assets.title,
        fileName: assets.fileName,
        originalFileName: assets.originalFileName,
        fileSize: assets.fileSize,
        mimeType: assets.mimeType,
        storageKey: assets.storageKey,
        thumbnailKey: assets.thumbnailKey,
        processingStatus: assets.processingStatus,
        createdAt: assets.createdAt,
      })
      .from(assets)
      .where(like(assets.title, "%header%"))
      .orderBy(desc(assets.createdAt))
      .limit(10);

    console.log(`Found ${allAssets.length} assets with 'header' in title:\n`);

    for (const asset of allAssets) {
      console.log(`📄 Asset: ${asset.title}`);
      console.log(`   ID: ${asset.id}`);
      console.log(`   File Name: ${asset.fileName}`);
      console.log(`   Original Name: ${asset.originalFileName}`);
      console.log(`   File Size: ${asset.fileSize} bytes (${(asset.fileSize / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`   MIME Type: ${asset.mimeType}`);
      console.log(`   Storage Key: ${asset.storageKey}`);
      console.log(`   Thumbnail Key: ${asset.thumbnailKey || 'None'}`);
      console.log(`   Processing Status: ${asset.processingStatus}`);
      console.log(`   Created: ${asset.createdAt}`);
      console.log(`   ---`);
    }

    // Also check for any assets with very large file sizes
    console.log("\n🔍 Checking for large assets (>10MB)...\n");
    
    const largeAssets = await db
      .select({
        id: assets.id,
        title: assets.title,
        fileName: assets.fileName,
        fileSize: assets.fileSize,
        storageKey: assets.storageKey,
      })
      .from(assets)
      .orderBy(desc(assets.fileSize))
      .limit(5);

    for (const asset of largeAssets) {
      const sizeInMB = (asset.fileSize / 1024 / 1024).toFixed(2);
      console.log(`📦 ${asset.title}: ${sizeInMB} MB (${asset.fileSize} bytes)`);
      console.log(`   Storage Key: ${asset.storageKey}`);
      console.log(`   File Name: ${asset.fileName}`);
      console.log(`   ---`);
    }

  } catch (error) {
    console.error("❌ Database check failed:", error);
    throw error;
  }
}

// Run the check
checkAssets()
  .then(() => {
    console.log("\n✅ Database check completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Check failed:", error);
    process.exit(1);
  });

export { checkAssets };