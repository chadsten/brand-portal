import postgres from 'postgres';

async function testConnection() {
  console.log("Testing database connection...");
  
  const sql = postgres("postgresql://postgres:exotheterrible@localhost:5432/brand_portal");
  
  try {
    // Test basic connection
    const result = await sql`SELECT current_database(), current_user`;
    console.log("Connected to:", result[0]);

    // List tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log("\nTables in database:");
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.table_name}`);
    });

    // Check if assets table exists and has data
    try {
      const assetCount = await sql`SELECT COUNT(*) FROM assets`;
      console.log(`\nAssets table has ${assetCount[0].count} records`);
      
      const sampleAssets = await sql`
        SELECT id, "originalFileName", "storageKey", "organizationId"
        FROM assets 
        LIMIT 3
      `;
      
      console.log("\nSample assets:");
      sampleAssets.forEach((asset, index) => {
        console.log(`  ${index + 1}. ${asset.originalFileName} (org: ${asset.organizationId})`);
      });
    } catch (error) {
      console.log("Error querying assets table:", error.message);
    }

  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await sql.end();
  }
}

testConnection().catch(console.error);