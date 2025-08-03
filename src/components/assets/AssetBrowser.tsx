"use client";

// Import removed - using native HTML and DaisyUI classes
import { useModal } from "~/hooks/useModal";
import {
	Archive,
	Download,
	Edit,
	Eye,
	FileText,
	Filter,
	Grid3X3,
	Image as ImageIcon,
	List,
	MoreVertical,
	Music,
	Search,
	Share,
	SortAsc,
	SortDesc,
	Trash2,
	Video,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { AssetDetailModal } from "./AssetDetailModal";
import { AssetFilters } from "./AssetFilters";
import { AssetGrid } from "./AssetGrid";
import { AssetList } from "./AssetList";
import { AssetToolbar } from "./AssetToolbar";
import { BaseModal } from "../ui/BaseModal";
import { CollectionSelectorModal } from "./CollectionSelectorModal";

export interface AssetBrowserProps {
	organizationId?: string;
	collectionId?: string;
	showUpload?: boolean;
	selectable?: boolean;
	onAssetSelect?: (assetId: string) => void;
	onAssetsSelect?: (assetIds: string[]) => void;
}

export type ViewMode = "grid" | "list";
export type SortField =
	| "name"
	| "createdAt"
	| "updatedAt"
	| "fileSize"
	| "fileType";
export type SortOrder = "asc" | "desc";

export interface AssetFilters {
	query?: string;
	fileTypes?: string[];
	tags?: string[];
	uploadedBy?: string;
	dateRange?: {
		from: Date;
		to: Date;
	};
	sizeRange?: {
		min: number;
		max: number;
	};
	collections?: string[];
}

export function AssetBrowser({
	organizationId,
	collectionId,
	showUpload = true,
	selectable = false,
	onAssetSelect,
	onAssetsSelect,
}: AssetBrowserProps) {
	// Session check
	const { data: session, status } = useSession();

	// State management
	const [viewMode, setViewMode] = useState<ViewMode>("grid");
	const [sortField, setSortField] = useState<SortField>("createdAt");
	const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
	const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
	const [filters, setFilters] = useState<AssetFilters>({});
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

	// Modal controls
	const {
		isOpen: isDetailOpen,
		onOpen: onDetailOpen,
		onClose: onDetailClose,
	} = useModal();
	const {
		isOpen: isFiltersOpen,
		onOpen: onFiltersOpen,
		onClose: onFiltersClose,
	} = useModal();
	const {
		isOpen: isCollectionSelectorOpen,
		onOpen: onCollectionSelectorOpen,
		onClose: onCollectionSelectorClose,
	} = useModal();

	// API queries
	const {
		data: assetsData,
		isLoading,
		error,
		refetch,
	} = api.asset.search.useQuery({
		query: filters.query || "",
		fileTypes: filters.fileTypes,
		tags: filters.tags,
		uploadedBy: filters.uploadedBy,
		sortBy:
			sortField === "name"
				? "title"
				: sortField === "fileType"
					? "fileName"
					: sortField,
		sortOrder,
		limit: 50,
		offset: (currentPage - 1) * 50,
	});

	// Debug logging
	console.log("AssetBrowser Debug:", {
		sessionStatus: status,
		sessionExists: !!session,
		sessionUserId: session?.user?.id,
		sessionUserOrgId: session?.user?.organizationId,
		isLoading,
		error: error?.message,
		errorCode: error?.data?.code,
		assetsData,
		totalCount: assetsData?.total,
		assetsLength: assetsData?.assets?.length,
	});

	const assets = assetsData?.assets || [];
	const totalCount = assetsData?.total || 0;
	const hasMore = assetsData?.hasMore || false;

	// Handlers
	const handleSearch = useCallback((query: string) => {
		setFilters((prev) => ({ ...prev, query }));
		setCurrentPage(1);
	}, []);

	const handleFilterChange = useCallback(
		(newFilters: Partial<AssetFilters>) => {
			setFilters((prev) => ({ ...prev, ...newFilters }));
			setCurrentPage(1);
		},
		[],
	);

	const handleSort = useCallback(
		(field: SortField) => {
			if (field === sortField) {
				setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
			} else {
				setSortField(field);
				setSortOrder("desc");
			}
			setCurrentPage(1);
		},
		[sortField],
	);

	const handleAssetClick = useCallback(
		(assetId: string) => {
			if (selectable && onAssetSelect) {
				onAssetSelect(assetId);
			} else {
				setSelectedAssetId(assetId);
				onDetailOpen();
			}
		},
		[selectable, onAssetSelect, onDetailOpen],
	);

	const handleAssetSelect = useCallback(
		(assetId: string, selected: boolean) => {
			const newSelected = new Set(selectedAssets);
			if (selected) {
				newSelected.add(assetId);
			} else {
				newSelected.delete(assetId);
			}
			setSelectedAssets(newSelected);

			if (onAssetsSelect) {
				onAssetsSelect(Array.from(newSelected));
			}
		},
		[selectedAssets, onAssetsSelect],
	);

	const handleSelectAll = useCallback(() => {
		const allAssetIds = assets.map((asset: any) => asset.id);
		setSelectedAssets(new Set(allAssetIds));
		if (onAssetsSelect) {
			onAssetsSelect(allAssetIds);
		}
	}, [assets, onAssetsSelect]);

	const handleClearSelection = useCallback(() => {
		setSelectedAssets(new Set());
		if (onAssetsSelect) {
			onAssetsSelect([]);
		}
	}, [onAssetsSelect]);

	// File type icon mapping
	const getFileTypeIcon = (mimeType: string) => {
		if (mimeType.startsWith("image/")) return ImageIcon;
		if (mimeType.startsWith("video/")) return Video;
		if (mimeType.startsWith("audio/")) return Music;
		if (mimeType.includes("pdf") || mimeType.includes("document"))
			return FileText;
		if (mimeType.includes("zip") || mimeType.includes("archive"))
			return Archive;
		return FileText;
	};

	// Compute active filter count
	const activeFilterCount = useMemo(() => {
		let count = 0;
		if (filters.fileTypes?.length) count++;
		if (filters.tags?.length) count++;
		if (filters.uploadedBy) count++;
		if (filters.dateRange) count++;
		if (filters.sizeRange) count++;
		if (filters.collections?.length) count++;
		return count;
	}, [filters]);

	return (
		<div className="w-full space-y-6">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="font-bold text-2xl">Assets</h1>
					<p className="text-base-content/70">
						{totalCount.toLocaleString()}{" "}
						{totalCount === 1 ? "asset" : "assets"}
						{selectedAssets.size > 0 && (
							<span className="ml-2">• {selectedAssets.size} selected</span>
						)}
					</p>
				</div>

				{/* View controls */}
				<div className="join">
					<button
						className={`btn btn-sm join-item ${
							viewMode === "grid" ? "btn-primary" : "btn-outline"
						}`}
						onClick={() => setViewMode("grid")}
					>
						<Grid3X3 size={16} />
					</button>
					<button
						className={`btn btn-sm join-item ${
							viewMode === "list" ? "btn-primary" : "btn-outline"
						}`}
						onClick={() => setViewMode("list")}
					>
						<List size={16} />
					</button>
				</div>
			</div>

			{/* Toolbar */}
			<AssetToolbar
				selectedAssets={selectedAssets}
				onSelectAll={handleSelectAll}
				onClearSelection={handleClearSelection}
				onRefresh={() => refetch()}
				showUpload={showUpload}
			/>

			{/* Search and Filters */}
			<div className="flex flex-col gap-4 sm:flex-row">
				<div className="flex-1 relative">
					<Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" />
					<input
						className="input input-bordered w-full pl-10 text-sm"
						placeholder="Search assets..."
						value={filters.query || ""}
						onChange={(e) => handleSearch(e.target.value)}
					/>
				</div>

				<div className="flex items-center gap-2">
					<button
						className="btn btn-outline btn-sm gap-2"
						onClick={onFiltersOpen}
					>
						<Filter size={16} />
						Filters
						{activeFilterCount > 0 && (
							<span className="badge badge-primary badge-sm">
								{activeFilterCount}
							</span>
						)}
					</button>

					<div className="dropdown dropdown-end">
						<label tabIndex={0} className="btn btn-outline btn-sm gap-2">
							{sortOrder === "asc" ? (
								<SortAsc size={16} />
							) : (
								<SortDesc size={16} />
							)}
							Sort
						</label>
						<ul className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
							<li><a onClick={() => handleSort("name")}>Name</a></li>
							<li><a onClick={() => handleSort("createdAt")}>Date Created</a></li>
							<li><a onClick={() => handleSort("updatedAt")}>Date Modified</a></li>
							<li><a onClick={() => handleSort("fileSize")}>File Size</a></li>
							<li><a onClick={() => handleSort("fileType")}>File Type</a></li>
						</ul>
					</div>
				</div>
			</div>

			{/* Active Filters */}
			{activeFilterCount > 0 && (
				<div className="flex flex-wrap gap-2">
					{filters.fileTypes?.map((type) => (
						<span key={type} className="badge badge-outline gap-2">
							{type}
							<button 
								className="btn btn-xs btn-ghost"
								onClick={() =>
									handleFilterChange({
										fileTypes: filters.fileTypes?.filter((t) => t !== type),
									})
								}
							>
								×
							</button>
						</span>
					))}
					{filters.tags?.map((tag) => (
						<span key={tag} className="badge badge-secondary gap-2">
							{tag}
							<button 
								className="btn btn-xs btn-ghost"
								onClick={() =>
									handleFilterChange({
										tags: filters.tags?.filter((t) => t !== tag),
									})
								}
							>
								×
							</button>
						</span>
					))}
					{filters.uploadedBy && (
						<span className="badge badge-success gap-2">
							Uploaded by: {filters.uploadedBy}
							<button 
								className="btn btn-xs btn-ghost"
								onClick={() => handleFilterChange({ uploadedBy: undefined })}
							>
								×
							</button>
						</span>
					)}
					{filters.dateRange && (
						<span className="badge badge-warning gap-2">
							Date: {filters.dateRange.from.toLocaleDateString()} -{" "}
							{filters.dateRange.to.toLocaleDateString()}
							<button 
								className="btn btn-xs btn-ghost"
								onClick={() => handleFilterChange({ dateRange: undefined })}
							>
								×
							</button>
						</span>
					)}
				</div>
			)}

			{/* Session Debug */}
			{status === "unauthenticated" && (
				<div className="card bg-error shadow">
					<div className="card-body">
						<h3 className="card-title text-error-content">Authentication Error</h3>
						<p className="text-error-content">You are not logged in. Please log in to view assets.</p>
					</div>
				</div>
			)}

			{/* Error State */}
			{error && (
				<div className="card bg-error shadow">
					<div className="card-body">
						<h3 className="card-title text-error-content">Error Loading Assets</h3>
						<p className="text-error-content">
							{error.message || "Failed to load assets"}
						</p>
						{error.data?.code && (
							<p className="text-error-content text-sm">
								Error Code: {error.data.code}
							</p>
						)}
						<div className="card-actions">
							<button 
								className="btn btn-outline btn-error-content"
								onClick={() => refetch()}
							>
								Retry
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Loading State */}
			{isLoading && (
				<div className="flex justify-center py-8">
					<span className="loading loading-spinner loading-lg"></span>
				</div>
			)}

			{/* Asset Content */}
			{!isLoading && (
				<>
					{assets.length === 0 ? (
						<div className="card bg-base-100 shadow">
							<div className="card-body py-12 text-center">
								<div className="mb-4 text-base-content/60">
									<ImageIcon size={64} className="mx-auto mb-4 opacity-40" />
									<h3 className="font-medium text-lg">No assets found</h3>
									<p className="text-sm">
										{filters.query || activeFilterCount > 0
											? "Try adjusting your search or filters"
											: "Upload your first asset to get started"}
									</p>
								</div>
								{showUpload && (
									<button className="btn btn-primary btn-lg">
										Upload Assets
									</button>
								)}
							</div>
						</div>
					) : (
						<>
							{viewMode === "grid" ? (
								<AssetGrid
									assets={assets as any}
									selectedAssets={selectedAssets}
									onAssetClick={handleAssetClick}
									onAssetSelect={selectable ? handleAssetSelect : undefined}
									getFileTypeIcon={getFileTypeIcon}
								/>
							) : (
								<AssetList
									assets={assets as any}
									selectedAssets={selectedAssets}
									onAssetClick={handleAssetClick}
									onAssetSelect={selectable ? handleAssetSelect : undefined}
									onSort={(field: string) => handleSort(field as SortField)}
									sortField={sortField}
									sortOrder={sortOrder}
									getFileTypeIcon={getFileTypeIcon}
								/>
							)}

							{/* Pagination */}
							{hasMore && (
								<div className="flex justify-center">
									<button
										className="btn btn-outline"
										onClick={() => setCurrentPage((prev) => prev + 1)}
									>
										Load More
									</button>
								</div>
							)}
						</>
					)}
				</>
			)}

			{/* Asset Detail Modal */}
			{selectedAssetId && (
				<AssetDetailModal
					assetId={selectedAssetId}
					isOpen={isDetailOpen}
					onClose={onDetailClose}
					onEdit={() => {
						// TODO: Implement edit functionality
					}}
					onDelete={() => {
						// TODO: Implement delete functionality
						refetch();
					}}
					onAddToCollection={onCollectionSelectorOpen}
				/>
			)}

			{/* Filters Modal */}
			<BaseModal
				isOpen={isFiltersOpen}
				onClose={onFiltersClose}
				title="Filter Assets"
				size="lg"
			>
				<div className="space-y-6">
					<AssetFilters filters={filters} onChange={handleFilterChange} />
					<div className="flex justify-end gap-2">
						<button className="btn btn-outline" onClick={onFiltersClose}>
							Cancel
						</button>
						<button className="btn btn-primary" onClick={onFiltersClose}>
							Apply Filters
						</button>
					</div>
				</div>
			</BaseModal>

			{/* Collection Selector Modal */}
			{selectedAssetId && (
				<CollectionSelectorModal
					isOpen={isCollectionSelectorOpen}
					onClose={onCollectionSelectorClose}
					assetId={selectedAssetId}
					onSuccess={() => {
						// Optionally refetch data or show success message
						refetch();
					}}
				/>
			)}
		</div>
	);
}
