"use client";

// Import removed - using native HTML and DaisyUI classes
import { useModal } from "~/hooks/useModal";
import { useDropdown } from "~/hooks/useDropdown";
import {
	Activity,
	AlertCircle,
	Archive,
	Bell,
	BellOff,
	Calendar,
	Check,
	CheckCircle,
	Clock,
	Download,
	ExternalLink,
	Eye,
	EyeOff,
	FileText,
	Filter,
	Forward,
	Heart,
	Info,
	Mail,
	MessageSquare,
	MoreVertical,
	Pin,
	Search,
	Settings,
	Share2,
	Shield,
	Star,
	Tag,
	Target,
	Trash2,
	TrendingUp,
	Upload,
	Users,
	Workflow,
	X,
	XCircle,
	Zap,
} from "lucide-react";
import { useState } from "react";

interface NotificationItem {
	id: string;
	type: "info" | "success" | "warning" | "error";
	category:
		| "asset"
		| "workflow"
		| "approval"
		| "system"
		| "collaboration"
		| "security";
	title: string;
	message: string;
	timestamp: Date;
	read: boolean;
	pinned: boolean;
	archived: boolean;
	actions?: {
		label: string;
		action: string;
		variant?: "primary" | "secondary" | "danger";
	}[];
	metadata?: {
		assetId?: string;
		workflowId?: string;
		userId?: string;
		url?: string;
		priority?: "low" | "medium" | "high" | "urgent";
	};
	sender?: {
		id: string;
		name: string;
		avatar?: string;
		role?: string;
	};
}

interface NotificationSettings {
	emailNotifications: boolean;
	pushNotifications: boolean;
	inAppNotifications: boolean;
	categories: {
		asset: boolean;
		workflow: boolean;
		approval: boolean;
		system: boolean;
		collaboration: boolean;
		security: boolean;
	};
	frequency: "immediate" | "hourly" | "daily" | "weekly";
	quietHours: {
		enabled: boolean;
		start: string;
		end: string;
	};
}

