"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	Activity,
	Award,
	BarChart3,
	Calendar,
	Clock,
	Download,
	ExternalLink,
	Eye,
	Filter,
	Heart,
	MessageSquare,
	PieChart,
	RefreshCw,
	Share2,
	Star,
	Target,
	TrendingDown,
	TrendingUp,
	UserMinus,
	UserPlus,
	Users,
} from "lucide-react";
import { useState } from "react";

interface UserData {
	id: string;
	name: string;
	email: string;
	avatar?: string;
	role: string;
	department: string;
	joinDate: Date;
	lastActive: Date;
	metrics: {
		totalViews: number;
		totalDownloads: number;
		totalLikes: number;
		totalShares: number;
		totalComments: number;
		sessionsCount: number;
		avgSessionDuration: number;
		activeDays: number;
	};
	engagement: {
		score: number;
		level: "high" | "medium" | "low";
		trend: "up" | "down" | "stable";
		change: number;
	};
	preferences: {
		favoriteCategories: string[];
		mostUsedFeatures: string[];
		deviceTypes: string[];
	};
}

interface UserEngagementProps {
	dateRange: "7d" | "30d" | "90d" | "1y";
	onDateRangeChange: (range: "7d" | "30d" | "90d" | "1y") => void;
}

const MOCK_USERS: UserData[] = [
	{
		id: "1",
		name: "Sarah Chen",
		email: "sarah.chen@company.com",
		avatar: "/avatars/sarah.jpg",
		role: "Marketing Manager",
		department: "Marketing",
		joinDate: new Date("2023-03-15"),
		lastActive: new Date("2024-03-10T14:30:00"),
		metrics: {
			totalViews: 2847,
			totalDownloads: 456,
			totalLikes: 123,
			totalShares: 89,
			totalComments: 34,
			sessionsCount: 187,
			avgSessionDuration: 24.5,
			activeDays: 85,
		},
		engagement: {
			score: 95,
			level: "high",
			trend: "up",
			change: 12.3,
		},
		preferences: {
			favoriteCategories: ["Marketing", "Brand", "Templates"],
			mostUsedFeatures: ["Search", "Collections", "Download"],
			deviceTypes: ["Desktop", "Mobile"],
		},
	},
	{
		id: "2",
		name: "Mike Johnson",
		email: "mike.johnson@company.com",
		avatar: "/avatars/mike.jpg",
		role: "Creative Director",
		department: "Design",
		joinDate: new Date("2023-01-20"),
		lastActive: new Date("2024-03-10T11:15:00"),
		metrics: {
			totalViews: 3421,
			totalDownloads: 678,
			totalLikes: 234,
			totalShares: 145,
			totalComments: 67,
			sessionsCount: 234,
			avgSessionDuration: 32.8,
			activeDays: 92,
		},
		engagement: {
			score: 88,
			level: "high",
			trend: "stable",
			change: 2.1,
		},
		preferences: {
			favoriteCategories: ["Design", "Photography", "Video"],
			mostUsedFeatures: ["Upload", "Edit", "Share"],
			deviceTypes: ["Desktop", "Tablet"],
		},
	},
	{
		id: "3",
		name: "Alex Rivera",
		email: "alex.rivera@company.com",
		avatar: "/avatars/alex.jpg",
		role: "Content Creator",
		department: "Content",
		joinDate: new Date("2023-06-10"),
		lastActive: new Date("2024-03-09T16:45:00"),
		metrics: {
			totalViews: 1923,
			totalDownloads: 324,
			totalLikes: 87,
			totalShares: 56,
			totalComments: 23,
			sessionsCount: 145,
			avgSessionDuration: 19.2,
			activeDays: 67,
		},
		engagement: {
			score: 72,
			level: "medium",
			trend: "up",
			change: 8.7,
		},
		preferences: {
			favoriteCategories: ["Content", "Social", "Templates"],
			mostUsedFeatures: ["Browse", "Like", "Comment"],
			deviceTypes: ["Mobile", "Desktop"],
		},
	},
	{
		id: "4",
		name: "Emma Wilson",
		email: "emma.wilson@company.com",
		avatar: "/avatars/emma.jpg",
		role: "Brand Manager",
		department: "Marketing",
		joinDate: new Date("2023-09-05"),
		lastActive: new Date("2024-03-08T09:30:00"),
		metrics: {
			totalViews: 1456,
			totalDownloads: 234,
			totalLikes: 45,
			totalShares: 23,
			totalComments: 12,
			sessionsCount: 89,
			avgSessionDuration: 15.6,
			activeDays: 34,
		},
		engagement: {
			score: 58,
			level: "medium",
			trend: "down",
			change: -5.2,
		},
		preferences: {
			favoriteCategories: ["Brand", "Guidelines", "Logo"],
			mostUsedFeatures: ["Search", "View", "Download"],
			deviceTypes: ["Desktop"],
		},
	},
	{
		id: "5",
		name: "David Kim",
		email: "david.kim@company.com",
		avatar: "/avatars/david.jpg",
		role: "Sales Rep",
		department: "Sales",
		joinDate: new Date("2023-11-12"),
		lastActive: new Date("2024-03-06T13:20:00"),
		metrics: {
			totalViews: 567,
			totalDownloads: 89,
			totalLikes: 12,
			totalShares: 8,
			totalComments: 3,
			sessionsCount: 34,
			avgSessionDuration: 8.9,
			activeDays: 18,
		},
		engagement: {
			score: 35,
			level: "low",
			trend: "stable",
			change: 0.8,
		},
		preferences: {
			favoriteCategories: ["Sales", "Presentations", "Marketing"],
			mostUsedFeatures: ["Browse", "Download"],
			deviceTypes: ["Desktop"],
		},
	},
];

