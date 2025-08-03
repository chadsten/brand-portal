"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	Clock,
	Download,
	Eye,
	FileText,
	Grid3x3,
	Heart,
	Image as ImageIcon,
	List,
	MoreVertical,
	Music,
	Share2,
	Star,
	TrendingUp,
	Video,
} from "lucide-react";
import { useState } from "react";
import { formatBytes, formatDistanceToNow } from "~/lib/utils";

export interface SearchResult {
	id: string;
	type: "asset" | "collection" | "guideline" | "user";
	title: string;
	description?: string;
	thumbnailUrl?: string;
	fileType?: string;
	fileSize?: number;
	createdAt: Date;
	updatedAt: Date;
	author: {
		id: string;
		name: string;
		avatar?: string;
	};
	tags: string[];
	metadata: {
		views?: number;
		downloads?: number;
		likes?: number;
		rating?: number;
		status?: string;
		compliance?: number;
	};
	relevanceScore: number;
}

interface SearchResultsProps {
	results: SearchResult[];
	totalResults: number;
	currentPage: number;
	pageSize: number;
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	sortBy: string;
	onSortChange: (sort: string) => void;
	viewMode: "grid" | "list";
	onViewModeChange: (mode: "grid" | "list") => void;
	isLoading?: boolean;
	searchQuery?: string;
	onResultClick?: (result: SearchResult) => void;
	onActionClick?: (action: string, result: SearchResult) => void;
}

const SORT_OPTIONS = [
	{ value: "relevance", label: "Most Relevant" },
	{ value: "date_desc", label: "Newest First" },
	{ value: "date_asc", label: "Oldest First" },
	{ value: "name_asc", label: "Name (A-Z)" },
	{ value: "name_desc", label: "Name (Z-A)" },
	{ value: "popular", label: "Most Popular" },
	{ value: "downloads", label: "Most Downloaded" },
];

const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];

// Helper function to get type colors
const getTypeColor = (type: string): "primary" | "secondary" | "success" | "warning" | "default" => {
	switch (type) {
		case "asset":
			return "primary";
		case "collection":
			return "success";
		case "guideline":
			return "warning";
		case "user":
			return "secondary";
		default:
			return "default";
	}
};

