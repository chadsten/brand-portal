import { type ApiResponse, apiClient } from "./api";

// Types
export interface AnalyticsTimeRange {
	start: string;
	end: string;
	granularity?: "hour" | "day" | "week" | "month";
}

export interface AssetAnalytics {
	totalAssets: number;
	totalSize: number;
	storageUsed: number;
	storageLimit: number;
	assetsByType: Record<string, number>;
	assetsByStatus: Record<string, number>;
	uploadTrends: Array<{
		date: string;
		count: number;
		size: number;
	}>;
	topTags: Array<{
		tag: string;
		count: number;
		growth: number;
	}>;
	popularAssets: Array<{
		id: string;
		name: string;
		downloads: number;
		views: number;
		rating: number;
	}>;
	performanceMetrics: {
		averageFileSize: number;
		compressionRatio: number;
		processingTime: number;
	};
}

export interface UserAnalytics {
	totalUsers: number;
	activeUsers: {
		daily: number;
		weekly: number;
		monthly: number;
	};
	usersByRole: Record<string, number>;
	usersByDepartment: Record<string, number>;
	userActivity: Array<{
		date: string;
		activeUsers: number;
		uploads: number;
		downloads: number;
	}>;
	topContributors: Array<{
		id: string;
		name: string;
		assetsUploaded: number;
		collectionsCreated: number;
		downloads: number;
	}>;
	engagementMetrics: {
		averageSessionDuration: number;
		bounceRate: number;
		returnUserRate: number;
	};
}

export interface CollectionAnalytics {
	totalCollections: number;
	collectionsByType: Record<string, number>;
	collectionsByVisibility: Record<string, number>;
	averageCollectionSize: number;
	collaborationMetrics: {
		sharedCollections: number;
		averageCollaborators: number;
		mostCollaborativeUsers: Array<{
			id: string;
			name: string;
			collaborations: number;
		}>;
	};
	popularCollections: Array<{
		id: string;
		name: string;
		views: number;
		contributors: number;
		assetCount: number;
	}>;
}

export interface UsageAnalytics {
	bandwidth: {
		total: number;
		upload: number;
		download: number;
		trends: Array<{
			date: string;
			upload: number;
			download: number;
		}>;
	};
	apiUsage: {
		totalRequests: number;
		requestsByEndpoint: Record<string, number>;
		errorRate: number;
		averageResponseTime: number;
		trends: Array<{
			date: string;
			requests: number;
			errors: number;
			responseTime: number;
		}>;
	};
	searchAnalytics: {
		totalSearches: number;
		topQueries: Array<{
			query: string;
			count: number;
			successRate: number;
		}>;
		searchTrends: Array<{
			date: string;
			searches: number;
			uniqueQueries: number;
		}>;
		zeroResultQueries: string[];
	};
}

export interface SecurityAnalytics {
	loginAttempts: {
		successful: number;
		failed: number;
		blocked: number;
	};
	accessPatterns: Array<{
		userId: string;
		userName: string;
		lastLogin: string;
		loginCount: number;
		suspiciousActivity: boolean;
	}>;
	permissionChanges: Array<{
		userId: string;
		changedBy: string;
		oldRole: string;
		newRole: string;
		timestamp: string;
	}>;
	dataAccess: {
		sensitiveAssetAccess: number;
		bulkDownloads: number;
		permissionEscalations: number;
	};
}

export interface CustomReport {
	id: string;
	name: string;
	description: string;
	type: "asset" | "user" | "collection" | "usage" | "security" | "custom";
	config: {
		metrics: string[];
		filters: Record<string, any>;
		groupBy: string[];
		timeRange: AnalyticsTimeRange;
		visualization: "table" | "chart" | "graph" | "heatmap";
	};
	schedule?: {
		frequency: "daily" | "weekly" | "monthly";
		recipients: string[];
		format: "pdf" | "csv" | "json";
	};
	createdBy: string;
	createdAt: string;
	lastRun?: string;
}

class AnalyticsService {
	// Asset Analytics
	async getAssetAnalytics(
		timeRange?: AnalyticsTimeRange,
	): Promise<ApiResponse<AssetAnalytics>> {
		const params = timeRange
			? {
					startDate: timeRange.start,
					endDate: timeRange.end,
					granularity: timeRange.granularity || "day",
				}
			: {};

		return apiClient.get<AssetAnalytics>("/analytics/assets", params);
	}

