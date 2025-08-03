"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	Activity,
	AlertCircle,
	ArrowUpRight,
	BarChart3,
	Bell,
	Calendar,
	CheckCircle,
	Clock,
	Download,
	Eye,
	FileImage,
	FolderOpen,
	PieChart,
	Plus,
	Search,
	Settings,
	Star,
	TrendingUp,
	Users,
} from "lucide-react";
import { useState } from "react";
// Metadata removed from client component - handled by layout or server component

// Mock data
const dashboardStats = {
	totalAssets: 1234,
	totalCollections: 56,
	storageUsed: 75,
	storageTotal: "100GB",
	recentUploads: 42,
	pendingApprovals: 7,
};

const recentAssets = [
	{
		id: 1,
		name: "Summer Campaign Banner.jpg",
		size: "2.4 MB",
		uploadedAt: "2 hours ago",
		status: "approved",
	},
	{
		id: 2,
		name: "Product Launch Video.mp4",
		size: "45.8 MB",
		uploadedAt: "5 hours ago",
		status: "pending",
	},
	{
		id: 3,
		name: "Brand Guidelines.pdf",
		size: "8.2 MB",
		uploadedAt: "1 day ago",
		status: "approved",
	},
	{
		id: 4,
		name: "Logo Variations.zip",
		size: "12.5 MB",
		uploadedAt: "2 days ago",
		status: "approved",
	},
];

const recentActivity = [
	{
		id: 1,
		user: "John Doe",
		action: "uploaded",
		target: "Marketing Presentation.pdf",
		timestamp: "10 minutes ago",
		avatar: null,
	},
	{
		id: 2,
		user: "Jane Smith",
		action: "approved",
		target: "Summer Campaign Assets",
		timestamp: "1 hour ago",
		avatar: null,
	},
	{
		id: 3,
		user: "Mike Johnson",
		action: "created collection",
		target: "Q4 2024 Campaign",
		timestamp: "3 hours ago",
		avatar: null,
	},
	{
		id: 4,
		user: "Sarah Williams",
		action: "shared",
		target: "Brand Guidelines",
		timestamp: "5 hours ago",
		avatar: null,
	},
];

const topCollections = [
	{
		id: 1,
		name: "2024 Marketing Campaign",
		assetCount: 145,
		contributors: 8,
		lastUpdated: "Updated 2 hours ago",
	},
	{
		id: 2,
		name: "Product Photography",
		assetCount: 298,
		contributors: 12,
		lastUpdated: "Updated 1 day ago",
	},
	{
		id: 3,
		name: "Brand Guidelines",
		assetCount: 67,
		contributors: 5,
		lastUpdated: "Updated 3 days ago",
	},
	{
		id: 4,
		name: "Social Media Assets",
		assetCount: 412,
		contributors: 15,
		lastUpdated: "Updated 1 week ago",
	},
	{
		id: 5,
		name: "Video Content",
		assetCount: 89,
		contributors: 6,
		lastUpdated: "Updated 2 weeks ago",
	},
	{
		id: 6,
		name: "Print Materials",
		assetCount: 156,
		contributors: 9,
		lastUpdated: "Updated 1 month ago",
	},
];

const notifications = [
	{
		id: 1,
		type: "approval",
		title: "Asset Approval Required",
		message: "3 new assets are waiting for your approval",
		timestamp: "5 minutes ago",
		isRead: false,
	},
	{
		id: 2,
		type: "info",
		title: "Storage Alert",
		message: "You've used 75% of your storage quota",
		timestamp: "1 hour ago",
		isRead: false,
	},
	{
		id: 3,
		type: "success",
		title: "Upload Complete",
		message: "Your bulk upload of 25 assets has completed",
		timestamp: "2 hours ago",
		isRead: true,
	},
	{
		id: 4,
		type: "info",
		title: "New Team Member",
		message: "Alex Chen has joined your workspace",
		timestamp: "1 day ago",
		isRead: true,
	},
];

