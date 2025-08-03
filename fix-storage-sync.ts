// THIS SCRIPT FIXES DATA SYNC ISSUES BETWEEN DATABASE AND STORAGE
// It maps actual files in storage to database records

import { S3Client, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";

interface StorageFile {
  key: string;
  size: number;
  contentType?: string;
  lastModified?: Date;
}

async function fixStorageSync() {
  console.log("=== Fixing Storage-Database Sync ===");
  
  // Get all objects from MinIO
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
    console.log("Step 1: Getting all objects from MinIO...");
    const listCommand = new ListObjectsV2Command({
      Bucket: "brand-portal-dev",
    });
    
    const listResult = await client.send(listCommand);
    const allObjects = listResult.Contents || [];
    
    // Get detailed info for each object
    const storageFiles: StorageFile[] = [];
    for (const obj of allObjects) {
      if (!obj.Key) continue;
      
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: "brand-portal-dev",
          Key: obj.Key,
        });
        const headResult = await client.send(headCommand);
        
        storageFiles.push({
          key: obj.Key,
          size: headResult.ContentLength || obj.Size || 0,
          contentType: headResult.ContentType,
          lastModified: headResult.LastModified || obj.LastModified,
        });
      } catch (error) {
        console.warn(`Could not get details for ${obj.Key}:`, error);
        storageFiles.push({
          key: obj.Key,
          size: obj.Size || 0,
          lastModified: obj.LastModified,
        });
      }
    }

    // Separate assets from thumbnails
    const assetFiles = storageFiles.filter(f => f.key.startsWith('test-assets/'));
    const thumbnailFiles = storageFiles.filter(f => f.key.startsWith('test-thumbnails/'));
    
    console.log(`\nStep 2: Found ${assetFiles.length} assets and ${thumbnailFiles.length} thumbnails in storage`);
    
    console.log("\n=== ASSETS IN STORAGE ===");
    assetFiles.forEach((file, index) => {
      const fileName = file.key.split('/').pop()?.replace(/^[^-]*-[^-]*-/, '') || 'unknown';
      console.log(`${index + 1}. ${fileName}`);
      console.log(`   Key: ${file.key}`);
      console.log(`   Size: ${file.size} bytes`);
      console.log(`   Type: ${file.contentType || 'unknown'}`);
      console.log("");
    });

    console.log("=== THUMBNAILS IN STORAGE ===");
    thumbnailFiles.forEach((file, index) => {
      console.log(`${index + 1}. Thumbnail ${index + 1}`);
      console.log(`   Key: ${file.key}`);
      console.log(`   Size: ${file.size} bytes`);
      console.log(`   Type: ${file.contentType || 'unknown'}`);
      console.log("");
    });

    // Create mapping suggestions
    console.log("=== SUGGESTED DATABASE UPDATES ===");
    console.log("Run these SQL commands to fix the database:");
    console.log("");

    // First, delete any assets that don't match storage
    console.log("-- Step 1: Clean up mismatched records");
    console.log(`DELETE FROM assets WHERE "organizationId" = 'clwh0q8qd000008l7ft5ka23z' AND "storageKey" NOT IN (`);
    assetFiles.forEach((file, index) => {
      const comma = index < assetFiles.length - 1 ? ',' : '';
      console.log(`  '${file.key}'${comma}`);
    });
    console.log(");");
    console.log("");

    // Create new records for files that exist in storage
    console.log("-- Step 2: Insert/Update records for actual storage files");
    assetFiles.forEach((file, index) => {
      const fileName = file.key.split('/').pop()?.replace(/^[^-]*-[^-]*-/, '') || `file-${index + 1}`;
      const extension = fileName.split('.').pop()?.toLowerCase() || '';
      
      // Determine MIME type
      let mimeType = file.contentType || 'application/octet-stream';
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

      // Find matching thumbnail
      const thumbnailFile = thumbnailFiles[index]; // Assume same order for now
      
      console.log(`INSERT INTO assets (
  id,
  "originalFileName",
  "storageKey",
  "thumbnailKey",
  "fileSize",
  "mimeType",
  "organizationId",
  "uploadedBy",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  '${fileName}',
  '${file.key}',
  ${thumbnailFile ? `'${thumbnailFile.key}'` : 'NULL'},
  ${file.size},
  '${mimeType}',
  'clwh0q8qd000008l7ft5ka23z',
  'clwh0r8qd000108l7hjl8jm3x',
  NOW(),
  NOW()
) ON CONFLICT ("storageKey") DO UPDATE SET
  "originalFileName" = EXCLUDED."originalFileName",
  "thumbnailKey" = EXCLUDED."thumbnailKey",
  "fileSize" = EXCLUDED."fileSize",
  "mimeType" = EXCLUDED."mimeType",
  "updatedAt" = NOW();`);
      console.log("");
    });

    console.log("\n=== NEXT STEPS ===");
    console.log("1. Run the SQL commands above to sync the database with storage");
    console.log("2. Restart your development server");
    console.log("3. Test downloads and thumbnails again");
    console.log("");
    console.log("Note: This will create new asset records that match the actual files in storage.");

  } catch (error) {
    console.error("Error fixing storage sync:", error);
  }
}

fixStorageSync().catch(console.error);