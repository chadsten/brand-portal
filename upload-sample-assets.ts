#!/usr/bin/env tsx

/**
 * Upload real sample assets with correct file sizes
 */

import { storageManager } from "./src/server/storage";
import { db } from "./src/server/db";
import { assets } from "./src/server/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

async function uploadSampleAssets() {
  console.log("📤 Uploading real sample assets...");

  // Create simple test files with different sizes
  const sampleFiles = [
    {
      name: "Website Header Image.png",
      type: "image",
      mimeType: "image/png",
      // Simple 1x1 PNG but we'll make it larger
      data: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==".repeat(1000), "base64")
    },
    {
      name: "Product Photo - Main.jpg", 
      type: "image",
      mimeType: "image/jpeg",
      data: Buffer.from("/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=".repeat(800), "base64")
    }
  ];

  try {
    for (const file of sampleFiles) {
      console.log(`\n📁 Processing ${file.name}...`);
      
      const orgId = "1a2b3c4d-5e6f-7890-1234-567890abcdef"; // Use a test org ID
      const userId = "1a2b3c4d-5e6f-7890-1234-567890abcdef"; // Use a test user ID
      
      // Generate storage key
      const storageKey = storageManager.generateStorageKey(orgId, file.name, userId);
      
      console.log(`   File size: ${file.data.length} bytes`);
      console.log(`   Storage key: ${storageKey}`);
      
      // Upload to storage
      const uploadResult = await storageManager.uploadFile(
        orgId,
        storageKey,
        file.data,
        file.mimeType,
        { sample: "true" }
      );
      
      console.log(`   ✅ Uploaded: ${uploadResult.size} bytes`);
      
      // Find and update the database record
      const existingAssets = await db
        .select()
        .from(assets)
        .where(eq(assets.fileName, file.name));
      
      if (existingAssets.length > 0) {
        for (const asset of existingAssets) {
          await db
            .update(assets)
            .set({
              fileSize: uploadResult.size,
              storageKey: storageKey,
              processingStatus: "completed"
            })
            .where(eq(assets.id, asset.id));
          
          console.log(`   ✅ Updated database record ${asset.id} with correct size: ${uploadResult.size} bytes`);
        }
      } else {
        console.log(`   ⚠️ No database record found for ${file.name}`);
      }
    }
    
    console.log("\n✅ Sample assets uploaded successfully!");
    
  } catch (error) {
    console.error("❌ Upload failed:", error);
    throw error;
  }
}

// Run the upload
uploadSampleAssets()
  .then(() => {
    console.log("\n🎯 Upload completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Upload failed:", error);
    process.exit(1);
  });