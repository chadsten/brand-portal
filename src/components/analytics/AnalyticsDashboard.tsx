"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	Activity,
	BarChart3,
	Calendar,
	Download,
	ExternalLink,
	Eye,
	FileText,
	Filter,
	Heart,
	LineChart,
	PieChart,
	RefreshCw,
	Share2,
	TrendingDown,
	TrendingUp,
	Users,
} from "lucide-react";
import { useState } from "react";

interface MetricData {
	value: number;
	change: number;
	trend: "up" | "down" | "stable";
	period: string;
}

interface ChartData {
	labels: string[];
	datasets: {
		label: string;
		data: number[];
		color: string;
	}[];
}

interface AnalyticsDashboardProps {
	dateRange: "7d" | "30d" | "90d" | "1y";
	onDateRangeChange: (range: "7d" | "30d" | "90d" | "1y") => void;
}

const MOCK_METRICS = {
	totalAssets: {
		value: 12847,
		change: 12.3,
		trend: "up" as const,
		period: "vs last month",
	},
	activeUsers: {
		value: 3421,
		change: 8.7,
		trend: "up" as const,
		period: "vs last month",
	},
	downloads: {
		value: 89432,
		change: -2.1,
		trend: "down" as const,
		period: "vs last month",
	},
	views: {
		value: 234567,
		change: 15.2,
		trend: "up" as const,
		period: "vs last month",
	},
	collections: {
		value: 456,
		change: 5.8,
		trend: "up" as const,
		period: "vs last month",
	},
	shares: {
		value: 1234,
		change: 22.4,
		trend: "up" as const,
		period: "vs last month",
	},
};

const MOCK_CHART_DATA: ChartData = {
	labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
	datasets: [
		{
			label: "Asset Views",
			data: [12000, 15000, 18000, 22000, 25000, 28000, 31000],
			color: "#0070f3",
		},
		{
			label: "Downloads",
			data: [8000, 9500, 11000, 13500, 15000, 17000, 19000],
			color: "#7c3aed",
		},
	],
};

const TOP_ASSETS = [
	{
		id: "1",
		name: "Brand Logo Primary",
		views: 15420,
		downloads: 3240,
		category: "Logo",
	},
	{
		id: "2",
		name: "Marketing Template Q3",
		views: 12890,
		downloads: 2890,
		category: "Template",
	},
	{
		id: "3",
		name: "Product Shot - Hero",
		views: 11234,
		downloads: 2567,
		category: "Photography",
	},
	{
		id: "4",
		name: "Brand Guidelines 2024",
		views: 9876,
		downloads: 1987,
		category: "Guidelines",
	},
	{
		id: "5",
		name: "Social Media Kit",
		views: 8765,
		downloads: 1876,
		category: "Social",
	},
];

const USER_ACTIVITY = [
	{
		id: "1",
		name: "Sarah Chen",
		action: "Downloaded",
		asset: "Brand Logo Primary",
		time: "2 minutes ago",
	},
	{
		id: "2",
		name: "Mike Johnson",
		action: "Shared",
		asset: "Marketing Template Q3",
		time: "5 minutes ago",
	},
	{
		id: "3",
		name: "Alex Rivera",
		action: "Viewed",
		asset: "Product Shot - Hero",
		time: "8 minutes ago",
	},
	{
		id: "4",
		name: "Emma Wilson",
		action: "Liked",
		asset: "Brand Guidelines 2024",
		time: "12 minutes ago",
	},
	{
		id: "5",
		name: "David Kim",
		action: "Downloaded",
		asset: "Social Media Kit",
		time: "15 minutes ago",
	},
];

