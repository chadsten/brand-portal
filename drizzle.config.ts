import type { Config } from "drizzle-kit";

import { env } from "~/env";

export default {
	schema: "./src/server/db/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
	tablesFilter: ["brand_portal_*"],
	verbose: true,
	strict: true,
} satisfies Config;
