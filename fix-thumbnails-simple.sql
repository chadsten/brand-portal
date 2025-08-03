-- Fix thumbnail issue by clearing fake thumbnailKey values
-- This allows images to use original files as thumbnails

-- Show current state
SELECT id, file_name, mime_type, thumbnail_key 
FROM assets 
WHERE thumbnail_key IS NOT NULL 
LIMIT 10;

-- Clear fake thumbnail keys
UPDATE assets 
SET thumbnail_key = NULL 
WHERE thumbnail_key IS NOT NULL;

-- Verify the fix
SELECT COUNT(*) as assets_with_thumbnails 
FROM assets 
WHERE thumbnail_key IS NOT NULL;