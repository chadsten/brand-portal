import { auth } from "~/server/auth";

async function debugAuthSession() {
  try {
    console.log("🔍 Testing authentication session...");
    
    // Get current session
    const session = await auth();
    
    if (!session) {
      console.log("❌ No active session found");
      return;
    }
    
    console.log("✅ Session found:");
    console.log("User ID:", session.user?.id);
    console.log("User Email:", session.user?.email);
    console.log("User Name:", session.user?.name);
    console.log("Organization ID:", session.user?.organizationId);
    console.log("Session:", JSON.stringify(session, null, 2));
    
  } catch (error) {
    console.error("❌ Error getting session:", error);
  }
}

// Run the debug function
debugAuthSession();