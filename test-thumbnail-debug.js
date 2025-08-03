import { db } from './src/server/db/index.ts';
import { assets } from './src/server/db/schema.ts';
import { isNull } from 'drizzle-orm';

// Test script to debug thumbnail issues
console.log('🔍 Debugging thumbnail functionality...\n');

try {
    // Get a few image assets to check their thumbnail status
    const imageAssets = await db.query.assets.findMany({
        where: isNull(assets.deletedAt),
        limit: 10,
        orderBy: assets.createdAt,
    });

    console.log(`📊 Found ${imageAssets.length} assets in database\n`);

    // Check thumbnail status for each asset
    imageAssets.forEach((asset, index) => {
        console.log(`Asset ${index + 1}:`);
        console.log(`  🆔 ID: ${asset.id}`);
        console.log(`  📁 File: ${asset.fileName}`);
        console.log(`  🏷️ MIME Type: ${asset.mimeType}`);
        console.log(`  🖼️ Thumbnail Key: ${asset.thumbnailKey || 'NOT SET'}`);
        console.log(`  📦 Storage Key: ${asset.storageKey}`);
        console.log(`  🔄 Processing Status: ${asset.processingStatus}`);
        console.log(`  📅 Created: ${asset.createdAt}`);
        
        // Check what the AssetGrid would generate for this asset
        let thumbnailUrl = null;
        if (asset.thumbnailKey) {
            thumbnailUrl = `/api/assets/${asset.id}/thumbnail`;
        } else if (asset.mimeType.startsWith('image/')) {
            thumbnailUrl = `/api/assets/${asset.id}/download`;
        }
        
        console.log(`  🌐 URL AssetGrid would generate: ${thumbnailUrl || 'NO THUMBNAIL URL'}`);
        console.log('  ---');
    });

    // Focus on image assets specifically
    const imageOnly = imageAssets.filter(asset => asset.mimeType.startsWith('image/'));
    console.log(`\n🖼️ Image assets specifically: ${imageOnly.length}`);
    
    imageOnly.forEach((asset, index) => {
        console.log(`Image ${index + 1}: ${asset.fileName} (${asset.mimeType})`);
        console.log(`  Thumbnail Key: ${asset.thumbnailKey || 'MISSING'}`);
        console.log(`  Processing Status: ${asset.processingStatus}`);
    });

} catch (error) {
    console.error('❌ Error during debug:', error);
}