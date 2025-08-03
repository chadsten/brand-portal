import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "~/server/db/connection";
import { checkRedisHealth } from "~/server/redis";

export async function GET() {
	try {
		const [dbHealth, redisHealth] = await Promise.all([
			checkDatabaseHealth(),
			checkRedisHealth(),
		]);

		const isHealthy = dbHealth.connected && redisHealth.connected;
		const status = isHealthy ? "healthy" : "unhealthy";

		const response = {
			status,
			timestamp: new Date().toISOString(),
			services: {
				database: {
					connected: dbHealth.connected,
					latency: dbHealth.latency,
					error: dbHealth.error,
				},
				redis: {
					connected: redisHealth.connected,
					latency: redisHealth.latency,
					error: redisHealth.error,
				},
			},
			environment: process.env.NODE_ENV,
			version: process.env.npm_package_version || "unknown",
		};

		return NextResponse.json(response, {
			status: isHealthy ? 200 : 503,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "no-cache, no-store, must-revalidate",
				Pragma: "no-cache",
				Expires: "0",
			},
		});
	} catch (error) {
		return NextResponse.json(
			{
				status: "error",
				timestamp: new Date().toISOString(),
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-cache, no-store, must-revalidate",
				},
			},
		);
	}
}
