import { sql } from "drizzle-orm";
import { db } from "./index";

export async function testDatabaseConnection(): Promise<boolean> {
	try {
		await db.execute(sql`SELECT 1`);
		return true;
	} catch (error) {
		console.error("Database connection failed:", error);
		return false;
	}
}

export async function checkDatabaseHealth(): Promise<{
	connected: boolean;
	latency?: number;
	error?: string;
}> {
	try {
		const start = Date.now();
		await db.execute(sql`SELECT version()`);
		const latency = Date.now() - start;

		return { connected: true, latency };
	} catch (error) {
		return {
			connected: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export async function createDatabaseSchema(): Promise<void> {
	try {
		await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
		await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
	} catch (error) {
		console.error("Failed to create extensions:", error);
		throw error;
	}
}

export { db };
