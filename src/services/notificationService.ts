import { type ApiResponse, apiClient } from "./api";

// Types
export interface Notification {
	id: string;
	type: "info" | "success" | "warning" | "error" | "system";
	category:
		| "asset"
		| "collection"
		| "user"
		| "system"
		| "workflow"
		| "approval";
	title: string;
	message: string;
	metadata?: Record<string, any>;
	actionUrl?: string;
	actionText?: string;
	priority: "low" | "medium" | "high" | "urgent";
	isRead: boolean;
	userId: string;
	createdAt: string;
	readAt?: string;
	expiresAt?: string;
	channels: Array<"in-app" | "email" | "push" | "sms">;
	relatedResource?: {
		type: "asset" | "collection" | "user" | "workflow";
		id: string;
		name: string;
	};
}

export interface NotificationCreate {
	type: Notification["type"];
	category: Notification["category"];
	title: string;
	message: string;
	metadata?: Record<string, any>;
	actionUrl?: string;
	actionText?: string;
	priority?: Notification["priority"];
	channels?: Notification["channels"];
	recipients: string[] | "all" | "admins" | "editors";
	expiresAt?: string;
	relatedResource?: Notification["relatedResource"];
}

export interface NotificationFilter {
	type?: string[];
	category?: string[];
	priority?: string[];
	isRead?: boolean;
	dateRange?: {
		start: string;
		end: string;
	};
	channels?: string[];
}

export interface NotificationPreferences {
	userId: string;
	channels: {
		"in-app": {
			enabled: boolean;
			categories: string[];
		};
		email: {
			enabled: boolean;
			categories: string[];
			frequency: "immediate" | "hourly" | "daily" | "weekly";
			digestEnabled: boolean;
		};
		push: {
			enabled: boolean;
			categories: string[];
			quietHours: {
				enabled: boolean;
				start: string; // "22:00"
				end: string; // "08:00"
			};
		};
		sms: {
			enabled: boolean;
			categories: string[];
			phoneNumber?: string;
		};
	};
	doNotDisturb: {
		enabled: boolean;
		start?: string;
		end?: string;
		days?: string[];
	};
}

export interface NotificationTemplate {
	id: string;
	name: string;
	type: Notification["type"];
	category: Notification["category"];
	title: string;
	message: string;
	variables: Array<{
		name: string;
		type: "string" | "number" | "date" | "url";
		required: boolean;
		description: string;
	}>;
	defaultChannels: Notification["channels"];
	isActive: boolean;
}

class NotificationService {
	// Get user notifications
	async getNotifications(
		filter?: NotificationFilter,
		page = 1,
		limit = 20,
	): Promise<ApiResponse<Notification[]>> {
		const params = {
			page: page.toString(),
			limit: limit.toString(),
			...(filter?.type?.length && { type: filter.type.join(",") }),
			...(filter?.category?.length && { category: filter.category.join(",") }),
			...(filter?.priority?.length && { priority: filter.priority.join(",") }),
			...(filter?.isRead !== undefined && { isRead: filter.isRead.toString() }),
			...(filter?.dateRange && {
				startDate: filter.dateRange.start,
				endDate: filter.dateRange.end,
			}),
			...(filter?.channels?.length && { channels: filter.channels.join(",") }),
		};

		return apiClient.get<Notification[]>("/notifications", params);
	}

	// Get notification by ID
	async getNotification(id: string): Promise<ApiResponse<Notification>> {
		return apiClient.get<Notification>(`/notifications/${id}`);
	}

	// Mark notifications as read
	async markAsRead(notificationIds: string[]): Promise<ApiResponse<void>> {
		return apiClient.patch<void>("/notifications/mark-read", {
			notificationIds,
		});
	}

	async markAllAsRead(): Promise<ApiResponse<void>> {
		return apiClient.patch<void>("/notifications/mark-all-read");
	}

	// Delete notifications
	async deleteNotifications(
		notificationIds: string[],
	): Promise<ApiResponse<void>> {
		return apiClient.post<void>("/notifications/delete", { notificationIds });
	}

	async deleteAllRead(): Promise<ApiResponse<void>> {
		return apiClient.delete<void>("/notifications/read");
	}

	// Get notification counts
	async getNotificationCounts(): Promise<
		ApiResponse<{
			total: number;
			unread: number;
			byCategory: Record<string, { total: number; unread: number }>;
			byPriority: Record<string, { total: number; unread: number }>;
		}>
	> {
		return apiClient.get("/notifications/counts");
	}

	// Create notification (admin/system use)
	async createNotification(data: NotificationCreate): Promise<
		ApiResponse<{
			id: string;
			recipientCount: number;
			deliveryStatus: Record<string, number>;
		}>
	> {
		return apiClient.post("/notifications", data);
	}

	// Notification preferences
	async getNotificationPreferences(): Promise<
		ApiResponse<NotificationPreferences>
	> {
		return apiClient.get<NotificationPreferences>("/notifications/preferences");
	}

	async updateNotificationPreferences(
		preferences: Partial<NotificationPreferences>,
	): Promise<ApiResponse<NotificationPreferences>> {
		return apiClient.patch<NotificationPreferences>(
			"/notifications/preferences",
			preferences,
		);
	}

