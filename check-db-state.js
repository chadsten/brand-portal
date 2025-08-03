import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function checkAssets() {
  const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:exotheterrible@localhost:5432/brand_portal');
  
  try {
    console.log('🔍 Checking database state...\n');
    
    const assetCount = await sql`SELECT COUNT(*) as count FROM brand_portal_assets WHERE deleted_at IS NULL`;
    console.log('Total assets (not deleted):', assetCount[0].count);
    
    const orgCount = await sql`SELECT COUNT(*) as count FROM brand_portal_organizations`;
    console.log('Total organizations:', orgCount[0].count);
    
    const userCount = await sql`SELECT COUNT(*) as count FROM brand_portal_users`;
    console.log('Total users:', userCount[0].count);
    
    console.log('\n📄 Sample assets:');
    const assets = await sql`
      SELECT id, title, organization_id, uploaded_by, processing_status, created_at 
      FROM brand_portal_assets 
      WHERE deleted_at IS NULL 
      LIMIT 5
    `;
    assets.forEach(asset => {
      console.log(`- ${asset.title} (org: ${asset.organization_id}, status: ${asset.processing_status})`);
    });
    
    console.log('\n👥 Sample users:');
    const users = await sql`
      SELECT id, email, organization_id 
      FROM brand_portal_users 
      LIMIT 5
    `;
    users.forEach(user => {
      console.log(`- ${user.email} (org: ${user.organization_id})`);
    });
    
    console.log('\n🏢 Organizations:');
    const orgs = await sql`
      SELECT id, name, slug 
      FROM brand_portal_organizations
    `;
    orgs.forEach(org => {
      console.log(`- ${org.name} (${org.slug}) - ID: ${org.id}`);
    });
    
    // Check if there's a mismatch between user org and asset org
    console.log('\n🔍 Checking for organization mismatches:');
    const mismatchCheck = await sql`
      SELECT DISTINCT 
        u.email,
        u.organization_id as user_org,
        a.organization_id as asset_org,
        COUNT(a.id) as asset_count
      FROM brand_portal_users u
      LEFT JOIN brand_portal_assets a ON a.organization_id = u.organization_id
      GROUP BY u.email, u.organization_id, a.organization_id
      ORDER BY u.email
    `;
    
    mismatchCheck.forEach(row => {
      if (row.asset_count === '0') {
        console.log(`⚠️  ${row.email} (org: ${row.user_org}) has no assets in their organization`);
      } else {
        console.log(`✅ ${row.email} (org: ${row.user_org}) has ${row.asset_count} assets`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

checkAssets();