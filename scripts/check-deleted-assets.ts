#!/usr/bin/env tsx

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { isNotNull, sql, count } from "drizzle-orm";
import postgres from "postgres";
import { assets } from "../src/server/db/schema";

// Load environment variables
config({ path: ".env.local" });

// Configuration
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

// Database connection
const connectionConfig = {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
} as const;

const conn = postgres(DATABASE_URL, connectionConfig);
const db = drizzle(conn, { schema: { assets } });

async function main() {
  try {
    console.log("🔍 Checking asset deletion status...\n");
    
    // Get total asset count
    const totalResult = await db
      .select({ count: count() })
      .from(assets);
    
    const totalAssets = totalResult[0]?.count || 0;
    console.log(`Total assets in database: ${totalAssets}`);
    
    // Get active asset count
    const activeResult = await db
      .select({ count: count() })
      .from(assets)
      .where(sql`${assets.deletedAt} IS NULL`);
    
    const activeAssets = activeResult[0]?.count || 0;
    console.log(`Active assets (not deleted): ${activeAssets}`);
    
    // Get deleted asset count
    const deletedResult = await db
      .select({ count: count() })
      .from(assets)
      .where(isNotNull(assets.deletedAt));
    
    const deletedAssets = deletedResult[0]?.count || 0;
    console.log(`Soft-deleted assets: ${deletedAssets}`);
    
    console.log(`\n📊 Summary:`);
    console.log(`  Total: ${totalAssets}`);
    console.log(`  Active: ${activeAssets}`);
    console.log(`  Deleted: ${deletedAssets}`);
    
    if (deletedAssets > 0) {
      console.log(`\n🔍 Checking recent deletions...`);
      
      // Get some details about deleted assets
      const recentDeleted = await db
        .select({
          id: assets.id,
          fileName: assets.fileName,
          originalFileName: assets.originalFileName,
          fileType: assets.fileType,
          mimeType: assets.mimeType,
          deletedAt: assets.deletedAt
        })
        .from(assets)
        .where(isNotNull(assets.deletedAt))
        .orderBy(sql`${assets.deletedAt} DESC`)
        .limit(20);
      
      console.log(`\nLast ${Math.min(20, recentDeleted.length)} deleted assets:`);
      for (const asset of recentDeleted) {
        const fileName = asset.originalFileName || asset.fileName || 'Unknown';
        const fileType = asset.fileType || 'unknown';
        const deletedAt = asset.deletedAt?.toISOString().split('T')[0];
        console.log(`  ${fileName} (${fileType}) - deleted: ${deletedAt}`);
      }
      
      // Group by file type
      console.log(`\n📁 Deleted assets by file type:`);
      const typeCountResult = await db
        .select({
          fileType: assets.fileType,
          count: count()
        })
        .from(assets)
        .where(isNotNull(assets.deletedAt))
        .groupBy(assets.fileType)
        .orderBy(sql`count DESC`);
      
      for (const { fileType, count } of typeCountResult) {
        console.log(`  ${fileType || 'unknown'}: ${count} files`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

// Handle CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}