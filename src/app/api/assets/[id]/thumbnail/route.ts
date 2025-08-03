import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { assets } from "~/server/db/schema";
import { storageManager } from "~/server/storage";

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

		// Check if thumbnail exists
		if (!asset.thumbnailKey) {
			// For images without thumbnails, serve the original file
			if (asset.mimeType.startsWith("image/")) {
				try {
					const fileResult = await storageManager.downloadFile(
						asset.organizationId,
						asset.storageKey,
					);

					return new NextResponse(fileResult.body, {
						headers: {
							"Content-Type": fileResult.contentType || asset.mimeType,
							"Cache-Control": "public, max-age=3600",
						},
					});
				} catch (error) {
					return NextResponse.json(
						{ error: "Asset file not found" },
						{ status: 404 }
					);
				}
			}

			return NextResponse.json(
				{ error: "No thumbnail available" },
				{ status: 404 }
			);
		}

		// Serve thumbnail
		try {
			const thumbnailResult = await storageManager.downloadFile(
				asset.organizationId,
				asset.thumbnailKey,
			);

			return new NextResponse(thumbnailResult.body, {
				headers: {
					"Content-Type": thumbnailResult.contentType || "image/jpeg",
					"Cache-Control": "public, max-age=3600",
				},
			});
		} catch (error) {
			return NextResponse.json(
				{ error: "Thumbnail not found" },
				{ status: 404 }
			);
		}
	} catch (error) {
		console.error("Thumbnail endpoint error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}