import { db } from './src/server/db/index.ts';
import { assets } from './src/server/db/schema.ts';
import { isNull, isNotNull } from 'drizzle-orm';

// Fix existing assets with fake thumbnailKey values
console.log('🔧 Fixing existing thumbnail data...\n');

try {
    // Find all assets that have thumbnailKey set (these are likely fake)
    const assetsWithThumbnails = await db.query.assets.findMany({
        where: isNotNull(assets.thumbnailKey),
    });

    console.log(`📊 Found ${assetsWithThumbnails.length} assets with thumbnailKey set`);
    
    if (assetsWithThumbnails.length > 0) {
        console.log('\n📋 Assets with thumbnailKey:');
        assetsWithThumbnails.forEach((asset, index) => {
            console.log(`  ${index + 1}. ${asset.fileName} (${asset.mimeType})`);
            console.log(`     ThumbnailKey: ${asset.thumbnailKey}`);
        });

        // Clear all thumbnailKey values
        console.log('\n🧹 Clearing fake thumbnailKey values...');
        const result = await db.update(assets)
            .set({ thumbnailKey: null })
            .where(isNotNull(assets.thumbnailKey));

        console.log(`✅ Updated ${assetsWithThumbnails.length} assets to clear fake thumbnailKey values`);
        console.log('📝 Images will now use original files as thumbnails via /download endpoint');
    } else {
        console.log('✅ No assets with thumbnailKey found - data is already clean');
    }

} catch (error) {
    console.error('❌ Error during fix:', error);
}