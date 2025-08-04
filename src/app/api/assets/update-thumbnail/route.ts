/**
 * API endpoint for updating asset thumbnail information
 * Updates the database with the generated thumbnail key
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '~/server/auth/config';
import { db } from '~/server/db';
import { assets } from '~/server/db/schema';
import { eq, and } from 'drizzle-orm';

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

    // Parse request body
    const body = await req.json();
    const { assetId, thumbnailKey } = body;

    // Validate required fields
    if (!assetId || !thumbnailKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: assetId, thumbnailKey' 
        },
        { status: 400 }
      );
    }

    // Verify the asset exists and user has access
    const existingAsset = await db
      .select({
        id: assets.id,
        organizationId: assets.organizationId,
        uploaderId: assets.uploaderId
      })
      .from(assets)
      .where(eq(assets.id, assetId))
      .limit(1);

    if (existingAsset.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    const asset = existingAsset[0];

    // Check user permissions (user must be uploader or have org access)
    const hasAccess = 
      asset.uploaderId === session.user.id || 
      asset.organizationId === session.user.organizationId;

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Update asset with thumbnail information
    const updateResult = await db
      .update(assets)
      .set({
        thumbnailKey,
        updatedAt: new Date()
      })
      .where(eq(assets.id, assetId))
      .returning({
        id: assets.id,
        thumbnailKey: assets.thumbnailKey
      });

    if (updateResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update asset' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      assetId,
      thumbnailKey,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Asset thumbnail update error:', error);
    
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