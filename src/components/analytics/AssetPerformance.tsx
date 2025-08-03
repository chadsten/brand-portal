"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	BarChart3,
	Calendar,
	Clock,
	Download,
	ExternalLink,
	Eye,
	FileText,
	Filter,
	Heart,
	Image as ImageIcon,
	Music,
	PieChart,
	Search,
	Share2,
	Star,
	TrendingDown,
	TrendingUp,
	Users,
	Video,
} from "lucide-react";
import { useState } from "react";

interface AssetMetrics {
	id: string;
	name: string;
	type: "image" | "video" | "audio" | "document";
	category: string;
	size: string;
	uploadDate: Date;
	author: {
		id: string;
		name: string;
		avatar?: string;
	};
	metrics: {
		views: number;
		downloads: number;
		likes: number;
		shares: number;
		comments: number;
		rating: number;
		conversionRate: number;
	};
	trends: {
		viewsChange: number;
		downloadsChange: number;
		likesChange: number;
		sharesChange: number;
	};
	performance: {
		score: number;
		rank: number;
		category: "excellent" | "good" | "average" | "poor";
	};
}

interface AssetPerformanceProps {
	searchQuery?: string;
	onSearchChange?: (query: string) => void;
	sortBy?: string;
	onSortChange?: (sort: string) => void;
	filterBy?: string;
	onFilterChange?: (filter: string) => void;
}

const MOCK_ASSETS: AssetMetrics[] = [
	{
		id: "1",
		name: "Brand Logo Primary",
		type: "image",
		category: "Logo",
		size: "2.4 MB",
		uploadDate: new Date("2024-01-15"),
		author: { id: "1", name: "Sarah Chen", avatar: "/avatars/sarah.jpg" },
		metrics: {
			views: 15420,
			downloads: 3240,
			likes: 892,
			shares: 234,
			comments: 45,
			rating: 4.8,
			conversionRate: 21.0,
		},
		trends: {
			viewsChange: 12.3,
			downloadsChange: 8.7,
			likesChange: 15.2,
			sharesChange: 22.1,
		},
		performance: {
			score: 95,
			rank: 1,
			category: "excellent",
		},
	},
	{
		id: "2",
		name: "Marketing Template Q3",
		type: "document",
		category: "Template",
		size: "5.1 MB",
		uploadDate: new Date("2024-02-08"),
		author: { id: "2", name: "Mike Johnson", avatar: "/avatars/mike.jpg" },
		metrics: {
			views: 12890,
			downloads: 2890,
			likes: 567,
			shares: 189,
			comments: 32,
			rating: 4.6,
			conversionRate: 22.4,
		},
		trends: {
			viewsChange: -2.1,
			downloadsChange: 5.3,
			likesChange: -1.2,
			sharesChange: 8.9,
		},
		performance: {
			score: 87,
			rank: 2,
			category: "good",
		},
	},
	{
		id: "3",
		name: "Product Shot - Hero",
		type: "image",
		category: "Photography",
		size: "8.3 MB",
		uploadDate: new Date("2024-01-22"),
		author: { id: "3", name: "Alex Rivera", avatar: "/avatars/alex.jpg" },
		metrics: {
			views: 11234,
			downloads: 2567,
			likes: 445,
			shares: 156,
			comments: 28,
			rating: 4.4,
			conversionRate: 22.9,
		},
		trends: {
			viewsChange: 18.7,
			downloadsChange: 12.4,
			likesChange: 25.6,
			sharesChange: 15.3,
		},
		performance: {
			score: 82,
			rank: 3,
			category: "good",
		},
	},
	{
		id: "4",
		name: "Brand Guidelines 2024",
		type: "document",
		category: "Guidelines",
		size: "12.7 MB",
		uploadDate: new Date("2024-01-05"),
		author: { id: "1", name: "Sarah Chen", avatar: "/avatars/sarah.jpg" },
		metrics: {
			views: 9876,
			downloads: 1987,
			likes: 334,
			shares: 98,
			comments: 67,
			rating: 4.9,
			conversionRate: 20.1,
		},
		trends: {
			viewsChange: 3.2,
			downloadsChange: -1.8,
			likesChange: 7.4,
			sharesChange: -5.2,
		},
		performance: {
			score: 78,
			rank: 4,
			category: "good",
		},
	},
	{
		id: "5",
		name: "Social Media Kit",
		type: "document",
		category: "Social",
		size: "3.9 MB",
		uploadDate: new Date("2024-02-12"),
		author: { id: "4", name: "Emma Wilson", avatar: "/avatars/emma.jpg" },
		metrics: {
			views: 8765,
			downloads: 1876,
			likes: 298,
			shares: 87,
			comments: 19,
			rating: 4.2,
			conversionRate: 21.4,
		},
		trends: {
			viewsChange: -8.9,
			downloadsChange: -12.3,
			likesChange: -3.1,
			sharesChange: 2.8,
		},
		performance: {
			score: 65,
			rank: 5,
			category: "average",
		},
	},
];

