"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	AlertCircle,
	Archive,
	Bell,
	BellOff,
	Check,
	CheckCheck,
	CheckCircle,
	Clock,
	Download,
	Eye,
	EyeOff,
	Filter,
	Info,
	MoreVertical,
	RefreshCw,
	Search,
	Settings,
	Share,
	Star,
	Trash2,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { AppLayout } from "~/components/layout/AppLayout";
import { useMockData } from "~/hooks/useMockData";

interface NotificationItem {
	id: string;
	type:
		| "approval"
		| "info"
		| "success"
		| "warning"
		| "error"
		| "mention"
		| "system";
	title: string;
	message: string;
	timestamp: Date;
	isRead: boolean;
	isStarred?: boolean;
	isArchived?: boolean;
	priority: "low" | "medium" | "high" | "urgent";
	category:
		| "assets"
		| "collections"
		| "users"
		| "system"
		| "workflow"
		| "security";
	actionUrl?: string;
	actionLabel?: string;
	metadata?: {
		userId?: string;
		assetId?: string;
		collectionId?: string;
		[key: string]: any;
	};
	sender?: {
		name: string;
		avatar: string;
		role: string;
	};
}

const mockNotifications: NotificationItem[] = [
	{
		id: "1",
		type: "approval",
		title: "Asset Approval Required",
		message: "Brand Logo V2.svg requires your approval before publishing",
		timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
		isRead: false,
		priority: "high",
		category: "assets",
		actionUrl: "/assets/brand-logo-v2",
		actionLabel: "Review Asset",
		sender: {
			name: "Sarah Chen",
			avatar: "/avatar-sarah.jpg",
			role: "Creative Director",
		},
	},
	{
		id: "2",
		type: "mention",
		title: "You were mentioned",
		message:
			"@you Please review the new marketing materials in the Q4 Campaign collection",
		timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
		isRead: false,
		isStarred: true,
		priority: "medium",
		category: "collections",
		actionUrl: "/collections/q4-campaign",
		actionLabel: "View Collection",
		sender: {
			name: "Mike Johnson",
			avatar: "/avatar-mike.jpg",
			role: "Marketing Manager",
		},
	},
	{
		id: "3",
		type: "success",
		title: "Asset Approved",
		message: "Product Hero Image.jpg has been approved and is now live",
		timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
		isRead: true,
		priority: "low",
		category: "assets",
		sender: {
			name: "Emily Davis",
			avatar: "/avatar-emily.jpg",
			role: "Brand Manager",
		},
	},
	{
		id: "4",
		type: "system",
		title: "Storage Alert",
		message:
			"You're using 85% of your storage quota. Consider upgrading your plan.",
		timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
		isRead: true,
		priority: "medium",
		category: "system",
		actionUrl: "/settings/billing",
		actionLabel: "Upgrade Plan",
	},
	{
		id: "5",
		type: "info",
		title: "Weekly Report Available",
		message: "Your weekly brand portal usage report is ready for download",
		timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
		isRead: true,
		priority: "low",
		category: "system",
		actionUrl: "/analytics/reports",
		actionLabel: "View Report",
	},
	{
		id: "6",
		type: "warning",
		title: "Asset Usage Violation",
		message:
			"Unauthorized usage detected for Brand Logo.svg. Please review usage guidelines.",
		timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
		isRead: false,
		priority: "urgent",
		category: "security",
		actionUrl: "/compliance/violations",
		actionLabel: "Review Details",
	},
];

