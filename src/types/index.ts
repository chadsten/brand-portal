// Type definitions for the Brand Portal application

export interface User {
	id: string;
	name: string;
	email: string;
	role: string;
	avatar: string;
	permissions: string[];
	isActive: boolean;
	joinedAt: Date;
	lastActiveAt: Date;
}

export interface Asset {
	id: string;
	name: string;
	type: "image" | "video" | "document" | "audio";
	size: string;
	url: string;
	thumbnailUrl: string;
	uploadedBy: string;
	uploadedAt: Date;
	modifiedAt: Date;
	status: "approved" | "pending" | "rejected" | "archived";
	tags: string[];
	downloads: number;
	views: number;
	rating: number;
	description: string;
	metadata: {
		width?: number;
		height?: number;
		duration?: number;
		format: string;
		colorProfile?: string;
	};
	collections: string[];
	aiTags: string[];
	aiDescription: string;
}

export interface Collection {
	id: string;
	name: string;
	description: string;
	createdBy: string;
	createdAt: Date;
	modifiedAt: Date;
	assetCount: number;
	contributors: number;
	isPublic: boolean;
	tags: string[];
	thumbnailUrl: string;
	assets: string[];
	permissions: {
		canView: string[];
		canEdit: string[];
		canManage: string[];
	};
}

export interface Notification {
	id: string;
	type: "approval" | "info" | "success" | "warning" | "error";
	title: string;
	message: string;
	timestamp: Date;
	isRead: boolean;
	userId: string;
	actionUrl?: string;
}

export interface ActivityItem {
	id: string;
	user: string;
	action: string;
	target: string;
	timestamp: Date;
	avatar: string;
	type: "asset" | "collection" | "user" | "system";
}

export interface SearchFilters {
	type?: string;
	status?: string;
	uploadedBy?: string;
	dateRange?: {
		start: Date;
		end: Date;
	};
	tags?: string[];
	minRating?: number;
	sortBy?: "name" | "uploadedAt" | "downloads" | "rating" | "size";
	sortOrder?: "asc" | "desc";
}

