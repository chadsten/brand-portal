import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { organizations, usageMetrics, users } from "~/server/db/schema";

export async function GET(request: Request) {
	// Verify the request is from Vercel Cron
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
		let updatedOrgs = 0;

		// Get all active organizations
		const orgs = await db
			.select({ id: organizations.id })
			.from(organizations)
			.where(sql`${organizations.deletedAt} IS NULL`);

		for (const org of orgs) {
			// Count users in organization
			const [userCount] = await db
				.select({ count: sql<number>`count(*)` })
				.from(users)
				.where(sql`${users.organizationId} = ${org.id}`);

			// Update or create usage metrics for current month
			await db
				.insert(usageMetrics)
				.values({
					organizationId: org.id,
					month: currentMonth,
					totalUsers: userCount?.count ?? 0,
					calculatedAt: new Date(),
				})
				.onConflictDoUpdate({
					target: [usageMetrics.organizationId, usageMetrics.month],
					set: {
						totalUsers: userCount?.count ?? 0,
						calculatedAt: new Date(),
					},
				});

			updatedOrgs++;
		}

		return NextResponse.json({
			success: true,
			updatedOrganizations: updatedOrgs,
			month: currentMonth,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Usage metrics update error:", error);

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
