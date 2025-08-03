import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/server/db/schema';
import { and, eq, isNull, desc, count } from 'drizzle-orm';

const sql = postgres('postgresql://postgres:exotheterrible@localhost:5432/brand_portal');
const db = drizzle(sql, { schema });

// Simulate what the tRPC asset search should do
async function simulateAssetSearch() {
  console.log('🔍 Simulating asset search for logged-in user...');
  
  // Get the test user (admin@test.com)
  const testUser = await db.query.users.findFirst({
    where: eq(schema.users.email, 'admin@test.com'),
    with: {
      organization: true
    }
  });
  
  if (!testUser || !testUser.organizationId) {
    console.log('❌ Test user not found or missing organizationId');
    return;
  }
  
  console.log(`✅ Found test user: ${testUser.email}`);
  console.log(`   - User ID: ${testUser.id}`);
  console.log(`   - Organization ID: ${testUser.organizationId}`);
  console.log(`   - Organization: ${testUser.organization?.name}`);
  
  // Simulate the getOrganizationId function
  const organizationId = testUser.organizationId;
  console.log(`\n🔧 Using organizationId: ${organizationId}`);
  
  // Simulate the asset search query exactly as the tRPC router does
  const whereConditions = [
    eq(schema.assets.organizationId, organizationId),
    isNull(schema.assets.deletedAt),
  ];
  
  console.log('\n📊 Executing asset search query...');
  
  // Count total results
  const totalCount = await db
    .select({ count: count() })
    .from(schema.assets)
    .where(and(...whereConditions));
  
  console.log(`   - Total count: ${totalCount[0]?.count || 0}`);
  
  // Get paginated results (first 50, like the frontend)
  const results = await db.query.assets.findMany({
    where: and(...whereConditions),
    orderBy: [desc(schema.assets.createdAt)],
    limit: 50,
    offset: 0,
    with: {
      uploader: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });
  
  console.log(`   - Results returned: ${results.length}`);
  
  if (results.length > 0) {
    console.log('\n📋 Sample assets:');
    results.slice(0, 5).forEach((asset, i) => {
      console.log(`   ${i + 1}. ${asset.title} (${asset.fileName})`);
      console.log(`      - Type: ${asset.fileType}`);
      console.log(`      - Size: ${asset.fileSize} bytes`);
      console.log(`      - Status: ${asset.processingStatus}`);
      console.log(`      - Uploader: ${asset.uploader.name}`);
    });
  }
  
  // Test the exact search parameters the frontend uses
  console.log('\n🔍 Testing search with empty query (default frontend call)...');
  const frontendResults = await db.query.assets.findMany({
    where: and(...whereConditions),
    orderBy: [desc(schema.assets.createdAt)],
    limit: 50,
    offset: 0,
    with: {
      uploader: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });
  
  console.log(`   - Frontend simulation results: ${frontendResults.length}`);
  
  await sql.end();
}

async function checkAssetDistribution() {
  console.log('\n📈 Checking asset distribution...');
  
  // Check all assets by organization
  const assetsByOrg = await db
    .select({
      organizationId: schema.assets.organizationId,
      count: count(),
    })
    .from(schema.assets)
    .where(isNull(schema.assets.deletedAt))
    .groupBy(schema.assets.organizationId);
  
  console.log('Assets by organization:');
  for (const org of assetsByOrg) {
    const orgDetails = await db.query.organizations.findFirst({
      where: eq(schema.organizations.id, org.organizationId),
    });
    console.log(`   - ${orgDetails?.name || 'Unknown'} (${org.organizationId}): ${org.count} assets`);
  }
  
  // Check processing status distribution  
  const assetsByStatus = await db
    .select({
      processingStatus: schema.assets.processingStatus,
      count: count(),
    })
    .from(schema.assets)
    .where(isNull(schema.assets.deletedAt))
    .groupBy(schema.assets.processingStatus);
  
  console.log('\nAssets by processing status:');
  assetsByStatus.forEach(status => {
    console.log(`   - ${status.processingStatus}: ${status.count}`);
  });
}

// Run all tests
async function runTests() {
  try {
    await simulateAssetSearch();
    await checkAssetDistribution();
    console.log('\n✅ Debug completed successfully');
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
  process.exit(0);
}

runTests();