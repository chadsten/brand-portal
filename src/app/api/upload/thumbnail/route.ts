/**
 * API endpoint for uploading client-generated thumbnails
 * Handles uploads from the client-side thumbnail generation service
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '~/server/auth/config';
import { storageManager } from '~/server/storage';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const assetId = formData.get('assetId') as string;
    const type = formData.get('type') as string;
    const originalFileName = formData.get('originalFileName') as string;
    const organizationId = formData.get('organizationId') as string;

    // Validate required fields
    if (!file || !assetId || type !== 'thumbnail') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: file, assetId, type' 
        },
        { status: 400 }
      );
    }

    // Validate file type (should be an image)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'File must be an image' 
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for thumbnails)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'File too large. Maximum size is 10MB' 
        },
        { status: 400 }
      );
    }

    // Generate thumbnail key
    const timestamp = Date.now();
    const randomId = nanoid(8);
    const fileExtension = file.name.split('.').pop() || 'webp';
    const thumbnailKey = `thumbnails/${assetId}/client-generated-${timestamp}-${randomId}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get organization ID for storage
    const orgId = organizationId || session.user.organizationId || 'default';

    // Upload to storage
    const uploadResult = await storageManager.uploadFile(
      orgId,
      thumbnailKey,
      buffer,
      file.type,
      {
        assetId,
        type: 'client_generated_thumbnail',
        originalFileName,
        generatedBy: session.user.id,
        generatedAt: new Date().toISOString(),
        size: file.size.toString()
      }
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to upload thumbnail to storage' 
        },
        { status: 500 }
      );
    }

    // Generate download URL for the thumbnail
    const downloadUrl = await storageManager.generateDownloadUrl(
      orgId,
      thumbnailKey,
      3600 // 1 hour expiry for immediate use
    );

    return NextResponse.json({
      success: true,
      url: downloadUrl,
      key: thumbnailKey,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Thumbnail upload error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}