export function SearchResults({
	results,
	totalResults,
	currentPage,
	pageSize,
	onPageChange,
	onPageSizeChange,
	sortBy,
	onSortChange,
	viewMode,
	onViewModeChange,
	isLoading = false,
	searchQuery,
	onResultClick,
	onActionClick,
}: SearchResultsProps) {
	const [hoveredResult, setHoveredResult] = useState<string | null>(null);

	const totalPages = Math.ceil(totalResults / pageSize);
	const startIndex = (currentPage - 1) * pageSize + 1;
	const endIndex = Math.min(currentPage * pageSize, totalResults);

	const getFileIcon = (fileType?: string) => {
		if (!fileType) return <FileText size={20} />;

		if (fileType.startsWith("image/")) return <ImageIcon size={20} />;
		if (fileType.startsWith("video/")) return <Video size={20} />;
		if (fileType.startsWith("audio/")) return <Music size={20} />;
		return <FileText size={20} />;
	};

	const getTypeColor = (type: string) => {
		switch (type) {
			case "asset":
				return "primary";
			case "collection":
				return "secondary";
			case "guideline":
				return "success";
			case "user":
				return "warning";
			default:
				return "default";
		}
	};

	const highlightSearchTerms = (text: string) => {
		if (!searchQuery) return text;

		const terms = searchQuery.split(" ").filter(Boolean);
		let highlightedText = text;

		terms.forEach((term) => {
			const regex = new RegExp(`(${term})`, "gi");
			highlightedText = highlightedText.replace(regex, "<mark>$1</mark>");
		});

		return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
	};

	const renderGridItem = (result: SearchResult) => (
		<div
			key={result.id}
			className="card bg-base-100 shadow group cursor-pointer transition-all hover:shadow-lg"
			onClick={() => onResultClick?.(result)}
			onMouseEnter={() => setHoveredResult(result.id)}
			onMouseLeave={() => setHoveredResult(null)}
		>
			<div className="card-body p-0">
				{/* Thumbnail */}
				<div className="relative aspect-video bg-base-200">
					{result.thumbnailUrl ? (
						<img
							src={result.thumbnailUrl}
							alt={result.title}
							className="h-full w-full object-cover"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center">
							{getFileIcon(result.fileType)}
						</div>
					)}

					{/* Overlay Actions */}
					{hoveredResult === result.id && (
						<div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
							<div className="tooltip" data-tip="Preview">
								<button
									className="btn btn-sm btn-square bg-white/20 backdrop-blur-sm border-none hover:bg-white/30"
									onClick={() => onActionClick?.("preview", result)}
								>
									<Eye size={16} />
								</button>
							</div>
							<div className="tooltip" data-tip="Download">
								<button
									className="btn btn-sm btn-square bg-white/20 backdrop-blur-sm border-none hover:bg-white/30"
									onClick={() => onActionClick?.("download", result)}
								>
									<Download size={16} />
								</button>
							</div>
							<div className="tooltip" data-tip="Share">
								<button
									className="btn btn-sm btn-square bg-white/20 backdrop-blur-sm border-none hover:bg-white/30"
									onClick={() => onActionClick?.("share", result)}
								>
									<Share2 size={16} />
								</button>
							</div>
						</div>
					)}

					{/* Badges */}
					<div className="absolute top-2 left-2 flex gap-2">
						<span className={`badge badge-sm ${
							getTypeColor(result.type) === "primary" ? "badge-primary" :
							getTypeColor(result.type) === "success" ? "badge-success" :
							getTypeColor(result.type) === "warning" ? "badge-warning" :
							getTypeColor(result.type) === "danger" ? "badge-error" :
							"badge-outline"
						}`}>
							{result.type}
						</span>
						{result.metadata.compliance && (
							<span
								className={`badge badge-sm ${
									result.metadata.compliance >= 80 ? "badge-success" : "badge-warning"
								}`}
							>
								{result.metadata.compliance}%
							</span>
						)}
					</div>

					{/* Relevance Score */}
					{result.relevanceScore > 0 && (
						<div className="absolute top-2 right-2">
							<div
								className="tooltip"
								data-tip={`${Math.round(result.relevanceScore * 100)}% match`}
							>
								<progress
									className="progress progress-success w-12 h-2"
									value={result.relevanceScore * 100}
									max={100}
								></progress>
							</div>
						</div>
					)}
				</div>

				{/* Content */}
				<div className="space-y-3 p-4">
					<div>
						<h4 className="truncate font-semibold">
							{highlightSearchTerms(result.title)}
						</h4>
						{result.description && (
							<p className="line-clamp-2 text-base-content/60 text-sm">
								{highlightSearchTerms(result.description)}
							</p>
						)}
					</div>

					{/* Metadata */}
					<div className="flex items-center justify-between text-base-content/40 text-xs">
						<span>{result.author.name}</span>
						<span>{formatDistanceToNow(result.updatedAt)} ago</span>
					</div>

					{/* Stats */}
					<div className="flex items-center gap-3 text-sm">
						{result.metadata.views !== undefined && (
							<div className="flex items-center gap-1">
								<Eye size={14} />
								<span>{result.metadata.views}</span>
							</div>
						)}
						{result.metadata.downloads !== undefined && (
							<div className="flex items-center gap-1">
								<Download size={14} />
								<span>{result.metadata.downloads}</span>
							</div>
						)}
						{result.metadata.likes !== undefined && (
							<div className="flex items-center gap-1">
								<Heart size={14} />
								<span>{result.metadata.likes}</span>
							</div>
						)}
						{result.metadata.rating !== undefined && (
							<div className="flex items-center gap-1">
								<Star size={14} className="text-warning" />
								<span>{result.metadata.rating.toFixed(1)}</span>
							</div>
						)}
					</div>

					{/* Tags */}
					{result.tags.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{result.tags.slice(0, 3).map((tag) => (
								<span key={tag} className="badge badge-sm badge-outline">
									{tag}
								</span>
							))}
							{result.tags.length > 3 && (
								<span className="badge badge-sm badge-outline">
									+{result.tags.length - 3}
								</span>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);

	const renderListItem = (result: SearchResult) => (
		<div
			key={result.id}
			className="card bg-base-100 shadow cursor-pointer transition-shadow hover:shadow-md"
			onClick={() => onResultClick?.(result)}
		>
			<div className="card-body p-4">
				<div className="flex gap-4">
					{/* Thumbnail */}
					<div className="h-24 w-24 flex-shrink-0 rounded-lg bg-base-200">
						{result.thumbnailUrl ? (
							<img
								src={result.thumbnailUrl}
								alt={result.title}
								className="h-full w-full rounded-lg object-cover"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center">
								{getFileIcon(result.fileType)}
							</div>
						)}
					</div>

					{/* Content */}
					<div className="min-w-0 flex-1">
						<div className="mb-2 flex items-start justify-between">
							<div>
								<h4 className="font-semibold text-lg">
									{highlightSearchTerms(result.title)}
								</h4>
								{result.description && (
									<p className="text-base-content/60 text-sm">
										{highlightSearchTerms(result.description)}
									</p>
								)}
							</div>
							<div className="flex items-center gap-2">
								<span
									className={`badge badge-sm ${
										getTypeColor(result.type) === "primary" ? "badge-primary" :
										getTypeColor(result.type) === "success" ? "badge-success" :
										getTypeColor(result.type) === "warning" ? "badge-warning" :
										getTypeColor(result.type) === "danger" ? "badge-error" :
										"badge-outline"
									}`}
								>
									{result.type}
								</span>
								{result.relevanceScore > 0 && (
									<div
										className="tooltip"
										data-tip={`${Math.round(result.relevanceScore * 100)}% match`}
									>
										<span className="badge badge-sm badge-success">
											{Math.round(result.relevanceScore * 100)}%
										</span>
									</div>
								)}
							</div>
						</div>

						{/* Metadata Row */}
						<div className="mb-2 flex items-center gap-4 text-base-content/60 text-sm">
							<span>By {result.author.name}</span>
							<span>•</span>
							<span>Updated {formatDistanceToNow(result.updatedAt)} ago</span>
							{result.fileSize && (
								<>
									<span>•</span>
									<span>{formatBytes(result.fileSize)}</span>
								</>
							)}
						</div>

						{/* Stats and Tags */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4 text-sm">
								{result.metadata.views !== undefined && (
									<div className="flex items-center gap-1">
										<Eye size={14} />
										<span>{result.metadata.views} views</span>
									</div>
								)}
								{result.metadata.downloads !== undefined && (
									<div className="flex items-center gap-1">
										<Download size={14} />
										<span>{result.metadata.downloads} downloads</span>
									</div>
								)}
								{result.metadata.rating !== undefined && (
									<div className="flex items-center gap-1">
										<Star size={14} className="text-warning" />
										<span>{result.metadata.rating.toFixed(1)}</span>
									</div>
								)}
							</div>

							{/* Actions */}
							<div className="flex items-center gap-1">
								<button
									className="btn btn-sm btn-square btn-ghost"
									onClick={() => onActionClick?.("preview", result)}
								>
									<Eye size={16} />
								</button>
								<button
									className="btn btn-sm btn-square btn-ghost"
									onClick={() => onActionClick?.("download", result)}
								>
									<Download size={16} />
								</button>
								<button
									className="btn btn-sm btn-square btn-ghost"
									onClick={() => onActionClick?.("more", result)}
								>
									<MoreVertical size={16} />
								</button>
							</div>
						</div>

						{/* Tags */}
						{result.tags.length > 0 && (
							<div className="mt-2 flex flex-wrap gap-1">
								{result.tags.map((tag) => (
									<span key={tag} className="badge badge-sm badge-outline">
										{tag}
									</span>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="card bg-base-100 shadow">
				<div className="card-body">
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div>
							<h3 className="font-semibold text-lg">
								{totalResults.toLocaleString()} Results
								{searchQuery && (
									<span className="font-normal text-base-content/60">
										{" "}
										for "{searchQuery}"
									</span>
								)}
							</h3>
							<p className="text-base-content/60 text-sm">
								Showing {startIndex}-{endIndex} of{" "}
								{totalResults.toLocaleString()}
							</p>
						</div>

						<div className="flex items-center gap-2">
							{/* Sort */}
							<div className="form-control w-48">
								<label className="label">
									<span className="label-text text-sm">Sort by</span>
								</label>
								<select
									className="select select-bordered select-sm"
									value={sortBy}
									onChange={(e) => onSortChange(e.target.value)}
								>
									{SORT_OPTIONS.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>

							{/* View Mode */}
							<div className="flex items-center gap-1 rounded-lg bg-base-200 p-1">
								<div className="tooltip" data-tip="Grid view">
									<button
										className={`btn btn-sm btn-square ${viewMode === "grid" ? "btn-primary" : "btn-ghost"}`}
										onClick={() => onViewModeChange("grid")}
									>
										<Grid3x3 size={16} />
									</button>
								</div>
								<div className="tooltip" data-tip="List view">
									<button
										className={`btn btn-sm btn-square ${viewMode === "list" ? "btn-primary" : "btn-ghost"}`}
										onClick={() => onViewModeChange("list")}
									>
										<List size={16} />
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Results */}
			{isLoading ? (
				<div className="card bg-base-100 shadow">
					<div className="card-body py-12 text-center">
						<span className="loading loading-spinner loading-lg"></span>
						<p className="mt-4 text-base-content/60">Searching...</p>
					</div>
				</div>
			) : results.length === 0 ? (
				<div className="card bg-base-100 shadow">
					<div className="card-body py-12 text-center">
						<ImageIcon size={48} className="mx-auto mb-4 text-base-content/30" />
						<h3 className="mb-2 font-semibold text-lg">No results found</h3>
						<p className="text-base-content/60">
							Try adjusting your search terms or filters
						</p>
					</div>
				</div>
			) : (
				<div
					className={
						viewMode === "grid"
							? "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
							: "space-y-4"
					}
				>
					{results.map((result) =>
						viewMode === "grid"
							? renderGridItem(result)
							: renderListItem(result),
					)}
				</div>
			)}

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="card bg-base-100 shadow">
					<div className="card-body flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="flex items-center gap-2">
							<span className="text-sm">Items per page:</span>
							<select
								className="select select-bordered select-sm w-20"
								value={String(pageSize)}
								onChange={(e) => onPageSizeChange(Number(e.target.value))}
							>
								{PAGE_SIZE_OPTIONS.map((size) => (
									<option key={String(size)} value={String(size)}>
										{size}
									</option>
								))}
							</select>
						</div>

						<div className="btn-group">
							<button
								className="btn btn-sm"
								onClick={() => onPageChange(Math.max(1, currentPage - 1))}
								disabled={currentPage === 1}
							>
								«
							</button>
							<button className="btn btn-sm btn-active">
								Page {currentPage}
							</button>
							<button
								className="btn btn-sm"
								onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
								disabled={currentPage === totalPages}
							>
								»
							</button>
						</div>

						<div className="text-base-content/60 text-sm">
							Page {currentPage} of {totalPages}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
