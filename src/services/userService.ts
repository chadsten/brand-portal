import { type ApiResponse, apiClient } from "./api";

// Types
export interface User {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	avatar?: string;
	role: "admin" | "editor" | "viewer" | "contributor";
	department?: string;
	title?: string;
	bio?: string;
	preferences: {
		theme: "light" | "dark" | "system";
		notifications: {
			email: boolean;
			push: boolean;
			digest: boolean;
		};
		dashboard: {
			layout: "grid" | "list";
			itemsPerPage: number;
			defaultView: "assets" | "collections" | "dashboard";
		};
		privacy: {
			profileVisible: boolean;
			activityVisible: boolean;
		};
	};
	permissions: string[];
	lastActiveAt: string;
	createdAt: string;
	updatedAt: string;
	status: "active" | "inactive" | "pending" | "suspended";
	stats: {
		assetsUploaded: number;
		collectionsCreated: number;
		downloadsCount: number;
		storageUsed: number;
	};
}

export interface UserCreate {
	email: string;
	firstName: string;
	lastName: string;
	role: User["role"];
	department?: string;
	title?: string;
	sendInvite?: boolean;
}

export interface UserUpdate {
	firstName?: string;
	lastName?: string;
	avatar?: string;
	role?: User["role"];
	department?: string;
	title?: string;
	bio?: string;
	preferences?: Partial<User["preferences"]>;
	status?: User["status"];
}

export interface UserFilter {
	search?: string;
	role?: string[];
	department?: string[];
	status?: string[];
	lastActiveRange?: {
		start: string;
		end: string;
	};
}

export interface AuthCredentials {
	email: string;
	password: string;
	rememberMe?: boolean;
}

export interface AuthResponse {
	user: User;
	token: string;
	refreshToken: string;
	expiresAt: string;
}

export interface PasswordReset {
	email: string;
	token?: string;
	newPassword?: string;
}

class UserService {
	// Authentication
	async login(
		credentials: AuthCredentials,
	): Promise<ApiResponse<AuthResponse>> {
		const response = await apiClient.post<AuthResponse>(
			"/auth/login",
			credentials,
		);

		if (response.success && response.data) {
			// Store auth token
			apiClient.setAuthToken(response.data.token, credentials.rememberMe);
		}

		return response;
	}

	async logout(): Promise<ApiResponse<void>> {
		const response = await apiClient.post<void>("/auth/logout");
		apiClient.clearAuthToken();
		return response;
	}

	async refreshToken(): Promise<ApiResponse<AuthResponse>> {
		return apiClient.post<AuthResponse>("/auth/refresh");
	}

	async getCurrentUser(): Promise<ApiResponse<User>> {
		return apiClient.get<User>("/auth/me");
	}

