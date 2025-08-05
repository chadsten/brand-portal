/**
 * Test what the tRPC getById query actually returns
 * This simulates the exact same query that the modal uses
 */

import postgres from 'postgres';

async function testTRPCQuery() {
  console.log('🧪 Testing tRPC getById Query Logic\n');
  
  const sql = postgres(
    process.env.DATABASE_URL || 
    "postgresql://postgres:exotheterrible@localhost:5432/brand_portal",
    { max: 1 }
  );
  
  try {
    // Use the test asset ID from our previous check
    const testAssetId = '81db9338-a4d3-42df-a7dd-e66158fd2e9a';
    
    console.log(`Testing with Asset ID: ${testAssetId}\n`);
    
    // Simulate the exact same query that tRPC getById uses
    // This is equivalent to: ctx.db.query.assets.findFirst
    const asset = await sql`
      SELECT 
        a.*,
        u.id as uploader_id,
        u.name as uploader_name, 
        u.email as uploader_email,
        u.image as uploader_image
      FROM brand_portal_assets a
      LEFT JOIN brand_portal_users u ON a.uploaded_by = u.id
      WHERE a.id = ${testAssetId}
        AND a.deleted_at IS NULL
      LIMIT 1
    `;

    if (asset.length === 0) {
      console.log('❌ Asset not found');
      return;
    }

    const result = asset[0];
    
    console.log('✅ Asset found!');
    console.log('📄 Raw Database Result:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n🔍 Key Fields Analysis:');
    console.log(`Title: "${result.title}" (type: ${typeof result.title}, length: ${result.title?.length})`);
    console.log(`Description: "${result.description}" (type: ${typeof result.description}, length: ${result.description?.length})`);
    console.log(`File Name: "${result.file_name}"`);
    console.log(`Original Name: "${result.original_file_name}"`);
    
    // Check if there are any unusual characters or encoding issues
    console.log('\n🔬 Character Analysis:');
    console.log(`Title bytes: [${Array.from(result.title || '').map(c => c.charCodeAt(0)).join(', ')}]`);
    console.log(`Description bytes: [${Array.from((result.description || '').substring(0, 50)).map(c => c.charCodeAt(0)).join(', ')}]`);
    
    // Test the structure that would be returned to the frontend
    const frontendStructure = {
      id: result.id,
      title: result.title,
      description: result.description,
      fileName: result.file_name,
      originalFileName: result.original_file_name,
      fileType: result.file_type,
      mimeType: result.mime_type,
      fileSize: result.file_size,
      uploader: {
        id: result.uploader_id,
        name: result.uploader_name,
        email: result.uploader_email,
        image: result.uploader_image,
      }
    };
    
    console.log('\n📊 Frontend Data Structure:');
    console.log(JSON.stringify(frontendStructure, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await sql.end();
  }
}

testTRPCQuery().catch(console.error);