import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/server/db/schema';

const sql = postgres('postgresql://postgres:exotheterrible@localhost:5432/brand_portal');
const db = drizzle(sql, { schema });

async function checkAssets() {
  const assets = await db.query.assets.findMany({
    orderBy: (assets, { desc }) => [desc(assets.createdAt)]
  });
  
  console.log(`Total assets in database: ${assets.length}`);
  
  // Count by file name to check for duplicates
  const byFileName = assets.reduce((acc, asset) => {
    acc[asset.fileName] = (acc[asset.fileName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\nUnique file names and their counts:');
  Object.entries(byFileName)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([fileName, count]) => {
      const indicator = count > 1 ? '⚠️ DUPLICATE' : '✅';
      console.log(`  ${fileName}: ${count} ${indicator}`);
    });
  
  // Show recent assets (last 37)
  const recentAssets = assets.slice(0, 37);
  console.log('\n📊 Last 37 imported assets:');
  recentAssets.forEach((asset, i) => {
    console.log(`${i + 1}. ${asset.fileName} (${asset.fileType}) - ${(asset.fileSize / 1024).toFixed(1)}KB`);
  });
  
  await sql.end();
}

checkAssets().catch(console.error);