import { redis } from "./index";

export interface SessionData {
	userId: string;
	organizationId?: string;
	roles: string[];
	permissions: Record<string, string[]>;
	lastActivity: number;
	metadata?: Record<string, any>;
}

export class SessionManager {
	private keyPrefix = "session";
	private defaultTTL = 604800; // 7 days

	private getKey(sessionId: string): string {
		return `${this.keyPrefix}:${sessionId}`;
	}

	async create(
		sessionId: string,
		data: SessionData,
		ttl = this.defaultTTL,
	): Promise<boolean> {
		try {
			const sessionData = {
				...data,
				createdAt: Date.now(),
				lastActivity: Date.now(),
			};

			await redis.setex(
				this.getKey(sessionId),
				ttl,
				JSON.stringify(sessionData),
			);

			return true;
		} catch (error) {
			console.error(`Session create error for ${sessionId}:`, error);
			return false;
		}
	}

	async get(sessionId: string): Promise<SessionData | null> {
		try {
			const data = await redis.get(this.getKey(sessionId));
			return data ? JSON.parse(data) : null;
		} catch (error) {
			console.error(`Session get error for ${sessionId}:`, error);
			return null;
		}
	}

	async update(
		sessionId: string,
		updates: Partial<SessionData>,
	): Promise<boolean> {
		try {
			const existing = await this.get(sessionId);
			if (!existing) return false;

			const updated = {
				...existing,
				...updates,
				lastActivity: Date.now(),
			};

			const ttl = await redis.ttl(this.getKey(sessionId));
			await redis.setex(
				this.getKey(sessionId),
				ttl > 0 ? ttl : this.defaultTTL,
				JSON.stringify(updated),
			);

			return true;
		} catch (error) {
			console.error(`Session update error for ${sessionId}:`, error);
			return false;
		}
	}

	async touch(sessionId: string): Promise<boolean> {
		try {
			const existing = await this.get(sessionId);
			if (!existing) return false;

			return await this.update(sessionId, { lastActivity: Date.now() });
		} catch (error) {
			console.error(`Session touch error for ${sessionId}:`, error);
			return false;
		}
	}

	async delete(sessionId: string): Promise<boolean> {
		try {
			const result = await redis.del(this.getKey(sessionId));
			return result > 0;
		} catch (error) {
			console.error(`Session delete error for ${sessionId}:`, error);
			return false;
		}
	}

	async deleteByUser(userId: string): Promise<number> {
		try {
			const pattern = `${this.keyPrefix}:*`;
			const keys = await redis.keys(pattern);

			if (keys.length === 0) return 0;

			const pipeline = redis.pipeline();
			keys.forEach((key) => pipeline.get(key));

			const results = await pipeline.exec();
			if (!results) return 0;

			const keysToDelete: string[] = [];

			results.forEach((result, index) => {
				if (result?.[1]) {
					try {
						const sessionData = JSON.parse(result[1] as string);
						if (sessionData.userId === userId) {
							keysToDelete.push(keys[index]!);
						}
					} catch {
						// Invalid session data, mark for deletion
						keysToDelete.push(keys[index]!);
					}
				}
			});

			if (keysToDelete.length === 0) return 0;

			const deleteResult = await redis.del(...keysToDelete);
			return deleteResult;
		} catch (error) {
			console.error(`Session deleteByUser error for ${userId}:`, error);
			return 0;
		}
	}

	async exists(sessionId: string): Promise<boolean> {
		try {
			const result = await redis.exists(this.getKey(sessionId));
			return result === 1;
		} catch (error) {
			console.error(`Session exists error for ${sessionId}:`, error);
			return false;
		}
	}

	async extend(sessionId: string, additionalTTL: number): Promise<boolean> {
		try {
			const currentTTL = await redis.ttl(this.getKey(sessionId));
			if (currentTTL <= 0) return false;

			const newTTL = currentTTL + additionalTTL;
			const result = await redis.expire(this.getKey(sessionId), newTTL);
			return result === 1;
		} catch (error) {
			console.error(`Session extend error for ${sessionId}:`, error);
			return false;
		}
	}

	async cleanup(): Promise<number> {
		try {
			const pattern = `${this.keyPrefix}:*`;
			const keys = await redis.keys(pattern);

			if (keys.length === 0) return 0;

			const pipeline = redis.pipeline();
			keys.forEach((key) => pipeline.ttl(key));

			const results = await pipeline.exec();
			if (!results) return 0;

			const expiredKeys: string[] = [];

			results.forEach((result, index) => {
				const ttl = result?.[1] as number;
				if (ttl === -2 || ttl === 0) {
					// Expired or non-existent
					expiredKeys.push(keys[index]!);
				}
			});

			if (expiredKeys.length === 0) return 0;

			const deleteResult = await redis.del(...expiredKeys);
			return deleteResult;
		} catch (error) {
			console.error("Session cleanup error:", error);
			return 0;
		}
	}

	async getActiveSessions(userId: string): Promise<string[]> {
		try {
			const pattern = `${this.keyPrefix}:*`;
			const keys = await redis.keys(pattern);

			if (keys.length === 0) return [];

			const pipeline = redis.pipeline();
			keys.forEach((key) => pipeline.get(key));

			const results = await pipeline.exec();
			if (!results) return [];

			const activeSessions: string[] = [];

			results.forEach((result, index) => {
				if (result?.[1]) {
					try {
						const sessionData = JSON.parse(result[1] as string);
						if (sessionData.userId === userId) {
							const sessionId = keys[index]!.replace(`${this.keyPrefix}:`, "");
							activeSessions.push(sessionId);
						}
					} catch {
						// Invalid session data, ignore
					}
				}
			});

			return activeSessions;
		} catch (error) {
			console.error(`GetActiveSessions error for ${userId}:`, error);
			return [];
		}
	}
}

export const sessionManager = new SessionManager();

// NextAuth Redis adapter utilities
export async function getNextAuthSession(sessionToken: string): Promise<any> {
	try {
		const data = await redis.get(`nextauth:session:${sessionToken}`);
		return data ? JSON.parse(data) : null;
	} catch (error) {
		console.error("NextAuth session get error:", error);
		return null;
	}
}

export async function setNextAuthSession(
	sessionToken: string,
	session: any,
	maxAge: number,
): Promise<boolean> {
	try {
		await redis.setex(
			`nextauth:session:${sessionToken}`,
			maxAge,
			JSON.stringify(session),
		);
		return true;
	} catch (error) {
		console.error("NextAuth session set error:", error);
		return false;
	}
}

export async function deleteNextAuthSession(
	sessionToken: string,
): Promise<boolean> {
	try {
		const result = await redis.del(`nextauth:session:${sessionToken}`);
		return result > 0;
	} catch (error) {
		console.error("NextAuth session delete error:", error);
		return false;
	}
}
