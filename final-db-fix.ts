import postgres from 'postgres';
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";

interface StorageFile {
  key: string;
  size: number;
  contentType?: string;
  originalName: string;
}

async function finalDatabaseFix() {
  console.log("=== Final Database Fix ===");

  const sql = postgres("postgresql://postgres:exotheterrible@localhost:5432/brand_portal");
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
      SELECT id, original_file_name, storage_key, thumbnail_key, file_size, created_at 
      FROM brand_portal_assets 
      WHERE organization_id = 'b614723b-8b45-4b3b-bcc4-996d04bcb25f' 
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    
    console.log(`Current database has ${currentAssets.length} asset records:`);
    currentAssets.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.original_file_name} (key: ${row.storage_key})`);
    });

    // Step 3: Clean up mismatched records  
    console.log("\nStep 3: Removing mismatched records...");
    const validKeys = assetFiles.map(f => f.key);
    
    const deleteResult = await sql`
      UPDATE brand_portal_assets 
      SET deleted_at = NOW() 
      WHERE organization_id = 'b614723b-8b45-4b3b-bcc4-996d04bcb25f' 
        AND deleted_at IS NULL
        AND storage_key != ALL(${validKeys})
    `;
    
    console.log(`Marked ${deleteResult.count} mismatched records as deleted`);

    // Step 4: Create/update records for storage files
    console.log("\nStep 4: Creating records for storage files...");
    
    for (let i = 0; i < assetFiles.length; i++) {
      const assetFile = assetFiles[i];
      // Match thumbnail by size
      const thumbnailFile = thumbnailFiles.find(thumb => thumb.size === assetFile.size);
      
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

      const fileType = mimeType.split('/')[0] || 'file';

      // Insert or update the record
      const upsertResult = await sql`
        INSERT INTO brand_portal_assets (
          id,
          organization_id,
          uploaded_by,
          file_name,
          original_file_name,
          file_type,
          mime_type,
          file_size,
          storage_key,
          thumbnail_key,
          storage_provider,
          title,
          description,
          tags,
          metadata,
          processing_status,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          'b614723b-8b45-4b3b-bcc4-996d04bcb25f',
          '780556cf-75c3-4a5e-92f1-3e1c01123eaa',
          ${assetFile.originalName},
          ${assetFile.originalName},
          ${fileType},
          ${mimeType},
          ${assetFile.size},
          ${assetFile.key},
          ${thumbnailFile?.key || null},
          'default',
          ${assetFile.originalName.replace(/\.[^/.]+$/, "")},
          'Synced from storage',
          '[]'::jsonb,
          '{}'::jsonb,
          'completed',
          NOW(),
          NOW()
        )
        ON CONFLICT (storage_key) DO UPDATE SET
          file_name = EXCLUDED.file_name,
          original_file_name = EXCLUDED.original_file_name,
          thumbnail_key = EXCLUDED.thumbnail_key,
          file_size = EXCLUDED.file_size,
          mime_type = EXCLUDED.mime_type,
          updated_at = NOW(),
          deleted_at = NULL
        RETURNING id
      `;

      console.log(`✓ ${upsertResult.length > 0 ? 'Created/Updated' : 'Processed'}: ${assetFile.originalName}`);
    }

    // Step 5: Verify the fix
    console.log("\nStep 5: Verifying the fix...");
    const finalAssets = await sql`
      SELECT id, original_file_name, storage_key, thumbnail_key, file_size 
      FROM brand_portal_assets 
      WHERE organization_id = 'b614723b-8b45-4b3b-bcc4-996d04bcb25f' 
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    
    console.log(`\nFixed database now has ${finalAssets.length} asset records:`);
    finalAssets.forEach((row, index) => {
      const hasThumb = row.thumbnail_key ? "✓" : "✗";
      console.log(`  ${index + 1}. ${row.original_file_name} [${hasThumb} thumbnail]`);
      console.log(`     Asset:     ${row.storage_key}`);
      if (row.thumbnail_key) {
        console.log(`     Thumbnail: ${row.thumbnail_key}`);
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

finalDatabaseFix().catch(console.error);