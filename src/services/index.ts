// Export all services and their types for easy importing

export type {
	AnalyticsTimeRange,
	AssetAnalytics,
	CollectionAnalytics,
	CustomReport,
	SecurityAnalytics,
	UsageAnalytics,
	UserAnalytics,
} from "./analyticsService";
export { analyticsService } from "./analyticsService";
export type { ApiConfig, ApiResponse } from "./api";
export { ApiError, apiClient } from "./api";
export type {
	Asset,
	AssetAnalytics as AssetServiceAnalytics,
	AssetFilter,
	AssetSort,
	AssetUpload,
} from "./assetService";
export { assetService } from "./assetService";
export type {
	Collection,
	CollectionCreate,
	CollectionFilter,
	CollectionSort,
} from "./collectionService";
export { collectionService } from "./collectionService";
export type {
	Notification,
	NotificationCreate,
	NotificationFilter,
	NotificationPreferences,
	NotificationTemplate,
} from "./notificationService";
export { notificationService } from "./notificationService";
export type {
	AuthCredentials,
	AuthResponse,
	PasswordReset,
	User,
	UserCreate,
	UserFilter,
	UserUpdate,
} from "./userService";
export { userService } from "./userService";
