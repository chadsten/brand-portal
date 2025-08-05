"use client";

import { FileText, Image as ImageIcon, Music, Archive, Video, Calendar, Tag, User, FolderOpen, RotateCcw } from "lucide-react";
import { useMemo } from "react";
import { api } from "~/trpc/react";
import { 
	FilterSection, 
	SearchFilter, 
	CheckboxFilter, 
	DateRangeFilter, 
	SelectFilter,
	dateRangePresets,
	type CheckboxFilterOption,
	type SelectFilterOption,
	type DateRange
} from "~/components/filters";

// File type options with categorization
const FILE_TYPE_OPTIONS = [
	{
		value: "image",
		label: "Images",
		icon: <ImageIcon size={16} />,
		types: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
	},
	{
		value: "video",
		label: "Videos", 
		icon: <Video size={16} />,
		types: ["video/mp4", "video/avi", "video/mov", "video/webm"],
	},
	{
		value: "audio",
		label: "Audio",
		icon: <Music size={16} />,
		types: ["audio/mp3", "audio/wav", "audio/aac", "audio/ogg"],
	},
	{
		value: "document",
		label: "Documents",
		icon: <FileText size={16} />,
		types: ["application/pdf", "application/msword", "text/plain"],
	},
	{
		value: "archive",
		label: "Archives",
		icon: <Archive size={16} />,
		types: ["application/zip", "application/rar", "application/7z"],
	},
];

export interface AssetFilters {
	query?: string;
	fileTypes?: string[];
	tags?: string[];
	uploadedBy?: string;
	dateRange?: DateRange;
	collections?: string[];
}

export interface AssetFiltersSidebarProps {
	/**
	 * Current filter values
	 */
	filters: AssetFilters;
	/**
	 * Callback when filters change
	 */
	onChange: (filters: Partial<AssetFilters>) => void;
	/**
	 * Callback to clear all filters
	 */
	onClearAll: () => void;
	/**
	 * Organization ID for scoped queries
	 */
	organizationId?: string;
}

/**
 * Asset filters sidebar component using shared filter components
 */
