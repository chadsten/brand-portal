import { NextAuthConfig } from "next-auth";
import { auth } from "./src/server/auth/index.js";
import { createTRPCContext } from "./src/server/api/trpc.js";
import { createCallerFactory } from "./src/server/api/trpc.js";
import { appRouter } from "./src/server/api/root.js";

async function testAssetAPI() {
  try {
    console.log('🧪 Testing asset API...\n');
    
    // Create a mock context for testing
    const ctx = await createTRPCContext({ 
      headers: new Headers()
    });
    
    console.log('Session:', ctx.session);
    
    // Create caller
    const caller = createCallerFactory(appRouter)(ctx);
    
    if (!ctx.session?.user) {
      console.log('❌ No session found - user not authenticated');
      return;
    }
    
    console.log('✅ User authenticated:', ctx.session.user.email);
    console.log('User organization ID:', ctx.session.user.organizationId);
    
    // Try to get all assets
    const assetsResult = await caller.asset.getAll();
    console.log('Assets query result:', {
      total: assetsResult.total,
      assetCount: assetsResult.assets.length,
      hasMore: assetsResult.hasMore
    });
    
    if (assetsResult.assets.length > 0) {
      console.log('Sample asset:', {
        id: assetsResult.assets[0].id,
        title: assetsResult.assets[0].title,
        organizationId: assetsResult.assets[0].organizationId,
        uploadedBy: assetsResult.assets[0].uploadedBy
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAssetAPI();