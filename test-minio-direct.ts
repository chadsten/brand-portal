import { S3Client, ListObjectsV2Command, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

async function testMinIOConnection() {
  console.log("=== Testing MinIO Direct Connection ===");
  
  // Create S3 client for MinIO
  const client = new S3Client({
    region: "us-east-1",
    endpoint: "http://localhost:9000",
    credentials: {
      accessKeyId: "minioadmin",
      secretAccessKey: "minioadmin123",
    },
    forcePathStyle: true, // Required for MinIO
  });

  try {
    // List objects in bucket
    console.log("Listing objects in bucket 'brand-portal-dev'...");
    const listCommand = new ListObjectsV2Command({
      Bucket: "brand-portal-dev",
      MaxKeys: 10,
    });
    
    const listResult = await client.send(listCommand);
    console.log(`Found ${listResult.Contents?.length || 0} objects in bucket`);
    
    if (listResult.Contents && listResult.Contents.length > 0) {
      console.log("First few objects:");
      listResult.Contents.slice(0, 5).forEach((obj, index) => {
        console.log(`  ${index + 1}. ${obj.Key} (${obj.Size} bytes)`);
      });
    }

    // Test specific keys from the database
    const testKeys = [
      "test-assets/8cebc718-1b4f-4f63-be71-30abb0133fe6-sample.tiff",
      "test-thumbnails/4f4c96c9-d27e-431b-9d5f-9b6171df1e26-thumb.jpg"
    ];

    for (const key of testKeys) {
      console.log(`\n--- Testing Key: ${key} ---`);
      
      try {
        // Check if object exists
        const headCommand = new HeadObjectCommand({
          Bucket: "brand-portal-dev",
          Key: key,
        });
        
        const headResult = await client.send(headCommand);
        console.log("Object exists! Info:", {
          size: headResult.ContentLength,
          contentType: headResult.ContentType,
          lastModified: headResult.LastModified,
          etag: headResult.ETag
        });

        // Try to get object
        const getCommand = new GetObjectCommand({
          Bucket: "brand-portal-dev",
          Key: key,
        });
        
        const getResult = await client.send(getCommand);
        console.log("Download successful! Info:", {
          size: getResult.ContentLength,
          contentType: getResult.ContentType,
          hasBody: !!getResult.Body
        });

      } catch (error: any) {
        if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
          console.log("Object not found in storage");
        } else {
          console.error("Error accessing object:", error.message || error);
        }
      }
    }

  } catch (error) {
    console.error("MinIO connection failed:", error);
  }
}

testMinIOConnection().catch(console.error);