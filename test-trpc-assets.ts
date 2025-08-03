import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/server/db/schema';

const sql = postgres('postgresql://postgres:exotheterrible@localhost:5432/brand_portal');
const db = drizzle(sql, { schema });

async function testTRPCAssets() {
  console.log('🧪 Testing TRPC Asset API requirements...');
  
  // Check if we have users with organization IDs
  const users = await db.query.users.findMany({
    with: {
      organization: {
        columns: { name: true }
      }
    }
  });
  
  console.log(`👥 Found ${users.length} users:`);
  users.forEach(user => {
    console.log(`   - ${user.email}: org=${user.organizationId} (${user.organization?.name || 'No org'})`);
  });
  
  // Check organization structure
  const organizations = await db.query.organizations.findMany();
  console.log(`\n🏢 Found ${organizations.length} organizations:`);
  organizations.forEach(org => {
    console.log(`   - ${org.name} (ID: ${org.id})`);
  });
  
  // Check if we have a test user we can simulate auth for
  const testUser = users.find(u => u.email.includes('admin'));
  if (testUser && testUser.organizationId) {
    console.log(`\n✅ Test user found: ${testUser.email}`);
    console.log(`   - Has organization: ${testUser.organizationId}`);
    
    // Count assets for this organization
    const assets = await db.query.assets.findMany({
      where: (assets, { eq, isNull, and }) => and(
        eq(assets.organizationId, testUser.organizationId!),
        isNull(assets.deletedAt)
      )
    });
    
    console.log(`   - Assets for org: ${assets.length}`);
    
    if (assets.length > 0) {
      console.log(`   - Sample asset: ${assets[0]?.title} (${assets[0]?.fileName})`);
    }
  } else {
    console.log(`\n❌ No valid test user found with organization ID`);
  }
  
  process.exit(0);
}

testTRPCAssets().catch(console.error);