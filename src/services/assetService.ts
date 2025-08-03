import { type ApiResponse, apiClient } from "./api";

// Types
export interface Asset {
	id: string;
	name: string;
	type: "image" | "video" | "audio" | "document";
	url: string;
	thumbnail?: string;
	size: number;
	format: string;
	tags: string[];
	collections: string[];
	metadata: Record<string, any>;
	createdAt: string;
	updatedAt: string;
	createdBy: string;
	status: "draft" | "approved" | "rejected" | "pending";
	approvedBy?: string;
	approvedAt?: string;
	downloadCount: number;
	viewCount: number;
	rating?: number;
	description?: string;
	altText?: string;
	copyrightInfo?: {
		owner: string;
		license: string;
		restrictions?: string[];
	};
	technicalInfo?: {
		resolution?: string;
		duration?: number;
		colorProfile?: string;
		compression?: string;
	};
}

export interface AssetUpload {
	name: string;
	description?: string;
	tags?: string[];
	collections?: string[];
	metadata?: Record<string, any>;
	altText?: string;
}

export interface AssetFilter {
	search?: string;
	type?: string[];
	status?: string[];
	tags?: string[];
	collections?: string[];
	createdBy?: string[];
	dateRange?: {
		start: string;
		end: string;
	};
	sizeRange?: {
		min: number;
		max: number;
	};
	rating?: {
		min: number;
		max: number;
	};
}

export interface AssetSort {
	field:
		| "name"
		| "createdAt"
		| "updatedAt"
		| "size"
		| "downloadCount"
		| "viewCount"
		| "rating";
	direction: "asc" | "desc";
}

export interface AssetAnalytics {
	totalAssets: number;
	totalSize: number;
	typeDistribution: Record<string, number>;
	statusDistribution: Record<string, number>;
	topTags: Array<{ tag: string; count: number }>;
	recentActivity: Array<{
		action: string;
		assetId: string;
		assetName: string;
		userId: string;
		userName: string;
		timestamp: string;
	}>;
	storageUsage: {
		used: number;
		total: number;
		percentage: number;
	};
}

class AssetService {
	// Get all assets with filtering, sorting, and pagination
	async getAssets(
		filter?: AssetFilter,
		sort?: AssetSort,
		page = 1,
		limit = 20,
	): Promise<ApiResponse<Asset[]>> {
		const params = {
			page: page.toString(),
			limit: limit.toString(),
			...(filter?.search && { search: filter.search }),
			...(filter?.type?.length && { type: filter.type.join(",") }),
			...(filter?.status?.length && { status: filter.status.join(",") }),
			...(filter?.tags?.length && { tags: filter.tags.join(",") }),
			...(filter?.collections?.length && {
				collections: filter.collections.join(","),
			}),
			...(filter?.createdBy?.length && {
				createdBy: filter.createdBy.join(","),
			}),
			...(filter?.dateRange && {
				startDate: filter.dateRange.start,
				endDate: filter.dateRange.end,
			}),
			...(filter?.sizeRange && {
				minSize: filter.sizeRange.min.toString(),
				maxSize: filter.sizeRange.max.toString(),
			}),
			...(filter?.rating && {
				minRating: filter.rating.min.toString(),
				maxRating: filter.rating.max.toString(),
			}),
			...(sort && {
				sortField: sort.field,
				sortDirection: sort.direction,
			}),
		};

		return apiClient.get<Asset[]>("/assets", params);
	}

	// Get asset by ID
	async getAsset(id: string): Promise<ApiResponse<Asset>> {
		return apiClient.get<Asset>(`/assets/${id}`);
	}

	// Upload new asset
	async uploadAsset(
		file: File,
		data: AssetUpload,
	): Promise<ApiResponse<Asset>> {
		return apiClient.upload<Asset>("/assets", file, data);
	}

	// Update asset metadata
	async updateAsset(
		id: string,
		updates: Partial<Asset>,
	): Promise<ApiResponse<Asset>> {
		return apiClient.patch<Asset>(`/assets/${id}`, updates);
	}

	// Delete asset
	async deleteAsset(id: string): Promise<ApiResponse<void>> {
		return apiClient.delete<void>(`/assets/${id}`);
	}

	// Bulk operations
	async bulkUpdateAssets(
		assetIds: string[],
		updates: Partial<Asset>,
	): Promise<ApiResponse<Asset[]>> {
		return apiClient.post<Asset[]>("/assets/bulk-update", {
			assetIds,
			updates,
		});
	}

	async bulkDeleteAssets(assetIds: string[]): Promise<ApiResponse<void>> {
		return apiClient.post<void>("/assets/bulk-delete", { assetIds });
	}

	// Asset approval workflow
	async approveAsset(
		id: string,
		comment?: string,
	): Promise<ApiResponse<Asset>> {
		return apiClient.post<Asset>(`/assets/${id}/approve`, { comment });
	}

	async rejectAsset(id: string, reason: string): Promise<ApiResponse<Asset>> {
		return apiClient.post<Asset>(`/assets/${id}/reject`, { reason });
	}

	async requestApproval(id: string): Promise<ApiResponse<Asset>> {
		return apiClient.post<Asset>(`/assets/${id}/request-approval`);
	}