const SORT_OPTIONS = [
	{ value: "performance", label: "Performance Score" },
	{ value: "views", label: "Most Views" },
	{ value: "downloads", label: "Most Downloads" },
	{ value: "likes", label: "Most Likes" },
	{ value: "shares", label: "Most Shares" },
	{ value: "rating", label: "Highest Rated" },
	{ value: "conversion", label: "Conversion Rate" },
	{ value: "recent", label: "Recently Added" },
];

const FILTER_OPTIONS = [
	{ value: "all", label: "All Types" },
	{ value: "image", label: "Images" },
	{ value: "video", label: "Videos" },
	{ value: "audio", label: "Audio" },
	{ value: "document", label: "Documents" },
];

export function AssetPerformance({
	searchQuery = "",
	onSearchChange,
	sortBy = "performance",
	onSortChange,
	filterBy = "all",
	onFilterChange,
}: AssetPerformanceProps) {
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedAsset, setSelectedAsset] = useState<AssetMetrics | null>(null);
	const pageSize = 10;

	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const onDetailModalOpen = () => setIsDetailModalOpen(true);
	const onDetailModalClose = () => setIsDetailModalOpen(false);

	const formatNumber = (num: number) => {
		if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
		if (num >= 1000) return (num / 1000).toFixed(1) + "K";
		return num.toString();
	};

	const getFileIcon = (type: string) => {
		switch (type) {
			case "image":
				return <ImageIcon size={16} className="text-primary" />;
			case "video":
				return <Video size={16} className="text-success" />;
			case "audio":
				return <Music size={16} className="text-warning" />;
			case "document":
				return <FileText size={16} className="text-secondary" />;
			default:
				return <FileText size={16} className="text-base-content/40" />;
		}
	};

	const getPerformanceColor = (category: string) => {
		switch (category) {
			case "excellent":
				return "success";
			case "good":
				return "primary";
			case "average":
				return "warning";
			case "poor":
				return "error";
			default:
				return "neutral";
		}
	};

	const getTrendIcon = (change: number) => {
		if (change > 0) return <TrendingUp size={12} className="text-success" />;
		if (change < 0) return <TrendingDown size={12} className="text-error" />;
		return null;
	};

	const handleAssetClick = (asset: AssetMetrics) => {
		setSelectedAsset(asset);
		onDetailModalOpen();
	};

	const renderAssetDetails = () => {
		if (!selectedAsset) return null;

		return (
			<dialog className={`modal ${isDetailModalOpen ? 'modal-open' : ''}`}>
				<div className="modal-box w-11/12 max-w-4xl">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-3">
							{getFileIcon(selectedAsset.type)}
							<div>
								<h3 className="font-semibold text-lg">{selectedAsset.name}</h3>
								<p className="text-base-content/50 text-sm">
									{selectedAsset.category} • {selectedAsset.size}
								</p>
							</div>
						</div>
						<button className="btn btn-sm btn-circle btn-ghost" onClick={onDetailModalClose}>✕</button>
					</div>
					<div className="py-4">
						<div className="space-y-6">
							{/* Performance Score */}
							<div className="card bg-base-100 shadow">
								<div className="card-header p-6 pb-0">
									<h4 className="font-semibold">Performance Overview</h4>
								</div>
								<div className="card-body">
									<div className="mb-4 flex items-center justify-between">
										<div>
											<p className="text-base-content/50 text-sm">
												Overall Score
											</p>
											<p className="font-bold text-2xl">
												{selectedAsset.performance.score}/100
											</p>
										</div>
										<div className="text-right">
											<span className={`badge badge-sm ${
												getPerformanceColor(selectedAsset.performance.category) === "success" ? "badge-success" :
												getPerformanceColor(selectedAsset.performance.category) === "primary" ? "badge-primary" :
												getPerformanceColor(selectedAsset.performance.category) === "warning" ? "badge-warning" :
												getPerformanceColor(selectedAsset.performance.category) === "error" ? "badge-error" :
												"badge-neutral"
											}`}>
												{selectedAsset.performance.category.toUpperCase()}
											</span>
											<p className="mt-1 text-base-content/50 text-sm">
												Rank #{selectedAsset.performance.rank}
											</p>
										</div>
									</div>
									<progress 
										className={`progress mb-4 ${
											getPerformanceColor(selectedAsset.performance.category) === "success" ? "progress-success" :
											getPerformanceColor(selectedAsset.performance.category) === "primary" ? "progress-primary" :
											getPerformanceColor(selectedAsset.performance.category) === "warning" ? "progress-warning" :
											getPerformanceColor(selectedAsset.performance.category) === "error" ? "progress-error" :
											"progress-neutral"
										}`} 
										value={selectedAsset.performance.score} 
										max={100}
									></progress>
								</div>
							</div>

							{/* Metrics Grid */}
							<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
								<div className="card bg-base-100 shadow">
									<div className="card-body text-center">
										<Eye size={24} className="mx-auto mb-2 text-primary" />
										<p className="font-bold text-2xl">
											{formatNumber(selectedAsset.metrics.views)}
										</p>
										<p className="text-base-content/50 text-sm">Views</p>
										<div className="mt-1 flex items-center justify-center gap-1">
											{getTrendIcon(selectedAsset.trends.viewsChange)}
											<span className="text-xs">
												{selectedAsset.trends.viewsChange > 0 ? "+" : ""}
												{selectedAsset.trends.viewsChange.toFixed(1)}%
											</span>
										</div>
									</div>
								</div>

								<div className="card bg-base-100 shadow">
									<div className="card-body text-center">
										<Download size={24} className="mx-auto mb-2 text-success" />
										<p className="font-bold text-2xl">
											{formatNumber(selectedAsset.metrics.downloads)}
										</p>
										<p className="text-base-content/50 text-sm">Downloads</p>
										<div className="mt-1 flex items-center justify-center gap-1">
											{getTrendIcon(selectedAsset.trends.downloadsChange)}
											<span className="text-xs">
												{selectedAsset.trends.downloadsChange > 0 ? "+" : ""}
												{selectedAsset.trends.downloadsChange.toFixed(1)}%
											</span>
										</div>
									</div>
								</div>

								<div className="card bg-base-100 shadow">
									<div className="card-body text-center">
										<Heart size={24} className="mx-auto mb-2 text-error" />
										<p className="font-bold text-2xl">
											{formatNumber(selectedAsset.metrics.likes)}
										</p>
										<p className="text-base-content/50 text-sm">Likes</p>
										<div className="mt-1 flex items-center justify-center gap-1">
											{getTrendIcon(selectedAsset.trends.likesChange)}
											<span className="text-xs">
												{selectedAsset.trends.likesChange > 0 ? "+" : ""}
												{selectedAsset.trends.likesChange.toFixed(1)}%
											</span>
										</div>
									</div>
								</div>

								<div className="card bg-base-100 shadow">
									<div className="card-body text-center">
										<Share2 size={24} className="mx-auto mb-2 text-warning" />
										<p className="font-bold text-2xl">
											{formatNumber(selectedAsset.metrics.shares)}
										</p>
										<p className="text-base-content/50 text-sm">Shares</p>
										<div className="mt-1 flex items-center justify-center gap-1">
											{getTrendIcon(selectedAsset.trends.sharesChange)}
											<span className="text-xs">
												{selectedAsset.trends.sharesChange > 0 ? "+" : ""}
												{selectedAsset.trends.sharesChange.toFixed(1)}%
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Additional Metrics */}
							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<div className="card-body text-center">
									<div className="mb-2 flex items-center justify-center gap-2">
										<Star size={16} className="text-warning" />
										<span className="font-semibold">
											{selectedAsset.metrics.rating}
										</span>
									</div>
									<p className="text-base-content/50 text-sm">Rating</p>
								</div>
								<div className="card-body text-center">
									<div className="mb-2 flex items-center justify-center gap-2">
										<Users size={16} className="text-primary" />
										<span className="font-semibold">
											{selectedAsset.metrics.comments}
										</span>
									</div>
									<p className="text-base-content/50 text-sm">Comments</p>
								</div>
								<div className="card-body text-center">
									<div className="mb-2 flex items-center justify-center gap-2">
										<BarChart3 size={16} className="text-success" />
										<span className="font-semibold">
											{selectedAsset.metrics.conversionRate}%
										</span>
									</div>
									<p className="text-base-content/50 text-sm">Conversion</p>
								</div>
							</div>
						</div>
					</div>
					<div className="modal-action">
						<button className="btn btn-ghost" onClick={onDetailModalClose}>
							Close
						</button>
						<button className="btn btn-primary">
							<ExternalLink size={16} />
							View Asset
						</button>
					</div>
				</div>
			</dialog>
		);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h2 className="font-semibold text-xl">Asset Performance</h2>
					<p className="text-base-content/50 text-sm">
						Track individual asset metrics and performance
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button className="btn btn-sm btn-ghost">
						<Calendar size={16} />
						Date Range
					</button>
					<button className="btn btn-sm btn-ghost">
						<PieChart size={16} />
						Export Report
					</button>
				</div>
			</div>

			{/* Filters */}
			<div className="card bg-base-100 shadow">
				<div>
					<div className="flex flex-col gap-4 md:flex-row md:items-center">
						<div className="form-control md:w-80">
							<div className="input-group">
								<span>
									<Search size={16} />
								</span>
								<input
									type="text"
									placeholder="Search assets..."
									className="input input-bordered input-sm"
									value={searchQuery}
									onChange={(e) => onSearchChange?.(e.target.value)}
								/>
							</div>
						</div>
						<div className="form-control md:w-48">
							<label className="label">
								<span className="label-text">Sort by</span>
							</label>
							<select
								className="select select-bordered select-sm"
								value={sortBy}
								onChange={(e) => onSortChange?.(e.target.value)}
							>
								{SORT_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</div>
						<div className="form-control md:w-48">
							<label className="label">
								<span className="label-text">Filter by type</span>
							</label>
							<select
								className="select select-bordered select-sm"
								value={filterBy}
								onChange={(e) => onFilterChange?.(e.target.value)}
							>
								{FILTER_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>
			</div>

			{/* Assets Table */}
			<div className="card bg-base-100 shadow">
				<div className="overflow-x-auto">
					<table className="table w-full">
						<thead>
							<tr>
								<th>ASSET</th>
								<th>TYPE</th>
								<th>PERFORMANCE</th>
								<th>VIEWS</th>
								<th>DOWNLOADS</th>
								<th>ENGAGEMENT</th>
								<th>CONVERSION</th>
								<th>ACTIONS</th>
							</tr>
						</thead>
						<tbody>
							{MOCK_ASSETS.map((asset) => (
								<tr key={asset.id}>
									<td>
										<div className="flex items-center gap-3">
											{getFileIcon(asset.type)}
											<div>
												<p className="font-medium">{asset.name}</p>
												<p className="text-base-content/50 text-sm">
													{asset.category} • {asset.size}
												</p>
											</div>
										</div>
									</td>
									<td>
										<span className="badge badge-sm badge-primary">
											{asset.type}
										</span>
									</td>
									<td>
										<div className="flex items-center gap-2">
											<span className="font-medium">
												{asset.performance.score}
											</span>
											<span className={`badge badge-sm ${
												getPerformanceColor(asset.performance.category) === "success" ? "badge-success" :
												getPerformanceColor(asset.performance.category) === "primary" ? "badge-primary" :
												getPerformanceColor(asset.performance.category) === "warning" ? "badge-warning" :
												getPerformanceColor(asset.performance.category) === "error" ? "badge-error" :
												"badge-neutral"
											}`}>
												#{asset.performance.rank}
											</span>
										</div>
									</td>
									<td>
										<div className="flex items-center gap-1">
											<span>{formatNumber(asset.metrics.views)}</span>
											{getTrendIcon(asset.trends.viewsChange)}
										</div>
									</td>
									<td>
										<div className="flex items-center gap-1">
											<span>{formatNumber(asset.metrics.downloads)}</span>
											{getTrendIcon(asset.trends.downloadsChange)}
										</div>
									</td>
									<td>
										<div className="flex items-center gap-2">
											<div className="flex items-center gap-1">
												<Heart size={12} />
												<span className="text-sm">
													{formatNumber(asset.metrics.likes)}
												</span>
											</div>
											<div className="flex items-center gap-1">
												<Share2 size={12} />
												<span className="text-sm">
													{formatNumber(asset.metrics.shares)}
												</span>
											</div>
										</div>
									</td>
									<td>
										<div className="flex items-center gap-2">
											<span className="text-sm">
												{asset.metrics.conversionRate}%
											</span>
											<progress 
												className="progress progress-success progress-sm w-16" 
												value={asset.metrics.conversionRate} 
												max={100}
											></progress>
										</div>
									</td>
									<td>
										<button
											className="btn btn-sm btn-ghost"
											onClick={() => handleAssetClick(asset)}
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

			{/* Pagination */}
			<div className="flex justify-center">
				<div className="btn-group">
					<button 
						className="btn btn-sm" 
						onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
						disabled={currentPage === 1}
					>
						«
					</button>
					<button className="btn btn-sm btn-active">
						Page {currentPage}
					</button>
					<button 
						className="btn btn-sm" 
						onClick={() => setCurrentPage(Math.min(Math.ceil(MOCK_ASSETS.length / pageSize), currentPage + 1))}
						disabled={currentPage === Math.ceil(MOCK_ASSETS.length / pageSize)}
					>
						»
					</button>
				</div>
			</div>

			{/* Asset Details Modal */}
			{renderAssetDetails()}
		</div>
	);
}