const ENGAGEMENT_LEVELS = [
	{ value: "all", label: "All Users" },
	{ value: "high", label: "High Engagement" },
	{ value: "medium", label: "Medium Engagement" },
	{ value: "low", label: "Low Engagement" },
];

const DEPARTMENTS = [
	{ value: "all", label: "All Departments" },
	{ value: "marketing", label: "Marketing" },
	{ value: "design", label: "Design" },
	{ value: "content", label: "Content" },
	{ value: "sales", label: "Sales" },
];

export function UserEngagement({
	dateRange,
	onDateRangeChange,
}: UserEngagementProps) {
	const [selectedTab, setSelectedTab] = useState("overview");
	const [engagementFilter, setEngagementFilter] = useState("all");
	const [departmentFilter, setDepartmentFilter] = useState("all");
	const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const [isUserModalOpen, setIsUserModalOpen] = useState(false);
	const onUserModalOpen = () => setIsUserModalOpen(true);
	const onUserModalClose = () => setIsUserModalOpen(false);

	const formatNumber = (num: number) => {
		if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
		if (num >= 1000) return (num / 1000).toFixed(1) + "K";
		return num.toString();
	};

	const getEngagementColor = (level: string) => {
		switch (level) {
			case "high":
				return "success";
			case "medium":
				return "warning";
			case "low":
				return "danger";
			default:
				return "default";
		}
	};

	const getTrendIcon = (trend: string, change: number) => {
		if (trend === "up")
			return <TrendingUp size={12} className="text-success" />;
		if (trend === "down")
			return <TrendingDown size={12} className="text-error" />;
		return <Activity size={12} className="text-base-content/40" />;
	};

	const handleUserClick = (user: UserData) => {
		setSelectedUser(user);
		onUserModalOpen();
	};

	const handleRefresh = () => {
		setIsRefreshing(true);
		setTimeout(() => setIsRefreshing(false), 2000);
	};

	const renderOverviewMetrics = () => {
		const totalUsers = MOCK_USERS.length;
		const activeUsers = MOCK_USERS.filter((u) => {
			const daysSinceActive =
				(Date.now() - u.lastActive.getTime()) / (1000 * 60 * 60 * 24);
			return daysSinceActive <= 7;
		}).length;
		const avgEngagement =
			MOCK_USERS.reduce((sum, u) => sum + u.engagement.score, 0) / totalUsers;
		const highEngagement = MOCK_USERS.filter(
			(u) => u.engagement.level === "high",
		).length;

		return (
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<div className="card bg-base-100 shadow">
					<div className="card-body text-center">
						<Users size={24} className="mx-auto mb-2 text-primary" />
						<p className="font-bold text-2xl">{totalUsers}</p>
						<p className="text-base-content/50 text-sm">Total Users</p>
					</div>
				</div>
				<div className="card bg-base-100 shadow">
					<div className="card-body text-center">
						<Activity size={24} className="mx-auto mb-2 text-success" />
						<p className="font-bold text-2xl">{activeUsers}</p>
						<p className="text-base-content/50 text-sm">Active This Week</p>
					</div>
				</div>
				<div className="card bg-base-100 shadow">
					<div className="card-body text-center">
						<Target size={24} className="mx-auto mb-2 text-warning" />
						<p className="font-bold text-2xl">{avgEngagement.toFixed(1)}</p>
						<p className="text-base-content/50 text-sm">Avg Engagement</p>
					</div>
				</div>
				<div className="card bg-base-100 shadow">
					<div className="card-body text-center">
						<Award size={24} className="mx-auto mb-2 text-error" />
						<p className="font-bold text-2xl">{highEngagement}</p>
						<p className="text-base-content/50 text-sm">High Engagement</p>
					</div>
				</div>
			</div>
		);
	};

	const renderUserTable = () => (
		<div className="card bg-base-100 shadow">
			<div className="card-header p-6 pb-0 flex justify-between">
				<div>
					<h3 className="font-semibold text-lg">User Engagement Details</h3>
					<p className="text-base-content/50 text-sm">
						Individual user metrics and activity
					</p>
				</div>
				<div className="flex items-center gap-2">
					<select
						className="select select-bordered select-sm w-40"
						value={engagementFilter}
						onChange={(e) => setEngagementFilter(e.target.value)}
					>
						{ENGAGEMENT_LEVELS.map((level) => (
							<option key={level.value} value={level.value}>
								{level.label}
							</option>
						))}
					</select>
					<select
						className="select select-bordered select-sm w-40"
						value={departmentFilter}
						onChange={(e) => setDepartmentFilter(e.target.value)}
					>
						{DEPARTMENTS.map((dept) => (
							<option key={dept.value} value={dept.value}>
								{dept.label}
							</option>
						))}
					</select>
					<button
						className={`btn btn-sm btn-square btn-ghost ${
							isRefreshing ? "loading" : ""
						}`}
						onClick={handleRefresh}
						disabled={isRefreshing}
					>
						{!isRefreshing && <RefreshCw size={16} />}
					</button>
				</div>
			</div>
			<div className="overflow-x-auto">
				<table className="table w-full">
					<thead>
						<tr>
							<th>USER</th>
							<th>DEPARTMENT</th>
							<th>ENGAGEMENT</th>
							<th>ACTIVITY</th>
							<th>LAST ACTIVE</th>
							<th>ACTIONS</th>
						</tr>
					</thead>
					<tbody>
						{MOCK_USERS.map((user) => (
							<tr key={user.id}>
								<td>
									<div className="flex items-center gap-3">
										<div className="avatar">
											<div className="w-8 rounded-full">
												{user.avatar ? (
													<img src={user.avatar} alt={user.name} />
												) : (
													<div className="bg-neutral-focus text-neutral-content flex items-center justify-center h-full">
														<span className="text-xs">{user.name.substring(0, 1)}</span>
													</div>
												)}
											</div>
										</div>
										<div>
											<p className="font-medium">{user.name}</p>
											<p className="text-base-content/50 text-sm">{user.role}</p>
										</div>
									</div>
								</td>
								<td>
									<span className="badge badge-sm badge-primary badge-outline">
										{user.department}
									</span>
								</td>
								<td>
									<div className="flex items-center gap-2">
										<div className="flex items-center gap-1">
											<span className="font-medium">
												{user.engagement.score}
											</span>
											{getTrendIcon(
												user.engagement.trend,
												user.engagement.change,
											)}
										</div>
										<span className={`badge badge-sm ${
											getEngagementColor(user.engagement.level) === "success" ? "badge-success" :
											getEngagementColor(user.engagement.level) === "warning" ? "badge-warning" :
											getEngagementColor(user.engagement.level) === "danger" ? "badge-error" :
											"badge-neutral"
										}`}>
											{user.engagement.level}
										</span>
									</div>
								</td>
								<td>
									<div className="flex items-center gap-3 text-sm">
										<div className="flex items-center gap-1">
											<Eye size={12} />
											<span>{formatNumber(user.metrics.totalViews)}</span>
										</div>
										<div className="flex items-center gap-1">
											<Download size={12} />
											<span>{formatNumber(user.metrics.totalDownloads)}</span>
										</div>
									</div>
								</td>
								<td>
									<div className="flex items-center gap-1">
										<Clock size={12} className="text-base-content/40" />
										<span className="text-sm">
											{Math.floor(
												(Date.now() - user.lastActive.getTime()) /
													(1000 * 60 * 60 * 24),
											)}
											d ago
										</span>
									</div>
								</td>
								<td>
									<button
										className="btn btn-sm btn-ghost"
										onClick={() => handleUserClick(user)}
									>
										View Details
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);

	const renderUserModal = () => {
		if (!selectedUser) return null;

		return (
			<dialog className={`modal ${isUserModalOpen ? 'modal-open' : ''}`}>
				<div className="modal-box w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
					<div className="flex justify-between items-start mb-4">
						<div className="flex items-center gap-3">
							<div className="avatar">
								<div className="w-12 rounded-full">
									{selectedUser.avatar ? (
										<img src={selectedUser.avatar} alt={selectedUser.name} />
									) : (
										<div className="bg-neutral-focus text-neutral-content flex items-center justify-center h-full">
											<span className="text-lg">{selectedUser.name.substring(0, 1)}</span>
										</div>
									)}
								</div>
							</div>
							<div>
								<h3 className="font-semibold text-lg">{selectedUser.name}</h3>
								<p className="text-base-content/50 text-sm">
									{selectedUser.role} • {selectedUser.department}
								</p>
							</div>
						</div>
						<button className="btn btn-sm btn-circle btn-ghost" onClick={onUserModalClose}>✕</button>
					</div>
					<div className="py-4">
						<div className="space-y-6">
							{/* Engagement Score */}
							<div className="card bg-base-100 shadow">
								<div className="card-body">
									<div className="mb-4 flex items-center justify-between">
										<div>
											<p className="text-base-content/50 text-sm">
												Engagement Score
											</p>
											<p className="font-bold text-2xl">
												{selectedUser.engagement.score}/100
											</p>
										</div>
										<div className="text-right">
											<span className={`badge badge-sm ${
												getEngagementColor(selectedUser.engagement.level) === "success" ? "badge-success" :
												getEngagementColor(selectedUser.engagement.level) === "warning" ? "badge-warning" :
												getEngagementColor(selectedUser.engagement.level) === "danger" ? "badge-error" :
												"badge-neutral"
											}`}>
												{selectedUser.engagement.level.toUpperCase()}
											</span>
											<div className="mt-1 flex items-center gap-1">
												{getTrendIcon(
													selectedUser.engagement.trend,
													selectedUser.engagement.change,
												)}
												<span className="text-sm">
													{selectedUser.engagement.change > 0 ? "+" : ""}
													{selectedUser.engagement.change.toFixed(1)}%
												</span>
											</div>
										</div>
									</div>
									<progress 
										className={`progress ${
											getEngagementColor(selectedUser.engagement.level) === "success" ? "progress-success" :
											getEngagementColor(selectedUser.engagement.level) === "warning" ? "progress-warning" :
											getEngagementColor(selectedUser.engagement.level) === "danger" ? "progress-error" :
											"progress-neutral"
										}`} 
										value={selectedUser.engagement.score} 
										max={100}
									></progress>
								</div>
							</div>

							{/* Activity Metrics */}
							<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
								<div className="card bg-base-100 shadow">
									<div className="card-body text-center">
										<Eye size={20} className="mx-auto mb-2 text-primary" />
										<p className="font-bold text-lg">
											{formatNumber(selectedUser.metrics.totalViews)}
										</p>
										<p className="text-base-content/50 text-sm">Total Views</p>
									</div>
								</div>
								<div className="card bg-base-100 shadow">
									<div className="card-body text-center">
										<Download size={20} className="mx-auto mb-2 text-success" />
										<p className="font-bold text-lg">
											{formatNumber(selectedUser.metrics.totalDownloads)}
										</p>
										<p className="text-base-content/50 text-sm">Downloads</p>
									</div>
								</div>
								<div className="card bg-base-100 shadow">
									<div className="card-body text-center">
										<Heart size={20} className="mx-auto mb-2 text-error" />
										<p className="font-bold text-lg">
											{formatNumber(selectedUser.metrics.totalLikes)}
										</p>
										<p className="text-base-content/50 text-sm">Likes</p>
									</div>
								</div>
								<div className="card bg-base-100 shadow">
									<div className="card-body text-center">
										<Share2 size={20} className="mx-auto mb-2 text-warning" />
										<p className="font-bold text-lg">
											{formatNumber(selectedUser.metrics.totalShares)}
										</p>
										<p className="text-base-content/50 text-sm">Shares</p>
									</div>
								</div>
							</div>

							{/* Usage Stats */}
							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<div className="text-center">
									<p className="font-bold text-lg">
										{selectedUser.metrics.sessionsCount}
									</p>
									<p className="text-base-content/50 text-sm">Sessions</p>
								</div>
								<div className="text-center">
									<p className="font-bold text-lg">
										{selectedUser.metrics.avgSessionDuration.toFixed(1)}m
									</p>
									<p className="text-base-content/50 text-sm">Avg Session</p>
								</div>
								<div className="text-center">
									<p className="font-bold text-lg">
										{selectedUser.metrics.activeDays}
									</p>
									<p className="text-base-content/50 text-sm">Active Days</p>
								</div>
							</div>

							{/* Preferences */}
							<div className="card bg-base-100 shadow">
								<div className="card-header p-6 pb-0">
									<h4 className="font-semibold">User Preferences</h4>
								</div>
								<div className="card-body">
									<div className="space-y-4">
										<div>
											<p className="mb-2 text-base-content/50 text-sm">
												Favorite Categories
											</p>
											<div className="flex flex-wrap gap-2">
												{selectedUser.preferences.favoriteCategories.map(
													(category) => (
														<span
															key={category}
															className="badge badge-sm badge-primary"
														>
															{category}
														</span>
													),
												)}
											</div>
										</div>
										<div>
											<p className="mb-2 text-base-content/50 text-sm">
												Most Used Features
											</p>
											<div className="flex flex-wrap gap-2">
												{selectedUser.preferences.mostUsedFeatures.map(
													(feature) => (
														<span
															key={feature}
															className="badge badge-sm badge-secondary"
														>
															{feature}
														</span>
													),
												)}
											</div>
										</div>
										<div>
											<p className="mb-2 text-base-content/50 text-sm">
												Device Types
											</p>
											<div className="flex flex-wrap gap-2">
												{selectedUser.preferences.deviceTypes.map((device) => (
													<span
														key={device}
														className="badge badge-sm badge-success"
													>
														{device}
													</span>
												))}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="modal-action">
						<button className="btn btn-ghost" onClick={onUserModalClose}>
							Close
						</button>
						<button className="btn btn-primary">
							<ExternalLink size={16} />
							View Profile
						</button>
					</div>
				</div>
			</dialog>
		);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-xl">User Engagement</h2>
					<p className="text-base-content/50 text-sm">
						Track user behavior and engagement patterns
					</p>
				</div>
				<div className="flex items-center gap-2">
					<select
						className="select select-bordered select-sm w-32"
						value={dateRange}
						onChange={(e) => onDateRangeChange(e.target.value as any)}
					>
						<option value="7d">7 days</option>
						<option value="30d">30 days</option>
						<option value="90d">90 days</option>
						<option value="1y">1 year</option>
					</select>
					<button className="btn btn-sm btn-ghost">
						<BarChart3 size={16} />
						Export
					</button>
				</div>
			</div>

			{/* Tabs */}
			<div className="w-full">
				<div className="tabs tabs-boxed mb-6">
					<button 
						className={`tab ${selectedTab === "overview" ? "tab-active" : ""}`}
						onClick={() => setSelectedTab("overview")}
					>
						Overview
					</button>
					<button 
						className={`tab ${selectedTab === "behavior" ? "tab-active" : ""}`}
						onClick={() => setSelectedTab("behavior")}
					>
						Behavior Analysis
					</button>
					<button 
						className={`tab ${selectedTab === "retention" ? "tab-active" : ""}`}
						onClick={() => setSelectedTab("retention")}
					>
						Retention
					</button>
				</div>

				{selectedTab === "overview" && (
					<div className="space-y-6 pt-4">
						{renderOverviewMetrics()}
						{renderUserTable()}
					</div>
				)}

				{selectedTab === "behavior" && (
					<div className="space-y-6 pt-4">
						<div className="card bg-base-100 shadow">
							<div className="card-body py-12 text-center">
								<PieChart size={48} className="mx-auto mb-4 text-base-content/30" />
								<h3 className="mb-2 font-semibold text-lg">
									User Behavior Analysis
								</h3>
								<p className="text-base-content/50">
									Detailed user behavior patterns and insights
								</p>
							</div>
						</div>
					</div>
				)}

				{selectedTab === "retention" && (
					<div className="space-y-6 pt-4">
						<div className="card bg-base-100 shadow">
							<div className="card-body py-12 text-center">
								<Target size={48} className="mx-auto mb-4 text-base-content/30" />
								<h3 className="mb-2 font-semibold text-lg">
									User Retention Analysis
								</h3>
								<p className="text-base-content/50">
									Track user retention and churn patterns
								</p>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* User Detail Modal */}
			{renderUserModal()}
		</div>
	);
}
