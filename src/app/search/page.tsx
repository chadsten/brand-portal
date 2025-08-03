"use client";

// Import removed - using native HTML and DaisyUI classes
import { Save } from "lucide-react";
import { useState } from "react";
import { AdvancedSearch } from "~/components/search/AdvancedSearch";
import { SavedSearches } from "~/components/search/SavedSearches";
import { SearchFilters } from "~/components/search/SearchFilters";
import {
	type SearchResult,
	SearchResults,
} from "~/components/search/SearchResults";

interface SearchFilter {
	id: string;
	type: "text" | "select" | "date" | "number" | "multiselect";
	field: string;
	label: string;
	value?: unknown;
	operator?: string;
	options?: Array<{ value: string; label: string }>;
}

interface SavedSearch {
	id: string;
	name: string;
	query: string;
	filters: SearchFilter[];
	createdAt: Date;
	isShared: boolean;
}

// Mock data generator
const generateMockResults = (count: number): SearchResult[] => {
	const types = ["asset", "collection", "guideline", "user"] as const;
	const fileTypes = ["image/png", "image/jpeg", "video/mp4", "application/pdf"];
	const tags = [
		"brand",
		"logo",
		"marketing",
		"social",
		"campaign",
		"guidelines",
		"template",
	];
	const authors = [
		{ id: "1", name: "Sarah Chen", avatar: "/avatars/sarah.jpg" },
		{ id: "2", name: "Mike Johnson", avatar: "/avatars/mike.jpg" },
		{ id: "3", name: "Alex Rivera", avatar: "/avatars/alex.jpg" },
	];

	return Array.from({ length: count }, (_, i) => ({
		id: `result-${i + 1}`,
		type: types[Math.floor(Math.random() * types.length)] as
			| "asset"
			| "collection"
			| "guideline"
			| "user",
		title: `${types[i % types.length]} Item ${i + 1}`,
		description: `This is a sample ${types[i % types.length]} item with detailed description for search results demonstration.`,
		thumbnailUrl: i % 3 === 0 ? undefined : `/placeholder-${(i % 4) + 1}.jpg`,
		fileType: fileTypes[Math.floor(Math.random() * fileTypes.length)],
		fileSize: Math.floor(Math.random() * 10000000),
		createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
		updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
		author: authors[Math.floor(Math.random() * authors.length)] as {
			id: string;
			name: string;
			avatar: string;
		},
		tags: tags.slice(0, Math.floor(Math.random() * 4) + 1),
		metadata: {
			views: Math.floor(Math.random() * 1000),
			downloads: Math.floor(Math.random() * 500),
			likes: Math.floor(Math.random() * 100),
			rating: Math.random() * 2 + 3,
			compliance: Math.floor(Math.random() * 30) + 70,
		},
		relevanceScore: Math.random() * 0.3 + 0.7,
	}));
};

