import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		// Core
		AUTH_SECRET:
			process.env.NODE_ENV === "production"
				? z.string()
				: z.string().optional(),
		DATABASE_URL: z.string().url(),
		REDIS_URL: z.string().url(),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),

		// OAuth Providers
		GOOGLE_CLIENT_ID: z.string(),
		GOOGLE_CLIENT_SECRET: z.string(),
		AZURE_AD_CLIENT_ID: z.string(),
		AZURE_AD_CLIENT_SECRET: z.string(),
		AZURE_AD_TENANT_ID: z.string(),

		// Storage (S3)
		AWS_ACCESS_KEY_ID: z.string(),
		AWS_SECRET_ACCESS_KEY: z.string(),
		AWS_REGION: z.string().default("us-east-1"),
		AWS_S3_BUCKET: z.string(),
		AWS_ENDPOINT: z.string().optional(),

		// Email
		SMTP_HOST: z.string(),
		SMTP_PORT: z.string(),
		SMTP_USER: z.string(),
		SMTP_PASS: z.string(),

		// Security
		BCRYPT_ROUNDS: z.string().default("12"),
		JWT_SECRET: z.string(),

		// Base URL
		NEXTAUTH_URL: z.string().url(),

		// Optional: Cron job authentication
		CRON_SECRET: z.string().optional(),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_APP_URL: z.string().url(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		// Core
		AUTH_SECRET: process.env.AUTH_SECRET,
		DATABASE_URL: process.env.DATABASE_URL,
		REDIS_URL: process.env.REDIS_URL,
		NODE_ENV: process.env.NODE_ENV,

		// OAuth
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
		AZURE_AD_CLIENT_ID: process.env.AZURE_AD_CLIENT_ID,
		AZURE_AD_CLIENT_SECRET: process.env.AZURE_AD_CLIENT_SECRET,
		AZURE_AD_TENANT_ID: process.env.AZURE_AD_TENANT_ID,

		// Storage
		AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
		AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
		AWS_REGION: process.env.AWS_REGION,
		AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
		AWS_ENDPOINT: process.env.AWS_ENDPOINT,

		// Email
		SMTP_HOST: process.env.SMTP_HOST,
		SMTP_PORT: process.env.SMTP_PORT,
		SMTP_USER: process.env.SMTP_USER,
		SMTP_PASS: process.env.SMTP_PASS,

		// Security
		BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS,
		JWT_SECRET: process.env.JWT_SECRET,

		// URLs
		NEXTAUTH_URL: process.env.NEXTAUTH_URL,
		NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,

		// Optional
		CRON_SECRET: process.env.CRON_SECRET,
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});
