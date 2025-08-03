import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/server/db/schema';

const sql = postgres('postgresql://postgres:exotheterrible@localhost:5432/brand_portal');
const db = drizzle(sql, { schema });

async function checkTodaysAssets() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const assets = await db.query.assets.findMany({
    where: (assets, { gte }) => gte(assets.createdAt, today),
    orderBy: (assets, { desc }) => [desc(assets.createdAt)]
  });
  
  console.log(`Assets imported today: ${assets.length}`);
  
  // Group by metadata extraction status
  const withMetadata = assets.filter(asset => 
    asset.metadata && 
    Object.keys(asset.metadata).length > 2 && // More than just basic fields
    !asset.metadata.error
  );
  
  const withBasicMetadata = assets.filter(asset => 
    asset.metadata && 
    Object.keys(asset.metadata).length <= 2
  );
  
  const withErrors = assets.filter(asset => 
    asset.metadata && asset.metadata.error
  );
  
  const withoutMetadata = assets.filter(asset => !asset.metadata);
  
  console.log(`\n📊 Metadata extraction results:`);
  console.log(`  ✅ Rich metadata extracted: ${withMetadata.length}`);
  console.log(`  📝 Basic metadata only: ${withBasicMetadata.length}`);
  console.log(`  ⚠️ Extraction errors: ${withErrors.length}`);
  console.log(`  ❌ No metadata: ${withoutMetadata.length}`);
  
  const totalProcessed = withMetadata.length + withBasicMetadata.length + withErrors.length + withoutMetadata.length;
  const successRate = ((withMetadata.length + withBasicMetadata.length) / totalProcessed * 100).toFixed(1);
  
  console.log(`\n🎯 Success Rate: ${successRate}% (${withMetadata.length + withBasicMetadata.length}/${totalProcessed} files successfully processed)`);
  
  if (withErrors.length > 0) {
    console.log(`\n⚠️ Files with errors:`);
    withErrors.forEach(asset => {
      console.log(`  - ${asset.fileName}: ${asset.metadata?.error || 'Unknown error'}`);
    });
  }
  
  if (withoutMetadata.length > 0) {
    console.log(`\n❌ Files without metadata:`);
    withoutMetadata.forEach(asset => {
      console.log(`  - ${asset.fileName} (${asset.fileType})`);
    });
  }
  
  await sql.end();
}

checkTodaysAssets().catch(console.error);