export default function NotificationsPage() {
	const [notifications, setNotifications] =
		useState<NotificationItem[]>(mockNotifications);
	const [selectedTab, setSelectedTab] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [filterBy, setFilterBy] = useState("all");
	const [sortBy, setSortBy] = useState("newest");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [isOpen, setIsOpen] = useState(false);

	// Filter and search notifications
	const filteredNotifications = notifications
		.filter((notification) => {
			// Text search
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				if (
					!notification.title.toLowerCase().includes(query) &&
					!notification.message.toLowerCase().includes(query)
				) {
					return false;
				}
			}

			// Tab filter
			if (selectedTab !== "all") {
				if (selectedTab === "unread" && notification.isRead) return false;
				if (selectedTab === "starred" && !notification.isStarred) return false;
				if (selectedTab === "archived" && !notification.isArchived)
					return false;
			}

			// Category filter
			if (filterBy !== "all" && notification.category !== filterBy) {
				return false;
			}

			return true;
		})
		.sort((a, b) => {
			switch (sortBy) {
				case "newest":
					return b.timestamp.getTime() - a.timestamp.getTime();
				case "oldest":
					return a.timestamp.getTime() - b.timestamp.getTime();
				case "priority": {
					const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
					return priorityOrder[b.priority] - priorityOrder[a.priority];
				}
				default:
					return 0;
			}
		});

	const unreadCount = notifications.filter(
		(n) => !n.isRead && !n.isArchived,
	).length;
	const starredCount = notifications.filter(
		(n) => n.isStarred && !n.isArchived,
	).length;

	const getNotificationIcon = (type: NotificationItem["type"]) => {
		switch (type) {
			case "approval":
				return <Clock className="text-warning" size={16} />;
			case "success":
				return <CheckCircle className="text-success" size={16} />;
			case "warning":
				return <AlertCircle className="text-warning" size={16} />;
			case "error":
				return <XCircle className="text-error" size={16} />;
			case "info":
				return <Info className="text-primary" size={16} />;
			case "mention":
				return <Bell className="text-secondary" size={16} />;
			case "system":
				return <Settings className="text-base-content/60" size={16} />;
			default:
				return <Bell className="text-base-content/60" size={16} />;
		}
	};

	const getPriorityColor = (priority: NotificationItem["priority"]) => {
		switch (priority) {
			case "urgent":
				return "error";
			case "high":
				return "warning";
			case "medium":
				return "primary";
			case "low":
				return "base-content";
			default:
				return "base-content";
		}
	};

	const formatTimestamp = (timestamp: Date) => {
		const now = new Date();
		const diff = now.getTime() - timestamp.getTime();
		const minutes = Math.floor(diff / (1000 * 60));
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (minutes < 1) return "Just now";
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		return timestamp.toLocaleDateString();
	};

	const handleMarkAsRead = (id: string) => {
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
		);
	};

	const handleMarkAllAsRead = () => {
		setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
	};

	const handleToggleStar = (id: string) => {
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, isStarred: !n.isStarred } : n)),
		);
	};

	const handleArchive = (id: string) => {
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, isArchived: true } : n)),
		);
	};

	const handleDelete = (id: string) => {
		setNotifications((prev) => prev.filter((n) => n.id !== id));
	};

	const handleBulkAction = (action: "read" | "star" | "archive" | "delete") => {
		const ids = Array.from(selectedIds);

		switch (action) {
			case "read":
				setNotifications((prev) =>
					prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n)),
				);
				break;
			case "star":
				setNotifications((prev) =>
					prev.map((n) =>
						ids.includes(n.id) ? { ...n, isStarred: !n.isStarred } : n,
					),
				);
				break;
			case "archive":
				setNotifications((prev) =>
					prev.map((n) =>
						ids.includes(n.id) ? { ...n, isArchived: true } : n,
					),
				);
				break;
			case "delete":
				setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
				break;
		}

		setSelectedIds(new Set());
	};

	const handleSelectAll = () => {
		if (selectedIds.size === filteredNotifications.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
		}
	};

	return (
		<AppLayout>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="font-bold text-3xl">Notifications</h1>
						<p className="mt-1 text-base-content/60">
							Stay updated with your brand portal activity and alerts.
						</p>
					</div>
					<div className="flex items-center gap-3">
						<button className="btn btn-outline gap-2">
							<RefreshCw size={16} />
							Refresh
						</button>
						<button
							className="btn btn-outline gap-2"
							onClick={handleMarkAllAsRead}
							disabled={unreadCount === 0}
						>
							<CheckCheck size={16} />
							Mark All Read
						</button>
						<button className="btn btn-outline gap-2">
							<Settings size={16} />
							Settings
						</button>
					</div>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div className="card bg-base-100 shadow">
						<div className="card-body text-center">
							<div className="font-bold text-2xl text-primary">
								{unreadCount}
							</div>
							<div className="text-base-content/60 text-sm">Unread</div>
						</div>
					</div>
					<div className="card bg-base-100 shadow">
						<div className="card-body text-center">
							<div className="font-bold text-2xl text-warning">
								{starredCount}
							</div>
							<div className="text-base-content/60 text-sm">Starred</div>
						</div>
					</div>
					<div className="card bg-base-100 shadow">
						<div className="card-body text-center">
							<div className="font-bold text-2xl text-base-content/60">
								{notifications.length}
							</div>
							<div className="text-base-content/60 text-sm">Total</div>
						</div>
					</div>
				</div>

				{/* Controls */}
				<div className="flex flex-col gap-4 sm:flex-row">
					<div className="relative sm:w-80">
						<Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" />
						<input
							className="input input-bordered w-full pl-10"
							placeholder="Search notifications..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					<div className="relative sm:w-48">
						<Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" />
						<select
							className="select select-bordered w-full pl-10"
							value={filterBy}
							onChange={(e) => setFilterBy(e.target.value)}
						>
							<option value="all">All Categories</option>
							<option value="assets">Assets</option>
							<option value="collections">Collections</option>
							<option value="users">Users</option>
							<option value="system">System</option>
							<option value="workflow">Workflow</option>
							<option value="security">Security</option>
						</select>
					</div>
					<select
						className="select select-bordered sm:w-40"
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value)}
					>
						<option value="newest">Newest</option>
						<option value="oldest">Oldest</option>
						<option value="priority">Priority</option>
					</select>
				</div>

				{/* Bulk Actions */}
				{selectedIds.size > 0 && (
					<div className="card bg-base-100 shadow border border-primary">
						<div className="card-body">
							<div className="flex items-center justify-between">
								<span className="text-sm">
									{selectedIds.size} notification
									{selectedIds.size !== 1 ? "s" : ""} selected
								</span>
								<div className="flex items-center gap-2">
									<button
										className="btn btn-sm btn-outline gap-2"
										onClick={() => handleBulkAction("read")}
									>
										<Check size={14} />
										Mark Read
									</button>
									<button
										className="btn btn-sm btn-outline gap-2"
										onClick={() => handleBulkAction("star")}
									>
										<Star size={14} />
										Star
									</button>
									<button
										className="btn btn-sm btn-outline gap-2"
										onClick={() => handleBulkAction("archive")}
									>
										<Archive size={14} />
										Archive
									</button>
									<button
										className="btn btn-sm btn-outline btn-error gap-2"
										onClick={() => handleBulkAction("delete")}
									>
										<Trash2 size={14} />
										Delete
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Notifications */}
				<div className="card bg-base-100 shadow">
					<div className="card-body p-0">
						<div role="tablist" className="tabs tabs-lifted w-full">
							<input
								type="radio"
								name="notification_tabs"
								role="tab"
								className="tab"
								aria-label="All"
								checked={selectedTab === "all"}
								onChange={() => setSelectedTab("all")}
							/>
							<input
								type="radio"
								name="notification_tabs"
								role="tab"
								className="tab"
								aria-label="Unread"
								checked={selectedTab === "unread"}
								onChange={() => setSelectedTab("unread")}
							/>
							<input
								type="radio"
								name="notification_tabs"
								role="tab"
								className="tab"
								aria-label="Starred"
								checked={selectedTab === "starred"}
								onChange={() => setSelectedTab("starred")}
							/>

							{selectedTab === "all" && (
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									<div className="space-y-1">
										{filteredNotifications.filter((n) => !n.isArchived).length >
										0 ? (
											<>
												<div className="mb-4 flex items-center gap-2">
													<input
														type="checkbox"
														checked={
															selectedIds.size ===
															filteredNotifications.filter((n) => !n.isArchived)
																.length
														}
														onChange={handleSelectAll}
														className="checkbox"
													/>
													<span className="text-base-content/60 text-sm">
														Select all
													</span>
												</div>
												{filteredNotifications
													.filter((n) => !n.isArchived)
													.map((notification) => (
														<div
															key={notification.id}
															className={`card bg-base-100 shadow cursor-pointer hover:shadow-md ${!notification.isRead ? "border border-primary" : ""} ${selectedIds.has(notification.id) ? "bg-primary/5" : ""}`}
															onClick={() =>
																!notification.isRead &&
																handleMarkAsRead(notification.id)
															}
														>
															<div className="card-body">
																<div className="flex items-start gap-3">
																	<input
																		type="checkbox"
																		checked={selectedIds.has(notification.id)}
																		onChange={(e) => {
																			const newSelected = new Set(selectedIds);
																			if (e.target.checked) {
																				newSelected.add(notification.id);
																			} else {
																				newSelected.delete(notification.id);
																			}
																			setSelectedIds(newSelected);
																		}}
																		className="mt-1"
																	/>
																	<div className="mt-1">
																		{getNotificationIcon(notification.type)}
																	</div>
																	{notification.sender && (
																		<div className="avatar">
																			<div className="w-8 h-8 rounded-full">
																				<img src={notification.sender.avatar} alt={notification.sender.name} />
																			</div>
																		</div>
																	)}
																	<div className="min-w-0 flex-1">
																		<div className="flex items-start justify-between">
																			<div className="min-w-0 flex-1">
																				<div className="mb-1 flex items-center gap-2">
																					<h4
																						className={`font-medium ${!notification.isRead ? "font-semibold" : ""}`}
																					>
																						{notification.title}
																					</h4>
																					<span
																						className={`badge badge-sm ${
																							getPriorityColor(notification.priority) === "error" ? "badge-error" :
																							getPriorityColor(notification.priority) === "warning" ? "badge-warning" :
																							getPriorityColor(notification.priority) === "primary" ? "badge-primary" :
																							"badge-neutral"
																						}`}
																					>
																						{notification.priority}
																					</span>
																					{!notification.isRead && (
																						<div className="h-2 w-2 rounded-full bg-primary" />
																					)}
																				</div>
																				<p className="mb-2 text-base-content/60 text-sm">
																					{notification.message}
																				</p>
																				<div className="flex items-center gap-4 text-base-content/60 text-xs">
																					<span>
																						{formatTimestamp(
																							notification.timestamp,
																						)}
																					</span>
																					{notification.sender && (
																						<span>
																							by {notification.sender.name}
																						</span>
																					)}
																					<span className="badge badge-sm badge-outline">
																						{notification.category}
																					</span>
																				</div>
																			</div>
																			<div className="ml-2 flex items-center gap-1">
																				{notification.actionUrl && (
																					<button className="btn btn-sm btn-primary">
																						{notification.actionLabel || "View"}
																					</button>
																				)}
																				<button
																					className="btn btn-sm btn-ghost btn-square"
																					onClick={() =>
																						handleToggleStar(notification.id)
																					}
																				>
																					<Star
																						size={16}
																						className={
																							notification.isStarred
																								? "fill-warning text-warning"
																								: "text-base-content/40"
																						}
																					/>
																				</button>
																				<div className="dropdown dropdown-end">
																					<div tabIndex={0} role="button" className="btn btn-sm btn-ghost btn-square">
																						<MoreVertical size={16} />
																					</div>
																					<ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
																						<li>
																							<button onClick={() => handleMarkAsRead(notification.id)} className="flex items-center gap-2">
																								<Eye size={16} />
																								Mark as Read
																							</button>
																						</li>
																						<li>
																							<button onClick={() => handleArchive(notification.id)} className="flex items-center gap-2">
																								<Archive size={16} />
																								Archive
																							</button>
																						</li>
																						<li>
																							<button onClick={() => handleDelete(notification.id)} className="flex items-center gap-2 text-error">
																								<Trash2 size={16} />
																								Delete
																							</button>
																						</li>
																					</ul>
																				</div>
																			</div>
																		</div>
																	</div>
																</div>
															</div>
														</div>
													))}
											</>
										) : (
											<div className="py-12 text-center">
												<BellOff
													className="mx-auto mb-4 text-base-content/40"
													size={48}
												/>
												<h3 className="mb-2 font-medium text-lg">
													No notifications
												</h3>
												<p className="text-base-content/60">
													You're all caught up!
												</p>
											</div>
										)}
									</div>
								</div>
							)}


							{selectedTab === "unread" && (
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									{filteredNotifications.filter(
										(n) => !n.isRead && !n.isArchived,
									).length === 0 ? (
										<div className="py-12 text-center">
											<CheckCircle
												className="mx-auto mb-4 text-success"
												size={48}
											/>
											<h3 className="mb-2 font-medium text-lg">
												All caught up!
											</h3>
											<p className="text-base-content/60">
												No unread notifications.
											</p>
										</div>
									) : (
										<div className="space-y-1">
											{filteredNotifications
												.filter((n) => !n.isRead && !n.isArchived)
												.map((notification) => (
													<div
														key={notification.id}
														className="card bg-base-100 shadow border border-primary"
													>
														{/* Same notification content as above */}
														<p className="p-4 text-center text-sm text-base-content/60">
															Unread notification: {notification.title}
														</p>
													</div>
												))}
										</div>
									)}
								</div>
							)}

							{selectedTab === "starred" && (
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									{filteredNotifications.filter(
										(n) => n.isStarred && !n.isArchived,
									).length === 0 ? (
										<div className="py-12 text-center">
											<Star
												className="mx-auto mb-4 text-base-content/40"
												size={48}
											/>
											<h3 className="mb-2 font-medium text-lg">
												No starred notifications
											</h3>
											<p className="text-base-content/60">
												Star important notifications to find them easily.
											</p>
										</div>
									) : (
										<div className="space-y-1">
											{filteredNotifications
												.filter((n) => n.isStarred && !n.isArchived)
												.map((notification) => (
													<div key={notification.id} className="card bg-base-100 shadow">
														{/* Same notification content as above */}
														<p className="p-4 text-center text-sm text-base-content/60">
															Starred notification: {notification.title}
														</p>
													</div>
												))}
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</AppLayout>
	);
}
