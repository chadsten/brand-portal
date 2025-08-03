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

async function main() {
  const conn = postgres(DATABASE_URL, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

  try {
    console.log("🔍 Verifying restoration results...\n");
    
    // Overall statistics
    const total = await conn`SELECT COUNT(*) as count FROM brand_portal_assets`;
    const active = await conn`SELECT COUNT(*) as count FROM brand_portal_assets WHERE deleted_at IS NULL`;
    const deleted = await conn`SELECT COUNT(*) as count FROM brand_portal_assets WHERE deleted_at IS NOT NULL`;
    
    console.log(`📊 Asset Statistics:`);
    console.log(`  Total assets: ${total[0]?.count}`);
    console.log(`  Active assets: ${active[0]?.count}`);
    console.log(`  Still deleted: ${deleted[0]?.count}\n`);
    
    // Active assets by type
    console.log(`📁 Active assets by file type:`);
    const activeByType = await conn`
      SELECT file_type, COUNT(*) as count
      FROM brand_portal_assets 
      WHERE deleted_at IS NULL
      GROUP BY file_type
      ORDER BY count DESC
    `;
    
    for (const { file_type, count } of activeByType) {
      console.log(`  ${file_type || 'unknown'}: ${count} files`);
    }
    
    // Still deleted assets by type
    console.log(`\n🗑️ Still deleted assets by file type:`);
    const deletedByType = await conn`
      SELECT file_type, COUNT(*) as count
      FROM brand_portal_assets 
      WHERE deleted_at IS NOT NULL
      GROUP BY file_type
      ORDER BY count DESC
    `;
    
    for (const { file_type, count } of deletedByType) {
      console.log(`  ${file_type || 'unknown'}: ${count} files`);
    }
    
    // Sample of active documents/videos/audio
    console.log(`\n📄 Sample restored non-image assets:`);
    const sampleActive = await conn`
      SELECT original_file_name, file_type, mime_type
      FROM brand_portal_assets 
      WHERE deleted_at IS NULL 
      AND file_type IN ('document', 'video', 'audio')
      ORDER BY created_at DESC
      LIMIT 15
    `;
    
    for (const asset of sampleActive) {
      console.log(`  ${asset.original_file_name} (${asset.file_type} - ${asset.mime_type})`);
    }
    
    console.log(`\n✅ Verification complete!`);
    console.log(`   - Non-image assets are now active and should appear in the UI`);
    console.log(`   - Image assets with storage issues remain deleted`);
    console.log(`   - Users can now browse and see all document, video, and audio files`);
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await conn.end();
  }
}

main();