export function AnalyticsDashboard({
	dateRange,
	onDateRangeChange,
}: AnalyticsDashboardProps) {
	const [selectedTab, setSelectedTab] = useState("overview");
	const [isRefreshing, setIsRefreshing] = useState(false);

	const handleRefresh = () => {
		setIsRefreshing(true);
		setTimeout(() => setIsRefreshing(false), 2000);
	};

	const formatNumber = (num: number) => {
		if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
		if (num >= 1000) return (num / 1000).toFixed(1) + "K";
		return num.toString();
	};

	const renderMetricCard = (
		title: string,
		icon: React.ReactNode,
		data: MetricData,
	) => (
		<div className="card bg-base-100 shadow">
			<div className="card-body p-6">
				<div className="mb-4 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="rounded-lg bg-primary/10 p-2">{icon}</div>
						<div>
							<p className="text-base-content/50 text-sm">{title}</p>
							<p className="font-bold text-2xl">{formatNumber(data.value)}</p>
						</div>
					</div>
					<div className="text-right">
						<div
							className={`flex items-center gap-1 ${
								data.trend === "up"
									? "text-success"
									: data.trend === "down"
										? "text-error"
										: "text-base-content/40"
							}`}
						>
							{data.trend === "up" ? (
								<TrendingUp size={16} />
							) : data.trend === "down" ? (
								<TrendingDown size={16} />
							) : (
								<Activity size={16} />
							)}
							<span className="font-medium text-sm">
								{data.change > 0 ? "+" : ""}
								{data.change.toFixed(1)}%
							</span>
						</div>
						<p className="text-base-content/40 text-xs">{data.period}</p>
					</div>
				</div>
			</div>
		</div>
	);

	const renderChart = () => (
		<div className="card bg-base-100 shadow">
			<div className="card-header p-6 pb-0 flex justify-between">
				<div>
					<h3 className="font-semibold text-lg">Usage Trends</h3>
					<p className="text-base-content/50 text-sm">
						Asset views and downloads over time
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
					<button
						className="btn btn-sm btn-square btn-ghost"
						onClick={handleRefresh}
						disabled={isRefreshing}
					>
						{isRefreshing ? (
							<span className="loading loading-spinner loading-sm"></span>
						) : (
							<RefreshCw size={16} />
						)}
					</button>
				</div>
			</div>
			<div className="card-body">
				<div className="flex h-64 items-center justify-center rounded-lg bg-base-200">
					<div className="text-center">
						<BarChart3 size={48} className="mx-auto mb-2 text-base-content/30" />
						<p className="text-base-content/50 text-sm">
							Chart visualization would render here
						</p>
						<p className="text-base-content/40 text-xs">
							Integration with charting library needed
						</p>
					</div>
				</div>
				<div className="mt-4 flex justify-center gap-6">
					{MOCK_CHART_DATA.datasets.map((dataset, index) => (
						<div key={index} className="flex items-center gap-2">
							<div
								className="h-3 w-3 rounded-full"
								style={{ backgroundColor: dataset.color }}
							/>
							<span className="text-sm">{dataset.label}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);

	const renderTopAssets = () => (
		<div className="card bg-base-100 shadow">
			<div className="card-header p-6 pb-0">
				<div className="flex w-full items-center justify-between">
					<div>
						<h3 className="font-semibold text-lg">Top Performing Assets</h3>
						<p className="text-base-content/50 text-sm">
							Most viewed and downloaded assets
						</p>
					</div>
					<button className="btn btn-sm btn-ghost">
						View All
						<ExternalLink size={14} />
					</button>
				</div>
			</div>
			<div className="card-body p-0">
				{TOP_ASSETS.map((asset, index) => (
					<div
						key={asset.id}
						className={`p-4 ${index < TOP_ASSETS.length - 1 ? "border-base-300 border-b" : ""}`}
					>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
									<span className="font-bold text-primary text-sm">
										#{index + 1}
									</span>
								</div>
								<div>
									<h4 className="font-medium">{asset.name}</h4>
									<div className="mt-1 flex items-center gap-2">
										<span className="badge badge-sm badge-primary badge-outline">
											{asset.category}
										</span>
									</div>
								</div>
							</div>
							<div className="text-right">
								<div className="flex items-center gap-4 text-base-content/50 text-sm">
									<div className="flex items-center gap-1">
										<Eye size={14} />
										<span>{formatNumber(asset.views)}</span>
									</div>
									<div className="flex items-center gap-1">
										<Download size={14} />
										<span>{formatNumber(asset.downloads)}</span>
									</div>
								</div>
								<div className="mt-1">
									<progress 
										className="progress progress-success progress-sm w-20" 
										value={(asset.downloads / asset.views) * 100} 
										max={100}
									></progress>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);

	const renderUserActivity = () => (
		<div className="card bg-base-100 shadow">
			<div className="card-header p-6 pb-0">
				<div>
					<h3 className="font-semibold text-lg">Recent Activity</h3>
					<p className="text-base-content/50 text-sm">Live user interactions</p>
				</div>
			</div>
			<div className="card-body p-0">
				{USER_ACTIVITY.map((activity, index) => (
					<div
						key={activity.id}
						className={`p-4 ${index < USER_ACTIVITY.length - 1 ? "border-base-300 border-b" : ""}`}
					>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-base-200">
									<span className="font-medium text-sm">
										{activity.name
											.split(" ")
											.map((n) => n[0])
											.join("")}
									</span>
								</div>
								<div>
									<p className="text-sm">
										<span className="font-medium">{activity.name}</span>
										<span className="text-base-content/50">
											{" "}
											{activity.action.toLowerCase()}{" "}
										</span>
										<span className="font-medium">{activity.asset}</span>
									</p>
									<p className="text-base-content/40 text-xs">{activity.time}</p>
								</div>
							</div>
							<div className="flex items-center gap-1">
								{activity.action === "Downloaded" && (
									<Download size={14} className="text-primary" />
								)}
								{activity.action === "Shared" && (
									<Share2 size={14} className="text-success" />
								)}
								{activity.action === "Viewed" && (
									<Eye size={14} className="text-base-content/40" />
								)}
								{activity.action === "Liked" && (
									<Heart size={14} className="text-error" />
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl">Analytics Dashboard</h1>
					<p className="text-base-content/50">
						Track usage, performance, and engagement metrics
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button className="btn btn-ghost">
						<Calendar size={16} />
						Custom Range
					</button>
					<button className="btn btn-ghost">
						<Filter size={16} />
						Filters
					</button>
				</div>
			</div>

			{/* Metrics Overview */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{renderMetricCard(
					"Total Assets",
					<FileText size={20} className="text-primary" />,
					MOCK_METRICS.totalAssets,
				)}
				{renderMetricCard(
					"Active Users",
					<Users size={20} className="text-success" />,
					MOCK_METRICS.activeUsers,
				)}
				{renderMetricCard(
					"Downloads",
					<Download size={20} className="text-warning" />,
					MOCK_METRICS.downloads,
				)}
				{renderMetricCard(
					"Views",
					<Eye size={20} className="text-secondary" />,
					MOCK_METRICS.views,
				)}
				{renderMetricCard(
					"Collections",
					<Heart size={20} className="text-danger" />,
					MOCK_METRICS.collections,
				)}
				{renderMetricCard(
					"Shares",
					<Share2 size={20} className="text-primary" />,
					MOCK_METRICS.shares,
				)}
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
						className={`tab ${selectedTab === "assets" ? "tab-active" : ""}`}
						onClick={() => setSelectedTab("assets")}
					>
						Asset Performance
					</button>
					<button 
						className={`tab ${selectedTab === "users" ? "tab-active" : ""}`}
						onClick={() => setSelectedTab("users")}
					>
						User Engagement
					</button>
					<button 
						className={`tab ${selectedTab === "reports" ? "tab-active" : ""}`}
						onClick={() => setSelectedTab("reports")}
					>
						Reports
					</button>
				</div>

				{selectedTab === "overview" && (
					<div className="space-y-6 pt-4">
						{/* Chart */}
						{renderChart()}

						{/* Split Layout */}
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
							{renderTopAssets()}
							{renderUserActivity()}
						</div>
					</div>
				)}

				{selectedTab === "assets" && (
					<div className="space-y-6 pt-4">
						<div className="card bg-base-100 shadow">
							<div className="card-body py-12 text-center">
								<PieChart size={48} className="mx-auto mb-4 text-base-content/30" />
								<h3 className="mb-2 font-semibold text-lg">
									Asset Performance Analytics
								</h3>
								<p className="text-base-content/50">
									Detailed asset performance metrics and insights
								</p>
							</div>
						</div>
					</div>
				)}

				{selectedTab === "users" && (
					<div className="space-y-6 pt-4">
						<div className="card bg-base-100 shadow">
							<div className="card-body py-12 text-center">
								<Activity size={48} className="mx-auto mb-4 text-base-content/30" />
								<h3 className="mb-2 font-semibold text-lg">
									User Engagement Analytics
								</h3>
								<p className="text-base-content/50">
									Track user behavior and engagement patterns
								</p>
							</div>
						</div>
					</div>
				)}

				{selectedTab === "reports" && (
					<div className="space-y-6 pt-4">
						<div className="card bg-base-100 shadow">
							<div className="card-body py-12 text-center">
								<LineChart
									size={48}
									className="mx-auto mb-4 text-base-content/30"
								/>
								<h3 className="mb-2 font-semibold text-lg">Custom Reports</h3>
								<p className="text-base-content/50">
									Generate and export custom analytics reports
								</p>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
