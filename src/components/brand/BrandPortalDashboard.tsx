"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	AlertTriangle,
	BarChart3,
	Calendar,
	CheckCircle,
	Clock,
	Download,
	Eye,
	FileText,
	Globe,
	Image as ImageIcon,
	Monitor,
	Palette,
	Printer,
	Share2,
	Smartphone,
	Target,
	TrendingDown,
	TrendingUp,
	Users,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { formatBytes, formatDistanceToNow } from "~/lib/utils";

interface DashboardMetrics {
	totalAssets: number;
	pendingApprovals: number;
	complianceScore: number;
	activeUsers: number;
	recentActivity: ActivityItem[];
	topAssets: AssetUsage[];
	complianceBreakdown: ComplianceBreakdown;
	usageByPlatform: PlatformUsage[];
	trendData: TrendData;
}

interface ActivityItem {
	id: string;
	type: "upload" | "approval" | "download" | "violation" | "guideline_update";
	user: {
		name: string;
		image?: string;
	};
	asset?: {
		name: string;
		type: string;
	};
	timestamp: Date;
	status?: "success" | "warning" | "danger";
}

interface AssetUsage {
	id: string;
	name: string;
	type: string;
	downloadCount: number;
	viewCount: number;
	complianceScore: number;
	lastUsed: Date;
	thumbnailKey?: string;
}

interface ComplianceBreakdown {
	color: { score: number; total: number; passed: number };
	typography: { score: number; total: number; passed: number };
	logo: { score: number; total: number; passed: number };
	spacing: { score: number; total: number; passed: number };
}

interface PlatformUsage {
	platform: string;
	usage: number;
	growth: number;
	icon: string;
}

interface TrendData {
	period: string;
	uploads: number[];
	approvals: number[];
	downloads: number[];
	violations: number[];
	labels: string[];
}

