/**
 * Simple script to check what asset data looks like in the database
 * This helps us understand if the issue is in the frontend or backend
 */

// Use basic postgres connection instead of Drizzle to avoid env issues
import postgres from 'postgres';

async function checkAssetData() {
  console.log('🔍 Checking Asset Data in Database\n');
  
  // Try to connect to the database with the same connection string from your project
  const sql = postgres(
    process.env.DATABASE_URL || 
    "postgresql://postgres:exotheterrible@localhost:5432/brand_portal",
    { max: 1 }
  );
  
  try {
    // Get recent assets with title/description data
    const assets = await sql`
      SELECT 
        id, 
        title, 
        description, 
        file_name, 
        original_file_name,
        created_at,
        CASE 
          WHEN title IS NULL THEN 'NULL'
          WHEN title = '' THEN 'EMPTY_STRING'
          ELSE 'HAS_VALUE'
        END as title_status,
        CASE 
          WHEN description IS NULL THEN 'NULL'
          WHEN description = '' THEN 'EMPTY_STRING'
          ELSE 'HAS_VALUE'
        END as description_status
      FROM brand_portal_assets 
      WHERE deleted_at IS NULL 
      ORDER BY created_at DESC 
      LIMIT 10
    `;

    console.log(`Found ${assets.length} recent assets:\n`);
    
    assets.forEach((asset, index) => {
      console.log(`${index + 1}. Asset ID: ${asset.id}`);
      console.log(`   Title Status: ${asset.title_status}`);
      console.log(`   Title Value: "${asset.title}"`);
      console.log(`   Description Status: ${asset.description_status}`);  
      console.log(`   Description Value: "${asset.description}"`);
      console.log(`   File Name: "${asset.file_name}"`);
      console.log(`   Original Name: "${asset.original_file_name}"`);
      console.log('');
    });

    // Count assets by status
    const titleStats = await sql`
      SELECT 
        CASE 
          WHEN title IS NULL THEN 'NULL'
          WHEN title = '' THEN 'EMPTY_STRING'
          ELSE 'HAS_VALUE'
        END as status,
        COUNT(*) as count
      FROM brand_portal_assets 
      WHERE deleted_at IS NULL 
      GROUP BY status
    `;

    const descStats = await sql`
      SELECT 
        CASE 
          WHEN description IS NULL THEN 'NULL'
          WHEN description = '' THEN 'EMPTY_STRING'
          ELSE 'HAS_VALUE'
        END as status,
        COUNT(*) as count
      FROM brand_portal_assets 
      WHERE deleted_at IS NULL 
      GROUP BY status
    `;

    console.log('📊 Title Statistics:');
    titleStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat.count} assets`);
    });

    console.log('\n📊 Description Statistics:');
    descStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat.count} assets`);
    });

    // If we have assets, pick one to test with
    if (assets.length > 0) {
      const testAsset = assets[0];
      console.log(`\n🧪 Test Asset for Modal: ${testAsset.id}`);
      console.log(`   This asset should show:`);
      console.log(`   - Title: "${testAsset.title}" (${testAsset.title_status})`);
      console.log(`   - Description: "${testAsset.description}" (${testAsset.description_status})`);
      console.log(`\n   Try opening this asset in the modal and check the console logs.`);
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.log('\n💡 Try checking:');
    console.log('   1. Is the database running?');
    console.log('   2. Are the connection details correct?');
    console.log('   3. Does the brand_portal_assets table exist?');
  } finally {
    await sql.end();
  }
}

// Run the check
checkAssetData().catch(console.error);