export interface ApiResponse<T> {
	data: T;
	message?: string;
	error?: string;
	pagination?: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface DashboardStats {
	totalAssets: number;
	totalCollections: number;
	totalUsers: number;
	totalDownloads: number;
	storageUsed: number;
	storageTotal: string;
	monthlyGrowth?: {
		assets: number;
		downloads: number;
		users: number;
		storage: number;
	};
}

export interface AnalyticsData {
	overview: {
		totalAssets: number;
		totalDownloads: number;
		activeUsers: number;
		storageUsed: number;
		monthlyGrowth: {
			assets: { value: number; trend: "up" | "down" };
			downloads: { value: number; trend: "up" | "down" };
			users: { value: number; trend: "up" | "down" };
			storage: { value: number; trend: "up" | "down" };
		};
	};
	topAssets: Array<{
		id: string;
		name: string;
		type: string;
		downloads: number;
		views: number;
		rating: number;
		lastDownload: string;
	}>;
	assetTypeDistribution: Array<{
		type: string;
		count: number;
		percentage: number;
		color: string;
	}>;
}

export interface ThemeConfig {
	colors: {
		primary: string;
		secondary: string;
		success: string;
		warning: string;
		danger: string;
		background: string;
		foreground: string;
	};
	spacing: {
		unit: number;
		small: string;
		medium: string;
		large: string;
	};
	borderRadius: {
		small: string;
		medium: string;
		large: string;
	};
	fontSize: {
		tiny: string;
		small: string;
		medium: string;
		large: string;
	};
}

export interface AppState {
	user: User | null;
	assets: Asset[];
	collections: Collection[];
	notifications: Notification[];
	loading: {
		assets: boolean;
		collections: boolean;
		user: boolean;
	};
	error: string | null;
	filters: SearchFilters;
	ui: {
		sidebarOpen: boolean;
		theme: "light" | "dark" | "auto";
		viewMode: "grid" | "list";
	};
}

export type AppAction =
	| { type: "SET_USER"; payload: User | null }
	| { type: "SET_ASSETS"; payload: Asset[] }
	| { type: "ADD_ASSET"; payload: Asset }
	| { type: "UPDATE_ASSET"; payload: { id: string; updates: Partial<Asset> } }
	| { type: "DELETE_ASSET"; payload: string }
	| { type: "SET_COLLECTIONS"; payload: Collection[] }
	| { type: "ADD_COLLECTION"; payload: Collection }
	| {
			type: "UPDATE_COLLECTION";
			payload: { id: string; updates: Partial<Collection> };
	  }
	| { type: "DELETE_COLLECTION"; payload: string }
	| { type: "SET_NOTIFICATIONS"; payload: Notification[] }
	| { type: "MARK_NOTIFICATION_READ"; payload: string }
	| {
			type: "SET_LOADING";
			payload: { key: keyof AppState["loading"]; value: boolean };
	  }
	| { type: "SET_ERROR"; payload: string | null }
	| { type: "SET_FILTERS"; payload: Partial<SearchFilters> }
	| { type: "SET_UI"; payload: Partial<AppState["ui"]> }
	| { type: "RESET_STATE" };

// Form types
export interface AssetUploadForm {
	files: File[];
	description: string;
	tags: string[];
	collections: string[];
	isPublic: boolean;
}

export interface CollectionForm {
	name: string;
	description: string;
	tags: string[];
	isPublic: boolean;
	assets: string[];
}

export interface UserProfileForm {
	name: string;
	email: string;
	role: string;
	avatar?: File;
	bio: string;
	preferences: {
		notifications: boolean;
		darkMode: boolean;
		language: string;
	};
}

// API types
export interface PaginationParams {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface AssetFilters extends PaginationParams {
	type?: string;
	status?: string;
	uploadedBy?: string;
	tags?: string[];
	search?: string;
}

export interface CollectionFilters extends PaginationParams {
	createdBy?: string;
	isPublic?: boolean;
	search?: string;
}

// Component prop types
export interface AssetCardProps {
	asset: Asset;
	onSelect?: (asset: Asset) => void;
	onDownload?: (asset: Asset) => void;
	onEdit?: (asset: Asset) => void;
	onDelete?: (asset: Asset) => void;
	isSelected?: boolean;
	viewMode?: "grid" | "list";
}

export interface CollectionCardProps {
	collection: Collection;
	onSelect?: (collection: Collection) => void;
	onEdit?: (collection: Collection) => void;
	onDelete?: (collection: Collection) => void;
}

export interface SearchBarProps {
	value: string;
	onChange: (value: string) => void;
	onSearch: (query: string) => void;
	placeholder?: string;
	suggestions?: string[];
}

export interface FilterPanelProps {
	filters: SearchFilters;
	onChange: (filters: Partial<SearchFilters>) => void;
	availableTypes: string[];
	availableTags: string[];
	availableUsers: string[];
}

// Error types
export class AppError extends Error {
	constructor(
		message: string,
		public code: string,
		public statusCode: number = 500,
	) {
		super(message);
		this.name = "AppError";
	}
}

export class ValidationError extends AppError {
	constructor(
		message: string,
		public field?: string,
	) {
		super(message, "VALIDATION_ERROR", 400);
		this.name = "ValidationError";
	}
}

export class AuthenticationError extends AppError {
	constructor(message: string = "Authentication required") {
		super(message, "AUTH_ERROR", 401);
		this.name = "AuthenticationError";
	}
}

export class AuthorizationError extends AppError {
	constructor(message: string = "Insufficient permissions") {
		super(message, "AUTHZ_ERROR", 403);
		this.name = "AuthorizationError";
	}
}

export class NotFoundError extends AppError {
	constructor(resource: string = "Resource") {
		super(`${resource} not found`, "NOT_FOUND", 404);
		this.name = "NotFoundError";
	}
}

export class FileError extends AppError {
	constructor(message: string) {
		super(message, "FILE_ERROR", 400);
		this.name = "FileError";
	}
}

export class FileSizeError extends AppError {
	constructor(maxSize: string) {
		super(
			`File size exceeds maximum allowed size of ${maxSize}`,
			"FILE_SIZE_ERROR",
			400,
		);
		this.name = "FileSizeError";
	}
}

export class FileTypeError extends AppError {
	constructor(allowedTypes: string[]) {
		super(
			`File type not allowed. Allowed types: ${allowedTypes.join(", ")}`,
			"FILE_TYPE_ERROR",
			400,
		);
		this.name = "FileTypeError";
	}
}

export class NetworkError extends AppError {
	constructor(message: string = "Network error occurred") {
		super(message, "NETWORK_ERROR", 0);
		this.name = "NetworkError";
	}
}

export class RateLimitError extends AppError {
	constructor(retryAfter?: number) {
		super("Rate limit exceeded", "RATE_LIMIT", 429);
		this.name = "RateLimitError";
		if (retryAfter) {
			this.retryAfter = retryAfter;
		}
	}
	retryAfter?: number;
}

// Additional entities for comprehensive mock data
export interface Organization {
	id: string;
	name: string;
	description: string;
	logo: string;
	website?: string;
	industry: string;
	size: "startup" | "small" | "medium" | "enterprise";
	createdAt: Date;
	memberCount: number;
	adminUsers: string[];
	subscription: {
		plan: "free" | "basic" | "pro" | "enterprise";
		status: "active" | "trial" | "expired" | "cancelled";
		expiresAt?: Date;
	};
	settings: {
		allowPublicAssets: boolean;
		enforceApprovalWorkflow: boolean;
		maxStorageGB: number;
		brandingEnabled: boolean;
	};
}

export interface Gallery {
	id: string;
	name: string;
	description: string;
	type: "public" | "private" | "shared";
	coverImage: string;
	createdBy: string;
	createdAt: Date;
	modifiedAt: Date;
	assets: string[];
	assetCount: number;
	tags: string[];
	viewCount: number;
	likeCount: number;
	shareCount: number;
	organization: string;
	permissions: {
		canView: string[];
		canEdit: string[];
		canManage: string[];
	};
	layout: "grid" | "masonry" | "slideshow";
	sortOrder: "newest" | "oldest" | "name" | "popular";
}

export interface Project {
	id: string;
	name: string;
	description: string;
	status: "active" | "completed" | "on-hold" | "cancelled";
	priority: "low" | "medium" | "high" | "urgent";
	startDate: Date;
	endDate?: Date;
	dueDate?: Date;
	createdBy: string;
	assignedTo: string[];
	organization: string;
	assets: string[];
	collections: string[];
	galleries: string[];
	progress: number; // 0-100
	budget?: {
		total: number;
		spent: number;
		currency: string;
	};
	tags: string[];
	color: string;
}

export interface BrandGuideline {
	id: string;
	name: string;
	version: string;
	organization: string;
	createdBy: string;
	createdAt: Date;
	modifiedAt: Date;
	isActive: boolean;
	logo: {
		primary: string;
		variations: string[];
		usage: string;
		restrictions: string[];
	};
	colors: {
		primary: string[];
		secondary: string[];
		neutral: string[];
		usage: string;
	};
	typography: {
		primary: string;
		secondary: string;
		headings: string;
		body: string;
		usage: string;
	};
	spacing: {
		baseUnit: number;
		scale: number[];
		usage: string;
	};
	voice: {
		tone: string;
		personality: string[];
		doNots: string[];
	};
	assets: string[];
	downloadUrl: string;
}

export interface Comment {
	id: string;
	content: string;
	author: string;
	authorAvatar: string;
	createdAt: Date;
	modifiedAt?: Date;
	targetType: "asset" | "collection" | "gallery" | "project";
	targetId: string;
	parentId?: string; // for replies
	isEdited: boolean;
	reactions: {
		type: "like" | "love" | "approve" | "reject";
		count: number;
		userIds: string[];
	}[];
}

export interface Review {
	id: string;
	rating: number; // 1-5
	title?: string;
	content: string;
	author: string;
	authorAvatar: string;
	createdAt: Date;
	targetType: "asset" | "collection";
	targetId: string;
	isVerified: boolean;
	helpfulCount: number;
}

export interface ApprovalWorkflow {
	id: string;
	name: string;
	description: string;
	organization: string;
	isActive: boolean;
	steps: {
		id: string;
		name: string;
		type: "review" | "approve" | "notify";
		assignedTo: string[];
		required: boolean;
		order: number;
		conditions?: {
			assetType?: string[];
			fileSize?: { min?: number; max?: number };
			tags?: string[];
		};
	}[];
	createdBy: string;
	createdAt: Date;
	modifiedAt: Date;
}

export interface ApprovalRequest {
	id: string;
	workflowId: string;
	assetId: string;
	requestedBy: string;
	createdAt: Date;
	status: "pending" | "approved" | "rejected" | "cancelled";
	currentStep: number;
	steps: {
		stepId: string;
		status: "pending" | "approved" | "rejected" | "skipped";
		assignedTo: string;
		completedBy?: string;
		completedAt?: Date;
		comments?: string;
	}[];
	priority: "low" | "medium" | "high" | "urgent";
	dueDate?: Date;
}

export interface UsageAnalytics {
	id: string;
	assetId: string;
	userId: string;
	action: "view" | "download" | "share" | "edit" | "comment" | "like";
	timestamp: Date;
	metadata: {
		userAgent?: string;
		ipAddress?: string;
		referrer?: string;
		deviceType?: "desktop" | "tablet" | "mobile";
		location?: {
			country: string;
			city: string;
		};
	};
	sessionId: string;
}
