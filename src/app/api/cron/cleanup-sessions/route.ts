import { NextResponse } from "next/server";
import { sessionManager } from "~/server/redis/session";

export async function GET(request: Request) {
	// Verify the request is from Vercel Cron
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const cleanedUp = await sessionManager.cleanup();

		return NextResponse.json({
			success: true,
			cleanedUp,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Session cleanup error:", error);

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}
