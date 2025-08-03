#!/usr/bin/env tsx

import { db } from "./src/server/db";
import { assets } from "./src/server/db/schema";
import { like, desc } from "drizzle-orm";

async function checkImageAssets() {
  console.log("🔍 Checking image assets in database...\n");

  try {
    // Get all image assets
    const imageAssets = await db
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
      .where(like(assets.mimeType, "image/%"))
      .orderBy(desc(assets.fileSize))
      .limit(10);

    console.log(`Found ${imageAssets.length} image assets:\n`);

    for (const asset of imageAssets) {
      const sizeInMB = (asset.fileSize / 1024 / 1024).toFixed(2);
      const sizeInKB = (asset.fileSize / 1024).toFixed(2);
      
      console.log(`🖼️ ${asset.title}`);
      console.log(`   ID: ${asset.id}`);
      console.log(`   File Size: ${asset.fileSize} bytes (${sizeInMB} MB / ${sizeInKB} KB)`);
      console.log(`   MIME Type: ${asset.mimeType}`);
      console.log(`   Storage Key: ${asset.storageKey}`);
      console.log(`   Thumbnail Key: ${asset.thumbnailKey || 'None'}`);
      console.log(`   Processing Status: ${asset.processingStatus}`);
      console.log(`   File Name: ${asset.fileName}`);
      console.log(`   Original Name: ${asset.originalFileName}`);
      console.log(`   Created: ${asset.createdAt?.toISOString().split('T')[0]}`);
      console.log(`   ---`);
    }

    // Look for assets with "website" or "header" in title
    console.log("\n🔍 Searching for website/header related assets...\n");
    
    const websiteAssets = await db
      .select({
        id: assets.id,
        title: assets.title,
        fileName: assets.fileName,
        fileSize: assets.fileSize,
        mimeType: assets.mimeType,
        storageKey: assets.storageKey,
      })
      .from(assets)
      .where(like(assets.title, "%website%"))
      .orderBy(desc(assets.createdAt));

    if (websiteAssets.length > 0) {
      for (const asset of websiteAssets) {
        const sizeInMB = (asset.fileSize / 1024 / 1024).toFixed(2);
        const sizeInKB = (asset.fileSize / 1024).toFixed(2);
        console.log(`🌐 ${asset.title}: ${sizeInMB} MB (${sizeInKB} KB)`);
        console.log(`   Storage Key: ${asset.storageKey}`);
        console.log(`   MIME Type: ${asset.mimeType}`);
        console.log(`   ---`);
      }
    } else {
      console.log("No assets found with 'website' in title");
    }

  } catch (error) {
    console.error("❌ Database check failed:", error);
    throw error;
  }
}

// Run the check
checkImageAssets()
  .then(() => {
    console.log("\n✅ Image asset check completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Check failed:", error);
    process.exit(1);
  });