	// Password management
	async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
		return apiClient.post<void>("/auth/password-reset", { email });
	}

	async resetPassword(
		data: Required<PasswordReset>,
	): Promise<ApiResponse<void>> {
		return apiClient.post<void>("/auth/password-reset/confirm", data);
	}

	async changePassword(data: {
		currentPassword: string;
		newPassword: string;
	}): Promise<ApiResponse<void>> {
		return apiClient.post<void>("/auth/change-password", data);
	}

	// User management
	async getUsers(
		filter?: UserFilter,
		page = 1,
		limit = 20,
	): Promise<ApiResponse<User[]>> {
		const params = {
			page: page.toString(),
			limit: limit.toString(),
			...(filter?.search && { search: filter.search }),
			...(filter?.role?.length && { role: filter.role.join(",") }),
			...(filter?.department?.length && {
				department: filter.department.join(","),
			}),
			...(filter?.status?.length && { status: filter.status.join(",") }),
			...(filter?.lastActiveRange && {
				lastActiveStart: filter.lastActiveRange.start,
				lastActiveEnd: filter.lastActiveRange.end,
			}),
		};

		return apiClient.get<User[]>("/users", params);
	}

	async getUser(id: string): Promise<ApiResponse<User>> {
		return apiClient.get<User>(`/users/${id}`);
	}

	async createUser(data: UserCreate): Promise<ApiResponse<User>> {
		return apiClient.post<User>("/users", data);
	}

	async updateUser(
		id: string,
		updates: UserUpdate,
	): Promise<ApiResponse<User>> {
		return apiClient.patch<User>(`/users/${id}`, updates);
	}

	async deleteUser(id: string): Promise<ApiResponse<void>> {
		return apiClient.delete<void>(`/users/${id}`);
	}

	// Profile management
	async updateProfile(
		updates: Omit<UserUpdate, "role" | "status">,
	): Promise<ApiResponse<User>> {
		return apiClient.patch<User>("/profile", updates);
	}

	async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
		return apiClient.upload<{ avatarUrl: string }>("/profile/avatar", file);
	}

	async updatePreferences(
		preferences: Partial<User["preferences"]>,
	): Promise<ApiResponse<User>> {
		return apiClient.patch<User>("/profile/preferences", { preferences });
	}

	// User activity and analytics
	async getUserActivity(
		userId: string,
		timeRange?: { start: string; end: string },
		limit = 50,
	): Promise<
		ApiResponse<
			Array<{
				id: string;
				action: string;
				resourceType: string;
				resourceId: string;
				resourceName: string;
				metadata: Record<string, any>;
				timestamp: string;
			}>
		>
	> {
		const params = {
			limit: limit.toString(),
			...(timeRange && {
				startDate: timeRange.start,
				endDate: timeRange.end,
			}),
		};

		return apiClient.get(`/users/${userId}/activity`, params);
	}

	async getUserStats(userId: string): Promise<
		ApiResponse<{
			assetsUploaded: number;
			collectionsCreated: number;
			downloadsCount: number;
			storageUsed: number;
			recentActivity: Array<{
				action: string;
				resourceName: string;
				timestamp: string;
			}>;
			topTags: Array<{ tag: string; count: number }>;
			collaborations: number;
		}>
	> {
		return apiClient.get(`/users/${userId}/stats`);
	}

	// User permissions and roles
	async getUserPermissions(userId: string): Promise<
		ApiResponse<{
			role: string;
			permissions: string[];
			inheritedFrom: string[];
			customPermissions: string[];
		}>
	> {
		return apiClient.get(`/users/${userId}/permissions`);
	}

	async updateUserPermissions(
		userId: string,
		permissions: string[],
	): Promise<ApiResponse<User>> {
		return apiClient.patch<User>(`/users/${userId}/permissions`, {
			permissions,
		});
	}

	// Bulk operations
	async bulkUpdateUsers(
		userIds: string[],
		updates: UserUpdate,
	): Promise<ApiResponse<User[]>> {
		return apiClient.post<User[]>("/users/bulk-update", { userIds, updates });
	}

	async bulkDeleteUsers(userIds: string[]): Promise<ApiResponse<void>> {
		return apiClient.post<void>("/users/bulk-delete", { userIds });
	}

	async inviteUsers(
		invitations: Array<{
			email: string;
			role: User["role"];
			department?: string;
			message?: string;
		}>,
	): Promise<
		ApiResponse<{
			sent: number;
			failed: Array<{ email: string; error: string }>;
		}>
	> {
		return apiClient.post("/users/invite", { invitations });
	}

	// User search and discovery
	async searchUsers(
		query: string,
		filters?: {
			role?: string[];
			department?: string[];
			includeInactive?: boolean;
		},
	): Promise<ApiResponse<User[]>> {
		return apiClient.post<User[]>("/users/search", { query, ...filters });
	}

	// Team and collaboration
	async getUserTeams(userId: string): Promise<
		ApiResponse<
			Array<{
				id: string;
				name: string;
				description?: string;
				role: "member" | "lead" | "admin";
				memberCount: number;
			}>
		>
	> {
		return apiClient.get(`/users/${userId}/teams`);
	}

	async getUserCollaborators(
		userId: string,
		limit = 20,
	): Promise<
		ApiResponse<
			Array<{
				user: Pick<User, "id" | "firstName" | "lastName" | "avatar">;
				collaborationCount: number;
				lastCollaboration: string;
			}>
		>
	> {
		return apiClient.get(`/users/${userId}/collaborators`, {
			limit: limit.toString(),
		});
	}

	// Account management
	async deactivateAccount(
		userId: string,
		reason?: string,
	): Promise<ApiResponse<void>> {
		return apiClient.post<void>(`/users/${userId}/deactivate`, { reason });
	}

	async reactivateAccount(userId: string): Promise<ApiResponse<User>> {
		return apiClient.post<User>(`/users/${userId}/reactivate`);
	}

	async exportUserData(userId: string): Promise<
		ApiResponse<{
			downloadUrl: string;
			expiresAt: string;
			includesPersonalData: boolean;
		}>
	> {
		return apiClient.post(`/users/${userId}/export`);
	}

	// Session management
	async getActiveSessions(): Promise<
		ApiResponse<
			Array<{
				id: string;
				deviceInfo: string;
				ipAddress: string;
				lastActive: string;
				isCurrent: boolean;
				location?: string;
			}>
		>
	> {
		return apiClient.get("/auth/sessions");
	}

	async revokeSession(sessionId: string): Promise<ApiResponse<void>> {
		return apiClient.delete(`/auth/sessions/${sessionId}`);
	}

	async revokeAllSessions(): Promise<ApiResponse<void>> {
		return apiClient.post<void>("/auth/sessions/revoke-all");
	}
}

// Create and export service instance
export const userService = new UserService();
