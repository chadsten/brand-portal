/**
 * Debug script to investigate asset modal title/description issue
 * Run with: npx tsx debug-asset-modal.ts
 */

import { db } from "./src/server/db";
import { assets } from "./src/server/db/schema";
import { isNull } from "drizzle-orm";

async function debugAssetData() {
  console.log("🔍 Debugging Asset Modal Data Issue\n");
  
  try {
    // Get recent assets to see what data exists
    const recentAssets = await db.query.assets.findMany({
      where: isNull(assets.deletedAt),
      orderBy: (assets, { desc }) => [desc(assets.createdAt)],
      limit: 10,
      columns: {
        id: true,
        title: true,
        description: true,
        fileName: true,
        originalFileName: true,
        createdAt: true,
      },
    });

    console.log(`Found ${recentAssets.length} recent assets:\n`);
    
    recentAssets.forEach((asset, index) => {
      console.log(`${index + 1}. Asset ID: ${asset.id}`);
      console.log(`   Title: "${asset.title || 'NULL/EMPTY'}"`);
      console.log(`   Description: "${asset.description || 'NULL/EMPTY'}"`);
      console.log(`   File Name: "${asset.fileName}"`);
      console.log(`   Original Name: "${asset.originalFileName}"`);
      console.log(`   Created: ${asset.createdAt}`);
      console.log("");
    });

    // Check for assets with missing title/description
    const assetsWithoutTitle = recentAssets.filter(a => !a.title || a.title.trim() === "");
    const assetsWithoutDescription = recentAssets.filter(a => !a.description || a.description.trim() === "");
    
    console.log(`📊 Summary:`);
    console.log(`   - Assets without title: ${assetsWithoutTitle.length}`);
    console.log(`   - Assets without description: ${assetsWithoutDescription.length}`);
    
    if (assetsWithoutTitle.length > 0) {
      console.log(`\n❌ Assets missing titles:`);
      assetsWithoutTitle.forEach(asset => {
        console.log(`   - ${asset.id} (${asset.originalFileName})`);
      });
    }
    
    if (assetsWithoutDescription.length > 0) {
      console.log(`\n❌ Assets missing descriptions:`);
      assetsWithoutDescription.forEach(asset => {
        console.log(`   - ${asset.id} (${asset.originalFileName})`);
      });
    }

    // If we have assets, let's test the tRPC query logic
    if (recentAssets.length > 0) {
      const testAsset = recentAssets[0];
      console.log(`\n🧪 Testing tRPC query logic for asset: ${testAsset.id}`);
      
      // Simulate the same query that the modal uses
      const detailedAsset = await db.query.assets.findFirst({
        where: (assets, { and, eq, isNull }) => and(
          eq(assets.id, testAsset.id),
          isNull(assets.deletedAt),
        ),
        with: {
          uploader: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      if (detailedAsset) {
        console.log(`✅ Asset found via tRPC query:`);
        console.log(`   Title: "${detailedAsset.title}"`);
        console.log(`   Description: "${detailedAsset.description || 'NULL/EMPTY'}"`);
        console.log(`   Uploader: ${detailedAsset.uploader?.name || 'No uploader'}`);
      } else {
        console.log(`❌ Asset NOT found via tRPC query logic`);
      }
    }

  } catch (error) {
    console.error("❌ Debug failed:", error);
  }
}

// Run the debug
debugAssetData().catch(console.error);