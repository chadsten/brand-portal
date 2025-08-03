import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/server/db/schema';
import { eq } from 'drizzle-orm';

const sql = postgres('postgresql://postgres:exotheterrible@localhost:5432/brand_portal');
const db = drizzle(sql, { schema });

async function debugFullAuthFlow() {
  console.log('🔍 Debug: Full authentication flow analysis\n');
  
  // 1. Check database state
  console.log('1️⃣ Database State Check:');
  
  const users = await db.query.users.findMany({
    with: { organization: true }
  });
  
  console.log(`   - Total users: ${users.length}`);
  users.forEach((user, i) => {
    console.log(`   - User ${i+1}: ${user.email} | Org: ${user.organizationId} (${user.organization?.name})`);
  });
  
  // 2. Check test user specifically
  console.log('\n2️⃣ Test User Analysis:');
  const testUser = await db.query.users.findFirst({
    where: eq(schema.users.email, 'admin@test.com'),
    with: { organization: true }
  });
  
  if (testUser) {
    console.log(`   ✅ User found: ${testUser.email}`);
    console.log(`   - ID: ${testUser.id}`);
    console.log(`   - Name: ${testUser.name}`);
    console.log(`   - OrgID: ${testUser.organizationId}`);
    console.log(`   - Org Name: ${testUser.organization?.name}`);
    console.log(`   - Email Verified: ${testUser.emailVerified}`);
    console.log(`   - Provider: ${testUser.provider || 'credentials'}`);
  } else {
    console.log('   ❌ Test user not found');
    await sql.end();
    return;
  }
  
  // 3. Check assets for this organization
  console.log('\n3️⃣ Assets Check:');
  const assets = await db.query.assets.findMany({
    where: (assets, { eq, isNull, and }) => and(
      eq(assets.organizationId, testUser.organizationId!),
      isNull(assets.deletedAt)
    ),
    limit: 5
  });
  
  console.log(`   - Assets in org: ${assets.length > 0 ? `${assets.length}+ (showing first 5)` : 0}`);
  assets.forEach((asset, i) => {
    console.log(`   - Asset ${i+1}: ${asset.title} (${asset.fileName})`);
  });
  
  // 4. Simulate tRPC getOrganizationId function
  console.log('\n4️⃣ tRPC getOrganizationId Simulation:');
  
  // Test scenarios:
  const scenarios = [
    {
      name: 'Valid session',
      session: {
        user: {
          id: testUser.id,
          organizationId: testUser.organizationId,
          email: testUser.email,
        }
      }
    },
    {
      name: 'Session without organizationId',
      session: {
        user: {
          id: testUser.id,
          email: testUser.email,
        }
      }
    },
    {
      name: 'Session with null organizationId',
      session: {
        user: {
          id: testUser.id,
          organizationId: null,
          email: testUser.email,
        }
      }
    },
    {
      name: 'Session with undefined organizationId',
      session: {
        user: {
          id: testUser.id,
          organizationId: undefined,
          email: testUser.email,
        }
      }
    },
    {
      name: 'No session',
      session: null
    }
  ];
  
  scenarios.forEach((scenario) => {
    console.log(`\n   Testing: ${scenario.name}`);
    try {
      if (!scenario.session?.user) {
        throw new Error('UNAUTHORIZED: No session');
      }
      
      const orgId = scenario.session.user.organizationId;
      if (!orgId) {
        throw new Error('FORBIDDEN: User must belong to an organization');
      }
      
      console.log(`   ✅ Success: orgId = ${orgId}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  });
  
  // 5. Check NextAuth session table
  console.log('\n5️⃣ NextAuth Sessions Check:');
  const sessions = await db.query.sessions.findMany({
    where: eq(schema.sessions.userId, testUser.id),
    with: {
      user: {
        columns: {
          email: true,
          organizationId: true
        }
      }
    }
  });
  
  console.log(`   - Active sessions for user: ${sessions.length}`);
  sessions.forEach((session, i) => {
    const isExpired = session.expires < new Date();
    console.log(`   - Session ${i+1}: ${session.sessionToken.substring(0, 20)}... | Expires: ${session.expires.toISOString()} | Expired: ${isExpired}`);
    console.log(`     User: ${session.user.email} | OrgID: ${session.user.organizationId}`);
  });
  
  // 6. Check potential issues
  console.log('\n6️⃣ Potential Issues Analysis:');
  
  // Check if user has organization but it's not in their session
  if (testUser.organizationId) {
    console.log('   ✅ User has organizationId in database');
  } else {
    console.log('   ❌ User missing organizationId in database');
  }
  
  // Check if there are expired sessions
  const expiredSessions = sessions.filter(s => s.expires < new Date());
  if (expiredSessions.length > 0) {
    console.log(`   ⚠️  ${expiredSessions.length} expired sessions found`);
  }
  
  // Check if there are assets but they're not being returned
  const totalAssets = await db.query.assets.findMany({
    where: (assets, { eq, isNull, and }) => and(
      eq(assets.organizationId, testUser.organizationId!),
      isNull(assets.deletedAt)
    )
  });
  
  if (totalAssets.length > 0) {
    console.log(`   ✅ ${totalAssets.length} assets available for this organization`);
    console.log('   ➡️  If assets aren\'t showing, the issue is likely:');
    console.log('       - Session not being passed to tRPC context');
    console.log('       - tRPC authentication middleware issue');
    console.log('       - Frontend-backend session sync issue');
  } else {
    console.log('   ❌ No assets found for this organization');
  }
  
  console.log('\n🎯 Summary:');
  console.log('   Based on this analysis, if assets exist but aren\'t showing:');
  console.log('   1. Check browser dev tools for tRPC request errors');
  console.log('   2. Verify session cookies are being sent with requests');
  console.log('   3. Check if NextAuth session is properly created on login');
  console.log('   4. Verify tRPC context receives the session');
  
  await sql.end();
}

debugFullAuthFlow().catch(console.error);