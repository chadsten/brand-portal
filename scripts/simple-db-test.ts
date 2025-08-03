#!/usr/bin/env tsx

import { config } from "dotenv";
import postgres from "postgres";

// Load environment variables
config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;

console.log("Database URL:", DATABASE_URL ? "Set" : "Not set");

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

async function main() {
  const conn = postgres(DATABASE_URL, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

  try {
    console.log("Testing database connection...");
    
    const result = await conn`SELECT COUNT(*) as count FROM brand_portal_assets`;
    console.log("Database connection successful!");
    console.log("Total assets:", result[0]?.count);
    
    const deletedResult = await conn`
      SELECT COUNT(*) as count 
      FROM brand_portal_assets 
      WHERE deleted_at IS NOT NULL
    `;
    console.log("Deleted assets:", deletedResult[0]?.count);
    
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await conn.end();
  }
}

main();