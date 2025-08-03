// This script automatically fixes the database to match storage
// It requires environment variables to be loaded

import { S3Client, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";

// Mock environment for this script
process.env.SKIP_ENV_VALIDATION = "1";
process.env.DATABASE_URL = "postgresql://postgres:exotheterrible@localhost:5432/brand_portal";
process.env.NODE_ENV = "development";

// Import after setting environment
import { db } from "./src/server/db/index";
import { assets } from "./src/server/db/schema";
import { eq, and, isNull } from "drizzle-orm";

interface StorageFile {
  key: string;
  size: number;
  contentType?: string;
  lastModified?: Date;
  originalName: string;
}

async function applyStorageFix() {
  console.log("=== Applying Storage Database Fix ===");
  
  const client = new S3Client({
    region: "us-east-1",
    endpoint: "http://localhost:9000",
    credentials: {
      accessKeyId: "minioadmin",
      secretAccessKey: "minioadmin123",
    },
    forcePathStyle: true,
  });

  try {
    // Step 1: Get all files from storage
    console.log("Step 1: Getting files from MinIO storage...");
    const listCommand = new ListObjectsV2Command({
      Bucket: "brand-portal-dev",
    });
    
    const listResult = await client.send(listCommand);
    const allObjects = listResult.Contents || [];
    
    const storageFiles: StorageFile[] = [];
    for (const obj of allObjects) {
      if (!obj.Key) continue;
      
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: "brand-portal-dev",
          Key: obj.Key,
        });
        const headResult = await client.send(headCommand);
        
        // Extract original filename
        let originalName = obj.Key.split('/').pop() || 'unknown';
        // Remove UUID prefix (pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-)
        originalName = originalName.replace(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-/, '');
        
        storageFiles.push({
          key: obj.Key,
          size: headResult.ContentLength || obj.Size || 0,
          contentType: headResult.ContentType,
          lastModified: headResult.LastModified || obj.LastModified,
          originalName,
        });
      } catch (error) {
        console.warn(`Could not get details for ${obj.Key}`);
      }
    }

    const assetFiles = storageFiles.filter(f => f.key.startsWith('test-assets/'));
    const thumbnailFiles = storageFiles.filter(f => f.key.startsWith('test-thumbnails/'));
    
    console.log(`Found ${assetFiles.length} assets and ${thumbnailFiles.length} thumbnails`);

    // Step 2: Clean up existing mismatched records
    console.log("\nStep 2: Cleaning up mismatched database records...");
    const orgId = 'clwh0q8qd000008l7ft5ka23z';
    const userId = 'clwh0r8qd000108l7hjl8jm3x';
    
    // Get existing assets
    const existingAssets = await db
      .select()
      .from(assets)
      .where(and(
        eq(assets.organizationId, orgId),
        isNull(assets.deletedAt)
      ));
    
    console.log(`Found ${existingAssets.length} existing database records`);

    // Delete assets that don't have matching storage keys
    const validStorageKeys = assetFiles.map(f => f.key);
    const assetsToDelete = existingAssets.filter(asset => !validStorageKeys.includes(asset.storageKey));
    
    if (assetsToDelete.length > 0) {
      console.log(`Deleting ${assetsToDelete.length} mismatched records...`);
      for (const asset of assetsToDelete) {
        await db
          .update(assets)
          .set({ deletedAt: new Date() })
          .where(eq(assets.id, asset.id));
      }
    }

    // Step 3: Create/update records for storage files
    console.log("\nStep 3: Creating records for storage files...");
    
    // Match thumbnails to assets (by size matching for now)
    const createAssetRecord = async (assetFile: StorageFile, thumbnailFile?: StorageFile) => {
      let mimeType = assetFile.contentType || 'application/octet-stream';
      const extension = assetFile.originalName.split('.').pop()?.toLowerCase() || '';
      
      if (!mimeType || mimeType === 'binary/octet-stream') {
        switch (extension) {
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'png':
            mimeType = 'image/png';
            break;
          case 'tiff':
          case 'tif':
            mimeType = 'image/tiff';
            break;
          default:
            mimeType = 'application/octet-stream';
        }
      }

      // Check if record already exists
      const existing = await db
        .select()
        .from(assets)
        .where(and(
          eq(assets.storageKey, assetFile.key),
          eq(assets.organizationId, orgId),
          isNull(assets.deletedAt)
        ))
        .limit(1);

      if (existing.length > 0) {
        // Update existing record
        await db
          .update(assets)
          .set({
            originalFileName: assetFile.originalName,
            thumbnailKey: thumbnailFile?.key || null,
            fileSize: assetFile.size,
            mimeType,
            updatedAt: new Date(),
          })
          .where(eq(assets.id, existing[0].id));
        
        console.log(`Updated: ${assetFile.originalName}`);
      } else {
        // Create new record
        await db
          .insert(assets)
          .values({
            originalFileName: assetFile.originalName,
            storageKey: assetFile.key,
            thumbnailKey: thumbnailFile?.key || null,
            fileSize: assetFile.size,
            mimeType,
            organizationId: orgId,
            uploadedBy: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        
        console.log(`Created: ${assetFile.originalName}`);
      }
    };

    // Match thumbnails to assets by size
    for (const assetFile of assetFiles) {
      const matchingThumbnail = thumbnailFiles.find(thumb => thumb.size === assetFile.size);
      await createAssetRecord(assetFile, matchingThumbnail);
    }

    console.log("\n=== Fix Applied Successfully! ===");
    console.log("The database now matches the files in storage.");
    console.log("Please restart your development server and test downloads/thumbnails.");

  } catch (error) {
    console.error("Error applying storage fix:", error);
  }
}

applyStorageFix().catch(console.error);