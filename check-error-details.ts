import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/server/db/schema';

const sql = postgres('postgresql://postgres:exotheterrible@localhost:5432/brand_portal');
const db = drizzle(sql, { schema });

async function checkErrorDetails() {
  // Get the 37 most recent assets (our latest seed run)
  const recentAssets = await db.query.assets.findMany({
    orderBy: (assets, { desc }) => [desc(assets.createdAt)],
    limit: 37
  });
  
  const withErrors = recentAssets.filter(asset => 
    asset.metadata && asset.metadata.error
  );
  
  console.log(`Files with metadata extraction errors (${withErrors.length}):`);
  
  withErrors.forEach((asset, i) => {
    console.log(`\n${i + 1}. ${asset.fileName} (${asset.fileType})`);
    console.log(`   Size: ${(asset.fileSize / 1024).toFixed(1)}KB`);
    console.log(`   MIME: ${asset.mimeType}`);
    console.log(`   Error: ${asset.metadata?.error || 'Unknown error'}`);
    console.log(`   Full metadata:`, JSON.stringify(asset.metadata, null, 2));
  });
  
  await sql.end();
}

checkErrorDetails().catch(console.error);