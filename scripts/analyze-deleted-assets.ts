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
  'audio/mpeg',
  'audio/wav',
  'font/woff',
  'font/woff2',
  'application/font-woff',
  'application/font-woff2'
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
    console.log("🔍 Analyzing soft-deleted assets...\n");
    
    // Get all soft-deleted assets
    const deletedAssets = await conn`
      SELECT id, file_name, original_file_name, file_type, mime_type, deleted_at
      FROM brand_portal_assets 
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `;
    
    console.log(`Found ${deletedAssets.length} soft-deleted assets\n`);
    
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
    
    console.log("📊 Asset breakdown:");
    console.log(`  Non-image assets (should be restored): ${nonImageAssets.length}`);
    console.log(`  Image assets (keep deleted): ${imageAssets.length}\n`);
    
    // Show breakdown by file type for non-image assets
    if (nonImageAssets.length > 0) {
      console.log("📁 Non-image assets by type:");
      const typeCount: Record<string, number> = {};
      
      for (const asset of nonImageAssets) {
        const fileName = asset.file_name || asset.original_file_name || '';
        const extension = fileName.split('.').pop()?.toLowerCase() || 'unknown';
        const mimeType = asset.mime_type;
        const key = `${extension} (${mimeType})`;
        typeCount[key] = (typeCount[key] || 0) + 1;
      }
      
      for (const [type, count] of Object.entries(typeCount)) {
        console.log(`  ${type}: ${count} files`);
      }
      console.log();
    }
    
    // Show sample of non-image files
    if (nonImageAssets.length > 0) {
      console.log("📄 Sample non-image files to restore:");
      const sampleFiles = nonImageAssets.slice(0, 15);
      for (const asset of sampleFiles) {
        const fileName = asset.original_file_name || asset.file_name || 'Unknown';
        const deletedAt = asset.deleted_at?.toISOString().split('T')[0];
        console.log(`  ${fileName} (deleted: ${deletedAt})`);
      }
      if (nonImageAssets.length > 15) {
        console.log(`  ... and ${nonImageAssets.length - 15} more files`);
      }
      console.log();
    }
    
    // Show sample of image files that will stay deleted
    if (imageAssets.length > 0) {
      console.log("🖼️ Sample image files (will stay deleted):");
      const sampleImages = imageAssets.slice(0, 10);
      for (const asset of sampleImages) {
        const fileName = asset.original_file_name || asset.file_name || 'Unknown';
        const deletedAt = asset.deleted_at?.toISOString().split('T')[0];
        console.log(`  ${fileName} (deleted: ${deletedAt})`);
      }
      if (imageAssets.length > 10) {
        console.log(`  ... and ${imageAssets.length - 10} more image files`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await conn.end();
  }
}

main();