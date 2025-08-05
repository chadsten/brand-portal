"use client";

import {
	Filter,
	Grid,
	Grid3X3,
	List,
	Plus,
	Rows3,
	SortAsc,
	SortDesc,
} from "lucide-react";
import { useState } from "react";
import { api } from "~/trpc/react";
import { useUrlFilters } from "~/hooks/useUrlFilters";
import { SidebarLayout } from "~/components/layout/SidebarLayout";
import { CollectionCreateModal } from "./CollectionCreateModal";
import { CollectionDetailModal } from "./CollectionDetailModal";
import { CollectionFiltersSidebar } from "./CollectionFiltersSidebar";
import { CollectionGrid } from "./CollectionGrid";
import { CollectionList } from "./CollectionList";
import { useModal } from "~/hooks/useModal";
import { Pagination } from "~/components/ui";
import type { DateRange } from "~/components/filters";

export interface CollectionFilters {
	query?: string;
	category?: string;
	isPublic?: boolean;
	isTemplate?: boolean;
	tags?: string[];
	createdBy?: string;
	dateRange?: DateRange;
	assetCountRange?: {
		min: number;
		max: number;
	};
	page?: number;
	pageSize?: number;
	sortField?: string;
	sortOrder?: "asc" | "desc";
}

const SORT_OPTIONS = [
	{ key: "name", label: "Name" },
	{ key: "createdAt", label: "Created Date" },
	{ key: "updatedAt", label: "Modified Date" },
	{ key: "assetCount", label: "Asset Count" },
	{ key: "totalSize", label: "Total Size" },
];

