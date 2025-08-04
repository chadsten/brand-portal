import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import {
	accounts,
	sessions,
	users,
	userRoles,
	roles,
	verificationTokens,
} from "~/server/db/schema";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
			organizationId?: string;
			isSuperAdmin?: boolean;
			roles?: string[];
		} & DefaultSession["user"];
	}

	interface User {
		organizationId?: string;
		isSuperAdmin?: boolean;
		roles?: string[];
	}
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
	providers: [
		DiscordProvider,
		// Simple credentials provider for development
		...(process.env.NODE_ENV === "development" ? [
			CredentialsProvider({
				name: "credentials",
				credentials: {
					email: { label: "Email", type: "email" },
				},
				async authorize(credentials) {
					if (!credentials?.email || typeof credentials.email !== 'string') return null;
					
					// For development, allow login with any of the seeded test emails
					const testEmails = [
						"admin@test.com",
						"user1@test.com", 
						"user2@test.com",
						"user3@test.com",
						"user4@test.com",
						"user5@test.com"
					];
					
					if (testEmails.includes(credentials.email)) {
						// Fetch the actual user from the database with roles
						const user = await db.query.users.findFirst({
							where: eq(users.email, credentials.email),
							with: {
								userRoles: {
									with: {
										role: true,
									},
								},
							},
						});

						if (user) {
							const userRoleNames = user.userRoles.map(ur => ur.role.name);
							return {
								id: user.id,
								email: user.email,
								name: user.name,
								// Convert null to undefined for NextAuth compatibility
								organizationId: user.organizationId || undefined,
								isSuperAdmin: user.isSuperAdmin || undefined,
								roles: userRoleNames,
							};
						}
					}
					
					return null;
				},
			})
		] : []),
		/**
		 * ...add more providers here.
		 *
		 * Most other providers require a bit more work than the Discord provider. For example, the
		 * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
		 * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
		 *
		 * @see https://next-auth.js.org/providers/github
		 */
	],
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationTokens,
	}),
	session: {
		strategy: "jwt",
	},
	callbacks: {
		jwt: ({ token, user }) => {
			if (user) {
				token.id = user.id;
				token.organizationId = user.organizationId;
				token.isSuperAdmin = user.isSuperAdmin;
				token.roles = user.roles;
			}
			return token;
		},
		session: ({ session, token }) => ({
			...session,
			user: {
				...session.user,
				id: token.id as string,
				organizationId: token.organizationId as string | undefined,
				isSuperAdmin: token.isSuperAdmin as boolean | undefined,
				roles: token.roles as string[] | undefined,
			},
		}),
	},
} satisfies NextAuthConfig;
