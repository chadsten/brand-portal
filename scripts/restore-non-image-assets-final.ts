#!/usr/bin/env tsx

import { config } from "dotenv";
import postgres from "postgres";

// Load environment variables
config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

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
  'video/x-ms-wmv',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/aac',
  'audio/flac',
  'font/woff',
  'font/woff2',
  'application/font-woff',
  'application/font-woff2',
  'application/rtf',
  'application/x-cfb',
  'image/vnd.adobe.photoshop'
];

function isNonImageAsset(asset: any): boolean {
  // Check file extension
  const fileName = asset.file_name || asset.original_file_name || '';
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (extension && NON_IMAGE_EXTENSIONS.includes(extension)) {
    return true;
  }
  
  // Check MIME type
  const mimeType = asset.mime_type?.toLowerCase();
  if (mimeType && NON_IMAGE_MIME_TYPES.includes(mimeType)) {
    return true;
  }
  
  // Check file type field
  const fileType = asset.file_type?.toLowerCase();
  if (fileType && NON_IMAGE_EXTENSIONS.includes(fileType)) {
    return true;
  }
  
  return false;
}

async function main() {
  const conn = postgres(DATABASE_URL, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

  try {
    console.log("🔍 Starting restoration of non-image assets...\n");
    
    // Get all soft-deleted assets
    const deletedAssets = await conn`
      SELECT id, file_name, original_file_name, file_type, mime_type, deleted_at
      FROM brand_portal_assets 
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `;
    
    console.log(`Found ${deletedAssets.length} soft-deleted assets`);
    
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
    
    console.log(`  Non-image assets to restore: ${nonImageAssets.length}`);
    console.log(`  Image assets to keep deleted: ${imageAssets.length}\n`);
    
    if (nonImageAssets.length === 0) {
      console.log("✅ No non-image assets to restore.");
      return;
    }
    
    // Restore non-image assets
    const assetIds = nonImageAssets.map(asset => asset.id);
    
    console.log("🔄 Restoring non-image assets...");
    
    const result = await conn`
      UPDATE brand_portal_assets 
      SET deleted_at = NULL 
      WHERE id = ANY(${assetIds}) 
      AND deleted_at IS NOT NULL
    `;
    
    console.log(`✅ Successfully restored ${result.count} non-image assets\n`);
    
    // Verify restoration
    const nowActive = await conn`
      SELECT COUNT(*) as count 
      FROM brand_portal_assets 
      WHERE deleted_at IS NULL
    `;
    
    const stillDeleted = await conn`
      SELECT COUNT(*) as count 
      FROM brand_portal_assets 
      WHERE deleted_at IS NOT NULL
    `;
    
    console.log(`📊 Final status:`);
    console.log(`  Active assets: ${nowActive[0]?.count}`);
    console.log(`  Still deleted (mainly images): ${stillDeleted[0]?.count}`);
    
    // Show what types were restored
    console.log(`\n📁 Restored asset types:`);
    const restoredAssets = await conn`
      SELECT file_type, COUNT(*) as count
      FROM brand_portal_assets 
      WHERE id = ANY(${assetIds})
      AND deleted_at IS NULL
      GROUP BY file_type
      ORDER BY count DESC
    `;
    
    for (const { file_type, count } of restoredAssets) {
      console.log(`  ${file_type || 'unknown'}: ${count} files`);
    }
    
    console.log(`\n✅ Restoration complete! Non-image assets should now be visible in the UI.`);
    console.log(`   Note: These files will display with file type icons instead of thumbnails.`);
    console.log(`   Downloads may fail if storage files don't exist, but assets are visible for browsing.`);
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();