interface NotificationCenterProps {
	notifications?: NotificationItem[];
	settings?: NotificationSettings;
	onMarkAsRead?: (notificationId: string) => void;
	onMarkAllAsRead?: () => void;
	onDeleteNotification?: (notificationId: string) => void;
	onArchiveNotification?: (notificationId: string) => void;
	onPinNotification?: (notificationId: string) => void;
	onUpdateSettings?: (settings: NotificationSettings) => void;
	onPerformAction?: (notificationId: string, action: string) => void;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
	{
		id: "1",
		type: "info",
		category: "asset",
		title: "New Asset Uploaded",
		message: "Sarah Chen uploaded a new brand logo asset",
		timestamp: new Date(Date.now() - 5 * 60 * 1000),
		read: false,
		pinned: false,
		archived: false,
		actions: [
			{ label: "View Asset", action: "view_asset", variant: "primary" },
			{ label: "Review", action: "review_asset", variant: "secondary" },
		],
		metadata: {
			assetId: "asset-123",
			userId: "user-1",
			priority: "medium",
		},
		sender: {
			id: "1",
			name: "Sarah Chen",
			avatar: "/avatars/sarah.jpg",
			role: "Marketing Manager",
		},
	},
	{
		id: "2",
		type: "success",
		category: "workflow",
		title: "Workflow Completed",
		message: "Auto Brand Compliance Check completed successfully",
		timestamp: new Date(Date.now() - 15 * 60 * 1000),
		read: false,
		pinned: true,
		archived: false,
		actions: [
			{ label: "View Results", action: "view_results", variant: "primary" },
		],
		metadata: {
			workflowId: "workflow-1",
			priority: "high",
		},
	},
	{
		id: "3",
		type: "warning",
		category: "approval",
		title: "Approval Required",
		message:
			"Marketing video requires manual review due to low compliance score",
		timestamp: new Date(Date.now() - 30 * 60 * 1000),
		read: false,
		pinned: false,
		archived: false,
		actions: [
			{ label: "Approve", action: "approve", variant: "primary" },
			{ label: "Reject", action: "reject", variant: "danger" },
			{ label: "View Details", action: "view_details", variant: "secondary" },
		],
		metadata: {
			assetId: "asset-456",
			priority: "urgent",
		},
		sender: {
			id: "system",
			name: "System",
			role: "Automated",
		},
	},
	{
		id: "4",
		type: "error",
		category: "system",
		title: "Backup Failed",
		message: "Weekly asset backup failed due to storage limit exceeded",
		timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
		read: true,
		pinned: false,
		archived: false,
		actions: [
			{ label: "Retry Backup", action: "retry_backup", variant: "primary" },
			{ label: "Check Storage", action: "check_storage", variant: "secondary" },
		],
		metadata: {
			priority: "high",
		},
	},
	{
		id: "5",
		type: "info",
		category: "collaboration",
		title: "Comment Added",
		message: "Mike Johnson commented on your asset collection",
		timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
		read: true,
		pinned: false,
		archived: false,
		actions: [
			{ label: "Reply", action: "reply", variant: "primary" },
			{
				label: "View Collection",
				action: "view_collection",
				variant: "secondary",
			},
		],
		metadata: {
			userId: "user-2",
			priority: "low",
		},
		sender: {
			id: "2",
			name: "Mike Johnson",
			avatar: "/avatars/mike.jpg",
			role: "Creative Director",
		},
	},
	{
		id: "6",
		type: "warning",
		category: "security",
		title: "Unusual Activity Detected",
		message: "Multiple failed login attempts from unknown device",
		timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
		read: false,
		pinned: false,
		archived: false,
		actions: [
			{ label: "Secure Account", action: "secure_account", variant: "primary" },
			{ label: "View Details", action: "view_security", variant: "secondary" },
		],
		metadata: {
			priority: "urgent",
		},
	},
];

const DEFAULT_SETTINGS: NotificationSettings = {
	emailNotifications: true,
	pushNotifications: true,
	inAppNotifications: true,
	categories: {
		asset: true,
		workflow: true,
		approval: true,
		system: true,
		collaboration: true,
		security: true,
	},
	frequency: "immediate",
	quietHours: {
		enabled: false,
		start: "22:00",
		end: "08:00",
	},
};

const NOTIFICATION_TYPES = [
	{ value: "info", label: "Info", icon: <Info size={16} />, color: "primary" },
	{
		value: "success",
		label: "Success",
		icon: <CheckCircle size={16} />,
		color: "success",
	},
	{
		value: "warning",
		label: "Warning",
		icon: <AlertCircle size={16} />,
		color: "warning",
	},
	{
		value: "error",
		label: "Error",
		icon: <XCircle size={16} />,
		color: "danger",
	},
];

const NOTIFICATION_CATEGORIES = [
	{
		value: "asset",
		label: "Assets",
		icon: <FileText size={16} />,
		color: "primary",
	},
	{
		value: "workflow",
		label: "Workflows",
		icon: <Workflow size={16} />,
		color: "secondary",
	},
	{
		value: "approval",
		label: "Approvals",
		icon: <Shield size={16} />,
		color: "success",
	},
	{
		value: "system",
		label: "System",
		icon: <Settings size={16} />,
		color: "warning",
	},
	{
		value: "collaboration",
		label: "Collaboration",
		icon: <Users size={16} />,
		color: "danger",
	},
	{
		value: "security",
		label: "Security",
		icon: <Shield size={16} />,
		color: "default",
	},
];

