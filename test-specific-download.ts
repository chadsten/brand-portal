#!/usr/bin/env tsx

import { storageManager } from "./src/server/storage";

async function testSpecificDownload() {
  console.log("🧪 Testing download of specific Website Header Image...\n");

  const assetId = "f5044f40-29e4-4641-9681-11137b55130d"; // 37.31 MB asset
  const storageKey = "test-assets/72987eaa-43b0-483a-bb27-eeb4ec57d621-Website Header Image.png";
  const expectedSize = 39127431; // bytes from database
  const organizationId = "test-org-id"; // This might need to be updated

  try {
    console.log(`📋 Asset Info:`);
    console.log(`   Asset ID: ${assetId}`);
    console.log(`   Storage Key: ${storageKey}`);
    console.log(`   Expected Size: ${expectedSize} bytes (${(expectedSize / 1024 / 1024).toFixed(2)} MB)`);
    console.log("");

    // Step 1: Check if file exists and get info
    console.log("🔍 Step 1: Checking file in storage...");
    const fileInfo = await storageManager.getFileInfo(organizationId, storageKey);
    console.log(`   File exists: ${fileInfo.exists}`);
    
    if (fileInfo.exists) {
      console.log(`   Storage size: ${fileInfo.size} bytes (${((fileInfo.size || 0) / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`   Size match: ${fileInfo.size === expectedSize ? '✅' : '❌'}`);
      console.log(`   Content type: ${fileInfo.contentType || 'Unknown'}`);
      console.log(`   Last modified: ${fileInfo.lastModified || 'Unknown'}`);
    }

    // Step 2: Try to download the file
    if (fileInfo.exists) {
      console.log("\n⬇️ Step 2: Downloading file...");
      const downloadResult = await storageManager.downloadFile(organizationId, storageKey);
      
      // Convert stream to buffer to check actual size
      const chunks: Uint8Array[] = [];
      const reader = downloadResult.body.getReader();
      let downloadedSize = 0;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          downloadedSize += value.length;
        }
      } finally {
        reader.releaseLock();
      }

      console.log(`   Downloaded size: ${downloadedSize} bytes (${(downloadedSize / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`   Content-Length header: ${downloadResult.contentLength} bytes`);
      console.log(`   Content type: ${downloadResult.contentType}`);
      console.log(`   Database size match: ${downloadedSize === expectedSize ? '✅' : '❌'}`);
      console.log(`   Header size match: ${downloadResult.contentLength === expectedSize ? '✅' : '❌'}`);

      // Step 3: Check for optimized version
      console.log("\n🔧 Step 3: Checking for optimized version...");
      const optimizedKey = `${storageKey}.optimized.webp`;
      const optimizedInfo = await storageManager.getFileInfo(organizationId, optimizedKey);
      console.log(`   Optimized exists: ${optimizedInfo.exists}`);
      
      if (optimizedInfo.exists) {
        console.log(`   Optimized size: ${optimizedInfo.size} bytes (${((optimizedInfo.size || 0) / 1024).toFixed(2)} KB)`);
        
        // Check if this matches our download
        const isServingOptimized = downloadedSize === optimizedInfo.size;
        console.log(`   Is download serving optimized? ${isServingOptimized ? '❌ YES - PROBLEM FOUND!' : '✅ No'}`);
      }

      // Summary
      console.log("\n📊 SUMMARY:");
      console.log(`Database size: ${expectedSize} bytes`);
      console.log(`Storage file size: ${fileInfo.size} bytes`);
      console.log(`Downloaded size: ${downloadedSize} bytes`);
      console.log(`Header Content-Length: ${downloadResult.contentLength} bytes`);
      
      if (downloadedSize !== expectedSize) {
        console.log("\n❌ SIZE MISMATCH CONFIRMED!");
        console.log("The download is not serving the file stored at the original storage key.");
        
        if (optimizedInfo.exists && downloadedSize === optimizedInfo.size) {
          console.log("🎯 ROOT CAUSE: Download is serving the optimized version instead of original!");
        } else {
          console.log("🤔 Unknown cause - downloaded size doesn't match database or optimized version.");
        }
      } else {
        console.log("\n✅ No size mismatch - download is correct.");
      }

    } else {
      console.log("\n❌ File not found in storage - this could be the problem!");
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
    
    // Try with different org IDs that might be in the database
    const possibleOrgIds = ["test-org", "org-1", "default-org", "main-org"];
    
    console.log("\n🔄 Trying different organization IDs...");
    for (const orgId of possibleOrgIds) {
      try {
        console.log(`\n   Trying org ID: ${orgId}`);
        const testInfo = await storageManager.getFileInfo(orgId, storageKey);
        if (testInfo.exists) {
          console.log(`   ✅ Found file with org ID: ${orgId}`);
          console.log(`   Size: ${testInfo.size} bytes`);
          break;
        }
      } catch (e) {
        console.log(`   ❌ Failed with org ID: ${orgId}`);
      }
    }
  }
}

// Run the test
testSpecificDownload()
  .then(() => {
    console.log("\n🎯 Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Test failed:", error);
    process.exit(1);
  });