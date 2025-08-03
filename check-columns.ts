import postgres from 'postgres';

async function checkColumns() {
  const sql = postgres("postgresql://postgres:exotheterrible@localhost:5432/brand_portal");
  
  try {
    // Get column info for assets table
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'brand_portal_assets' 
      ORDER BY ordinal_position
    `;
    
    console.log("Columns in brand_portal_assets table:");
    columns.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'nullable' : 'not null'}`);
    });

    // Get sample data
    const sampleData = await sql`
      SELECT * FROM brand_portal_assets LIMIT 1
    `;
    
    if (sampleData.length > 0) {
      console.log("\nSample record structure:");
      Object.keys(sampleData[0]).forEach(key => {
        console.log(`  ${key}: ${sampleData[0][key]}`);
      });
    } else {
      console.log("\nNo records in table");
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await sql.end();
  }
}

checkColumns().catch(console.error);