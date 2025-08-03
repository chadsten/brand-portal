import { db } from "./src/server/db/index.js";
import { assets } from "./src/server/db/schema.js";
import { desc } from "drizzle-orm";

const recentAssets = await db.select().from(assets).orderBy(desc(assets.createdAt)).limit(3);
console.log("📊 Recent assets:");
recentAssets.forEach((asset, i) => {
  console.log(`${i + 1}. ${asset.title} (${asset.fileName})`);
  console.log(`   ID: ${asset.id}`);
  console.log(`   MimeType: ${asset.mimeType}`);
  console.log(`   ThumbnailKey: ${asset.thumbnailKey || "null"}`);
  console.log(`   ProcessingStatus: ${asset.processingStatus}`);
  console.log(`   StorageKey: ${asset.storageKey}`);
  console.log("");
});

// Test thumbnail URL logic
if (recentAssets.length > 0) {
  const asset = recentAssets[0];
  console.log("🔍 Testing thumbnail logic for first asset:");
  console.log(`Asset has thumbnailKey: ${!!asset.thumbnailKey}`);
  console.log(`Asset is image: ${asset.mimeType.startsWith("image/")}`);
  
  if (asset.thumbnailKey) {
    console.log(`Would use thumbnail URL: /api/assets/${asset.id}/thumbnail`);
  } else if (asset.mimeType.startsWith("image/")) {
    console.log(`Would use download URL: /api/assets/${asset.id}/download`);
  } else {
    console.log("Would show file icon");
  }
}

process.exit(0);