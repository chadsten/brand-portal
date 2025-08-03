import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/server/db/schema';
import { eq } from 'drizzle-orm';

const sql = postgres('postgresql://postgres:exotheterrible@localhost:5432/brand_portal');
const db = drizzle(sql, { schema });

async function testSessionFlow() {
  console.log('🔧 Testing session flow for auth...');
  
  // Test the specific user credential login flow
  const testEmail = 'admin@test.com';
  
  // Simulate the credentials provider authorize function
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, testEmail),
  });

  if (user) {
    console.log('✅ User found in database:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Name: ${user.name}`);
    console.log(`   - Organization ID: ${user.organizationId}`);
    console.log(`   - Organization ID type: ${typeof user.organizationId}`);
    console.log(`   - Organization ID is null: ${user.organizationId === null}`);
    console.log(`   - Organization ID is undefined: ${user.organizationId === undefined}`);
    
    // Test the conversion that happens in auth config
    const authResult = {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId || undefined,
    };
    
    console.log('\n🔄 Auth result after conversion:');
    console.log(JSON.stringify(authResult, null, 2));
    
    // Test what would go into JWT token
    const tokenData = {
      id: authResult.id,
      organizationId: authResult.organizationId,
    };
    
    console.log('\n🎫 JWT token data:');
    console.log(JSON.stringify(tokenData, null, 2));
    
    // Test what would go into session
    const sessionData = {
      user: {
        id: tokenData.id,
        organizationId: tokenData.organizationId,
        email: authResult.email,
        name: authResult.name,
      },
    };
    
    console.log('\n👤 Session data:');
    console.log(JSON.stringify(sessionData, null, 2));
    
    // Test the getOrganizationId function simulation
    const orgId = sessionData.user.organizationId;
    console.log(`\n🏢 Organization ID from session: ${orgId}`);
    console.log(`   - Type: ${typeof orgId}`);
    console.log(`   - Truthy: ${!!orgId}`);
    
    if (!orgId) {
      console.log('❌ Would throw FORBIDDEN error: "User must belong to an organization"');
    } else {
      console.log('✅ Organization ID is valid for queries');
    }
  } else {
    console.log('❌ User not found');
  }
  
  await sql.end();
}

testSessionFlow().catch(console.error);