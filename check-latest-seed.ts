import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/server/db/schema';

const sql = postgres('postgresql://postgres:exotheterrible@localhost:5432/brand_portal');
const db = drizzle(sql, { schema });

async function checkLatestSeed() {
  // Get the 37 most recent assets (our latest seed run)
  const recentAssets = await db.query.assets.findMany({
    orderBy: (assets, { desc }) => [desc(assets.createdAt)],
    limit: 37
  });
  
  console.log(`Checking latest seed run (37 most recent assets):`);
  
  // Check metadata extraction for these files
  const withRichMetadata = recentAssets.filter(asset => 
    asset.metadata && 
    Object.keys(asset.metadata).length > 3 && // sourceFile, discoveredAt, fileStats + actual metadata
    !asset.metadata.error
  );
  
  const withBasicMetadata = recentAssets.filter(asset => 
    asset.metadata && 
    Object.keys(asset.metadata).length >= 2 &&
    Object.keys(asset.metadata).length <= 3 &&
    !asset.metadata.error
  );
  
  const withErrors = recentAssets.filter(asset => 
    asset.metadata && asset.metadata.error
  );
  
  const withoutMetadata = recentAssets.filter(asset => !asset.metadata);
  
  console.log(`\n📊 Metadata extraction results:`);
  console.log(`  ✅ Rich metadata extracted: ${withRichMetadata.length}`);
  console.log(`  📝 Basic metadata only: ${withBasicMetadata.length}`);
  console.log(`  ⚠️ Extraction errors: ${withErrors.length}`);
  console.log(`  ❌ No metadata: ${withoutMetadata.length}`);
  
  const totalProcessed = recentAssets.length;
  const successCount = withRichMetadata.length + withBasicMetadata.length;
  const successRate = (successCount / totalProcessed * 100).toFixed(1);
  
  console.log(`\n🎯 Success Rate: ${successRate}% (${successCount}/${totalProcessed} files successfully processed)`);
  
  // Show breakdown by file type
  const byType = recentAssets.reduce((acc, asset) => {
    if (!acc[asset.fileType]) acc[asset.fileType] = [];
    acc[asset.fileType].push(asset);
    return acc;
  }, {} as Record<string, typeof recentAssets>);
  
  console.log(`\n📋 Assets by type:`);
  Object.entries(byType).forEach(([type, typeAssets]) => {
    const successCount = typeAssets.filter(a => a.metadata && !a.metadata.error).length;
    console.log(`  ${type}: ${successCount}/${typeAssets.length} successful`);
  });
  
  // List all files
  console.log(`\n📄 All files in latest seed:`);
  recentAssets.forEach((asset, i) => {
    const status = asset.metadata 
      ? (asset.metadata.error ? '❌' : '✅') 
      : '⚠️';
    console.log(`${i + 1}. ${status} ${asset.fileName} (${asset.fileType}) - ${(asset.fileSize / 1024).toFixed(1)}KB`);
  });
  
  await sql.end();
}

checkLatestSeed().catch(console.error);