	// Asset analytics and metrics
	async getAssetAnalytics(
		filter?: AssetFilter,
	): Promise<ApiResponse<AssetAnalytics>> {
		const params = filter ? this.buildFilterParams(filter) : {};
		return apiClient.get<AssetAnalytics>("/assets/analytics", params);
	}

	async getAssetUsage(id: string): Promise<
		ApiResponse<{
			downloadCount: number;
			viewCount: number;
			recentDownloads: Array<{
				userId: string;
				userName: string;
				timestamp: string;
			}>;
			recentViews: Array<{
				userId: string;
				userName: string;
				timestamp: string;
			}>;
		}>
	> {
		return apiClient.get(`/assets/${id}/usage`);
	}

	// Asset downloads and views
	async downloadAsset(
		id: string,
	): Promise<ApiResponse<{ downloadUrl: string }>> {
		return apiClient.post<{ downloadUrl: string }>(`/assets/${id}/download`);
	}

	async recordView(id: string): Promise<ApiResponse<void>> {
		return apiClient.post<void>(`/assets/${id}/view`);
	}

	// Asset versions
	async getAssetVersions(id: string): Promise<ApiResponse<Asset[]>> {
		return apiClient.get<Asset[]>(`/assets/${id}/versions`);
	}

	async createAssetVersion(
		id: string,
		file: File,
		notes?: string,
	): Promise<ApiResponse<Asset>> {
		return apiClient.upload<Asset>(`/assets/${id}/versions`, file, { notes });
	}

	// Asset search and discovery
	async searchAssets(
		query: string,
		options?: {
			includeMetadata?: boolean;
			similarityThreshold?: number;
			maxResults?: number;
		},
	): Promise<ApiResponse<Array<Asset & { relevanceScore: number }>>> {
		return apiClient.post("/assets/search", { query, ...options });
	}

	async getSimilarAssets(
		id: string,
		limit = 10,
	): Promise<ApiResponse<Array<Asset & { similarityScore: number }>>> {
		return apiClient.get(`/assets/${id}/similar`, { limit: limit.toString() });
	}

	// Asset AI features
	async generateTags(
		id: string,
	): Promise<
		ApiResponse<{ tags: Array<{ name: string; confidence: number }> }>
	> {
		return apiClient.post(`/assets/${id}/generate-tags`);
	}

	async analyzeContent(id: string): Promise<
		ApiResponse<{
			objects: string[];
			colors: string[];
			text: string[];
			faces: number;
			mood: string[];
			style: string[];
			technicalAnalysis: Record<string, any>;
		}>
	> {
		return apiClient.post(`/assets/${id}/analyze`);
	}

	// Asset ratings and reviews
	async rateAsset(
		id: string,
		rating: number,
		review?: string,
	): Promise<ApiResponse<void>> {
		return apiClient.post(`/assets/${id}/rate`, { rating, review });
	}

	async getAssetRatings(id: string): Promise<
		ApiResponse<{
			averageRating: number;
			totalRatings: number;
			distribution: Record<string, number>;
			reviews: Array<{
				userId: string;
				userName: string;
				rating: number;
				review?: string;
				timestamp: string;
			}>;
		}>
	> {
		return apiClient.get(`/assets/${id}/ratings`);
	}

	// Asset collections management
	async addToCollection(
		assetId: string,
		collectionId: string,
	): Promise<ApiResponse<void>> {
		return apiClient.post(`/assets/${assetId}/collections/${collectionId}`);
	}

	async removeFromCollection(
		assetId: string,
		collectionId: string,
	): Promise<ApiResponse<void>> {
		return apiClient.delete(`/assets/${assetId}/collections/${collectionId}`);
	}

	// Asset sharing and permissions
	async shareAsset(
		id: string,
		options: {
			shareType: "public" | "private" | "organization";
			expiresAt?: string;
			password?: string;
			allowDownload?: boolean;
		},
	): Promise<ApiResponse<{ shareUrl: string; shareId: string }>> {
		return apiClient.post(`/assets/${id}/share`, options);
	}

	async getSharedAsset(
		shareId: string,
		password?: string,
	): Promise<ApiResponse<Asset>> {
		return apiClient.get(
			`/shared/assets/${shareId}`,
			password ? { password } : {},
		);
	}

	// Utility methods
	private buildFilterParams(filter: AssetFilter): Record<string, string> {
		const params: Record<string, string> = {};

		if (filter.search) params.search = filter.search;
		if (filter.type?.length) params.type = filter.type.join(",");
		if (filter.status?.length) params.status = filter.status.join(",");
		if (filter.tags?.length) params.tags = filter.tags.join(",");
		if (filter.collections?.length)
			params.collections = filter.collections.join(",");
		if (filter.createdBy?.length) params.createdBy = filter.createdBy.join(",");
		if (filter.dateRange) {
			params.startDate = filter.dateRange.start;
			params.endDate = filter.dateRange.end;
		}
		if (filter.sizeRange) {
			params.minSize = filter.sizeRange.min.toString();
			params.maxSize = filter.sizeRange.max.toString();
		}
		if (filter.rating) {
			params.minRating = filter.rating.min.toString();
			params.maxRating = filter.rating.max.toString();
		}

		return params;
	}
}

// Create and export service instance
export const assetService = new AssetService();
