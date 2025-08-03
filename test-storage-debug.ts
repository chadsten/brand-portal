import { storageManager } from "./src/server/storage/index";
import { db } from "./src/server/db";
import { assets } from "./src/server/db/schema";
import { eq, and, isNull } from "drizzle-orm";

async function testStorageConnectivity() {
  console.log("=== Testing Storage Connectivity ===");
  
  try {
    // Test connection with default config
    const config = await storageManager.getOrganizationConfig("clwh0q8qd000008l7ft5ka23z");
    console.log("Storage config:", {
      provider: config.provider,
      bucketName: config.bucketName,
      region: config.region,
      endpoint: config.endpoint
    });

    // Test connection
    const testResult = await storageManager.testConnection(config);
    console.log("Connection test result:", testResult);

    // Get sample assets from database
    console.log("\n=== Getting Sample Assets ===");
    const sampleAssets = await db
      .select({
        id: assets.id,
        originalFileName: assets.originalFileName,
        storageKey: assets.storageKey,
        thumbnailKey: assets.thumbnailKey,
        organizationId: assets.organizationId,
        fileSize: assets.fileSize
      })
      .from(assets)
      .where(and(
        eq(assets.organizationId, "clwh0q8qd000008l7ft5ka23z"),
        isNull(assets.deletedAt)
      ))
      .limit(3);

    console.log(`Found ${sampleAssets.length} assets in database`);

    for (const asset of sampleAssets) {
      console.log(`\n--- Testing Asset: ${asset.originalFileName} ---`);
      console.log("Asset details:", {
        id: asset.id,
        storageKey: asset.storageKey,
        thumbnailKey: asset.thumbnailKey,
        fileSize: asset.fileSize
      });

      // Test if original file exists
      console.log("Checking original file existence...");
      try {
        const originalInfo = await storageManager.getFileInfo(asset.organizationId, asset.storageKey);
        console.log("Original file info:", originalInfo);
      } catch (error) {
        console.error("Error checking original file:", error);
      }

      // Test if thumbnail exists
      if (asset.thumbnailKey) {
        console.log("Checking thumbnail file existence...");
        try {
          const thumbInfo = await storageManager.getFileInfo(asset.organizationId, asset.thumbnailKey);
          console.log("Thumbnail file info:", thumbInfo);
        } catch (error) {
          console.error("Error checking thumbnail file:", error);
        }
      }

      // Try to download original file
      console.log("Attempting to download original file...");
      try {
        const downloadResult = await storageManager.downloadFile(asset.organizationId, asset.storageKey);
        console.log("Download result:", {
          hasBody: !!downloadResult.body,
          contentType: downloadResult.contentType,
          contentLength: downloadResult.contentLength
        });
      } catch (error) {
        console.error("Download error:", error);
      }

      // Try to download thumbnail
      if (asset.thumbnailKey) {
        console.log("Attempting to download thumbnail...");
        try {
          const thumbDownload = await storageManager.downloadFile(asset.organizationId, asset.thumbnailKey);
          console.log("Thumbnail download result:", {
            hasBody: !!thumbDownload.body,
            contentType: thumbDownload.contentType,
            contentLength: thumbDownload.contentLength
          });
        } catch (error) {
          console.error("Thumbnail download error:", error);
        }
      }
    }

  } catch (error) {
    console.error("Storage test failed:", error);
  }
}

testStorageConnectivity().catch(console.error);