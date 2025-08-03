"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	Activity,
	ArrowUpRight,
	BarChart3,
	Download,
	Eye,
	FileImage,
	LineChart,
	PieChart,
	Search,
	Share,
	Star,
	TrendingDown,
	TrendingUp,
	Users,
} from "lucide-react";
import { useState } from "react";
import { AppLayout } from "~/components/layout/AppLayout";

// Mock analytics data
const overviewStats = {
	totalAssets: 2847,
	totalDownloads: 15420,
	activeUsers: 1247,
	storageUsed: 78.5,
	monthlyGrowth: {
		assets: { value: 12.5, trend: "up" },
		downloads: { value: 8.3, trend: "up" },
		users: { value: -2.1, trend: "down" },
		storage: { value: 15.7, trend: "up" },
	},
};

const topAssets = [
	{
		id: "1",
		name: "Brand Logo V2.svg",
		type: "Vector",
		downloads: 1234,
		views: 5678,
		rating: 4.8,
		lastDownload: "2 hours ago",
	},
	{
		id: "2",
		name: "Product Hero Image.jpg",
		type: "Image",
		downloads: 987,
		views: 4321,
		rating: 4.6,
		lastDownload: "4 hours ago",
	},
	{
		id: "3",
		name: "Marketing Video.mp4",
		type: "Video",
		downloads: 765,
		views: 3210,
		rating: 4.9,
		lastDownload: "1 day ago",
	},
];

const assetTypeDistribution = [
	{ type: "Images", count: 1247, percentage: 43.8, color: "bg-primary" },
	{ type: "Videos", count: 456, percentage: 16.0, color: "bg-secondary" },
	{ type: "Documents", count: 389, percentage: 13.7, color: "bg-success" },
	{ type: "Vectors", count: 312, percentage: 11.0, color: "bg-warning" },
	{ type: "Audio", count: 278, percentage: 9.8, color: "bg-error" },
	{ type: "Archives", count: 165, percentage: 5.8, color: "bg-base-300" },
];