export function CollectionBrowser() {
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [selectedCollection, setSelectedCollection] = useState<string | null>(
		null,
	);

	// URL-synced filters and pagination
	const { filters, updateFilters, clearFilters, activeFilterCount } = useUrlFilters<CollectionFilters>({
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
			assetCountRange: {
				serialize: (value) => JSON.stringify(value),
				deserialize: (value) => {
					try {
						return JSON.parse(value);
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
		isOpen: isCreateOpen,
		onOpen: onCreateOpen,
		onClose: onCreateClose,
	} = useModal();
	const {
		isOpen: isDetailOpen,
		onOpen: onDetailOpen,
		onClose: onDetailClose,
	} = useModal();

	// API queries
	const {
		data: collectionsData,
		isLoading,
		refetch,
	} = api.assetApi.searchCollections?.useQuery({
		query: filters.query || "",
		isPublic: filters.isPublic,
		isTemplate: filters.isTemplate,
		tags: filters.tags,
		createdBy: filters.createdBy,
		sortBy: sortField as any,
		sortOrder,
		page: currentPage,
		pageSize: pageSize,
	}) || {
		data: { collections: [], total: 0, totalPages: 0, currentPage: 1, pageSize: 25 },
		isLoading: false,
		refetch: () => {},
	};

	const collections = collectionsData?.collections || [];
	const totalItems = collectionsData?.total || 0;
	const totalPages = collectionsData?.totalPages || 0;

	const handleFilterChange = (newFilters: Partial<CollectionFilters>) => {
		updateFilters({ ...newFilters, page: 1 });
	};

	const handleCollectionSelect = (collectionId: string) => {
		setSelectedCollection(collectionId);
		onDetailOpen();
	};

	const handleSort = (field: string) => {
		if (sortField === field) {
			updateFilters({ sortOrder: sortOrder === "asc" ? "desc" : "asc", page: 1 });
		} else {
			updateFilters({ sortField: field, sortOrder: "desc", page: 1 });
		}
	};

	const toggleSortOrder = () => {
		updateFilters({ sortOrder: sortOrder === "asc" ? "desc" : "asc", page: 1 });
	};

	const handleClearFilters = () => {
		clearFilters();
	};

	const handlePageChange = (page: number) => {
		updateFilters({ page });
	};

	const handlePageSizeChange = (newPageSize: number) => {
		updateFilters({ pageSize: newPageSize, page: 1 });
	};


	// Create sidebar content
	const sidebarContent = (
		<CollectionFiltersSidebar
			filters={filters}
			onChange={handleFilterChange}
			onClearAll={handleClearFilters}
		/>
	);

	// Create main content
	const mainContent = (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-bold text-2xl">Collections</h1>
					<p className="text-base-content/70 text-sm">
						Organize and manage your asset collections
					</p>
				</div>
				<button
					className="btn btn-primary gap-2"
					onClick={onCreateOpen}
				>
					<Plus size={16} />
					Create Collection
				</button>
			</div>

			{/* Controls */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="flex items-center gap-2">
					<select
						aria-label="Sort by"
						className="select"
						value={sortField}
						onChange={(e) => handleSort(e.target.value)}
					>
						<option disabled value="">Sort by</option>
						{SORT_OPTIONS.map((option) => (
							<option key={option.key} value={option.key}>{option.label}</option>
						))}
					</select>
					<button
						className="btn btn-square btn-outline"
						onClick={toggleSortOrder}
						aria-label={`Sort ${sortOrder === "asc" ? "ascending" : "descending"}`}
					>
						{sortOrder === "asc" ? (
							<SortAsc size={16} />
						) : (
							<SortDesc size={16} />
						)}
					</button>
				</div>

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
						<Rows3 size={16} />
					</button>
				</div>
			</div>

			{/* Results Summary */}
			<div className="flex items-center justify-between text-base-content/70 text-sm">
				<span>
					{isLoading
						? "Loading..."
						: `${totalItems} collection${totalItems === 1 ? "" : "s"} found`}
				</span>
				{totalPages > 1 && (
					<span>
						Page {currentPage} of {totalPages}
					</span>
				)}
			</div>

			{/* Content */}
			{isLoading ? (
				<div className="flex justify-center py-12">
					<span className="loading loading-spinner loading-lg"></span>
				</div>
			) : collections.length === 0 ? (
				<div className="card bg-base-100 shadow">
					<div className="card-body py-12 text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-base-200">
							<Grid size={24} className="text-base-content/60" />
						</div>
						<h3 className="mb-2 font-semibold text-lg">
							No collections found
						</h3>
						<p className="mb-4 text-base-content/70 text-sm">
							{activeFilterCount > 0
								? "Try adjusting your filters or search terms"
								: "Get started by creating your first collection"}
						</p>
						{activeFilterCount > 0 ? (
							<button className="btn btn-outline" onClick={handleClearFilters}>
								Clear filters
							</button>
						) : (
							<button className="btn btn-primary" onClick={onCreateOpen}>
								Create Collection
							</button>
						)}
					</div>
				</div>
			) : viewMode === "grid" ? (
				<CollectionGrid
					collections={collections as any}
					onCollectionSelect={handleCollectionSelect}
				/>
			) : (
				<CollectionList
					collections={collections as any}
					onCollectionSelect={handleCollectionSelect}
				/>
			)}

			{/* Pagination */}
			{totalPages > 1 && (
				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					pageSize={pageSize}
					total={totalItems}
					onPageChange={handlePageChange}
					onPageSizeChange={handlePageSizeChange}
					showPageSizeSelector={true}
					pageSizeOptions={[25, 50, 100]}
					disabled={isLoading}
				/>
			)}

			{/* Modals */}
			<CollectionCreateModal
				isOpen={isCreateOpen}
				onClose={onCreateClose}
				onSuccess={() => {
					refetch();
					onCreateClose();
				}}
			/>

			{selectedCollection && (
				<CollectionDetailModal
					collectionId={selectedCollection}
					isOpen={isDetailOpen}
					onClose={() => {
						onDetailClose();
						setSelectedCollection(null);
					}}
					onUpdate={refetch}
				/>
			)}
		</div>
	);

	return (
		<SidebarLayout
			sidebar={sidebarContent}
			activeFilterCount={activeFilterCount}
			filterTitle="Collection Filters"
		>
			{mainContent}
		</SidebarLayout>
	);
}