export default function SearchPage() {
	const [query, setQuery] = useState("");
	const [filters, setFilters] = useState<SearchFilter[]>([]);
	const [activeFilters, setActiveFilters] = useState<Record<string, unknown>>(
		{},
	);
	const [results, setResults] = useState<SearchResult[]>([]);
	const [totalResults, setTotalResults] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(24);
	const [sortBy, setSortBy] = useState("relevance");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [isLoading, setIsLoading] = useState(false);
	const [showSavedSearches, setShowSavedSearches] = useState(false);

	// Searchable fields configuration
	const searchableFields = [
		{ field: "title", label: "Title", type: "text" as const },
		{ field: "description", label: "Description", type: "text" as const },
		{
			field: "fileType",
			label: "File Type",
			type: "select" as const,
			options: [
				{ value: "image", label: "Images" },
				{ value: "video", label: "Videos" },
				{ value: "document", label: "Documents" },
				{ value: "audio", label: "Audio" },
			],
		},
		{ field: "author", label: "Author", type: "text" as const },
		{ field: "tags", label: "Tags", type: "tags" as const },
		{ field: "createdAt", label: "Created Date", type: "date" as const },
		{ field: "fileSize", label: "File Size", type: "range" as const },
		{ field: "compliance", label: "Compliance Score", type: "range" as const },
	];

	// Filter groups for sidebar
	const filterGroups = [
		{
			id: "type",
			label: "Type",
			type: "checkbox" as const,
			options: [
				{ value: "asset", label: "Assets", count: 1247 },
				{ value: "collection", label: "Collections", count: 89 },
				{ value: "guideline", label: "Guidelines", count: 23 },
				{ value: "user", label: "Users", count: 156 },
			],
		},
		{
			id: "fileType",
			label: "File Type",
			type: "checkbox" as const,
			options: [
				{ value: "image", label: "Images", count: 892 },
				{ value: "video", label: "Videos", count: 234 },
				{ value: "document", label: "Documents", count: 121 },
				{ value: "audio", label: "Audio", count: 45 },
			],
		},
		{
			id: "dateRange",
			label: "Date Range",
			type: "date" as const,
		},
		{
			id: "fileSize",
			label: "File Size (MB)",
			type: "range" as const,
			min: 0,
			max: 100,
			step: 1,
			unit: "MB",
		},
		{
			id: "rating",
			label: "Rating",
			type: "radio" as const,
			options: [
				{ value: "5", label: "5 Stars", count: 234 },
				{ value: "4", label: "4+ Stars", count: 567 },
				{ value: "3", label: "3+ Stars", count: 890 },
				{ value: "any", label: "Any Rating", count: 1234 },
			],
		},
	];

	// Mock saved searches
	const mockSavedSearches = [
		{
			id: "1",
			name: "Brand Assets Only",
			description: "All brand-approved image assets",
			query: "brand",
			filters: [{ field: "fileType", label: "File Type", value: "image" }],
			createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
			lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
			runCount: 23,
			isFavorite: true,
			isShared: true,
			alerts: {
				enabled: true,
				frequency: "daily" as const,
				conditions: {
					newResults: true,
				},
			},
			owner: {
				id: "1",
				name: "Sarah Chen",
				avatar: "/avatars/sarah.jpg",
			},
		},
		{
			id: "2",
			name: "Recent Marketing Materials",
			description: "Marketing assets from the last 30 days",
			query: "marketing",
			filters: [
				{ field: "tags", label: "Tags", value: ["marketing", "campaign"] },
				{
					field: "dateRange",
					label: "Date",
					value: {
						start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
						end: new Date(),
					},
				},
			],
			createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
			runCount: 8,
			isFavorite: false,
			isShared: false,
			alerts: {
				enabled: false,
				frequency: "weekly" as const,
				conditions: {
					newResults: false,
				},
			},
			owner: {
				id: "1",
				name: "Sarah Chen",
				avatar: "/avatars/sarah.jpg",
			},
		},
	];

	const handleSearch = (searchQuery: string, searchFilters: SearchFilter[]) => {
		setIsLoading(true);
		setQuery(searchQuery);
		setFilters(searchFilters);

		// Simulate API call
		setTimeout(() => {
			const mockResults = generateMockResults(120);
			setResults(mockResults.slice(0, pageSize));
			setTotalResults(mockResults.length);
			setCurrentPage(1);
			setIsLoading(false);
		}, 1000);
	};

	const handleFilterChange = (filterId: string, value: unknown) => {
		setActiveFilters((prev) => ({
			...prev,
			[filterId]: value,
		}));

		// Trigger search with new filters
		handleSearch(query, filters);
	};

	const handleClearFilters = () => {
		setActiveFilters({});
		handleSearch(query, filters);
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
		// Simulate loading new page
		const mockResults = generateMockResults(totalResults);
		const start = (page - 1) * pageSize;
		const end = start + pageSize;
		setResults(mockResults.slice(start, end));
	};

	const handlePageSizeChange = (size: number) => {
		setPageSize(size);
		setCurrentPage(1);
		// Reload results with new page size
		const mockResults = generateMockResults(totalResults);
		setResults(mockResults.slice(0, size));
	};

	const handleRunSavedSearch = (search: SavedSearch) => {
		setQuery(search.query);
		setFilters(search.filters);
		handleSearch(search.query, search.filters);
		setShowSavedSearches(false);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="space-y-6">
				{/* Search Header */}
				<div>
					<h1 className="mb-2 font-bold text-3xl">Search</h1>
					<p className="text-base-content/60">
						Find assets, collections, guidelines, and more across your brand
						portal
					</p>
				</div>

				{/* Advanced Search */}
				<AdvancedSearch
					onSearch={handleSearch}
					searchableFields={searchableFields}
					presets={[
						{
							id: "1",
							name: "Images Only",
							filters: [
								{
									id: "1",
									type: "select",
									field: "fileType",
									label: "File Type",
									value: "image",
									operator: "equals",
								},
							],
							createdAt: new Date(),
							isShared: true,
							icon: "image",
						},
						{
							id: "2",
							name: "Recent Uploads",
							filters: [
								{
									id: "1",
									type: "date",
									field: "createdAt",
									label: "Created",
									value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
									operator: "greater_than",
								},
							],
							createdAt: new Date(),
							isShared: true,
							icon: "calendar",
						},
					]}
					onSavePreset={(preset) => console.log("Save preset:", preset)}
				/>

				{/* Toggle Saved Searches */}
				<div className="flex justify-end">
					<button
						className="btn btn-outline gap-2"
						onClick={() => setShowSavedSearches(!showSavedSearches)}
					>
						<Save size={16} />
						{showSavedSearches ? "Hide" : "Show"} Saved Searches
					</button>
				</div>

				{/* Saved Searches */}
				{showSavedSearches && (
					<SavedSearches
						searches={mockSavedSearches}
						onRunSearch={handleRunSavedSearch}
						onUpdateSearch={(search) => console.log("Update search:", search)}
						onDeleteSearch={(id) => console.log("Delete search:", id)}
						onCreateSearch={(search) => console.log("Create search:", search)}
					/>
				)}

				{/* Main Content */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
					{/* Filters Sidebar */}
					<div className="lg:col-span-1">
						<SearchFilters
							filterGroups={filterGroups}
							activeFilters={activeFilters}
							onFilterChange={handleFilterChange}
							onClearAll={handleClearFilters}
						/>
					</div>

					{/* Search Results */}
					<div className="lg:col-span-3">
						<SearchResults
							results={results}
							totalResults={totalResults}
							currentPage={currentPage}
							pageSize={pageSize}
							onPageChange={handlePageChange}
							onPageSizeChange={handlePageSizeChange}
							sortBy={sortBy}
							onSortChange={setSortBy}
							viewMode={viewMode}
							onViewModeChange={setViewMode}
							isLoading={isLoading}
							searchQuery={query}
							onResultClick={(result) => console.log("Click result:", result)}
							onActionClick={(action, result) => console.log(action, result)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}