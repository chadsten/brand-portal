#!/usr/bin/env tsx

import { db } from "./src/server/db";
import { assets } from "./src/server/db/schema";
import { desc } from "drizzle-orm";

async function checkRecentAssets() {
  console.log("🔍 Checking recent assets...\n");

  const recentAssets = await db
    .select()
    .from(assets)
    .orderBy(desc(assets.createdAt))
    .limit(10);

  console.log("Recent assets:");
  recentAssets.forEach(asset => {
    const sizeKB = (asset.fileSize / 1024).toFixed(1);
    console.log(`- ${asset.title}: ${sizeKB} KB (${asset.mimeType})`);
  });
}

checkRecentAssets()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });