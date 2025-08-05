"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	Calendar,
	Crown,
	Eye,
	Filter,
	HardDrive,
	RotateCcw,
	Tag as TagIcon,
	User,
	Users,
} from "lucide-react";
import { useState } from "react";
import { api } from "~/trpc/react";
import type { CollectionFiltersState } from "./CollectionBrowser";

interface CollectionFiltersProps {
	filters: CollectionFiltersState;
	onFiltersChange: (filters: Partial<CollectionFiltersState>) => void;
}

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

export function CollectionFilters({
	filters,
	onFiltersChange,
}: CollectionFiltersProps) {
	const [localAssetCountRange, setLocalAssetCountRange] = useState<number[]>([
		filters.assetCountRange?.min || 0,
		filters.assetCountRange?.max || 1000,
	]);

	// TODO: Implement getTags and getUsers endpoints when available
	const tags: any[] = [];
	const users: any[] = [];

	const handleAssetCountRangeChange = (values: number[]) => {
		setLocalAssetCountRange(values);
		onFiltersChange({
			assetCountRange: {
				min: values[0] || 0,
				max: values[1] || 1000,
			},
		});
	};

	const handleDateRangeChange = (field: "from" | "to", date: Date | null) => {
		if (!date) {
			if (field === "from") {
				onFiltersChange({
					dateRange: filters.dateRange
						? { ...filters.dateRange, from: undefined as any }
						: undefined,
				});
			} else {
				onFiltersChange({
					dateRange: filters.dateRange
						? { ...filters.dateRange, to: undefined as any }
						: undefined,
				});
			}
			return;
		}

		onFiltersChange({
			dateRange: {
				from: field === "from" ? date : filters.dateRange?.from || new Date(),
				to: field === "to" ? date : filters.dateRange?.to || new Date(),
			},
		});
	};

	const resetFilters = () => {
		onFiltersChange({
			query: "",
			category: "",
			isPublic: undefined,
			isTemplate: undefined,
			tags: [],
			createdBy: undefined,
			dateRange: undefined,
			assetCountRange: undefined,
		});
		setLocalAssetCountRange([0, 1000]);
	};

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{/* Category Filter */}
			<div className="space-y-2">
				<label className="font-medium text-sm">Category</label>
				<select
					className="select"
					value={filters.category || ""}
					onChange={(e) => onFiltersChange({ category: e.target.value })}
				>
					<option value="">All categories</option>
					{COLLECTION_CATEGORIES.map((category) => (
						<option key={category.key} value={category.key}>{category.label}</option>
					))}
				</select>
			</div>

			{/* Creator Filter */}
			<div className="space-y-2">
				<label className="font-medium text-sm">Created By</label>
				<select
					className="select"
					value={filters.createdBy || ""}
					onChange={(e) => onFiltersChange({ createdBy: e.target.value || undefined })}
				>
					<option value="">Any creator</option>
					{users.map((user: any) => (
						<option key={user.id} value={user.id}>{user.name || user.email}</option>
					))}
				</select>
			</div>

			{/* Tags Filter */}
			<div className="space-y-2">
				<label className="font-medium text-sm">Tags</label>
				<div className="max-h-32 overflow-y-auto space-y-2">
					{tags.length > 0 ? (
						tags.map((tag: any) => (
							<label key={tag.id} className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									className="checkbox checkbox-sm"
									checked={filters.tags?.includes(tag.id)}
									onChange={(e) => {
										const currentTags = filters.tags || [];
										const newTags = e.target.checked
											? [...currentTags, tag.id]
											: currentTags.filter(t => t !== tag.id);
										onFiltersChange({ tags: newTags });
									}}
								/>
								<span className="text-sm">{tag.name}</span>
							</label>
						))
					) : (
						<p className="text-base-content/40 text-sm">No tags available</p>
					)}
				</div>
			</div>

			{/* Collection Type Filters */}
			<div className="space-y-4">
				<label className="font-medium text-sm">Collection Type</label>
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Eye size={16} className="text-base-content/40" />
							<span className="text-sm">Public Only</span>
						</div>
						<input
							type="checkbox"
							className="toggle toggle-sm"
							checked={filters.isPublic === true}
							onChange={(e) =>
								onFiltersChange({ isPublic: e.target.checked ? true : undefined })
							}
						/>
					</div>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Crown size={16} className="text-base-content/40" />
							<span className="text-sm">Templates Only</span>
						</div>
						<input
							type="checkbox"
							className="toggle toggle-sm"
							checked={filters.isTemplate === true}
							onChange={(e) =>
								onFiltersChange({ isTemplate: e.target.checked ? true : undefined })
							}
						/>
					</div>
				</div>
			</div>

			{/* Asset Count Range */}
			<div className="space-y-2">
				<label className="font-medium text-sm">Asset Count</label>
				<div className="px-2 py-4">
					<div className="space-y-2">
						<input
							type="range"
							min={0}
							max={1000}
							step={1}
							value={localAssetCountRange[1]}
							className="range range-sm range-primary"
							onChange={(e) => {
								const newMax = parseInt(e.target.value);
								handleAssetCountRangeChange([localAssetCountRange[0], newMax]);
							}}
						/>
					</div>
					<div className="mt-2 flex justify-between text-base-content/50 text-sm">
						<span>{localAssetCountRange[0]} assets</span>
						<span>{localAssetCountRange[1]} assets</span>
					</div>
				</div>
			</div>

			{/* Date Range */}
			<div className="space-y-2">
				<label className="font-medium text-sm">Created Date Range</label>
				<div className="space-y-2">
					<div>
						<label className="label">
							<span className="text-sm">From</span>
						</label>
						<input
							type="date"
							className="input input-sm w-full"
							value={
								filters.dateRange?.from
									? filters.dateRange.from.toISOString().split("T")[0]
									: ""
							}
							onChange={(e) => {
								const date = e.target.value ? new Date(e.target.value) : null;
								handleDateRangeChange("from", date);
							}}
						/>
					</div>
					<div>
						<label className="label">
							<span className="text-sm">To</span>
						</label>
						<input
							type="date"
							className="input input-sm w-full"
							value={
								filters.dateRange?.to
									? filters.dateRange.to.toISOString().split("T")[0]
									: ""
							}
							onChange={(e) => {
								const date = e.target.value ? new Date(e.target.value) : null;
								handleDateRangeChange("to", date);
							}}
						/>
					</div>
				</div>
			</div>

			{/* Reset Button */}
			<div className="flex items-end">
				<button
					className="btn btn-ghost w-full"
					onClick={resetFilters}
				>
					<RotateCcw size={16} />
					Reset Filters
				</button>
			</div>
		</div>
	);
}
