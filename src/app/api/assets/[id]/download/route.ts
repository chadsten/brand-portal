import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { assets } from "~/server/db/schema";
import { storageManager } from "~/server/storage";
import { usageTracker } from "~/server/storage/usage";

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const assetId = params.id;
		if (!assetId) {
			return NextResponse.json({ error: "Asset ID required" }, { status: 400 });
		}

		// Get asset from database
		const asset = await db.query.assets.findFirst({
			where: and(
				eq(assets.id, assetId),
				eq(assets.organizationId, session.user.organizationId!),
				isNull(assets.deletedAt),
			),
		});

		if (!asset) {
			return NextResponse.json({ error: "Asset not found" }, { status: 404 });
		}

		// Check download permission (basic implementation)
		// In a full implementation, you'd check asset permissions table
		
		// Determine which file to download
		const url = new URL(request.url);
		const original = url.searchParams.get("original") !== "false"; // Default to true for downloads
		
		// Always use the original storageKey for downloads unless explicitly requested otherwise
		const downloadKey = original ? asset.storageKey : asset.storageKey;
		
		// Log what we're attempting to download
		console.log(`Download attempt for asset ${assetId}:`, {
			storageKey: asset.storageKey,
			downloadKey,
			original,
			databaseFileSize: asset.fileSize,
			organizationId: asset.organizationId
		});

		// Get file from storage
		const fileResult = await storageManager.downloadFile(
			asset.organizationId,
			downloadKey,
		);

		if (!fileResult.body) {
			console.log(`File not found at storage key: ${downloadKey}`);
			return NextResponse.json(
				{ error: "Asset file not found" },
				{ status: 404 }
			);
		}

		// Log what we actually got from storage
		console.log(`Retrieved file from storage:`, {
			contentLength: fileResult.contentLength,
			contentType: fileResult.contentType,
			storageKey: downloadKey
		});

		// Track download analytics (async, don't wait)
		usageTracker.incrementDownloadCount(asset.organizationId).catch(console.error);

		// Determine content disposition
		const inline = url.searchParams.get("inline") === "true";
		const disposition = inline ? "inline" : "attachment";

		return new NextResponse(fileResult.body, {
			headers: {
				"Content-Type": fileResult.contentType || asset.mimeType,
				"Content-Disposition": `${disposition}; filename="${asset.originalFileName}"`,
				"Content-Length": (fileResult.contentLength || asset.fileSize).toString(),
				"Cache-Control": "private, max-age=3600",
				"X-Asset-Id": asset.id,
				"X-Storage-Key": downloadKey,
				"X-Original-File": original.toString(),
			},
		});
	} catch (error) {
		console.error("Download endpoint error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}