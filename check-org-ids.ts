import postgres from 'postgres';

async function checkOrgIds() {
  const sql = postgres("postgresql://postgres:exotheterrible@localhost:5432/brand_portal");
  
  try {
    // Get organizations
    const orgs = await sql`
      SELECT id, name, slug 
      FROM brand_portal_organizations 
      ORDER BY created_at DESC
    `;
    
    console.log("Organizations in database:");
    orgs.forEach((org, index) => {
      console.log(`  ${index + 1}. ${org.name} (${org.slug})`);
      console.log(`     ID: ${org.id}`);
      console.log();
    });

    // Get users
    const users = await sql`
      SELECT id, email, name, organization_id 
      FROM brand_portal_users 
      ORDER BY created_at DESC
    `;
    
    console.log("Users in database:");
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name || user.email}`);
      console.log(`     ID: ${user.id}`);
      console.log(`     Org ID: ${user.organization_id}`);
      console.log();
    });

    // Get assets to see which org/user they belong to
    const assets = await sql`
      SELECT id, original_file_name, organization_id, uploaded_by 
      FROM brand_portal_assets 
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    console.log("Sample assets in database:");
    assets.forEach((asset, index) => {
      console.log(`  ${index + 1}. ${asset.original_file_name}`);
      console.log(`     Org ID: ${asset.organization_id}`);
      console.log(`     User ID: ${asset.uploaded_by}`);
      console.log();
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await sql.end();
  }
}

checkOrgIds().catch(console.error);