import { type ApiResponse, apiClient } from "./api";

// Types
export interface Collection {
	id: string;
	name: string;
	description?: string;
	type: "folder" | "smart" | "shared";
	visibility: "public" | "private" | "organization";
	thumbnail?: string;
	assetIds: string[];
	tags: string[];
	metadata: Record<string, any>;
	createdAt: string;
	updatedAt: string;
	createdBy: string;
	sharedWith: Array<{
		userId: string;
		userName: string;
		permission: "view" | "edit" | "admin";
	}>;
	stats: {
		assetCount: number;
		totalSize: number;
		lastActivity: string;
	};
	rules?: {
		autoAdd: boolean;
		criteria: {
			tags?: string[];
			types?: string[];
			creators?: string[];
			dateRange?: { start: string; end: string };
		};
	};
}

export interface CollectionCreate {
	name: string;
	description?: string;
	type: "folder" | "smart" | "shared";
	visibility: "public" | "private" | "organization";
	tags?: string[];
	metadata?: Record<string, any>;
	rules?: Collection["rules"];
}

export interface CollectionFilter {
	search?: string;
	type?: string[];
	visibility?: string[];
	tags?: string[];
	createdBy?: string[];
	dateRange?: {
		start: string;
		end: string;
	};
	hasAssets?: boolean;
	sharedWithMe?: boolean;
}

export interface CollectionSort {
	field: "name" | "createdAt" | "updatedAt" | "assetCount" | "lastActivity";
	direction: "asc" | "desc";
}

class CollectionService {
	// Get all collections with filtering, sorting, and pagination
	async getCollections(
		filter?: CollectionFilter,
		sort?: CollectionSort,
		page = 1,
		limit = 20,
	): Promise<ApiResponse<Collection[]>> {
		const params = {
			page: page.toString(),
			limit: limit.toString(),
			...(filter?.search && { search: filter.search }),
			...(filter?.type?.length && { type: filter.type.join(",") }),
			...(filter?.visibility?.length && {
				visibility: filter.visibility.join(","),
			}),
			...(filter?.tags?.length && { tags: filter.tags.join(",") }),
			...(filter?.createdBy?.length && {
				createdBy: filter.createdBy.join(","),
			}),
			...(filter?.dateRange && {
				startDate: filter.dateRange.start,
				endDate: filter.dateRange.end,
			}),
			...(filter?.hasAssets !== undefined && {
				hasAssets: filter.hasAssets.toString(),
			}),
			...(filter?.sharedWithMe !== undefined && {
				sharedWithMe: filter.sharedWithMe.toString(),
			}),
			...(sort && {
				sortField: sort.field,
				sortDirection: sort.direction,
			}),
		};

		return apiClient.get<Collection[]>("/collections", params);
	}

	// Get collection by ID
	async getCollection(id: string): Promise<ApiResponse<Collection>> {
		return apiClient.get<Collection>(`/collections/${id}`);
	}

	// Create new collection
	async createCollection(
		data: CollectionCreate,
	): Promise<ApiResponse<Collection>> {
		return apiClient.post<Collection>("/collections", data);
	}

	// Update collection
	async updateCollection(
		id: string,
		updates: Partial<Collection>,
	): Promise<ApiResponse<Collection>> {
		return apiClient.patch<Collection>(`/collections/${id}`, updates);
	}

	// Delete collection
	async deleteCollection(id: string): Promise<ApiResponse<void>> {
		return apiClient.delete<void>(`/collections/${id}`);
	}

	// Collection asset management
	async addAssetsToCollection(
		collectionId: string,
		assetIds: string[],
	): Promise<ApiResponse<Collection>> {
		return apiClient.post<Collection>(`/collections/${collectionId}/assets`, {
			assetIds,
		});
	}

	async removeAssetsFromCollection(
		collectionId: string,
		assetIds: string[],
	): Promise<ApiResponse<Collection>> {
		return apiClient.post<Collection>(
			`/collections/${collectionId}/assets/remove`,
			{ assetIds },
		);
	}

	async getCollectionAssets(
		collectionId: string,
		page = 1,
		limit = 20,
	): Promise<ApiResponse<any[]>> {
		return apiClient.get(`/collections/${collectionId}/assets`, {
			page: page.toString(),
			limit: limit.toString(),
		});
	}

	// Collection sharing and permissions
	async shareCollection(
		collectionId: string,
		users: Array<{
			userId: string;
			permission: "view" | "edit" | "admin";
		}>,
	): Promise<ApiResponse<Collection>> {
		return apiClient.post<Collection>(`/collections/${collectionId}/share`, {
			users,
		});
	}

