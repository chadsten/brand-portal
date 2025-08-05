"use client";

import { Grid, User, Tag, Calendar, Crown, Eye, RotateCcw, HardDrive } from "lucide-react";
import { useMemo } from "react";
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

// Collection categories
const COLLECTION_CATEGORIES = [
	{ key: "general", label: "General" },
	{ key: "marketing", label: "Marketing" },
	{ key: "brand", label: "Brand Assets" },
	{ key: "product", label: "Product" },
	{ key: "social", label: "Social Media" },
	{ key: "print", label: "Print Materials" },
	{ key: "web", label: "Web Assets" },
	{ key: "presentation", label: "Presentations" },
	{ key: "training", label: "Training" },
	{ key: "archive", label: "Archive" },
];

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
}

export interface CollectionFiltersSidebarProps {
	/**
	 * Current filter values
	 */
	filters: CollectionFilters;
	/**
	 * Callback when filters change
	 */
	onChange: (filters: Partial<CollectionFilters>) => void;
	/**
	 * Callback to clear all filters
	 */
	onClearAll: () => void;
}

/**
 * Collection filters sidebar component using shared filter components
 */
export function CollectionFiltersSidebar({
	filters,
	onChange,
	onClearAll,
}: CollectionFiltersSidebarProps) {
	// TODO: Implement these endpoints when available
	const tags: any[] = [];
	const users: any[] = [];

	// Transform categories to select options
	const categoryOptions: SelectFilterOption[] = useMemo(() => {
		return COLLECTION_CATEGORIES.map(cat => ({
			value: cat.key,
			label: cat.label,
		}));
	}, []);

	// Transform tags to checkbox options
	const tagOptions: CheckboxFilterOption[] = useMemo(() => {
		return tags.map(tag => ({
			value: tag.id,
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

	// Handle asset count range changes
	const handleAssetCountChange = (field: 'min' | 'max', value: number) => {
		const currentRange = filters.assetCountRange || { min: 0, max: 1000 };
		const newRange = { ...currentRange, [field]: value };
		onChange({ assetCountRange: newRange });
	};

	// Count active filters
	const activeFilterCount = useMemo(() => {
		let count = 0;
		if (filters.category) count++;
		if (filters.isPublic !== undefined) count++;
		if (filters.isTemplate !== undefined) count++;
		if (filters.tags?.length) count++;
		if (filters.createdBy) count++;
		if (filters.dateRange?.from || filters.dateRange?.to) count++;
		if (filters.assetCountRange) count++;
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
			<FilterSection title="Search" icon={<Grid size={16} />}>
				<SearchFilter
					value={filters.query || ""}
					onChange={(query) => onChange({ query })}
					placeholder="Search collections..."
				/>
			</FilterSection>

			{/* Category */}
			<FilterSection 
				title="Category" 
				icon={<Grid size={16} />}
				collapsible
				defaultExpanded={!!filters.category}
			>
				<SelectFilter
					options={categoryOptions}
					value={filters.category}
					onChange={(category) => onChange({ category })}
					placeholder="All categories"
				/>
			</FilterSection>

			{/* Collection Type */}
			<FilterSection 
				title="Collection Type" 
				icon={<Crown size={16} />}
				collapsible
				defaultExpanded={filters.isPublic !== undefined || filters.isTemplate !== undefined}
			>
				<div className="space-y-4">
					{/* Public Toggle */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Eye size={16} className="text-base-content/40" />
							<span className="text-sm">Public Only</span>
						</div>
						<input
							type="checkbox"
							className="toggle toggle-sm toggle-primary"
							checked={filters.isPublic === true}
							onChange={(e) =>
								onChange({ isPublic: e.target.checked ? true : undefined })
							}
						/>
					</div>

					{/* Template Toggle */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Crown size={16} className="text-base-content/40" />
							<span className="text-sm">Templates Only</span>
						</div>
						<input
							type="checkbox"
							className="toggle toggle-sm toggle-primary"
							checked={filters.isTemplate === true}
							onChange={(e) =>
								onChange({ isTemplate: e.target.checked ? true : undefined })
							}
						/>
					</div>
				</div>
			</FilterSection>

			{/* Created Date */}
			<FilterSection 
				title="Created Date" 
				icon={<Calendar size={16} />}
				collapsible
				defaultExpanded={!!(filters.dateRange?.from || filters.dateRange?.to)}
			>
				<DateRangeFilter
					value={filters.dateRange}
					onChange={(dateRange) => onChange({ dateRange })}
					presets={dateRangePresets}
					fromLabel="Created After"
					toLabel="Created Before"
				/>
			</FilterSection>

			{/* Asset Count Range */}
			<FilterSection 
				title="Asset Count" 
				icon={<HardDrive size={16} />}
				collapsible
				defaultExpanded={!!filters.assetCountRange}
			>
				<div className="space-y-4">
					{/* Min Count */}
					<div>
						<label className="label text-sm">Minimum Assets</label>
						<input
							type="range"
							min={0}
							max={100}
							step={1}
							value={filters.assetCountRange?.min || 0}
							className="range range-sm range-primary"
							onChange={(e) => handleAssetCountChange('min', parseInt(e.target.value))}
						/>
						<div className="text-sm text-base-content/60 mt-1">
							{filters.assetCountRange?.min || 0} assets
						</div>
					</div>

					{/* Max Count */}
					<div>
						<label className="label text-sm">Maximum Assets</label>
						<input
							type="range"
							min={0}
							max={1000}
							step={10}
							value={filters.assetCountRange?.max || 1000}
							className="range range-sm range-primary"
							onChange={(e) => handleAssetCountChange('max', parseInt(e.target.value))}
						/>
						<div className="text-sm text-base-content/60 mt-1">
							{filters.assetCountRange?.max || 1000} assets
						</div>
					</div>

					{/* Current Range Display */}
					{filters.assetCountRange && (
						<div className="p-3 bg-base-200 rounded-lg">
							<div className="text-sm text-base-content/70">Asset Count Range:</div>
							<div className="text-sm font-medium">
								{filters.assetCountRange.min} - {filters.assetCountRange.max} assets
							</div>
						</div>
					)}
				</div>
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

			{/* Created By */}
			{userOptions.length > 0 && (
				<FilterSection 
					title="Created By" 
					icon={<User size={16} />}
					collapsible
					defaultExpanded={!!filters.createdBy}
				>
					<SelectFilter
						options={userOptions}
						value={filters.createdBy}
						onChange={(createdBy) => onChange({ createdBy })}
						placeholder="Any creator"
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