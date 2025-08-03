import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
	conn: postgres.Sql | undefined;
};

const connectionConfig = {
	max: 20,
	idle_timeout: 20,
	connect_timeout: 10,
	prepare: false,
} as const;

const conn = globalForDb.conn ?? postgres(env.DATABASE_URL, connectionConfig);
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, {
	schema,
	logger: env.NODE_ENV === "development",
});

export type Database = typeof db;