export function BrandPortalDashboard() {
	const [timeRange, setTimeRange] = useState("7d");
	const [selectedTab, setSelectedTab] = useState("overview");

	// Mock data for demonstration
	const mockMetrics: DashboardMetrics = {
		totalAssets: 1247,
		pendingApprovals: 23,
		complianceScore: 87,
		activeUsers: 156,
		recentActivity: [
			{
				id: "1",
				type: "upload",
				user: { name: "Sarah Chen", image: "/avatars/sarah.jpg" },
				asset: { name: "Q4 Campaign Banner", type: "image/png" },
				timestamp: new Date(Date.now() - 10 * 60 * 1000),
				status: "success",
			},
			{
				id: "2",
				type: "approval",
				user: { name: "Mike Johnson", image: "/avatars/mike.jpg" },
				asset: { name: "Product Showcase", type: "image/jpg" },
				timestamp: new Date(Date.now() - 25 * 60 * 1000),
				status: "success",
			},
			{
				id: "3",
				type: "violation",
				user: { name: "Alex Rivera", image: "/avatars/alex.jpg" },
				asset: { name: "Social Media Post", type: "image/png" },
				timestamp: new Date(Date.now() - 45 * 60 * 1000),
				status: "warning",
			},
		],
		topAssets: [
			{
				id: "1",
				name: "Primary Logo Package",
				type: "Brand Asset",
				downloadCount: 342,
				viewCount: 1580,
				complianceScore: 100,
				lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
			},
			{
				id: "2",
				name: "Marketing Banner Template",
				type: "Template",
				downloadCount: 189,
				viewCount: 945,
				complianceScore: 95,
				lastUsed: new Date(Date.now() - 4 * 60 * 60 * 1000),
			},
		],
		complianceBreakdown: {
			color: { score: 92, total: 45, passed: 41 },
			typography: { score: 78, total: 38, passed: 30 },
			logo: { score: 95, total: 28, passed: 27 },
			spacing: { score: 84, total: 33, passed: 28 },
		},
		usageByPlatform: [
			{ platform: "Web", usage: 45, growth: 12, icon: "globe" },
			{ platform: "Mobile", usage: 32, growth: 8, icon: "smartphone" },
			{ platform: "Desktop", usage: 18, growth: -3, icon: "monitor" },
			{ platform: "Print", usage: 5, growth: 2, icon: "printer" },
		],
		trendData: {
			period: "Last 7 days",
			uploads: [12, 15, 8, 22, 18, 25, 19],
			approvals: [8, 12, 6, 18, 14, 20, 16],
			downloads: [145, 167, 134, 198, 176, 203, 189],
			violations: [3, 1, 4, 2, 5, 1, 2],
			labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
		},
	};

	const getActivityIcon = (type: string) => {
		switch (type) {
			case "upload":
				return <ImageIcon size={16} />;
			case "approval":
				return <CheckCircle size={16} />;
			case "download":
				return <Download size={16} />;
			case "violation":
				return <AlertTriangle size={16} />;
			case "guideline_update":
				return <Palette size={16} />;
			default:
				return <FileText size={16} />;
		}
	};

	const getActivityColor = (status?: string) => {
		switch (status) {
			case "success":
				return "success";
			case "warning":
				return "warning";
			case "danger":
				return "danger";
			default:
				return "default";
		}
	};

	const getPlatformIcon = (iconName: string) => {
		switch (iconName) {
			case "globe":
				return <Globe size={16} />;
			case "smartphone":
				return <Smartphone size={16} />;
			case "monitor":
				return <Monitor size={16} />;
			case "printer":
				return <Printer size={16} />;
			default:
				return <FileText size={16} />;
		}
	};

	const getComplianceColor = (score: number) => {
		if (score >= 90) return "success";
		if (score >= 70) return "warning";
		return "danger";
	};

	const getTrendIcon = (growth: number) => {
		return growth >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />;
	};

	const getTrendColor = (growth: number) => {
		return growth >= 0 ? "success" : "danger";
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-bold text-2xl">Brand Portal Dashboard</h1>
					<p className="text-base-content/60 text-sm">
						Monitor brand compliance and asset usage
					</p>
				</div>
				<div className="flex gap-2">
					<select
						className="select select-bordered select-sm w-32"
						value={timeRange}
						onChange={(e) => setTimeRange(e.target.value)}
					>
						<option value="24h">Last 24h</option>
						<option value="7d">Last 7 days</option>
						<option value="30d">Last 30 days</option>
						<option value="90d">Last 90 days</option>
					</select>
					<button className="btn btn-outline gap-2">
						<Download size={16} />
						Export
					</button>
				</div>
			</div>

			{/* Key Metrics */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<div className="card bg-base-100 shadow">
					<div className="card-body space-y-2 p-4">
						<div className="flex items-center gap-2">
							<ImageIcon size={16} className="text-primary" />
							<span className="font-medium text-sm">Total Assets</span>
						</div>
						<div className="flex items-end justify-between">
							<p className="font-bold text-2xl">
								{mockMetrics.totalAssets.toLocaleString()}
							</p>
							<div className="flex items-center gap-1 text-sm text-success">
								<TrendingUp size={12} />
								<span>+12%</span>
							</div>
						</div>
					</div>
				</div>

				<div className="card bg-base-100 shadow">
					<div className="card-body space-y-2 p-4">
						<div className="flex items-center gap-2">
							<Clock size={16} className="text-warning" />
							<span className="font-medium text-sm">Pending Approvals</span>
						</div>
						<div className="flex items-end justify-between">
							<p className="font-bold text-2xl">
								{mockMetrics.pendingApprovals}
							</p>
							<div className="flex items-center gap-1 text-sm text-warning">
								<TrendingUp size={12} />
								<span>+3</span>
							</div>
						</div>
					</div>
				</div>

				<div className="card bg-base-100 shadow">
					<div className="card-body space-y-2 p-4">
						<div className="flex items-center gap-2">
							<Target size={16} className="text-success" />
							<span className="font-medium text-sm">Compliance Score</span>
						</div>
						<div className="flex items-end justify-between">
							<p className="font-bold text-2xl">
								{mockMetrics.complianceScore}%
							</p>
							<div className="flex items-center gap-1 text-sm text-success">
								<TrendingUp size={12} />
								<span>+5%</span>
							</div>
						</div>
					</div>
				</div>

				<div className="card bg-base-100 shadow">
					<div className="card-body space-y-2 p-4">
						<div className="flex items-center gap-2">
							<Users size={16} className="text-secondary" />
							<span className="font-medium text-sm">Active Users</span>
						</div>
						<div className="flex items-end justify-between">
							<p className="font-bold text-2xl">{mockMetrics.activeUsers}</p>
							<div className="flex items-center gap-1 text-sm text-success">
								<TrendingUp size={12} />
								<span>+8%</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Left Column - 2/3 width */}
				<div className="space-y-6 lg:col-span-2">
					{/* Compliance Breakdown */}
					<div className="card bg-base-100 shadow">
						<div className="card-header">
							<h3 className="font-semibold text-lg">
								Brand Compliance Breakdown
							</h3>
						</div>
						<div className="card-body space-y-4">
							{Object.entries(mockMetrics.complianceBreakdown).map(
								([category, data]) => (
									<div key={category} className="space-y-2">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												{category === "color" && <Palette size={16} />}
												{category === "typography" && <FileText size={16} />}
												{category === "logo" && <ImageIcon size={16} />}
												{category === "spacing" && <BarChart3 size={16} />}
												<span className="font-medium capitalize">
													{category}
												</span>
											</div>
											<div className="text-right">
												<span
													className={`font-bold text-${getComplianceColor(data.score)}`}
												>
													{data.score}%
												</span>
												<p className="text-base-content/60 text-xs">
													{data.passed}/{data.total} passed
												</p>
											</div>
										</div>
										<progress
											className={`progress w-full h-2 ${
												getComplianceColor(data.score) === "success" ? "progress-success" :
												getComplianceColor(data.score) === "warning" ? "progress-warning" :
												"progress-error"
											}`}
											value={data.score}
											max="100"
										></progress>
									</div>
								),
							)}
						</div>
					</div>

					{/* Platform Usage */}
					<div className="card bg-base-100 shadow">
						<div className="card-header">
							<h3 className="font-semibold text-lg">Usage by Platform</h3>
						</div>
						<div className="card-body">
							<div className="grid grid-cols-2 gap-4">
								{mockMetrics.usageByPlatform.map((platform) => (
									<div key={platform.platform} className="space-y-2">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												{getPlatformIcon(platform.icon)}
												<span className="font-medium">{platform.platform}</span>
											</div>
											<div className="flex items-center gap-1">
												{getTrendIcon(platform.growth)}
												<span
													className={`text-sm ${getTrendColor(platform.growth) === "success" ? "text-success" : "text-error"}`}
												>
													{platform.growth > 0 ? "+" : ""}
													{platform.growth}%
												</span>
											</div>
										</div>
										<div className="relative">
											<progress
												className="progress progress-primary w-full h-2"
												value={platform.usage}
												max="100"
											></progress>
											<span className="absolute right-0 top-0 text-xs font-medium">
												{platform.usage}%
											</span>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Top Assets */}
					<div className="card bg-base-100 shadow">
						<div className="card-header flex justify-between">
							<h3 className="font-semibold text-lg">Top Assets</h3>
							<button className="btn btn-sm btn-outline">
								View All
							</button>
						</div>
						<div className="card-body">
							<div className="space-y-4">
								{mockMetrics.topAssets.map((asset) => (
									<div key={asset.id} className="flex items-center gap-4">
										<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-base-300 bg-base-200">
											{asset.thumbnailKey ? (
												<img
													src={`/api/assets/serve/${asset.thumbnailKey}`}
													alt={asset.name}
													className="h-full w-full rounded-lg object-cover"
												/>
											) : (
												<ImageIcon size={20} className="text-base-content/40" />
											)}
										</div>
										<div className="min-w-0 flex-1">
											<h4 className="truncate font-medium">{asset.name}</h4>
											<p className="text-base-content/60 text-sm">
												{asset.type}
											</p>
											<div className="flex items-center gap-4 text-base-content/40 text-xs">
												<span>{asset.downloadCount} downloads</span>
												<span>{asset.viewCount} views</span>
												<span>
													Updated {formatDistanceToNow(asset.lastUsed)} ago
												</span>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<span
												className={`badge badge-sm ${
													getComplianceColor(asset.complianceScore) === "success" ? "badge-success" :
													getComplianceColor(asset.complianceScore) === "warning" ? "badge-warning" :
													"badge-error"
												}`}
											>
												{asset.complianceScore}%
											</span>
											<button className="btn btn-sm btn-ghost btn-square">
												<Eye size={14} />
											</button>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Right Column - 1/3 width */}
				<div className="space-y-6">
					{/* Quick Actions */}
					<div className="card bg-base-100 shadow">
						<div className="card-header">
							<h3 className="font-semibold">Quick Actions</h3>
						</div>
						<div className="card-body space-y-3">
							<button className="btn btn-outline w-full justify-start gap-2">
								<ImageIcon size={16} />
								Upload New Asset
							</button>
							<button className="btn btn-outline w-full justify-start gap-2">
								<Palette size={16} />
								Create Guidelines
							</button>
							<button className="btn btn-outline w-full justify-start gap-2">
								<CheckCircle size={16} />
								Review Approvals
							</button>
							<button className="btn btn-outline w-full justify-start gap-2">
								<Zap size={16} />
								Run Compliance Check
							</button>
						</div>
					</div>

					{/* Recent Activity */}
					<div className="card bg-base-100 shadow">
						<div className="card-header flex justify-between">
							<h3 className="font-semibold">Recent Activity</h3>
							<button className="btn btn-sm btn-outline">
								View All
							</button>
						</div>
						<div className="card-body">
							<div className="space-y-4">
								{mockMetrics.recentActivity.map((activity) => (
									<div key={activity.id} className="flex items-start gap-3">
										<div className="avatar flex-shrink-0">
											<div className="w-8 h-8 rounded-full">
												{activity.user.image ? (
													<img src={activity.user.image} alt={activity.user.name} />
												) : (
													<div className="bg-base-300 flex items-center justify-center h-full w-full rounded-full">
														<span className="text-sm font-medium">
															{activity.user.name?.charAt(0)?.toUpperCase()}
														</span>
													</div>
												)}
											</div>
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												{getActivityIcon(activity.type)}
												<span className={`badge badge-sm ${
													getActivityColor(activity.status) === "success" ? "badge-success" :
													getActivityColor(activity.status) === "warning" ? "badge-warning" :
													getActivityColor(activity.status) === "danger" ? "badge-error" :
													"badge-neutral"
												}`}>
													{activity.type.replace("_", " ")}
												</span>
											</div>
											<p className="mt-1 text-sm">
												<span className="font-medium">
													{activity.user.name}
												</span>
												{activity.asset && (
													<span className="text-base-content/60">
														{" "}
														on {activity.asset.name}
													</span>
												)}
											</p>
											<p className="text-base-content/40 text-xs">
												{formatDistanceToNow(activity.timestamp)} ago
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Notifications */}
					<div className="card bg-base-100 shadow">
						<div className="card-header">
							<h3 className="font-semibold">Notifications</h3>
						</div>
						<div className="card-body">
							<div className="space-y-3">
								<div className="flex items-start gap-3 rounded-lg border border-warning-200 bg-warning-50 p-3">
									<AlertTriangle
										size={16}
										className="mt-0.5 flex-shrink-0 text-warning"
									/>
									<div>
										<p className="font-medium text-sm">
											23 assets pending approval
										</p>
										<p className="text-base-content/60 text-xs">
											Some approaching deadline
										</p>
									</div>
								</div>
								<div className="flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50 p-3">
									<AlertTriangle
										size={16}
										className="mt-0.5 flex-shrink-0 text-danger"
									/>
									<div>
										<p className="font-medium text-sm">
											3 compliance violations
										</p>
										<p className="text-base-content/60 text-xs">
											Require immediate attention
										</p>
									</div>
								</div>
								<div className="flex items-start gap-3 rounded-lg border border-success-200 bg-success-50 p-3">
									<CheckCircle
										size={16}
										className="mt-0.5 flex-shrink-0 text-success"
									/>
									<div>
										<p className="font-medium text-sm">Guidelines updated</p>
										<p className="text-base-content/60 text-xs">
											Brand 2.0 now active
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
