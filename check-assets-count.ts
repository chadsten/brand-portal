import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/server/db/schema';

const sql = postgres('postgresql://postgres:exotheterrible@localhost:5432/brand_portal');
const db = drizzle(sql, { schema });

async function checkAssets() {
  const assets = await db.query.assets.findMany();
  console.log(`Total assets in database: ${assets.length}`);
  
  const byType = assets.reduce((acc, asset) => {
    acc[asset.fileType] = (acc[asset.fileType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('Assets by type:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  await sql.end();
}

checkAssets().catch(console.error);