export default function DashboardPage() {
	const [selectedTab, setSelectedTab] = useState("overview");

	return (
		<div className="space-y-6">
				{/* Dashboard Header */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="font-bold text-3xl">Dashboard</h1>
						<p className="mt-1 text-default-500">
							Welcome back! Here's what's happening with your brand assets.
						</p>
					</div>
					<div className="flex gap-3">
						<button className="btn btn-ghost gap-2">
							<Search size={18} />
							Search
						</button>
						<button className="btn btn-primary gap-2">
							<Plus size={18} />
							Upload Asset
						</button>
					</div>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
					<div className="card bg-base-100 shadow">
						<div className="card-body">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-base-content/60 text-sm">Total Assets</p>
									<p className="mt-1 font-semibold text-2xl">
										{dashboardStats.totalAssets.toLocaleString()}
									</p>
								</div>
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
									<FileImage className="text-primary" size={24} />
								</div>
							</div>
							<div className="mt-3 flex items-center gap-1">
								<TrendingUp className="text-success" size={16} />
								<span className="text-success text-sm">+12.5%</span>
								<span className="text-base-content/60 text-sm">from last month</span>
							</div>
						</div>
					</div>

					<div className="card bg-base-100 shadow">
						<div className="card-body">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-base-content/60 text-sm">Collections</p>
									<p className="mt-1 font-semibold text-2xl">
										{dashboardStats.totalCollections}
									</p>
								</div>
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
									<FolderOpen className="text-secondary" size={24} />
								</div>
							</div>
							<div className="mt-3 flex items-center gap-1">
								<TrendingUp className="text-success" size={16} />
								<span className="text-success text-sm">+8.3%</span>
								<span className="text-base-content/60 text-sm">from last month</span>
							</div>
						</div>
					</div>

					<div className="card bg-base-100 shadow">
						<div className="card-body">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-base-content/60 text-sm">Recent Uploads</p>
									<p className="mt-1 font-semibold text-2xl">
										{dashboardStats.recentUploads}
									</p>
								</div>
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
									<Download className="text-accent" size={24} />
								</div>
							</div>
							<div className="mt-3 text-base-content/60 text-sm">Last 7 days</div>
						</div>
					</div>

					<div className="card bg-base-100 shadow">
						<div className="card-body">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-base-content/60 text-sm">Pending Approvals</p>
									<p className="mt-1 font-semibold text-2xl">
										{dashboardStats.pendingApprovals}
									</p>
								</div>
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
									<Clock className="text-warning" size={24} />
								</div>
							</div>
							<button className="mt-3 text-primary text-sm hover:underline">
								Review now →
							</button>
						</div>
					</div>
				</div>

				{/* Main Content Tabs */}
				<div className="card bg-base-100 shadow">
					<div className="card-body p-0">
						<div role="tablist" className="tabs tabs-lifted w-full">
							<input
								type="radio"
								name="dashboard_tabs"
								role="tab"
								className="tab"
								aria-label="Overview"
								checked={selectedTab === "overview"}
								onChange={() => setSelectedTab("overview")}
							/>
							<input
								type="radio"
								name="dashboard_tabs"
								role="tab"
								className="tab"
								aria-label="Recent Activity"
								checked={selectedTab === "recent"}
								onChange={() => setSelectedTab("recent")}
							/>
							<input
								type="radio"
								name="dashboard_tabs"
								role="tab"
								className="tab"
								aria-label="Top Collections"
								checked={selectedTab === "collections"}
								onChange={() => setSelectedTab("collections")}
							/>
							<input
								type="radio"
								name="dashboard_tabs"
								role="tab"
								className="tab"
								aria-label="Notifications"
								checked={selectedTab === "notifications"}
								onChange={() => setSelectedTab("notifications")}
							/>
							
							{/* Tab Panels */}
							{selectedTab === "overview" && (
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									{/* Storage Usage */}
									<div>
										<div className="mb-3 flex items-center justify-between">
											<h4 className="font-semibold text-medium">
												Storage Usage
											</h4>
											<span className="text-base-content/60 text-sm">
												{dashboardStats.storageUsed}% of{" "}
												{dashboardStats.storageTotal}
											</span>
										</div>
										<progress
											className={`progress w-full mb-2 ${
												dashboardStats.storageUsed > 80 ? "progress-error" : "progress-primary"
											}`}
											value={dashboardStats.storageUsed}
											max="100"
										></progress>
										<p className="text-base-content/60 text-sm">
											{dashboardStats.storageUsed > 80
												? "Storage is running low. Consider upgrading your plan."
												: "Storage usage is healthy."}
										</p>
									</div>

									<div className="divider"></div>

									{/* Charts Placeholder */}
									<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
										<div>
											<h4 className="mb-4 font-semibold text-medium">
												Upload Trends
											</h4>
											<div className="flex h-48 items-center justify-center rounded-lg bg-base-200">
												<div className="text-center">
													<PieChart
														className="mx-auto mb-2 text-base-content/60"
														size={32}
													/>
													<p className="text-base-content/60 text-sm">
														Upload trends chart
													</p>
													<p className="text-base-content/60 text-tiny">
														Chart visualization here
													</p>
												</div>
											</div>
										</div>
										<div>
											<h4 className="mb-4 font-semibold text-medium">
												Download Activity
											</h4>
											<div className="flex h-48 items-center justify-center rounded-lg bg-base-200">
												<div className="text-center">
													<BarChart3
														className="mx-auto mb-2 text-base-content/60"
														size={32}
													/>
													<p className="text-base-content/60 text-sm">
														Download activity chart
													</p>
													<p className="text-base-content/60 text-tiny">
														Chart visualization here
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>
							)}

							{selectedTab === "recent" && (
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
										{/* Recent Assets */}
										<div>
											<div className="mb-4 flex items-center justify-between">
												<h4 className="font-semibold text-medium">
													Recent Assets
												</h4>
												<button
													className="btn btn-sm btn-ghost"
												>
													View All
													<ArrowUpRight size={14} />
												</button>
											</div>
											<div className="space-y-3">
												{recentAssets.map((asset) => (
													<div key={asset.id} className="card bg-base-100 shadow">
														<div className="card-body">
															<div className="flex items-center gap-3">
																<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-default-100">
																	<FileImage
																		size={20}
																		className="text-default-500"
																	/>
																</div>
																<div className="min-w-0 flex-1">
																	<h5 className="truncate font-medium">
																		{asset.name}
																	</h5>
																	<div className="mt-1 flex items-center gap-2">
																		<span className="text-base-content/60 text-sm">
																			{asset.size}
																		</span>
																		<span className="text-base-content/60 text-sm">
																			•
																		</span>
																		<span className="text-base-content/60 text-sm">
																			{asset.uploadedAt}
																		</span>
																	</div>
																</div>
																<span
																	className={`badge badge-sm ${
																		asset.status === "approved"
																			? "badge-success"
																			: "badge-warning"
																	}`}
																>
																	{asset.status}
																</span>
															</div>
														</div>
													</div>
												))}
											</div>
										</div>

										{/* Activity Feed */}
										<div>
											<div className="mb-4 flex items-center justify-between">
												<h4 className="font-semibold text-medium">
													Activity Feed
												</h4>
												<button
													className="btn btn-sm btn-ghost"
												>
													View All
													<ArrowUpRight size={14} />
												</button>
											</div>
											<div className="space-y-3">
												{recentActivity.map((activity) => (
													<div
														key={activity.id}
														className="flex items-start gap-3"
													>
														<div className="avatar">
															<div className="w-8 rounded-full">
																{activity.avatar ? (
																	<img src={activity.avatar} alt={activity.user} />
																) : (
																	<div className="flex h-8 w-8 items-center justify-center rounded-full bg-base-300">
																		<span className="text-base-content text-sm font-medium">
																			{activity.user?.charAt(0)?.toUpperCase() || 'U'}
																		</span>
																	</div>
																)}
															</div>
														</div>
														<div className="min-w-0 flex-1">
															<p className="text-small">
																<span className="font-medium">
																	{activity.user}
																</span>{" "}
																<span className="text-default-500">
																	{activity.action}
																</span>{" "}
																<span className="font-medium">
																	{activity.target}
																</span>
															</p>
															<p className="mt-1 text-base-content/60 text-tiny">
																{activity.timestamp}
															</p>
														</div>
													</div>
												))}
											</div>
										</div>
									</div>
								</div>
							)}

							{selectedTab === "collections" && (
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
										{topCollections.map((collection) => (
											<div key={collection.id} className="card bg-base-100 shadow cursor-pointer hover:shadow-md">
												<div className="card-body">
													<div className="flex items-start gap-3">
														<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-default-100">
															<FolderOpen
																size={20}
																className="text-default-500"
															/>
														</div>
														<div className="min-w-0 flex-1">
															<h5 className="truncate font-medium">
																{collection.name}
															</h5>
															<div className="mt-2 flex items-center gap-4">
																<div className="flex items-center gap-1">
																	<FileImage
																		size={14}
																		className="text-base-content/60"
																	/>
																	<span className="text-base-content/60 text-sm">
																		{collection.assetCount}
																	</span>
																</div>
																<div className="flex items-center gap-1">
																	<Users
																		size={14}
																		className="text-base-content/60"
																	/>
																	<span className="text-base-content/60 text-sm">
																		{collection.contributors}
																	</span>
																</div>
															</div>
															<p className="mt-2 text-base-content/60 text-tiny">
																{collection.lastUpdated}
															</p>
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{selectedTab === "notifications" && (
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									<div className="space-y-3">
										{notifications.map((notification) => (
											<div key={notification.id} className="card bg-base-100 shadow">
												<div className="card-body">
													<div className="flex items-start gap-3">
														<div
															className={`flex h-8 w-8 items-center justify-center rounded-full ${
																notification.type === "approval"
																	? "bg-warning/10"
																	: notification.type === "info"
																		? "bg-primary/10"
																		: "bg-success/10"
															}`}
														>
															{notification.type === "approval" ? (
																<Clock size={16} className="text-warning" />
															) : notification.type === "info" ? (
																<AlertCircle
																	size={16}
																	className="text-primary"
																/>
															) : (
																<CheckCircle
																	size={16}
																	className="text-success"
																/>
															)}
														</div>
														<div className="min-w-0 flex-1">
															<div className="flex items-start justify-between">
																<div>
																	<h5 className="font-medium">
																		{notification.title}
																	</h5>
																	<p className="mt-1 text-base-content/60 text-sm">
																		{notification.message}
																	</p>
																	<p className="mt-2 text-base-content/60 text-tiny">
																		{notification.timestamp}
																	</p>
																</div>
																{!notification.isRead && (
																	<div className="h-2 w-2 rounded-full bg-primary" />
																)}
															</div>
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
		</div>
	);
}