	// Real-time notifications (WebSocket)
	async subscribeToNotifications(
		callback: (notification: Notification) => void,
	): Promise<WebSocket | null> {
		if (typeof window === "undefined") return null;

		const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
		const ws = new WebSocket(`${wsUrl}/notifications`);

		ws.onmessage = (event) => {
			try {
				const notification = JSON.parse(event.data);
				callback(notification);
			} catch (error) {
				console.error("Failed to parse notification:", error);
			}
		};

		ws.onerror = (error) => {
			console.error("WebSocket error:", error);
		};

		return ws;
	}

	// Push notification registration
	async registerPushSubscription(
		subscription: PushSubscription,
	): Promise<ApiResponse<void>> {
		return apiClient.post<void>("/notifications/push/subscribe", {
			subscription: JSON.stringify(subscription),
		});
	}

	async unregisterPushSubscription(): Promise<ApiResponse<void>> {
		return apiClient.post<void>("/notifications/push/unsubscribe");
	}

	// Email notification management
	async unsubscribeFromEmail(token: string): Promise<ApiResponse<void>> {
		return apiClient.post<void>("/notifications/email/unsubscribe", { token });
	}

	async getEmailDigest(frequency: "daily" | "weekly"): Promise<
		ApiResponse<{
			notifications: Notification[];
			summary: {
				totalNotifications: number;
				highPriorityCount: number;
				categoryCounts: Record<string, number>;
			};
			period: {
				start: string;
				end: string;
			};
		}>
	> {
		return apiClient.get(`/notifications/email/digest/${frequency}`);
	}

	// Notification templates (admin use)
	async getNotificationTemplates(): Promise<
		ApiResponse<NotificationTemplate[]>
	> {
		return apiClient.get<NotificationTemplate[]>("/notifications/templates");
	}

	async getNotificationTemplate(
		id: string,
	): Promise<ApiResponse<NotificationTemplate>> {
		return apiClient.get<NotificationTemplate>(
			`/notifications/templates/${id}`,
		);
	}

	async createNotificationTemplate(
		template: Omit<NotificationTemplate, "id">,
	): Promise<ApiResponse<NotificationTemplate>> {
		return apiClient.post<NotificationTemplate>(
			"/notifications/templates",
			template,
		);
	}

	async updateNotificationTemplate(
		id: string,
		updates: Partial<NotificationTemplate>,
	): Promise<ApiResponse<NotificationTemplate>> {
		return apiClient.patch<NotificationTemplate>(
			`/notifications/templates/${id}`,
			updates,
		);
	}

	async deleteNotificationTemplate(id: string): Promise<ApiResponse<void>> {
		return apiClient.delete<void>(`/notifications/templates/${id}`);
	}

	// Send notification from template
	async sendFromTemplate(
		templateId: string,
		data: {
			recipients: string[] | "all" | "admins" | "editors";
			variables: Record<string, any>;
			channels?: Notification["channels"];
			priority?: Notification["priority"];
		},
	): Promise<
		ApiResponse<{
			id: string;
			recipientCount: number;
			deliveryStatus: Record<string, number>;
		}>
	> {
		return apiClient.post(`/notifications/templates/${templateId}/send`, data);
	}

	// Notification analytics
	async getNotificationAnalytics(timeRange?: {
		start: string;
		end: string;
	}): Promise<
		ApiResponse<{
			totalSent: number;
			deliveryRates: Record<string, number>;
			readRates: Record<string, number>;
			categoryBreakdown: Record<string, number>;
			channelPerformance: Record<
				string,
				{
					sent: number;
					delivered: number;
					opened: number;
					clicked: number;
				}
			>;
			userEngagement: {
				activeUsers: number;
				averageReadTime: number;
				mostEngagedHours: number[];
			};
		}>
	> {
		const params = timeRange
			? {
					startDate: timeRange.start,
					endDate: timeRange.end,
				}
			: {};

		return apiClient.get("/notifications/analytics", params);
	}

	// Batch operations
	async bulkUpdateNotifications(
		notificationIds: string[],
		updates: { isRead?: boolean; priority?: Notification["priority"] },
	): Promise<ApiResponse<void>> {
		return apiClient.patch<void>("/notifications/bulk-update", {
			notificationIds,
			updates,
		});
	}

	// Notification rules and automation
	async getNotificationRules(): Promise<
		ApiResponse<
			Array<{
				id: string;
				name: string;
				description: string;
				trigger: {
					event: string;
					conditions: Record<string, any>;
				};
				action: {
					templateId: string;
					recipients: string;
					variables: Record<string, string>;
				};
				isActive: boolean;
			}>
		>
	> {
		return apiClient.get("/notifications/rules");
	}

	async createNotificationRule(rule: {
		name: string;
		description: string;
		trigger: {
			event: string;
			conditions: Record<string, any>;
		};
		action: {
			templateId: string;
			recipients: string;
			variables: Record<string, string>;
		};
	}): Promise<ApiResponse<{ id: string }>> {
		return apiClient.post("/notifications/rules", rule);
	}

	// Test notifications
	async sendTestNotification(data: {
		type: Notification["type"];
		title: string;
		message: string;
		channels: Notification["channels"];
	}): Promise<ApiResponse<void>> {
		return apiClient.post<void>("/notifications/test", data);
	}
}

// Create and export service instance
export const notificationService = new NotificationService();
