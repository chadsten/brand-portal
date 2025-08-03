import postgres from 'postgres';
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";

interface StorageFile {
  key: string;
  size: number;
  contentType?: string;
  originalName: string;
}

async function directDatabaseFix() {
  console.log("=== Direct Database Fix ===");

  // Connect to PostgreSQL directly
  const sql = postgres("postgresql://postgres:exotheterrible@localhost:5432/brand_portal");

  // Connect to MinIO
  const s3Client = new S3Client({
    region: "us-east-1",
    endpoint: "http://localhost:9000",
    credentials: {
      accessKeyId: "minioadmin",
      secretAccessKey: "minioadmin123",
    },
    forcePathStyle: true,
  });

  try {
    console.log("Connected to database");

    // Step 1: Get files from storage
    console.log("\nStep 1: Getting files from MinIO...");
    const listCommand = new ListObjectsV2Command({
      Bucket: "brand-portal-dev",
    });
    
    const listResult = await s3Client.send(listCommand);
    const allObjects = listResult.Contents || [];
    
    const storageFiles: StorageFile[] = [];
    for (const obj of allObjects) {
      if (!obj.Key) continue;
      
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: "brand-portal-dev",
          Key: obj.Key,
        });
        const headResult = await s3Client.send(headCommand);
        
        let originalName = obj.Key.split('/').pop() || 'unknown';
        originalName = originalName.replace(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-/, '');
        
        storageFiles.push({
          key: obj.Key,
          size: headResult.ContentLength || obj.Size || 0,
          contentType: headResult.ContentType,
          originalName,
        });
      } catch (error) {
        console.warn(`Could not get details for ${obj.Key}`);
      }
    }

    const assetFiles = storageFiles.filter(f => f.key.startsWith('test-assets/'));
    const thumbnailFiles = storageFiles.filter(f => f.key.startsWith('test-thumbnails/'));
    
    console.log(`Found ${assetFiles.length} assets and ${thumbnailFiles.length} thumbnails`);

    // Step 2: Show current database state
    console.log("\nStep 2: Checking current database state...");
    const currentAssets = await sql`
      SELECT id, "originalFileName", "storageKey", "thumbnailKey", "fileSize", "createdAt" 
      FROM brand_portal_assets 
      WHERE "organizationId" = 'clwh0q8qd000008l7ft5ka23z' 
        AND "deletedAt" IS NULL
      ORDER BY "createdAt" DESC
    `;
    
    console.log(`Current database has ${currentAssets.length} asset records:`);
    currentAssets.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.originalFileName} (key: ${row.storageKey})`);
    });

    // Step 3: Clean up mismatched records
    console.log("\nStep 3: Removing mismatched records...");
    const validKeys = assetFiles.map(f => f.key);
    
    const deleteResult = await sql`
      UPDATE brand_portal_assets 
      SET "deletedAt" = NOW() 
      WHERE "organizationId" = 'clwh0q8qd000008l7ft5ka23z' 
        AND "deletedAt" IS NULL
        AND "storageKey" != ALL(${validKeys})
    `;
    
    console.log(`Marked ${deleteResult.count} mismatched records as deleted`);

    // Step 4: Create/update records for storage files
    console.log("\nStep 4: Creating records for storage files...");
    
    for (let i = 0; i < assetFiles.length; i++) {
      const assetFile = assetFiles[i];
      const thumbnailFile = thumbnailFiles[i]; // Match by index for now
      
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

      // Insert or update the record
      const upsertResult = await sql`
        INSERT INTO brand_portal_assets (
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
          ${assetFile.originalName},
          ${assetFile.key},
          ${thumbnailFile?.key || null},
          ${assetFile.size},
          ${mimeType},
          'clwh0q8qd000008l7ft5ka23z',
          'clwh0r8qd000108l7hjl8jm3x',
          NOW(),
          NOW()
        )
        ON CONFLICT ("storageKey") DO UPDATE SET
          "originalFileName" = EXCLUDED."originalFileName",
          "thumbnailKey" = EXCLUDED."thumbnailKey",
          "fileSize" = EXCLUDED."fileSize",
          "mimeType" = EXCLUDED."mimeType",
          "updatedAt" = NOW(),
          "deletedAt" = NULL
        RETURNING id
      `;

      console.log(`✓ ${upsertResult.length > 0 ? 'Created/Updated' : 'Processed'}: ${assetFile.originalName}`);
    }

    // Step 5: Verify the fix
    console.log("\nStep 5: Verifying the fix...");
    const finalAssets = await sql`
      SELECT id, "originalFileName", "storageKey", "thumbnailKey", "fileSize" 
      FROM brand_portal_assets 
      WHERE "organizationId" = 'clwh0q8qd000008l7ft5ka23z' 
        AND "deletedAt" IS NULL
      ORDER BY "createdAt" DESC
    `;
    
    console.log(`\nFixed database now has ${finalAssets.length} asset records:`);
    finalAssets.forEach((row, index) => {
      const hasThumb = row.thumbnailKey ? "✓" : "✗";
      console.log(`  ${index + 1}. ${row.originalFileName} [${hasThumb} thumbnail]`);
      console.log(`     Asset:     ${row.storageKey}`);
      if (row.thumbnailKey) {
        console.log(`     Thumbnail: ${row.thumbnailKey}`);
      }
      console.log();
    });

    console.log("=== Fix Applied Successfully! ===");
    console.log("Database now matches storage. Downloads and thumbnails should work.");

  } catch (error) {
    console.error("Fix failed:", error);
  } finally {
    await sql.end();
  }
}

directDatabaseFix().catch(console.error);