export default function AnalyticsPage() {
	const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
	const [selectedTab, setSelectedTab] = useState("overview");

	const timeRangeOptions = [
		{ key: "24h", label: "Last 24 Hours" },
		{ key: "7d", label: "Last 7 Days" },
		{ key: "30d", label: "Last 30 Days" },
		{ key: "90d", label: "Last 90 Days" },
		{ key: "1y", label: "Last Year" },
	];

	return (
		<AppLayout>
			<div className="space-y-6">
				{/* Analytics Header */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="font-bold text-3xl">Analytics</h1>
						<p className="mt-1 text-base-content/60">
							Track usage patterns, performance metrics, and user engagement.
						</p>
					</div>
					<div className="flex items-center gap-3">
						<select
							className="select select-bordered select-sm w-48"
							value={selectedTimeRange}
							onChange={(e) => setSelectedTimeRange(e.target.value)}
						>
							{timeRangeOptions.map((option) => (
								<option key={option.key} value={option.key}>{option.label}</option>
							))}
						</select>
						<button className="btn btn-outline btn-sm gap-2">
							<Share size={16} />
							Export
						</button>
					</div>
				</div>

				{/* Key Metrics */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
					<div className="card bg-base-100 shadow">
						<div className="card-body">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-base-content/60 text-sm">Total Assets</p>
									<p className="font-bold text-2xl">
										{overviewStats.totalAssets.toLocaleString()}
									</p>
									<div className="mt-1 flex items-center gap-1">
										<TrendingUp size={14} className="text-success" />
										<span className="text-sm text-success">
											+{overviewStats.monthlyGrowth.assets.value}%
										</span>
									</div>
								</div>
								<div className="rounded-lg bg-primary/10 p-3">
									<FileImage className="text-primary" size={24} />
								</div>
							</div>
						</div>
					</div>

					<div className="card bg-base-100 shadow">
						<div className="card-body">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-base-content/60 text-sm">Total Downloads</p>
									<p className="font-bold text-2xl">
										{overviewStats.totalDownloads.toLocaleString()}
									</p>
									<div className="mt-1 flex items-center gap-1">
										<TrendingUp size={14} className="text-success" />
										<span className="text-sm text-success">
											+{overviewStats.monthlyGrowth.downloads.value}%
										</span>
									</div>
								</div>
								<div className="rounded-lg bg-secondary/10 p-3">
									<Download className="text-secondary" size={24} />
								</div>
							</div>
						</div>
					</div>

					<div className="card bg-base-100 shadow">
						<div className="card-body">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-base-content/60 text-sm">Active Users</p>
									<p className="font-bold text-2xl">
										{overviewStats.activeUsers.toLocaleString()}
									</p>
									<div className="mt-1 flex items-center gap-1">
										<TrendingDown size={14} className="text-error" />
										<span className="text-error text-sm">
											{overviewStats.monthlyGrowth.users.value}%
										</span>
									</div>
								</div>
								<div className="rounded-lg bg-success/10 p-3">
									<Users className="text-success" size={24} />
								</div>
							</div>
						</div>
					</div>

					<div className="card bg-base-100 shadow">
						<div className="card-body">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-base-content/60 text-sm">Storage Used</p>
									<p className="font-bold text-2xl">
										{overviewStats.storageUsed}%
									</p>
									<div className="mt-1 flex items-center gap-1">
										<TrendingUp size={14} className="text-warning" />
										<span className="text-sm text-warning">
											+{overviewStats.monthlyGrowth.storage.value}%
										</span>
									</div>
								</div>
								<div className="rounded-lg bg-warning/10 p-3">
									<Activity className="text-warning" size={24} />
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Main Analytics Content */}
				<div className="card bg-base-100 shadow">
					<div className="card-body p-0">
						<div role="tablist" className="tabs tabs-lifted w-full">
							<input
								type="radio"
								name="analytics_tabs"
								role="tab"
								className="tab"
								aria-label="Overview"
								checked={selectedTab === "overview"}
								onChange={() => setSelectedTab("overview")}
							/>
							<input
								type="radio"
								name="analytics_tabs"
								role="tab"
								className="tab"
								aria-label="Top Assets"
								checked={selectedTab === "assets"}
								onChange={() => setSelectedTab("assets")}
							/>
							<input
								type="radio"
								name="analytics_tabs"
								role="tab"
								className="tab"
								aria-label="Performance"
								checked={selectedTab === "performance"}
								onChange={() => setSelectedTab("performance")}
							/>

							{/* Tab Panels */}
							{selectedTab === "overview" && (
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									{/* Usage Trends */}
									<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
										<div>
											<h4 className="mb-4 font-semibold text-lg">
												Usage Trends
											</h4>
											<div className="flex h-64 items-center justify-center rounded-lg bg-base-200">
												<div className="text-center">
													<LineChart
														className="mx-auto mb-2 text-base-content/40"
														size={32}
													/>
													<p className="text-base-content/60 text-sm">
														Usage trends chart
													</p>
													<p className="text-base-content/40 text-xs">
														Interactive chart visualization here
													</p>
												</div>
											</div>
										</div>

										<div>
											<h4 className="mb-4 font-semibold text-lg">
												Asset Type Distribution
											</h4>
											<div className="space-y-3">
												{assetTypeDistribution.map((item) => (
													<div
														key={item.type}
														className="flex items-center justify-between"
													>
														<div className="flex items-center gap-3">
															<div
																className={`h-3 w-3 rounded-full ${item.color}`}
															/>
															<span className="text-sm">{item.type}</span>
														</div>
														<div className="text-right">
															<span className="font-medium text-sm">
																{item.count}
															</span>
															<span className="ml-2 text-base-content/60 text-xs">
																({item.percentage}%)
															</span>
														</div>
													</div>
												))}
											</div>
										</div>
									</div>

									<div className="divider"></div>

									{/* Storage Usage */}
									<div>
										<div className="mb-4 flex items-center justify-between">
											<h4 className="font-semibold text-lg">Storage Usage</h4>
											<span className="text-base-content/60 text-sm">
												{overviewStats.storageUsed}% of 2.5 TB
											</span>
										</div>
										<progress
											className={`progress w-full mb-4 ${
												overviewStats.storageUsed > 80 ? "progress-error" : "progress-primary"
											}`}
											value={overviewStats.storageUsed}
											max="100"
										></progress>
										<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
											{assetTypeDistribution.slice(0, 4).map((item) => (
												<div key={item.type} className="text-center">
													<div className="font-semibold text-lg">
														{(
															(overviewStats.storageUsed * item.percentage) /
															100
														).toFixed(1)}
														%
													</div>
													<div className="text-base-content/60 text-sm">
														{item.type}
													</div>
												</div>
											))}
										</div>
									</div>
								</div>
							)}

							{selectedTab === "assets" && (
								<div role="tabpanel" className="tab-content p-6">
									<div className="mb-6 flex items-center justify-between">
										<h4 className="font-semibold text-lg">
											Most Downloaded Assets
										</h4>
										<div className="relative w-64">
											<Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" />
											<input
												className="input input-bordered input-sm w-full pl-10"
												placeholder="Search assets..."
											/>
										</div>
									</div>
									<div className="overflow-x-auto">
										<table className="table table-zebra">
											<thead>
												<tr>
													<th>ASSET</th>
													<th>TYPE</th>
													<th>DOWNLOADS</th>
													<th>VIEWS</th>
													<th>RATING</th>
													<th>LAST DOWNLOAD</th>
												</tr>
											</thead>
											<tbody>
												{topAssets.map((asset) => (
													<tr key={asset.id}>
														<td>
															<div className="flex items-center gap-3">
																<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-base-200">
																	<FileImage
																		size={16}
																		className="text-base-content/60"
																	/>
																</div>
																<span className="font-medium">{asset.name}</span>
															</div>
														</td>
														<td>
															<span className="badge badge-sm badge-outline">
																{asset.type}
															</span>
														</td>
														<td>
															<div className="flex items-center gap-1">
																<Download
																	size={14}
																	className="text-base-content/40"
																/>
																<span>{asset.downloads}</span>
															</div>
														</td>
														<td>
															<div className="flex items-center gap-1">
																<Eye size={14} className="text-base-content/40" />
																<span>{asset.views}</span>
															</div>
														</td>
														<td>
															<div className="flex items-center gap-1">
																<Star size={14} className="text-warning" />
																<span>{asset.rating}</span>
															</div>
														</td>
														<td>
															<span className="text-base-content/60 text-sm">
																{asset.lastDownload}
															</span>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							)}

							{selectedTab === "performance" && (
								<div role="tabpanel" className="tab-content space-y-6 p-6">
									{/* Performance Charts Placeholder */}
									<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
										<div>
											<h4 className="mb-4 font-semibold text-lg">
												Download Performance
											</h4>
											<div className="flex h-64 items-center justify-center rounded-lg bg-base-200">
												<div className="text-center">
													<BarChart3
														className="mx-auto mb-2 text-base-content/40"
														size={32}
													/>
													<p className="text-base-content/60 text-sm">
														Download performance chart
													</p>
													<p className="text-base-content/40 text-xs">
														Peak times and patterns
													</p>
												</div>
											</div>
										</div>

										<div>
											<h4 className="mb-4 font-semibold text-lg">
												User Engagement
											</h4>
											<div className="flex h-64 items-center justify-center rounded-lg bg-base-200">
												<div className="text-center">
													<PieChart
														className="mx-auto mb-2 text-base-content/40"
														size={32}
													/>
													<p className="text-base-content/60 text-sm">
														User engagement metrics
													</p>
													<p className="text-base-content/40 text-xs">
														Session duration and activities
													</p>
												</div>
											</div>
										</div>
									</div>

									{/* Performance Metrics */}
									<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
										<div className="card bg-base-100 shadow">
											<div className="card-body text-center">
												<div className="font-bold text-2xl text-success">
													98.5%
												</div>
												<div className="text-base-content/60 text-sm">
													Uptime
												</div>
											</div>
										</div>
										<div className="card bg-base-100 shadow">
											<div className="card-body text-center">
												<div className="font-bold text-2xl text-primary">
													1.2s
												</div>
												<div className="text-base-content/60 text-sm">
													Avg Load Time
												</div>
											</div>
										</div>
										<div className="card bg-base-100 shadow">
											<div className="card-body text-center">
												<div className="font-bold text-2xl text-warning">
													4.8/5
												</div>
												<div className="text-base-content/60 text-sm">
													User Rating
												</div>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</AppLayout>
	);
}