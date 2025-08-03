import { NextResponse } from "next/server";
import { analyticsCollector } from "~/server/redis/analytics";

export async function GET(request: Request) {
	// Verify the request is from Vercel Cron
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		// Clean up analytics data older than 90 days
		const cleanedUp = await analyticsCollector.cleanup(90);

		return NextResponse.json({
			success: true,
			cleanedUp,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Analytics cleanup error:", error);

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