	async getAssetPerformance(
		assetId: string,
		timeRange?: AnalyticsTimeRange,
	): Promise<
		ApiResponse<{
			views: Array<{ date: string; count: number }>;
			downloads: Array<{ date: string; count: number }>;
			shares: Array<{ date: string; count: number }>;
			ratings: Array<{ date: string; average: number; count: number }>;
			comments: Array<{ date: string; count: number }>;
			totalEngagement: number;
			engagementScore: number;
		}>
	> {
		const params = timeRange
			? {
					startDate: timeRange.start,
					endDate: timeRange.end,
					granularity: timeRange.granularity || "day",
				}
			: {};

		return apiClient.get(`/analytics/assets/${assetId}/performance`, params);
	}

	// User Analytics
	async getUserAnalytics(
		timeRange?: AnalyticsTimeRange,
	): Promise<ApiResponse<UserAnalytics>> {
		const params = timeRange
			? {
					startDate: timeRange.start,
					endDate: timeRange.end,
					granularity: timeRange.granularity || "day",
				}
			: {};

		return apiClient.get<UserAnalytics>("/analytics/users", params);
	}

	async getUserEngagement(
		userId: string,
		timeRange?: AnalyticsTimeRange,
	): Promise<
		ApiResponse<{
			sessionsCount: number;
			totalDuration: number;
			averageDuration: number;
			pageViews: number;
			actionsPerformed: Record<string, number>;
			timeline: Array<{
				date: string;
				sessions: number;
				duration: number;
				actions: number;
			}>;
		}>
	> {
		const params = timeRange
			? {
					startDate: timeRange.start,
					endDate: timeRange.end,
					granularity: timeRange.granularity || "day",
				}
			: {};

		return apiClient.get(`/analytics/users/${userId}/engagement`, params);
	}

	// Collection Analytics
	async getCollectionAnalytics(
		timeRange?: AnalyticsTimeRange,
	): Promise<ApiResponse<CollectionAnalytics>> {
		const params = timeRange
			? {
					startDate: timeRange.start,
					endDate: timeRange.end,
					granularity: timeRange.granularity || "day",
				}
			: {};

		return apiClient.get<CollectionAnalytics>("/analytics/collections", params);
	}

	async getCollectionInsights(
		collectionId: string,
		timeRange?: AnalyticsTimeRange,
	): Promise<
		ApiResponse<{
			views: number;
			contributors: number;
			assetAdditions: Array<{ date: string; count: number }>;
			collaboratorActivity: Array<{
				userId: string;
				userName: string;
				contributions: number;
				lastActivity: string;
			}>;
			popularAssets: Array<{
				id: string;
				name: string;
				views: number;
				downloads: number;
			}>;
		}>
	> {
		const params = timeRange
			? {
					startDate: timeRange.start,
					endDate: timeRange.end,
				}
			: {};

		return apiClient.get(
			`/analytics/collections/${collectionId}/insights`,
			params,
		);
	}

	// Usage Analytics
	async getUsageAnalytics(
		timeRange?: AnalyticsTimeRange,
	): Promise<ApiResponse<UsageAnalytics>> {
		const params = timeRange
			? {
					startDate: timeRange.start,
					endDate: timeRange.end,
					granularity: timeRange.granularity || "day",
				}
			: {};

		return apiClient.get<UsageAnalytics>("/analytics/usage", params);
	}

	async getStorageAnalytics(): Promise<
		ApiResponse<{
			totalUsed: number;
			totalLimit: number;
			usageByType: Record<string, number>;
			usageByUser: Array<{
				userId: string;
				userName: string;
				used: number;
				percentage: number;
			}>;
			growthTrend: Array<{
				date: string;
				used: number;
			}>;
			projectedUsage: {
				nextMonth: number;
				nextQuarter: number;
				fullAt: string;
			};
		}>
	> {
		return apiClient.get("/analytics/storage");
	}

	// Security Analytics
	async getSecurityAnalytics(
		timeRange?: AnalyticsTimeRange,
	): Promise<ApiResponse<SecurityAnalytics>> {
		const params = timeRange
			? {
					startDate: timeRange.start,
					endDate: timeRange.end,
				}
			: {};

		return apiClient.get<SecurityAnalytics>("/analytics/security", params);
	}

	async getSecurityEvents(
		severity?: "low" | "medium" | "high" | "critical",
		limit = 50,
	): Promise<
		ApiResponse<
			Array<{
				id: string;
				type: string;
				severity: "low" | "medium" | "high" | "critical";
				description: string;
				userId?: string;
				userName?: string;
				ipAddress: string;
				userAgent: string;
				metadata: Record<string, any>;
				timestamp: string;
				resolved: boolean;
			}>
		>
	> {
		const params = {
			limit: limit.toString(),
			...(severity && { severity }),
		};

		return apiClient.get("/analytics/security/events", params);
	}

