import { redis } from "./index";

export interface AnalyticsEvent {
	type: string;
	userId?: string;
	organizationId?: string;
	assetId?: string;
	metadata?: Record<string, any>;
	timestamp: number;
	ipAddress?: string;
	userAgent?: string;
}

export class AnalyticsCollector {
	private keyPrefix = "analytics";
	private batchSize = 100;
	private flushInterval = 30000; // 30 seconds

	private getEventKey(type: string, date: string): string {
		return `${this.keyPrefix}:events:${type}:${date}`;
	}

	private getCounterKey(
		type: string,
		identifier: string,
		date: string,
	): string {
		return `${this.keyPrefix}:counters:${type}:${identifier}:${date}`;
	}

	async recordEvent(event: AnalyticsEvent): Promise<boolean> {
		try {
			const date = new Date(event.timestamp).toISOString().split("T")[0]!; // YYYY-MM-DD
			const eventData = JSON.stringify(event);

			const pipeline = redis.pipeline();

			// Store event in time-series list
			const eventKey = this.getEventKey(event.type, date);
			pipeline.lpush(eventKey, eventData);
			pipeline.expire(eventKey, 2592000); // 30 days

			// Update counters
			if (event.organizationId) {
				const orgKey = this.getCounterKey(
					event.type,
					`org:${event.organizationId}`,
					date,
				);
				pipeline.incr(orgKey);
				pipeline.expire(orgKey, 2592000);
			}

			if (event.userId) {
				const userKey = this.getCounterKey(
					event.type,
					`user:${event.userId}`,
					date,
				);
				pipeline.incr(userKey);
				pipeline.expire(userKey, 2592000);
			}

			if (event.assetId) {
				const assetKey = this.getCounterKey(
					event.type,
					`asset:${event.assetId}`,
					date,
				);
				pipeline.incr(assetKey);
				pipeline.expire(assetKey, 2592000);
			}

			await pipeline.exec();
			return true;
		} catch (error) {
			console.error("Analytics record error:", error);
			return false;
		}
	}

	async getEventCount(
		type: string,
		identifier: string,
		startDate: string,
		endDate: string,
	): Promise<number> {
		try {
			const pipeline = redis.pipeline();
			const start = new Date(startDate);
			const end = new Date(endDate);

			for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
				const date = d.toISOString().split("T")[0];
				pipeline.get(this.getCounterKey(type, identifier, date!));
			}

			const results = await pipeline.exec();
			if (!results) return 0;

			return results.reduce((total, result) => {
				const count = parseInt((result?.[1] as string) || "0");
				return total + count;
			}, 0);
		} catch (error) {
			console.error("Analytics getEventCount error:", error);
			return 0;
		}
	}

	async getEvents(
		type: string,
		date: string,
		limit = 100,
		offset = 0,
	): Promise<AnalyticsEvent[]> {
		try {
			const key = this.getEventKey(type, date);
			const events = await redis.lrange(key, offset, offset + limit - 1);

			return events
				.map((eventData) => {
					try {
						return JSON.parse(eventData);
					} catch {
						return null;
					}
				})
				.filter(Boolean);
		} catch (error) {
			console.error("Analytics getEvents error:", error);
			return [];
		}
	}

	async getDailyStats(
		organizationId: string,
		startDate: string,
		endDate: string,
	): Promise<Record<string, Record<string, number>>> {
		try {
			const stats: Record<string, Record<string, number>> = {};
			const eventTypes = [
				"asset_view",
				"asset_download",
				"asset_upload",
				"user_login",
			];

			const pipeline = redis.pipeline();
			const start = new Date(startDate);
			const end = new Date(endDate);

			for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
				const date = d.toISOString().split("T")[0]!;
				stats[date] = {};

				for (const eventType of eventTypes) {
					pipeline.get(
						this.getCounterKey(eventType, `org:${organizationId}`, date),
					);
				}
			}

			const results = await pipeline.exec();
			if (!results) return stats;

			let resultIndex = 0;
			for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
				const date = d.toISOString().split("T")[0]!;

				for (const eventType of eventTypes) {
					const count = parseInt((results[resultIndex]?.[1] as string) || "0");
					stats[date]![eventType] = count;
					resultIndex++;
				}
			}

			return stats;
		} catch (error) {
			console.error("Analytics getDailyStats error:", error);
			return {};
		}
	}

	async getTopAssets(
		organizationId: string,
		eventType: string,
		date: string,
		limit = 10,
	): Promise<Array<{ assetId: string; count: number }>> {
		try {
			const pattern = this.getCounterKey(eventType, `asset:*`, date);
			const keys = await redis.keys(pattern);

			if (keys.length === 0) return [];

			const pipeline = redis.pipeline();
			keys.forEach((key) => pipeline.get(key));

			const results = await pipeline.exec();
			if (!results) return [];

			const assetCounts: Array<{ assetId: string; count: number }> = [];

			results.forEach((result, index) => {
				if (result?.[1]) {
					const count = parseInt(result[1] as string);
					const key = keys[index]!;
					const assetId = key
						.split(":")
						.slice(-2, -1)[0]!
						.replace("asset:", "");
					assetCounts.push({ assetId, count });
				}
			});

			return assetCounts.sort((a, b) => b.count - a.count).slice(0, limit);
		} catch (error) {
			console.error("Analytics getTopAssets error:", error);
			return [];
		}
	}

	async cleanup(daysToKeep = 30): Promise<number> {
		try {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

			const pattern = `${this.keyPrefix}:*`;
			const keys = await redis.keys(pattern);

			const keysToDelete: string[] = [];

			for (const key of keys) {
				// Extract date from key
				const parts = key.split(":");
				const dateStr = parts[parts.length - 1];

				if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
					const keyDate = new Date(dateStr);
					if (keyDate < cutoffDate) {
						keysToDelete.push(key);
					}
				}
			}

			if (keysToDelete.length === 0) return 0;

			const result = await redis.del(...keysToDelete);
			return result;
		} catch (error) {
			console.error("Analytics cleanup error:", error);
			return 0;
		}
	}
}

export const analyticsCollector = new AnalyticsCollector();

// Convenience functions for common analytics events
export async function trackAssetView(
	assetId: string,
	userId?: string,
	organizationId?: string,
	metadata?: Record<string, any>,
): Promise<boolean> {
	return analyticsCollector.recordEvent({
		type: "asset_view",
		assetId,
		userId,
		organizationId,
		metadata,
		timestamp: Date.now(),
	});
}

export async function trackAssetDownload(
	assetId: string,
	userId?: string,
	organizationId?: string,
	metadata?: Record<string, any>,
): Promise<boolean> {
	return analyticsCollector.recordEvent({
		type: "asset_download",
		assetId,
		userId,
		organizationId,
		metadata,
		timestamp: Date.now(),
	});
}

export async function trackAssetUpload(
	assetId: string,
	userId: string,
	organizationId: string,
	metadata?: Record<string, any>,
): Promise<boolean> {
	return analyticsCollector.recordEvent({
		type: "asset_upload",
		assetId,
		userId,
		organizationId,
		metadata,
		timestamp: Date.now(),
	});
}

export async function trackUserLogin(
	userId: string,
	organizationId?: string,
	metadata?: Record<string, any>,
): Promise<boolean> {
	return analyticsCollector.recordEvent({
		type: "user_login",
		userId,
		organizationId,
		metadata,
		timestamp: Date.now(),
	});
}
