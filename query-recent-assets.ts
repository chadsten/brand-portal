import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/server/db/schema';

const sql = postgres('postgresql://postgres:exotheterrible@localhost:5432/brand_portal');
const db = drizzle(sql, { schema });

async function queryAssets() {
  console.log('🔍 Querying recent assets...');
  
  const assets = await db.query.assets.findMany({
    limit: 10,
    orderBy: (assets, { desc }) => desc(assets.createdAt)
  });
  
  console.log(`📊 Found ${assets.length} recent assets:`);
  
  assets.forEach((asset, i) => {
    console.log(`${i + 1}. ${asset.title} (${asset.fileName})`);
    console.log(`   ID: ${asset.id}`);
    console.log(`   Type: ${asset.fileType} - ${asset.mimeType}`);
    console.log(`   Size: ${(asset.fileSize / 1024).toFixed(1)} KB`);
    console.log(`   Org ID: ${asset.organizationId}`);
    console.log(`   Uploader ID: ${asset.uploadedBy}`);
    console.log(`   Created: ${asset.createdAt}`);
    console.log(`   Status: ${asset.processingStatus}`);
    console.log('');
  });
  
  // Count total assets by using a simple query
  const allAssets = await db.query.assets.findMany();
  console.log(`📈 Total assets in database: ${allAssets.length}`);
  
  // Count by organization
  const organizations = await db.query.organizations.findMany();
  console.log('📊 Assets by organization:');
  
  for (const org of organizations) {
    const orgAssets = allAssets.filter(asset => asset.organizationId === org.id);
    console.log(`   ${org.name}: ${orgAssets.length} assets`);
  }
  
  process.exit(0);
}

queryAssets().catch(console.error);