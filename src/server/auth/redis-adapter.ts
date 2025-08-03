import type {
	Adapter,
	AdapterAccount,
	AdapterSession,
	AdapterUser,
	VerificationToken,
} from "next-auth/adapters";
import { redis } from "~/server/redis";

export function RedisAdapter(): Adapter {
	return {
		async createUser(user: Omit<AdapterUser, "id">): Promise<AdapterUser> {
			const id = crypto.randomUUID();
			const newUser: AdapterUser = { id, ...user };

			await redis.setex(
				`auth:user:${id}`,
				2592000, // 30 days
				JSON.stringify(newUser),
			);

			if (user.email) {
				await redis.setex(`auth:user:email:${user.email}`, 2592000, id);
			}

			return newUser;
		},

		async getUser(id: string): Promise<AdapterUser | null> {
			const userData = await redis.get(`auth:user:${id}`);
			return userData ? JSON.parse(userData) : null;
		},

		async getUserByEmail(email: string): Promise<AdapterUser | null> {
			const userId = await redis.get(`auth:user:email:${email}`);
			if (!userId) return null;

			return this.getUser!(userId);
		},

		async getUserByAccount({
			providerAccountId,
			provider,
		}: Pick<
			AdapterAccount,
			"provider" | "providerAccountId"
		>): Promise<AdapterUser | null> {
			const accountData = await redis.get(
				`auth:account:${provider}:${providerAccountId}`,
			);
			if (!accountData) return null;

			const account: AdapterAccount = JSON.parse(accountData);
			return this.getUser!(account.userId);
		},

		async updateUser(
			user: Partial<AdapterUser> & Pick<AdapterUser, "id">,
		): Promise<AdapterUser> {
			const existing = await this.getUser!(user.id);
			if (!existing) throw new Error("User not found");

			const updated = { ...existing, ...user };

			await redis.setex(
				`auth:user:${user.id}`,
				2592000,
				JSON.stringify(updated),
			);

			if (updated.email && updated.email !== existing.email) {
				// Update email index
				if (existing.email) {
					await redis.del(`auth:user:email:${existing.email}`);
				}
				await redis.setex(`auth:user:email:${updated.email}`, 2592000, user.id);
			}

			return updated;
		},

		async deleteUser(userId: string): Promise<void> {
			const user = await this.getUser!(userId);
			if (!user) return;

			// Delete user data
			await redis.del(`auth:user:${userId}`);

			if (user.email) {
				await redis.del(`auth:user:email:${user.email}`);
			}

			// Delete associated accounts
			const accountKeys = await redis.keys(`auth:account:*`);
			for (const key of accountKeys) {
				const accountData = await redis.get(key);
				if (accountData) {
					const account: AdapterAccount = JSON.parse(accountData);
					if (account.userId === userId) {
						await redis.del(key);
					}
				}
			}

			// Delete associated sessions
			const sessionKeys = await redis.keys(`auth:session:*`);
			for (const key of sessionKeys) {
				const sessionData = await redis.get(key);
				if (sessionData) {
					const session: AdapterSession = JSON.parse(sessionData);
					if (session.userId === userId) {
						await redis.del(key);
					}
				}
			}
		},

		async linkAccount(account: AdapterAccount): Promise<void> {
			await redis.setex(
				`auth:account:${account.provider}:${account.providerAccountId}`,
				2592000,
				JSON.stringify(account),
			);
		},

		async unlinkAccount({
			providerAccountId,
			provider,
		}: Pick<AdapterAccount, "provider" | "providerAccountId">): Promise<void> {
			await redis.del(`auth:account:${provider}:${providerAccountId}`);
		},

		async createSession(session: {
			sessionToken: string;
			userId: string;
			expires: Date;
		}): Promise<AdapterSession> {
			const adapterSession: AdapterSession = {
				...session,
			};

			const ttl = Math.floor((session.expires.getTime() - Date.now()) / 1000);

			await redis.setex(
				`auth:session:${session.sessionToken}`,
				ttl > 0 ? ttl : 86400, // Default to 24 hours if TTL calculation fails
				JSON.stringify(adapterSession),
			);

			return adapterSession;
		},

		async getSessionAndUser(sessionToken: string): Promise<{
			session: AdapterSession;
			user: AdapterUser;
		} | null> {
			const sessionData = await redis.get(`auth:session:${sessionToken}`);
			if (!sessionData) return null;

			const session: AdapterSession = JSON.parse(sessionData);
			const user = await this.getUser!(session.userId);

			if (!user) {
				// Clean up orphaned session
				await redis.del(`auth:session:${sessionToken}`);
				return null;
			}

			return { session, user };
		},

		async updateSession(
			session: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">,
		): Promise<AdapterSession | null | undefined> {
			const existing = await redis.get(`auth:session:${session.sessionToken}`);
			if (!existing) return null;

			const existingSession: AdapterSession = JSON.parse(existing);
			const updated = { ...existingSession, ...session };

			const ttl = Math.floor((updated.expires.getTime() - Date.now()) / 1000);

			await redis.setex(
				`auth:session:${session.sessionToken}`,
				ttl > 0 ? ttl : 86400,
				JSON.stringify(updated),
			);

			return updated;
		},

		async deleteSession(sessionToken: string): Promise<void> {
			await redis.del(`auth:session:${sessionToken}`);
		},

		async createVerificationToken(
			token: VerificationToken,
		): Promise<VerificationToken | null | undefined> {
			const ttl = Math.floor((token.expires.getTime() - Date.now()) / 1000);

			await redis.setex(
				`auth:verification:${token.identifier}:${token.token}`,
				ttl > 0 ? ttl : 3600, // Default to 1 hour
				JSON.stringify(token),
			);

			return token;
		},

		async useVerificationToken({
			identifier,
			token,
		}: {
			identifier: string;
			token: string;
		}): Promise<VerificationToken | null> {
			const key = `auth:verification:${identifier}:${token}`;
			const tokenData = await redis.get(key);

			if (!tokenData) return null;

			// Delete token after use
			await redis.del(key);

			return JSON.parse(tokenData);
		},
	};
}
