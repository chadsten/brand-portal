"use client";

import {
	Archive,
	Download,
	Edit,
	Eye,
	FileText,
	Grid3X3,
	Image as ImageIcon,
	List,
	MoreVertical,
	Music,
	SortAsc,
	SortDesc,
	Trash2,
	Video,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { useUrlFilters } from "~/hooks/useUrlFilters";
import { SidebarLayout } from "~/components/layout/SidebarLayout";
import { AssetDetailModal } from "./AssetDetailModal";
import { AssetFiltersSidebar } from "./AssetFiltersSidebar";
import { AssetGrid } from "./AssetGrid";
import { AssetList } from "./AssetList";
import { AssetToolbar } from "./AssetToolbar";
import { CollectionSelectorModal } from "./CollectionSelectorModal";
import { useModal } from "~/hooks/useModal";
import { UploadManager } from "../upload";
import { Pagination } from "~/components/ui";
import type { DateRange } from "~/components/filters";

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
	dateRange?: DateRange;
	collections?: string[];
	page?: number;
	pageSize?: number;
	sortField?: SortField;
	sortOrder?: SortOrder;
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
	const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
	const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

	// URL-synced filters and pagination
	const { filters, updateFilters, clearFilters, activeFilterCount } = useUrlFilters<AssetFilters>({
		defaultFilters: {
			page: 1,
			pageSize: 25,
			sortField: "createdAt",
			sortOrder: "desc",
		},
		serializers: {
			dateRange: {
				serialize: (value) => JSON.stringify(value),
				deserialize: (value) => {
					try {
						const parsed = JSON.parse(value);
						return {
							from: parsed.from ? new Date(parsed.from) : undefined,
							to: parsed.to ? new Date(parsed.to) : undefined,
						};
					} catch {
						return undefined;
					}
				},
			},
		},
	});

	// Extract pagination and sorting from URL state
	const currentPage = filters.page || 1;
	const pageSize = filters.pageSize || 25;
	const sortField = filters.sortField || "createdAt";
	const sortOrder = filters.sortOrder || "desc";

	// Modal controls
	const {
		isOpen: isDetailOpen,
		onOpen: onDetailOpen,
		onClose: onDetailClose,
	} = useModal();

	// Enhanced close handler that clears selection
	const handleDetailClose = useCallback(() => {
		onDetailClose();
		setSelectedAssetId(null);
	}, [onDetailClose]);

	// Clear selectedAssetId when modal closes (regardless of how it closes) 
	useEffect(() => {
		if (!isDetailOpen && selectedAssetId) {
			setSelectedAssetId(null);
		}
	}, [isDetailOpen, selectedAssetId]);
	const {
		isOpen: isCollectionSelectorOpen,
		onOpen: onCollectionSelectorOpen,
		onClose: onCollectionSelectorClose,
	} = useModal();
	const {
		isOpen: isUploadOpen,
		onOpen: onUploadOpen,
		onClose: onUploadClose,
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
		page: currentPage,
		pageSize: pageSize,
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
	const totalPages = assetsData?.totalPages || 0;
	const hasNextPage = assetsData?.hasNextPage || false;
	const hasPreviousPage = assetsData?.hasPreviousPage || false;

	// Handlers
	const handleFilterChange = useCallback(
		(newFilters: Partial<AssetFilters>) => {
			updateFilters({ ...newFilters, page: 1 });
		},
		[updateFilters],
	);

	const handleClearAllFilters = useCallback(() => {
		clearFilters();
	}, [clearFilters]);

	const handleSort = useCallback(
		(field: SortField) => {
			if (field === sortField) {
				updateFilters({ sortOrder: sortOrder === "asc" ? "desc" : "asc", page: 1 });
			} else {
				updateFilters({ sortField: field, sortOrder: "desc", page: 1 });
			}
		},
		[sortField, sortOrder, updateFilters],
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
			setSelectedAssets(prev => {
				const newSelected = new Set(prev);
				if (selected) {
					newSelected.add(assetId);
				} else {
					newSelected.delete(assetId);
				}
				
				if (onAssetsSelect) {
					onAssetsSelect(Array.from(newSelected));
				}
				
				return newSelected;
			});
		},
		[onAssetsSelect],
	);

	const handlePageChange = useCallback((page: number) => {
		updateFilters({ page });
	}, [updateFilters]);

	const handlePageSizeChange = useCallback((newPageSize: number) => {
		updateFilters({ pageSize: newPageSize, page: 1 });
	}, [updateFilters]);

	const allAssetIds = useMemo(() => assets.map((asset: any) => asset.id), [assets]);

	const handleSelectAll = useCallback(() => {
		setSelectedAssets(new Set(allAssetIds));
		if (onAssetsSelect) {
			onAssetsSelect(allAssetIds);
		}
	}, [allAssetIds, onAssetsSelect]);

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


	// Create sidebar content
	const sidebarContent = (
		<AssetFiltersSidebar
			filters={filters}
			onChange={handleFilterChange}
			onClearAll={handleClearAllFilters}
			organizationId={organizationId}
		/>
	);

	// Create main content
	const mainContent = (
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

				{/* View controls and Sort */}
				<div className="flex items-center gap-2">
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

			{/* Toolbar */}
			<AssetToolbar
				selectedAssets={selectedAssets}
				onSelectAll={handleSelectAll}
				onClearSelection={handleClearSelection}
				onRefresh={() => refetch()}
				showUpload={showUpload}
			/>

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
									<button 
										className="btn btn-primary btn-lg"
										onClick={onUploadOpen}
									>
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
							{totalPages > 1 && (
								<Pagination
									currentPage={currentPage}
									totalPages={totalPages}
									pageSize={pageSize}
									total={totalCount}
									onPageChange={handlePageChange}
									onPageSizeChange={handlePageSizeChange}
									showPageSizeSelector={true}
									pageSizeOptions={[25, 50, 100]}
									disabled={isLoading}
								/>
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
					onClose={handleDetailClose}
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

			{/* Upload Manager Modal */}
			<dialog className="modal modal-bottom sm:modal-middle" open={isUploadOpen}>
				<div className="modal-box max-w-4xl w-full">
					<UploadManager
						onUploadComplete={(files) => {
							console.log('Upload completed:', files);
							refetch();
							onUploadClose();
						}}
						maxFiles={50}
						maxSize={100 * 1024 * 1024}
					/>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button onClick={onUploadClose}>close</button>
				</form>
			</dialog>
		</div>
	);

	return (
		<SidebarLayout
			sidebar={sidebarContent}
			activeFilterCount={activeFilterCount}
			filterTitle="Asset Filters"
		>
			{mainContent}
		</SidebarLayout>
	);
}