export function AssetFiltersSidebar({
	filters,
	onChange,
	onClearAll,
	organizationId,
}: AssetFiltersSidebarProps) {
	// API queries for filter options
	const { data: collectionsData } = api.assetApi.searchCollections.useQuery({
		limit: 100,
	});

	// TODO: Implement these endpoints when available
	const tags: any[] = [];
	const users: any[] = [];

	// Transform file type categories to checkbox options
	const fileTypeOptions: CheckboxFilterOption[] = useMemo(() => {
		return FILE_TYPE_OPTIONS.map(option => {
			const isSelected = option.types.some(type => filters.fileTypes?.includes(type));
			return {
				value: option.value,
				label: option.label,
				// You could add count here if available from API
			};
		});
	}, [filters.fileTypes]);

	// Transform collections to checkbox options
	const collectionOptions: CheckboxFilterOption[] = useMemo(() => {
		if (!collectionsData?.collections) return [];
		
		return collectionsData.collections.map(collection => ({
			value: collection.id,
			label: collection.name,
			count: collection.assetCount,
		}));
	}, [collectionsData]);

	// Transform tags to checkbox options
	const tagOptions: CheckboxFilterOption[] = useMemo(() => {
		return tags.map(tag => ({
			value: tag.name,
			label: tag.name,
			count: tag.usageCount,
		}));
	}, [tags]);

	// Transform users to select options
	const userOptions: SelectFilterOption[] = useMemo(() => {
		return users.map(user => ({
			value: user.id,
			label: user.name || user.email,
		}));
	}, [users]);

	// Handle file type changes
	const handleFileTypeChange = (selectedCategories: string[]) => {
		// Convert category selections to actual mime types
		const mimeTypes: string[] = [];
		selectedCategories.forEach((category) => {
			const option = FILE_TYPE_OPTIONS.find((opt) => opt.value === category);
			if (option) {
				mimeTypes.push(...option.types);
			}
		});
		onChange({ fileTypes: mimeTypes });
	};

	// Get selected file type categories
	const getSelectedFileTypeCategories = (): string[] => {
		if (!filters.fileTypes?.length) return [];

		return FILE_TYPE_OPTIONS.filter((option) =>
			option.types.some((type) => filters.fileTypes?.includes(type)),
		).map((option) => option.value);
	};

	// Count active filters
	const activeFilterCount = useMemo(() => {
		let count = 0;
		if (filters.fileTypes?.length) count++;
		if (filters.tags?.length) count++;
		if (filters.uploadedBy) count++;
		if (filters.dateRange?.from || filters.dateRange?.to) count++;
		if (filters.collections?.length) count++;
		return count;
	}, [filters]);

	return (
		<div className="space-y-4">
			{/* Clear All Button */}
			{activeFilterCount > 0 && (
				<button
					className="btn btn-outline btn-error w-full gap-2"
					onClick={onClearAll}
				>
					<RotateCcw size={16} />
					Clear All Filters ({activeFilterCount})
				</button>
			)}

			{/* Search */}
			<FilterSection title="Search" icon={<ImageIcon size={16} />}>
				<SearchFilter
					value={filters.query || ""}
					onChange={(query) => onChange({ query })}
					placeholder="Search assets..."
				/>
			</FilterSection>

			{/* File Types */}
			<FilterSection 
				title="File Types" 
				icon={<FileText size={16} />}
				badgeCount={filters.fileTypes?.length}
				collapsible
				defaultExpanded={!!filters.fileTypes?.length}
			>
				<CheckboxFilter
					options={fileTypeOptions}
					selectedValues={getSelectedFileTypeCategories()}
					onChange={handleFileTypeChange}
					showSelectAll
				/>
			</FilterSection>

			{/* Upload Date */}
			<FilterSection 
				title="Upload Date" 
				icon={<Calendar size={16} />}
				collapsible
				defaultExpanded={!!(filters.dateRange?.from || filters.dateRange?.to)}
			>
				<DateRangeFilter
					value={filters.dateRange}
					onChange={(dateRange) => onChange({ dateRange })}
					presets={dateRangePresets}
					fromLabel="Uploaded After"
					toLabel="Uploaded Before"
				/>
			</FilterSection>

			{/* Tags */}
			{tagOptions.length > 0 && (
				<FilterSection 
					title="Tags" 
					icon={<Tag size={16} />}
					badgeCount={filters.tags?.length}
					collapsible
					defaultExpanded={!!filters.tags?.length}
				>
					<CheckboxFilter
						options={tagOptions}
						selectedValues={filters.tags || []}
						onChange={(tags) => onChange({ tags })}
						maxHeight="max-h-40"
						showSelectAll
					/>
				</FilterSection>
			)}

			{/* Uploaded By */}
			{userOptions.length > 0 && (
				<FilterSection 
					title="Uploaded By" 
					icon={<User size={16} />}
					collapsible
					defaultExpanded={!!filters.uploadedBy}
				>
					<SelectFilter
						options={userOptions}
						value={filters.uploadedBy}
						onChange={(uploadedBy) => onChange({ uploadedBy })}
						placeholder="Select uploader"
					/>
				</FilterSection>
			)}

			{/* Collections */}
			{collectionOptions.length > 0 && (
				<FilterSection 
					title="Collections" 
					icon={<FolderOpen size={16} />}
					badgeCount={filters.collections?.length}
					collapsible
					defaultExpanded={!!filters.collections?.length}
				>
					<CheckboxFilter
						options={collectionOptions}
						selectedValues={filters.collections || []}
						onChange={(collections) => onChange({ collections })}
						maxHeight="max-h-40"
						showSelectAll
					/>
				</FilterSection>
			)}

			{/* Filter Summary */}
			{activeFilterCount > 0 && (
				<div className="mt-6 p-4 bg-base-200 rounded-lg">
					<div className="text-sm font-medium mb-2">Active Filters:</div>
					<div className="text-xs text-base-content/70">
						{activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
					</div>
				</div>
			)}
		</div>
	);
}