export function NotificationCenter({
	notifications = MOCK_NOTIFICATIONS,
	settings = DEFAULT_SETTINGS,
	onMarkAsRead,
	onMarkAllAsRead,
	onDeleteNotification,
	onArchiveNotification,
	onPinNotification,
	onUpdateSettings,
	onPerformAction,
}: NotificationCenterProps) {
	const [selectedTab, setSelectedTab] = useState("all");
	const [filterType, setFilterType] = useState("all");
	const [filterCategory, setFilterCategory] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedNotification, setSelectedNotification] =
		useState<NotificationItem | null>(null);
	const [notificationSettings, setNotificationSettings] =
		useState<NotificationSettings>(settings);

	const {
		isOpen: isDetailModalOpen,
		onOpen: onDetailModalOpen,
		onClose: onDetailModalClose,
	} = useModal();

	const {
		isOpen: isSettingsModalOpen,
		onOpen: onSettingsModalOpen,
		onClose: onSettingsModalClose,
	} = useModal();

	const getFilteredNotifications = () => {
		let filtered = notifications;

		// Filter by tab
		if (selectedTab === "unread") {
			filtered = filtered.filter((n) => !n.read);
		} else if (selectedTab === "pinned") {
			filtered = filtered.filter((n) => n.pinned);
		} else if (selectedTab === "archived") {
			filtered = filtered.filter((n) => n.archived);
		} else {
			filtered = filtered.filter((n) => !n.archived);
		}

		// Filter by type
		if (filterType !== "all") {
			filtered = filtered.filter((n) => n.type === filterType);
		}

		// Filter by category
		if (filterCategory !== "all") {
			filtered = filtered.filter((n) => n.category === filterCategory);
		}

		// Filter by search
		if (searchQuery) {
			filtered = filtered.filter(
				(n) =>
					n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					n.message.toLowerCase().includes(searchQuery.toLowerCase()),
			);
		}

		return filtered.sort((a, b) => {
			// Pinned notifications first
			if (a.pinned && !b.pinned) return -1;
			if (!a.pinned && b.pinned) return 1;

			// Then by timestamp (newest first)
			return b.timestamp.getTime() - a.timestamp.getTime();
		});
	};

	const getNotificationIcon = (notification: NotificationItem) => {
		const typeConfig = NOTIFICATION_TYPES.find(
			(t) => t.value === notification.type,
		);
		const categoryConfig = NOTIFICATION_CATEGORIES.find(
			(c) => c.value === notification.category,
		);

		return categoryConfig?.icon || typeConfig?.icon || <Bell size={16} />;
	};

	const getNotificationColor = (
		notification: NotificationItem,
	): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
		const typeConfig = NOTIFICATION_TYPES.find(
			(t) => t.value === notification.type,
		);
		return (
			(typeConfig?.color as
				| "default"
				| "primary"
				| "secondary"
				| "success"
				| "warning"
				| "danger") || "default"
		);
	};

	const getPriorityColor = (priority?: string) => {
		switch (priority) {
			case "urgent":
				return "danger";
			case "high":
				return "warning";
			case "medium":
				return "primary";
			case "low":
				return "default";
			default:
				return "default";
		}
	};

	const formatTimeAgo = (date: Date) => {
		const now = Date.now();
		const diffMs = now - date.getTime();
		const diffMinutes = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffMinutes < 1) return "Just now";
		if (diffMinutes < 60) return `${diffMinutes}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	};

	const handleNotificationClick = (notification: NotificationItem) => {
		if (!notification.read) {
			onMarkAsRead?.(notification.id);
		}
		setSelectedNotification(notification);
		onDetailModalOpen();
	};

	const handleUpdateSettings = () => {
		onUpdateSettings?.(notificationSettings);
		onSettingsModalClose();
	};

	const unreadCount = notifications.filter(
		(n) => !n.read && !n.archived,
	).length;
	const filteredNotifications = getFilteredNotifications();

	const renderNotificationItem = (notification: NotificationItem) => (
		<div
			key={notification.id}
			className={`card bg-base-100 shadow cursor-pointer transition-all hover:shadow-md group ${
				!notification.read ? "ring-1 ring-primary/20" : ""
			}`}
			onClick={() => handleNotificationClick(notification)}
		>
			<div className="card-body p-4">
				<div className="flex items-start gap-3">
					{/* Icon */}
					<div
						className={`rounded-lg p-2 ${
							!notification.read ? "bg-primary/10" : "bg-base-200"
						}`}
					>
						{getNotificationIcon(notification)}
					</div>

					{/* Content */}
					<div className="min-w-0 flex-1">
						<div className="mb-2 flex items-start justify-between">
							<div className="flex items-center gap-2">
								<h4
									className={`font-medium ${
										!notification.read ? "text-base-content" : "text-base-content/70"
									}`}
								>
									{notification.title}
								</h4>
								{notification.pinned && (
									<Pin size={14} className="text-warning" />
								)}
								{notification.metadata?.priority && (
									<span className={`badge badge-sm ${
										getPriorityColor(notification.metadata.priority) === 'danger' ? 'badge-error' :
										getPriorityColor(notification.metadata.priority) === 'warning' ? 'badge-warning' :
										getPriorityColor(notification.metadata.priority) === 'primary' ? 'badge-primary' :
										'badge-neutral'
									}`}>
										{notification.metadata.priority}
									</span>
								)}
							</div>
							<div className="flex items-center gap-2">
								<span className="text-base-content/60 text-sm">
									{formatTimeAgo(notification.timestamp)}
								</span>
								<div className="dropdown dropdown-end">
									<div tabIndex={0} role="button" className="btn btn-sm btn-ghost opacity-0 group-hover:opacity-100">
										<MoreVertical size={14} />
									</div>
									<ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
										<li>
											<a onClick={() => onPinNotification?.(notification.id)} className="flex items-center gap-2">
												<Pin size={14} />
												{notification.pinned ? "Unpin" : "Pin"}
											</a>
										</li>
										<li>
											<a onClick={() => onArchiveNotification?.(notification.id)} className="flex items-center gap-2">
												<Archive size={14} />
												Archive
											</a>
										</li>
										<li>
											<a onClick={() => onDeleteNotification?.(notification.id)} className="flex items-center gap-2 text-error">
												<Trash2 size={14} />
												Delete
											</a>
										</li>
									</ul>
								</div>
							</div>
						</div>

						<p
							className={`mb-2 text-sm ${
								!notification.read ? "text-base-content" : "text-base-content/70"
							}`}
						>
							{notification.message}
						</p>

						{/* Sender */}
						{notification.sender && (
							<div className="mb-2 flex items-center gap-2">
								<div className="avatar">
									<div className="w-8 rounded-full">
										<img 
											src={notification.sender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.sender.name)}&background=random`} 
											alt={notification.sender.name}
										/>
									</div>
								</div>
								<div>
									<p className="font-medium text-sm">
										{notification.sender.name}
									</p>
									{notification.sender.role && (
										<p className="text-base-content/60 text-xs">
											{notification.sender.role}
										</p>
									)}
								</div>
							</div>
						)}

						{/* Actions */}
						{notification.actions && notification.actions.length > 0 && (
							<div className="mt-3 flex items-center gap-2">
								{notification.actions.map((action, index) => (
									<button
										key={index}
										className={`btn btn-sm ${
											action.variant === "primary" ? "btn-primary" :
											action.variant === "danger" ? "btn-error" :
											"btn-outline btn-primary"
										}`}
										onClick={() =>
											onPerformAction?.(notification.id, action.action)
										}
									>
										{action.label}
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);

	const renderNotificationDetail = () => {
		if (!selectedNotification) return null;

		return (
			<dialog className="modal" open={isDetailModalOpen}>
				<div className="modal-box max-w-2xl">
					<div className="flex items-center gap-3 mb-6">
						<div className="rounded-lg bg-primary/10 p-2">
							{getNotificationIcon(selectedNotification)}
						</div>
						<div>
							<h3 className="font-semibold text-lg">
								{selectedNotification.title}
							</h3>
							<p className="text-base-content/60 text-sm">
								{formatTimeAgo(selectedNotification.timestamp)}
							</p>
						</div>
					</div>
					<div className="space-y-4">
						<div className="space-y-4">
							<div>
								<p className="text-base-content">
									{selectedNotification.message}
								</p>
							</div>

							{selectedNotification.sender && (
								<div>
									<h4 className="mb-2 font-semibold">From</h4>
									<div className="flex items-center gap-3">
										<div className="avatar">
											<div className="w-12 rounded-full">
												<img 
													src={selectedNotification.sender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedNotification.sender.name)}&background=random`} 
													alt={selectedNotification.sender.name}
												/>
											</div>
										</div>
										<div>
											<p className="font-medium">
												{selectedNotification.sender.name}
											</p>
											{selectedNotification.sender.role && (
												<p className="text-base-content/60 text-sm">
													{selectedNotification.sender.role}
												</p>
											)}
										</div>
									</div>
								</div>
							)}

							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="mb-1 text-base-content/60 text-sm">Type</p>
									<span className={`badge badge-sm ${
										getNotificationColor(selectedNotification) === 'danger' ? 'badge-error' :
										getNotificationColor(selectedNotification) === 'warning' ? 'badge-warning' :
										getNotificationColor(selectedNotification) === 'success' ? 'badge-success' :
										getNotificationColor(selectedNotification) === 'primary' ? 'badge-primary' :
										'badge-neutral'
									}`}>
										{selectedNotification.type}
									</span>
								</div>
								<div>
									<p className="mb-1 text-base-content/60 text-sm">Category</p>
									<span className="badge badge-sm badge-neutral">
										{selectedNotification.category}
									</span>
								</div>
							</div>

							{selectedNotification.metadata?.priority && (
								<div>
									<p className="mb-1 text-base-content/60 text-sm">Priority</p>
									<span className={`badge ${
										getPriorityColor(selectedNotification.metadata.priority) === 'danger' ? 'badge-error' :
										getPriorityColor(selectedNotification.metadata.priority) === 'warning' ? 'badge-warning' :
										getPriorityColor(selectedNotification.metadata.priority) === 'primary' ? 'badge-primary' :
										'badge-neutral'
									}`}>
										{selectedNotification.metadata.priority}
									</span>
								</div>
							)}
						</div>
					</div>
					<div className="modal-action">
						<button className="btn btn-outline" onClick={onDetailModalClose}>
							Close
						</button>
						{selectedNotification.actions &&
							selectedNotification.actions.length > 0 && (
								<>
									{selectedNotification.actions.map((action, index) => (
										<button
											key={index}
											className={`btn ${
												action.variant === "primary" ? "btn-primary" :
												action.variant === "danger" ? "btn-error" :
												"btn-outline btn-primary"
											}`}
											onClick={() => {
												onPerformAction?.(
													selectedNotification.id,
													action.action,
												);
												onDetailModalClose();
											}}
										>
											{action.label}
										</button>
									))}
								</>
							)}
					</div>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button onClick={onDetailModalClose}>close</button>
				</form>
			</dialog>
		);
	};

	const renderSettingsModal = () => (
		<dialog className="modal" open={isSettingsModalOpen}>
			<div className="modal-box max-w-2xl">
				<h3 className="font-semibold text-lg mb-6">Notification Settings</h3>
					<div className="space-y-6">
						{/* Delivery Methods */}
						<div>
							<h4 className="mb-4 font-semibold">Delivery Methods</h4>
							<div className="space-y-3">
								<div className="form-control">
									<label className="label cursor-pointer">
										<div className="flex items-center gap-2">
											<Mail size={16} />
											<span className="label-text">Email Notifications</span>
										</div>
										<input 
											type="checkbox" 
											className="toggle" 
											checked={notificationSettings.emailNotifications}
											onChange={(e) =>
												setNotificationSettings({
													...notificationSettings,
													emailNotifications: e.target.checked,
												})
											}
										/>
									</label>
								</div>
								<div className="form-control">
									<label className="label cursor-pointer">
										<div className="flex items-center gap-2">
											<Bell size={16} />
											<span className="label-text">Push Notifications</span>
										</div>
										<input 
											type="checkbox" 
											className="toggle" 
											checked={notificationSettings.pushNotifications}
											onChange={(e) =>
												setNotificationSettings({
													...notificationSettings,
													pushNotifications: e.target.checked,
												})
											}
										/>
									</label>
								</div>
								<div className="form-control">
									<label className="label cursor-pointer">
										<div className="flex items-center gap-2">
											<MessageSquare size={16} />
											<span className="label-text">In-App Notifications</span>
										</div>
										<input 
											type="checkbox" 
											className="toggle" 
											checked={notificationSettings.inAppNotifications}
											onChange={(e) =>
												setNotificationSettings({
													...notificationSettings,
													inAppNotifications: e.target.checked,
												})
											}
										/>
									</label>
								</div>
							</div>
						</div>

						{/* Categories */}
						<div>
							<h4 className="mb-4 font-semibold">Categories</h4>
							<div className="space-y-3">
								{NOTIFICATION_CATEGORIES.map((category) => (
									<div key={category.value} className="form-control">
										<label className="label cursor-pointer">
											<div className="flex items-center gap-2">
												{category.icon}
												<span className="label-text">{category.label}</span>
											</div>
											<input 
												type="checkbox" 
												className="toggle" 
												checked={notificationSettings.categories[category.value as keyof typeof notificationSettings.categories]}
												onChange={(e) =>
													setNotificationSettings({
														...notificationSettings,
														categories: {
															...notificationSettings.categories,
															[category.value]: e.target.checked,
														},
													})
												}
											/>
										</label>
									</div>
								))}
							</div>
						</div>

						{/* Frequency */}
						<div>
							<h4 className="mb-4 font-semibold">Frequency</h4>
							<div className="space-y-2">
								<div className="form-control">
									<label className="label cursor-pointer justify-start gap-2">
										<input 
											type="radio" 
											name="frequency" 
											value="immediate"
											className="radio" 
											checked={notificationSettings.frequency === "immediate"}
											onChange={(e) =>
												setNotificationSettings({
													...notificationSettings,
													frequency: e.target.value as any,
												})
											}
										/>
										<span className="label-text">Immediate</span>
									</label>
								</div>
								<div className="form-control">
									<label className="label cursor-pointer justify-start gap-2">
										<input 
											type="radio" 
											name="frequency" 
											value="hourly"
											className="radio" 
											checked={notificationSettings.frequency === "hourly"}
											onChange={(e) =>
												setNotificationSettings({
													...notificationSettings,
													frequency: e.target.value as any,
												})
											}
										/>
										<span className="label-text">Hourly Digest</span>
									</label>
								</div>
								<div className="form-control">
									<label className="label cursor-pointer justify-start gap-2">
										<input 
											type="radio" 
											name="frequency" 
											value="daily"
											className="radio" 
											checked={notificationSettings.frequency === "daily"}
											onChange={(e) =>
												setNotificationSettings({
													...notificationSettings,
													frequency: e.target.value as any,
												})
											}
										/>
										<span className="label-text">Daily Digest</span>
									</label>
								</div>
								<div className="form-control">
									<label className="label cursor-pointer justify-start gap-2">
										<input 
											type="radio" 
											name="frequency" 
											value="weekly"
											className="radio" 
											checked={notificationSettings.frequency === "weekly"}
											onChange={(e) =>
												setNotificationSettings({
													...notificationSettings,
													frequency: e.target.value as any,
												})
											}
										/>
										<span className="label-text">Weekly Digest</span>
									</label>
								</div>
							</div>
						</div>

						{/* Quiet Hours */}
						<div>
							<h4 className="mb-4 font-semibold">Quiet Hours</h4>
							<div className="space-y-3">
								<div className="form-control">
									<label className="label cursor-pointer">
										<span className="label-text">Enable Quiet Hours</span>
										<input 
											type="checkbox" 
											className="toggle" 
											checked={notificationSettings.quietHours.enabled}
											onChange={(e) =>
												setNotificationSettings({
													...notificationSettings,
													quietHours: {
														...notificationSettings.quietHours,
														enabled: e.target.checked,
													},
												})
											}
										/>
									</label>
								</div>
								{notificationSettings.quietHours.enabled && (
									<div className="grid grid-cols-2 gap-4">
										<div className="form-control">
											<label className="label">
												<span className="label-text">Start Time</span>
											</label>
											<input
												type="time"
												value={notificationSettings.quietHours.start}
												onChange={(e) =>
													setNotificationSettings({
														...notificationSettings,
														quietHours: {
															...notificationSettings.quietHours,
															start: e.target.value,
														},
													})
												}
												className="input"
											/>
										</div>
										<div className="form-control">
											<label className="label">
												<span className="label-text">End Time</span>
											</label>
											<input
												type="time"
												value={notificationSettings.quietHours.end}
												onChange={(e) =>
													setNotificationSettings({
														...notificationSettings,
														quietHours: {
															...notificationSettings.quietHours,
															end: e.target.value,
														},
													})
												}
												className="input"
											/>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				<div className="modal-action">
					<button className="btn btn-outline" onClick={onSettingsModalClose}>
						Cancel
					</button>
					<button className="btn btn-primary" onClick={handleUpdateSettings}>
						Save Settings
					</button>
				</div>
			</div>
			<form method="dialog" className="modal-backdrop">
				<button onClick={onSettingsModalClose}>close</button>
			</form>
		</dialog>
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="flex items-center gap-2 font-semibold text-xl">
						<Bell size={24} className="text-primary" />
						Notifications
						{unreadCount > 0 && (
							<span className="badge badge-sm badge-error">
								{unreadCount}
							</span>
						)}
					</h2>
					<p className="text-base-content/60 text-sm">
						Stay updated with important events and activities
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						className="btn btn-outline"
						onClick={onSettingsModalOpen}
					>
						<Settings size={16} />
						Settings
					</button>
					{unreadCount > 0 && (
						<button
							className="btn btn-outline"
							onClick={onMarkAllAsRead}
						>
							<Check size={16} />
							Mark All Read
						</button>
					)}
				</div>
			</div>

			{/* Filters */}
			<div className="card bg-base-100 shadow">
				<div className="card-body">
					<div className="flex flex-col gap-4 md:flex-row md:items-center">
						<div className="relative md:w-80">
							<input
								type="text"
								placeholder="Search notifications..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="input input-sm w-full pl-10"
							/>
							<Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" />
						</div>
						<div className="md:w-40">
							<label className="label" htmlFor="filter-type">
								<span className="label-text">Type</span>
							</label>
							<select 
								id="filter-type"
								className="select select-sm w-full"
								value={filterType}
								onChange={(e) => setFilterType(e.target.value)}
							>
								<option value="all">All Types</option>
								<option value="info">Info</option>
								<option value="success">Success</option>
								<option value="warning">Warning</option>
								<option value="error">Error</option>
							</select>
						</div>
						<div className="md:w-40">
							<label className="label" htmlFor="filter-category">
								<span className="label-text">Category</span>
							</label>
							<select 
								id="filter-category"
								className="select select-sm w-full"
								value={filterCategory}
								onChange={(e) => setFilterCategory(e.target.value)}
							>
								<option value="all">All Categories</option>
								<option value="asset">Assets</option>
								<option value="workflow">Workflows</option>
								<option value="approval">Approvals</option>
								<option value="system">System</option>
								<option value="collaboration">Collaboration</option>
								<option value="security">Security</option>
							</select>
						</div>
					</div>
				</div>
			</div>

			{/* Tabs */}
			<div className="w-full">
				<div role="tablist" className="tabs tabs-bordered">
					<input 
						type="radio" 
						name="notification_tabs" 
						role="tab" 
						className="tab" 
						aria-label="All" 
						checked={selectedTab === "all"}
						onChange={() => setSelectedTab("all")}
					/>
					<div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
						<div className="flex items-center gap-2 mb-4">
							<span>All</span>
							<span className="badge badge-sm badge-neutral">
								{notifications.filter((n) => !n.archived).length}
							</span>
						</div>
						<div className="space-y-3">
							{filteredNotifications.length === 0 ? (
								<div className="card bg-base-100 shadow">
									<div className="card-body py-12 text-center">
										<Bell size={48} className="mx-auto mb-4 text-base-content/30" />
										<h3 className="mb-2 font-semibold text-lg">
											No notifications
										</h3>
										<p className="text-base-content/60">
											You're all caught up! No new notifications to show.
										</p>
									</div>
								</div>
							) : (
								filteredNotifications.map(renderNotificationItem)
							)}
						</div>
					</div>

					<input 
						type="radio" 
						name="notification_tabs" 
						role="tab" 
						className="tab" 
						aria-label="Unread" 
						checked={selectedTab === "unread"}
						onChange={() => setSelectedTab("unread")}
					/>
					<div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
						<div className="flex items-center gap-2 mb-4">
							<span>Unread</span>
							{unreadCount > 0 && (
								<span className="badge badge-sm badge-error">
									{unreadCount}
								</span>
							)}
						</div>
						<div className="space-y-3">
							{filteredNotifications.length === 0 ? (
								<div className="card bg-base-100 shadow">
									<div className="card-body py-12 text-center">
										<CheckCircle
											size={48}
											className="mx-auto mb-4 text-success"
										/>
										<h3 className="mb-2 font-semibold text-lg">All caught up!</h3>
										<p className="text-base-content/60">
											You have no unread notifications.
										</p>
									</div>
								</div>
							) : (
								filteredNotifications.map(renderNotificationItem)
							)}
						</div>
					</div>

					<input 
						type="radio" 
						name="notification_tabs" 
						role="tab" 
						className="tab" 
						aria-label="Pinned" 
						checked={selectedTab === "pinned"}
						onChange={() => setSelectedTab("pinned")}
					/>
					<div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
						<div className="flex items-center gap-2 mb-4">
							<Pin size={16} />
							<span>Pinned</span>
						</div>
						<div className="space-y-3">
							{filteredNotifications.length === 0 ? (
								<div className="card bg-base-100 shadow">
									<div className="card-body py-12 text-center">
										<Pin size={48} className="mx-auto mb-4 text-base-content/30" />
										<h3 className="mb-2 font-semibold text-lg">
											No pinned notifications
										</h3>
										<p className="text-base-content/60">
											Pin important notifications to keep them at the top.
										</p>
									</div>
								</div>
							) : (
								filteredNotifications.map(renderNotificationItem)
							)}
						</div>
					</div>

					<input 
						type="radio" 
						name="notification_tabs" 
						role="tab" 
						className="tab" 
						aria-label="Archived" 
						checked={selectedTab === "archived"}
						onChange={() => setSelectedTab("archived")}
					/>
					<div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
						<div className="flex items-center gap-2 mb-4">
							<Archive size={16} />
							<span>Archived</span>
						</div>
						<div className="space-y-3">
							{filteredNotifications.length === 0 ? (
								<div className="card bg-base-100 shadow">
									<div className="card-body py-12 text-center">
										<Archive
											size={48}
											className="mx-auto mb-4 text-base-content/30"
										/>
										<h3 className="mb-2 font-semibold text-lg">
											No archived notifications
										</h3>
										<p className="text-base-content/60">
											Archived notifications will appear here.
										</p>
									</div>
								</div>
							) : (
								filteredNotifications.map(renderNotificationItem)
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Modals */}
			{renderNotificationDetail()}
			{renderSettingsModal()}
		</div>
	);
}
