#!/usr/bin/env tsx

/**
 * Test script to upload an asset and track file size through the entire pipeline
 * Run with: npx tsx test-asset-upload.ts
 */

import { db } from "./src/server/db";
import { assets } from "./src/server/db/schema";
import { storageManager } from "./src/server/storage";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function createTestAsset() {
  console.log("🧪 Creating test asset to trace file size discrepancy...\n");

  // Create a test image file (simple PNG)
  const testImageData = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    "base64"
  );
  
  const testFileName = `test-image-${Date.now()}.png`;
  const originalSize = testImageData.length;
  
  console.log(`📏 Original test file size: ${originalSize} bytes`);
  
  try {
    // Step 1: Upload to storage
    console.log("\n📤 Step 1: Uploading to storage...");
    const storageKey = storageManager.generateStorageKey(
      "test-org-id",
      testFileName,
      "test-user-id"
    );
    
    const uploadResult = await storageManager.uploadFile(
      "test-org-id",
      storageKey,
      testImageData,
      "image/png",
      { test: "true", originalSize: originalSize.toString() }
    );
    
    console.log(`✅ Uploaded to storage:`, {
      key: uploadResult.key,
      size: uploadResult.size,
      sizeMatch: uploadResult.size === originalSize
    });

    // Step 2: Create database record
    console.log("\n💾 Step 2: Creating database record...");
    const [assetRecord] = await db
      .insert(assets)
      .values({
        organizationId: "test-org-id",
        uploadedBy: "test-user-id",
        fileName: testFileName,
        originalFileName: testFileName,
        fileType: "image",
        mimeType: "image/png",
        fileSize: originalSize, // Store original size
        storageKey: storageKey,
        title: "Test Asset",
        description: "Test asset for size debugging",
        processingStatus: "completed",
      })
      .returning();

    if (!assetRecord) {
      throw new Error("Failed to create asset record");
    }

    console.log(`✅ Database record created:`, {
      id: assetRecord.id,
      fileSize: assetRecord.fileSize,
      storageKey: assetRecord.storageKey
    });

    // Step 3: Verify storage file
    console.log("\n🔍 Step 3: Verifying file in storage...");
    const fileInfo = await storageManager.getFileInfo("test-org-id", storageKey);
    console.log(`✅ Storage file info:`, {
      exists: fileInfo.exists,
      size: fileInfo.size,
      sizeMatch: fileInfo.size === originalSize
    });

    // Step 4: Test download from storage
    console.log("\n⬇️ Step 4: Testing download from storage...");
    const downloadResult = await storageManager.downloadFile("test-org-id", storageKey);
    
    // Convert stream to buffer to check size
    const chunks: Uint8Array[] = [];
    const reader = downloadResult.body.getReader();
    let downloadedSize = 0;
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        downloadedSize += value.length;
      }
    } finally {
      reader.releaseLock();
    }

    console.log(`✅ Downloaded from storage:`, {
      contentLength: downloadResult.contentLength,
      actualDownloadedSize: downloadedSize,
      originalSizeMatch: downloadedSize === originalSize,
      contentType: downloadResult.contentType
    });

    // Step 5: Check for any optimized versions
    console.log("\n🔧 Step 5: Checking for optimized versions...");
    const optimizedKey = `${storageKey}.optimized.webp`;
    const optimizedInfo = await storageManager.getFileInfo("test-org-id", optimizedKey);
    console.log(`📋 Optimized file check:`, {
      optimizedKey,
      exists: optimizedInfo.exists,
      size: optimizedInfo.size || "N/A"
    });

    // Summary
    console.log("\n📊 SUMMARY:");
    console.log(`Original file size: ${originalSize} bytes`);
    console.log(`Database fileSize: ${assetRecord.fileSize} bytes`);
    console.log(`Storage file size: ${fileInfo.size || "unknown"} bytes`);
    console.log(`Downloaded size: ${downloadedSize} bytes`);
    console.log(`Storage key: ${storageKey}`);
    console.log(`Asset ID: ${assetRecord.id}`);
    
    const hasDiscrepancy = downloadedSize !== originalSize || 
                          (fileInfo.size && fileInfo.size !== originalSize) ||
                          assetRecord.fileSize !== originalSize;
    
    if (hasDiscrepancy) {
      console.log("\n❌ SIZE DISCREPANCY DETECTED!");
      console.log("This indicates the issue is reproducible with new uploads.");
    } else {
      console.log("\n✅ NO SIZE DISCREPANCY - sizes match throughout pipeline");
      console.log("The issue may be specific to existing assets or certain file types.");
    }

    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    await storageManager.deleteFile("test-org-id", storageKey);
    await db.delete(assets).where(eq(assets.id, assetRecord.id));
    console.log("✅ Test data cleaned up");
    
    return {
      originalSize,
      databaseSize: assetRecord.fileSize,
      storageSize: fileInfo.size,
      downloadedSize,
      hasDiscrepancy
    };

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

// Run the test
createTestAsset()
  .then((result) => {
    console.log("\n🎯 Test completed successfully");
    process.exit(result.hasDiscrepancy ? 1 : 0);
  })
  .catch((error) => {
    console.error("💥 Test failed:", error);
    process.exit(1);
  });

export { createTestAsset };