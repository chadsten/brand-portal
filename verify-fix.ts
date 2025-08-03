import postgres from 'postgres';

async function verifyFix() {
  const sql = postgres("postgresql://postgres:exotheterrible@localhost:5432/brand_portal");
  
  try {
    // Check current state after fix
    const assets = await sql`
      SELECT id, original_file_name, storage_key, thumbnail_key, file_size 
      FROM brand_portal_assets 
      WHERE organization_id = 'b614723b-8b45-4b3b-bcc4-996d04bcb25f' 
        AND deleted_at IS NULL
        AND storage_key LIKE 'test-assets/%'
      ORDER BY created_at DESC
    `;
    
    console.log(`\nAssets matching storage after fix: ${assets.length}`);
    assets.forEach((asset, index) => {
      const hasThumb = asset.thumbnail_key ? "✓" : "✗";
      console.log(`  ${index + 1}. ${asset.original_file_name} [${hasThumb} thumbnail]`);
      console.log(`     Asset:     ${asset.storage_key}`);
      if (asset.thumbnail_key) {
        console.log(`     Thumbnail: ${asset.thumbnail_key}`);
      }
      console.log();
    });

    // Check if any mismatched records remain
    const validKeys = [
      'test-assets/1beb4fd5-9667-4dcd-836d-13fb21df99aa-Instagram Story Template.jpg',
      'test-assets/72987eaa-43b0-483a-bb27-eeb4ec57d621-Website Header Image.png',
      'test-assets/c26ab204-4310-4435-9ab7-5a0273b7eb56-Product Photo - Main.jpg',
      'test-assets/ecb3b9f1-3de0-4dcb-9572-a5529361c72f-Team Member Portrait.jpg'
    ];

    const mismatched = await sql`
      SELECT COUNT(*) as count
      FROM brand_portal_assets 
      WHERE organization_id = 'b614723b-8b45-4b3b-bcc4-996d04bcb25f' 
        AND deleted_at IS NULL
        AND storage_key != ALL(${validKeys})
    `;

    console.log(`Mismatched records remaining: ${mismatched[0].count}`);

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await sql.end();
  }
}

verifyFix().catch(console.error);