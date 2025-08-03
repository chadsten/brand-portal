import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

async function checkDataSync() {
  console.log("=== Checking Data Sync Between Database and Storage ===");
  
  // Get objects from MinIO
  const client = new S3Client({
    region: "us-east-1",
    endpoint: "http://localhost:9000",
    credentials: {
      accessKeyId: "minioadmin",
      secretAccessKey: "minioadmin123",
    },
    forcePathStyle: true,
  });

  try {
    console.log("Getting all objects from MinIO...");
    const listCommand = new ListObjectsV2Command({
      Bucket: "brand-portal-dev",
    });
    
    const listResult = await client.send(listCommand);
    const storageKeys = (listResult.Contents || []).map(obj => obj.Key!);
    
    console.log(`Found ${storageKeys.length} objects in MinIO storage:`);
    storageKeys.forEach((key, index) => {
      console.log(`  ${index + 1}. ${key}`);
    });

    // Separate assets from thumbnails
    const assetKeys = storageKeys.filter(key => key.startsWith('test-assets/'));
    const thumbnailKeys = storageKeys.filter(key => key.startsWith('test-thumbnails/'));
    
    console.log(`\nStorage breakdown:`);
    console.log(`  Assets: ${assetKeys.length}`);
    console.log(`  Thumbnails: ${thumbnailKeys.length}`);

    console.log("\n=== Manual Database Check Required ===");
    console.log("To check database assets, run this SQL query:");
    console.log(`
SELECT 
  id,
  "originalFileName",
  "storageKey",
  "thumbnailKey",
  "fileSize",
  "createdAt"
FROM assets 
WHERE "organizationId" = 'clwh0q8qd000008l7ft5ka23z' 
  AND "deletedAt" IS NULL
ORDER BY "createdAt" DESC;
    `);

    console.log("\nExpected assets in storage (from previous info):");
    console.log("  test-assets/8cebc718-1b4f-4f63-be71-30abb0133fe6-sample.tiff");
    console.log("  test-thumbnails/4f4c96c9-d27e-431b-9d5f-9b6171df1e26-thumb.jpg");
    
    console.log("\nActual assets in storage:");
    assetKeys.forEach(key => console.log(`  ${key}`));
    
    console.log("\nActual thumbnails in storage:");
    thumbnailKeys.forEach(key => console.log(`  ${key}`));

  } catch (error) {
    console.error("Error checking storage:", error);
  }
}

checkDataSync().catch(console.error);