	async updateCollectionPermission(
		collectionId: string,
		userId: string,
		permission: "view" | "edit" | "admin",
	): Promise<ApiResponse<Collection>> {
		return apiClient.patch<Collection>(
			`/collections/${collectionId}/permissions/${userId}`,
			{ permission },
		);
	}

	async removeCollectionAccess(
		collectionId: string,
		userId: string,
	): Promise<ApiResponse<Collection>> {
		return apiClient.delete<Collection>(
			`/collections/${collectionId}/permissions/${userId}`,
		);
	}

	// Collection statistics and analytics
	async getCollectionStats(id: string): Promise<
		ApiResponse<{
			assetCount: number;
			totalSize: number;
			typeDistribution: Record<string, number>;
			recentActivity: Array<{
				action: string;
				assetId: string;
				assetName: string;
				userId: string;
				userName: string;
				timestamp: string;
			}>;
			usage: {
				views: number;
				downloads: number;
				shares: number;
			};
		}>
	> {
		return apiClient.get(`/collections/${id}/stats`);
	}

	// Smart collection rules
	async updateCollectionRules(
		collectionId: string,
		rules: Collection["rules"],
	): Promise<ApiResponse<Collection>> {
		return apiClient.patch<Collection>(`/collections/${collectionId}/rules`, {
			rules,
		});
	}

	async executeSmartCollectionRules(collectionId: string): Promise<
		ApiResponse<{
			addedAssets: string[];
			removedAssets: string[];
			totalMatched: number;
		}>
	> {
		return apiClient.post(`/collections/${collectionId}/execute-rules`);
	}

	// Bulk operations
	async bulkUpdateCollections(
		collectionIds: string[],
		updates: Partial<Collection>,
	): Promise<ApiResponse<Collection[]>> {
		return apiClient.post<Collection[]>("/collections/bulk-update", {
			collectionIds,
			updates,
		});
	}

	async bulkDeleteCollections(
		collectionIds: string[],
	): Promise<ApiResponse<void>> {
		return apiClient.post<void>("/collections/bulk-delete", { collectionIds });
	}

	// Collection export/import
	async exportCollection(
		id: string,
		format: "json" | "csv" | "zip",
	): Promise<
		ApiResponse<{
			downloadUrl: string;
			expiresAt: string;
		}>
	> {
		return apiClient.post(`/collections/${id}/export`, { format });
	}

	async importCollection(
		file: File,
		options?: {
			mergeStrategy: "replace" | "merge" | "skip";
			preserveIds: boolean;
		},
	): Promise<
		ApiResponse<{
			collectionId: string;
			importedAssets: number;
			skippedAssets: number;
			errors: string[];
		}>
	> {
		return apiClient.upload("/collections/import", file, options);
	}

	// Collection templates
	async getCollectionTemplates(): Promise<
		ApiResponse<
			Array<{
				id: string;
				name: string;
				description: string;
				category: string;
				rules: Collection["rules"];
			}>
		>
	> {
		return apiClient.get("/collections/templates");
	}

	async createCollectionFromTemplate(
		templateId: string,
		data: Pick<CollectionCreate, "name" | "description" | "visibility">,
	): Promise<ApiResponse<Collection>> {
		return apiClient.post<Collection>(
			`/collections/templates/${templateId}/create`,
			data,
		);
	}

	// Collection collaboration
	async getCollectionActivity(
		id: string,
		limit = 50,
	): Promise<
		ApiResponse<
			Array<{
				id: string;
				action: string;
				userId: string;
				userName: string;
				details: Record<string, any>;
				timestamp: string;
			}>
		>
	> {
		return apiClient.get(`/collections/${id}/activity`, {
			limit: limit.toString(),
		});
	}

	async addCollectionComment(
		id: string,
		comment: string,
	): Promise<
		ApiResponse<{
			id: string;
			comment: string;
			userId: string;
			userName: string;
			timestamp: string;
		}>
	> {
		return apiClient.post(`/collections/${id}/comments`, { comment });
	}

	async getCollectionComments(id: string): Promise<
		ApiResponse<
			Array<{
				id: string;
				comment: string;
				userId: string;
				userName: string;
				timestamp: string;
			}>
		>
	> {
		return apiClient.get(`/collections/${id}/comments`);
	}
}

// Create and export service instance
export const collectionService = new CollectionService();
