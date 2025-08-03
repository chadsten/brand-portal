"use client";

// Import removed - using native HTML and DaisyUI classes
import { useModal } from "~/hooks/useModal";
import {
	Filter,
	Grid,
	Grid3X3,
	List,
	Plus,
	Rows3,
	Search,
	SortAsc,
	SortDesc,
} from "lucide-react";
import { useState } from "react";
import { api } from "~/trpc/react";
import { CollectionCreateModal } from "./CollectionCreateModal";
import { CollectionDetailModal } from "./CollectionDetailModal";
import { CollectionFilters } from "./CollectionFilters";
import { CollectionGrid } from "./CollectionGrid";
import { CollectionList } from "./CollectionList";

export interface CollectionFiltersState {
	query: string;
	category: string;
	isPublic?: boolean;
	isTemplate?: boolean;
	tags: string[];
	createdBy?: string;
	dateRange?: {
		from: Date;
		to: Date;
	};
	assetCountRange?: {
		min: number;
		max: number;
	};
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
	const [sortField, setSortField] = useState<string>("createdAt");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [currentPage, setCurrentPage] = useState(1);
	const [showFilters, setShowFilters] = useState(false);
	const [filters, setFilters] = useState<CollectionFiltersState>({
		query: "",
		category: "",
		tags: [],
	});

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

	const itemsPerPage = 20;
	const offset = (currentPage - 1) * itemsPerPage;

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
		limit: itemsPerPage,
		offset,
	}) || {
		data: { collections: [], total: 0 },
		isLoading: false,
		refetch: () => {},
	};

	const collections = collectionsData?.collections || [];
	const totalItems = collectionsData?.total || 0;
	const totalPages = Math.ceil(totalItems / itemsPerPage);

	const handleFilterChange = (newFilters: Partial<CollectionFiltersState>) => {
		setFilters((prev) => ({ ...prev, ...newFilters }));
		setCurrentPage(1);
	};

	const handleCollectionSelect = (collectionId: string) => {
		setSelectedCollection(collectionId);
		onDetailOpen();
	};

	const handleSort = (field: string) => {
		if (sortField === field) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortOrder("desc");
		}
		setCurrentPage(1);
	};

	const toggleSortOrder = () => {
		setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		setCurrentPage(1);
	};

	const clearFilters = () => {
		setFilters({
			query: "",
			category: "",
			tags: [],
		});
		setCurrentPage(1);
	};

	const activeFilterCount = Object.values(filters).filter((value) => {
		if (Array.isArray(value)) return value.length > 0;
		return value !== "" && value !== undefined && value !== null;
	}).length;

	return (
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

			{/* Search and Controls */}
			<div className="card bg-base-100 shadow">
				<div className="card-body gap-4">
					<div className="flex flex-col gap-4 md:flex-row md:items-center">
						<div className="relative flex-1">
							<Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" />
							<input
								className="input input-bordered w-full pl-10 h-10"
								placeholder="Search collections..."
								value={filters.query}
								onChange={(e) => handleFilterChange({ query: e.target.value })}
							/>
						</div>
						<div className="flex items-center gap-2">
							<button
								className={`btn gap-2 ${
									showFilters ? "btn-primary" : "btn-outline"
								}`}
								onClick={() => setShowFilters(!showFilters)}
							>
								<Filter size={16} />
								Filters
								{activeFilterCount > 0 && (
									<span className="badge badge-primary badge-sm">
										{activeFilterCount}
									</span>
								)}
							</button>
							<select
								aria-label="Sort by"
								className="select select-bordered w-40"
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
					</div>

					{/* Active Filters */}
					{activeFilterCount > 0 && (
						<div className="flex flex-wrap items-center gap-2">
							<span className="text-base-content/70 text-sm">
								Active filters:
							</span>
							{filters.query && (
								<span className="badge badge-outline gap-2">
									Query: {filters.query}
									<button 
										className="btn btn-xs btn-ghost"
										onClick={() => handleFilterChange({ query: "" })}
									>
										×
									</button>
								</span>
							)}
							{filters.category && (
								<span className="badge badge-outline gap-2">
									Category: {filters.category}
									<button 
										className="btn btn-xs btn-ghost"
										onClick={() => handleFilterChange({ category: "" })}
									>
										×
									</button>
								</span>
							)}
							{filters.tags.map((tag) => (
								<span key={tag} className="badge badge-outline gap-2">
									Tag: {tag}
									<button 
										className="btn btn-xs btn-ghost"
										onClick={() =>
											handleFilterChange({
												tags: filters.tags.filter((t) => t !== tag),
											})
										}
									>
										×
									</button>
								</span>
							))}
							<button className="btn btn-sm btn-ghost" onClick={clearFilters}>
								Clear all
							</button>
						</div>
					)}

					{/* Filters Panel */}
					{showFilters && (
						<>
							<div className="divider"></div>
							<CollectionFilters
								filters={filters}
								onFiltersChange={handleFilterChange}
							/>
						</>
					)}
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
							<button className="btn btn-outline" onClick={clearFilters}>
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
				<div className="flex justify-center">
					<div className="join">
						<button 
							className="join-item btn" 
							disabled={currentPage === 1}
							onClick={() => setCurrentPage(currentPage - 1)}
						>
							«
						</button>
						<button className="join-item btn btn-active">
							Page {currentPage} of {totalPages}
						</button>
						<button 
							className="join-item btn" 
							disabled={currentPage === totalPages}
							onClick={() => setCurrentPage(currentPage + 1)}
						>
							»
						</button>
					</div>
				</div>
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
}