	// Real-time Analytics
	async getRealTimeMetrics(): Promise<
		ApiResponse<{
			activeUsers: number;
			currentUploads: number;
			currentDownloads: number;
			systemLoad: {
				cpu: number;
				memory: number;
				storage: number;
			};
			recentActivity: Array<{
				type: string;
				user: string;
				resource: string;
				timestamp: string;
			}>;
		}>
	> {
		return apiClient.get("/analytics/realtime");
	}

	// Custom Reports
	async getCustomReports(): Promise<ApiResponse<CustomReport[]>> {
		return apiClient.get<CustomReport[]>("/analytics/reports");
	}

	async getCustomReport(id: string): Promise<ApiResponse<CustomReport>> {
		return apiClient.get<CustomReport>(`/analytics/reports/${id}`);
	}

	async createCustomReport(
		report: Omit<CustomReport, "id" | "createdBy" | "createdAt" | "lastRun">,
	): Promise<ApiResponse<CustomReport>> {
		return apiClient.post<CustomReport>("/analytics/reports", report);
	}

	async updateCustomReport(
		id: string,
		updates: Partial<CustomReport>,
	): Promise<ApiResponse<CustomReport>> {
		return apiClient.patch<CustomReport>(`/analytics/reports/${id}`, updates);
	}

	async deleteCustomReport(id: string): Promise<ApiResponse<void>> {
		return apiClient.delete<void>(`/analytics/reports/${id}`);
	}

	async runCustomReport(id: string): Promise<
		ApiResponse<{
			data: any[];
			metadata: {
				totalRows: number;
				executionTime: number;
				generatedAt: string;
			};
		}>
	> {
		return apiClient.post(`/analytics/reports/${id}/run`);
	}

	async exportCustomReport(
		id: string,
		format: "pdf" | "csv" | "json" | "xlsx",
	): Promise<
		ApiResponse<{
			downloadUrl: string;
			expiresAt: string;
		}>
	> {
		return apiClient.post(`/analytics/reports/${id}/export`, { format });
	}

	// Dashboard Analytics
	async getDashboardMetrics(): Promise<
		ApiResponse<{
			overview: {
				totalAssets: number;
				totalUsers: number;
				totalCollections: number;
				storageUsed: number;
			};
			recentActivity: Array<{
				type: string;
				description: string;
				user: string;
				timestamp: string;
			}>;
			topMetrics: {
				mostDownloadedAssets: Array<{ name: string; downloads: number }>;
				mostActiveUsers: Array<{ name: string; activity: number }>;
				largestCollections: Array<{ name: string; assetCount: number }>;
			};
			alerts: Array<{
				type: "warning" | "error" | "info";
				message: string;
				timestamp: string;
			}>;
		}>
	> {
		return apiClient.get("/analytics/dashboard");
	}

	// Export and Reporting
	async exportAnalytics(
		type: "asset" | "user" | "collection" | "usage" | "security",
		format: "pdf" | "csv" | "json" | "xlsx",
		timeRange?: AnalyticsTimeRange,
	): Promise<
		ApiResponse<{
			downloadUrl: string;
			expiresAt: string;
			fileSize: number;
		}>
	> {
		const params = {
			format,
			...(timeRange && {
				startDate: timeRange.start,
				endDate: timeRange.end,
			}),
		};

		return apiClient.post(`/analytics/${type}/export`, params);
	}

	// Comparative Analytics
	async getComparativeAnalytics(
		metric: string,
		timeRanges: AnalyticsTimeRange[],
	): Promise<
		ApiResponse<{
			comparison: Array<{
				period: string;
				value: number;
				change: number;
				changePercent: number;
			}>;
			trend: "up" | "down" | "stable";
			insights: string[];
		}>
	> {
		return apiClient.post("/analytics/compare", { metric, timeRanges });
	}

	// Predictive Analytics
	async getPredictiveAnalytics(
		metric: string,
		horizon: "week" | "month" | "quarter",
	): Promise<
		ApiResponse<{
			predictions: Array<{
				date: string;
				predicted: number;
				confidence: number;
			}>;
			accuracy: number;
			factors: Array<{
				name: string;
				impact: number;
			}>;
		}>
	> {
		return apiClient.post("/analytics/predict", { metric, horizon });
	}
}

// Create and export service instance
export const analyticsService = new AnalyticsService();
