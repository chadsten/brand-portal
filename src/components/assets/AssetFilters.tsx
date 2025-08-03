"use client";

import {
	Calendar,
	HardDrive,
	RotateCcw,
	Search,
	Tag,
	User,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatBytes } from "~/lib/utils";
import { api } from "~/trpc/react";

export interface AssetFiltersProps {
	filters: {
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
	};
	onChange: (filters: any) => void;
}

const FILE_TYPE_OPTIONS = [
	{
		value: "image",
		label: "Images",
		types: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
	},
	{
		value: "video",
		label: "Videos",
		types: ["video/mp4", "video/avi", "video/mov", "video/webm"],
	},
	{
		value: "audio",
		label: "Audio",
		types: ["audio/mp3", "audio/wav", "audio/aac", "audio/ogg"],
	},
	{
		value: "document",
		label: "Documents",
		types: ["application/pdf", "application/msword", "text/plain"],
	},
	{
		value: "archive",
		label: "Archives",
		types: ["application/zip", "application/rar", "application/7z"],
	},
];

const SIZE_PRESETS = [
	{ label: "Small (< 1MB)", min: 0, max: 1024 * 1024 },
	{ label: "Medium (1-10MB)", min: 1024 * 1024, max: 10 * 1024 * 1024 },
	{ label: "Large (10-100MB)", min: 10 * 1024 * 1024, max: 100 * 1024 * 1024 },
	{
		label: "Very Large (> 100MB)",
		min: 100 * 1024 * 1024,
		max: Number.MAX_SAFE_INTEGER,
	},
];

export function AssetFilters({ filters, onChange }: AssetFiltersProps) {
	const [localFilters, setLocalFilters] = useState(filters);
	const [sizeRange, setSizeRange] = useState([0, 1000 * 1024 * 1024]); // 0 to 1GB

	// API queries for filter options
	// TODO: Implement getTags and getUploaders endpoints
	const tags: any[] = [];
	const users: any[] = [];
	const { data: collections } = api.assetApi.searchCollections.useQuery({
		limit: 100,
	});

	useEffect(() => {
		setLocalFilters(filters);
		if (filters.sizeRange) {
			setSizeRange([filters.sizeRange.min, filters.sizeRange.max]);
		}
	}, [filters]);

	const handleFilterChange = (key: string, value: any) => {
		const newFilters = { ...localFilters, [key]: value };
		setLocalFilters(newFilters);
		onChange(newFilters);
	};

	const handleFileTypeChange = (selectedTypes: string[]) => {
		// Convert category selections to actual mime types
		const mimeTypes: string[] = [];
		selectedTypes.forEach((type) => {
			const option = FILE_TYPE_OPTIONS.find((opt) => opt.value === type);
			if (option) {
				mimeTypes.push(...option.types);
			}
		});
		handleFilterChange("fileTypes", mimeTypes);
	};

	const handleSizeRangeChange = (range: number[]) => {
		setSizeRange(range);
		handleFilterChange("sizeRange", {
			min: range[0],
			max: range[1],
		});
	};

	const handleSizePresetSelect = (preset: (typeof SIZE_PRESETS)[0]) => {
		const newRange = [preset.min, preset.max];
		setSizeRange(newRange);
		handleFilterChange("sizeRange", {
			min: preset.min,
			max: preset.max,
		});
	};

	const handleDateRangeChange = (range: any) => {
		if (range?.start && range?.end) {
			handleFilterChange("dateRange", {
				from: new Date(range.start),
				to: new Date(range.end),
			});
		} else {
			handleFilterChange("dateRange", undefined);
		}
	};

	const handleClearAll = () => {
		const clearedFilters = {
			query: "",
			fileTypes: [],
			tags: [],
			uploadedBy: undefined,
			dateRange: undefined,
			sizeRange: undefined,
			collections: [],
		};
		setLocalFilters(clearedFilters);
		setSizeRange([0, 1000 * 1024 * 1024]);
		onChange(clearedFilters);
	};

	const getSelectedFileTypeCategories = () => {
		if (!localFilters.fileTypes?.length) return [];

		return FILE_TYPE_OPTIONS.filter((option) =>
			option.types.some((type) => localFilters.fileTypes?.includes(type)),
		).map((option) => option.value);
	};

	return (
		<div className="space-y-6">
			{/* Quick Actions */}
			<div className="flex items-center justify-between">
				<h3 className="font-semibold text-lg">Filter Assets</h3>
				<button
					className="btn btn-sm btn-ghost gap-2"
					onClick={handleClearAll}
				>
					<RotateCcw size={16} />
					Clear All
				</button>
			</div>

			{/* Search Query */}
			<div className="card bg-base-100 shadow">
				<div className="card-body">
					<div className="form-control">
						<label className="label">
							<span className="label-text">Search Query</span>
						</label>
						<div className="relative">
							<Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" />
							<input
								type="text"
								className="input input-bordered w-full pl-10 pr-10"
								placeholder="Search in titles, descriptions, and filenames..."
								value={localFilters.query || ""}
								onChange={(e) => handleFilterChange("query", e.target.value)}
							/>
							{localFilters.query && (
								<button
									className="absolute right-3 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-xs"
									onClick={() => handleFilterChange("query", "")}
								>
									<X size={12} />
								</button>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* File Types */}
			<div className="card bg-base-100 shadow">
				<div className="card-body">
					<h4 className="card-title">File Types</h4>
					<div className="space-y-2">
						{FILE_TYPE_OPTIONS.map((option) => {
							const isChecked = getSelectedFileTypeCategories().includes(option.value);
							return (
								<div key={option.value} className="form-control">
									<label className="cursor-pointer label justify-start gap-3">
										<input
											type="checkbox"
											className="checkbox checkbox-sm"
											checked={isChecked}
											onChange={(e) => {
												const currentSelected = getSelectedFileTypeCategories();
												const newSelected = e.target.checked
													? [...currentSelected, option.value]
													: currentSelected.filter(v => v !== option.value);
												handleFileTypeChange(newSelected);
											}}
										/>
										<span className="label-text">{option.label}</span>
									</label>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* File Size */}
			<div className="card bg-base-100 shadow">
				<div className="card-body">
					<h4 className="card-title">File Size</h4>
					<div className="space-y-4">
						{/* Size Presets */}
						<div className="grid grid-cols-2 gap-2">
							{SIZE_PRESETS.map((preset) => (
								<button
									key={preset.label}
									className="btn btn-sm btn-outline justify-start text-left"
									onClick={() => handleSizePresetSelect(preset)}
								>
									{preset.label}
								</button>
							))}
						</div>

						<div className="divider"></div>

						{/* Custom Range */}
						<div className="space-y-2">
							<div className="flex justify-between text-base-content/60 text-sm">
								<span>{formatBytes(sizeRange[0] || 0)}</span>
								<span>{formatBytes(sizeRange[1] || 0)}</span>
							</div>
							<input
								type="range"
								className="range range-sm w-full"
								min={0}
								max={1000 * 1024 * 1024} // 1GB
								step={1024 * 1024} // 1MB steps
								value={sizeRange[1] || 0}
								onChange={(e) => {
									const value = parseInt(e.target.value);
									handleSizeRangeChange([0, value]);
								}}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Upload Date */}
			<div className="card bg-base-100 shadow">
				<div className="card-body">
					<h4 className="card-title">Upload Date</h4>
					<div className="space-y-4">
						<div className="form-control">
							<label className="label">
								<span className="label-text">From Date</span>
							</label>
							<input
								type="date"
								className="input input-bordered w-full"
								value={
									localFilters.dateRange?.from.toISOString().split("T")[0] || ""
								}
								onChange={(e) => {
									const from = new Date(e.target.value);
									const to = localFilters.dateRange?.to || new Date();
									handleFilterChange("dateRange", { from, to });
								}}
							/>
						</div>
						<div className="form-control">
							<label className="label">
								<span className="label-text">To Date</span>
							</label>
							<input
								type="date"
								className="input input-bordered w-full"
								value={
									localFilters.dateRange?.to.toISOString().split("T")[0] || ""
								}
								onChange={(e) => {
									const to = new Date(e.target.value);
									const from = localFilters.dateRange?.from || new Date();
									handleFilterChange("dateRange", { from, to });
								}}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Tags */}
			{tags && tags.length > 0 && (
				<div className="card bg-base-100 shadow">
					<div className="card-body">
						<h4 className="card-title">Tags</h4>
						<div className="space-y-3 max-h-48 overflow-y-auto">
							{tags.map((tag: any) => {
								const isChecked = (localFilters.tags || []).includes(tag.name);
								return (
									<div key={tag.id} className="form-control">
										<label className="cursor-pointer label justify-start gap-3">
											<input
												type="checkbox"
												className="checkbox checkbox-sm"
												checked={isChecked}
												onChange={(e) => {
													const currentTags = localFilters.tags || [];
													const newTags = e.target.checked
														? [...currentTags, tag.name]
														: currentTags.filter(t => t !== tag.name);
													handleFilterChange("tags", newTags);
												}}
											/>
											<div className="flex items-center gap-2">
												<span className="label-text">{tag.name}</span>
												<span className="badge badge-sm badge-neutral">
													{tag.usageCount}
												</span>
											</div>
										</label>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}

			{/* Uploaded By */}
			{users && users.length > 0 && (
				<div className="card bg-base-100 shadow">
					<div className="card-body">
						<h4 className="card-title">Uploaded By</h4>
						<div className="form-control">
							<label className="label">
								<span className="label-text">User</span>
							</label>
							<div className="relative">
								<select
									className="select select-bordered w-full"
									value={localFilters.uploadedBy || ""}
									onChange={(e) => {
										const value = e.target.value;
										handleFilterChange("uploadedBy", value || undefined);
									}}
								>
									<option value="">Select uploader</option>
									{users.map((user: any) => (
										<option key={user.id} value={user.id}>
											{user.name}
										</option>
									))}
								</select>
								{localFilters.uploadedBy && (
									<button
										className="absolute right-3 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-xs"
										onClick={() => handleFilterChange("uploadedBy", undefined)}
									>
										<X size={12} />
									</button>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Collections */}
			{collections?.collections && collections.collections.length > 0 && (
				<div className="card bg-base-100 shadow">
					<div className="card-body">
						<h4 className="card-title">Collections</h4>
						<div className="space-y-3 max-h-48 overflow-y-auto">
							{collections.collections.map((collection) => {
								const isChecked = (localFilters.collections || []).includes(collection.id);
								return (
									<div key={collection.id} className="form-control">
										<label className="cursor-pointer label justify-start gap-3">
											<input
												type="checkbox"
												className="checkbox checkbox-sm"
												checked={isChecked}
												onChange={(e) => {
													const currentCollections = localFilters.collections || [];
													const newCollections = e.target.checked
														? [...currentCollections, collection.id]
														: currentCollections.filter(c => c !== collection.id);
													handleFilterChange("collections", newCollections);
												}}
											/>
											<div className="flex items-center gap-2">
												<span className="label-text">{collection.name}</span>
												<span className="badge badge-sm badge-neutral">
													{collection.assetCount}
												</span>
											</div>
										</label>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}

			{/* Filter Summary */}
			{(localFilters.fileTypes?.length ||
				localFilters.tags?.length ||
				localFilters.uploadedBy ||
				localFilters.dateRange ||
				localFilters.sizeRange ||
				localFilters.collections?.length) && (
				<div className="card bg-base-100 shadow">
					<div className="card-header p-4 border-b border-base-300">
						<h4 className="font-medium">Active Filters</h4>
					</div>
					<div className="card-body">
						<div className="flex flex-wrap gap-2">
							{localFilters.fileTypes?.map((type) => (
								<span
									key={type}
									className="badge badge-sm badge-outline gap-2"
								>
									{type}
									<button
										className="btn btn-xs btn-ghost p-0 min-h-0 h-4 w-4"
										onClick={() => {
											const newTypes = localFilters.fileTypes?.filter(
												(t) => t !== type,
											);
											handleFilterChange("fileTypes", newTypes);
										}}
									>
										<X size={12} />
									</button>
								</span>
							))}
							{localFilters.tags?.map((tag) => (
								<span
									key={tag}
									className="badge badge-sm badge-secondary gap-2"
								>
									{tag}
									<button
										className="btn btn-xs btn-ghost p-0 min-h-0 h-4 w-4"
										onClick={() => {
											const newTags = localFilters.tags?.filter((t) => t !== tag);
											handleFilterChange("tags", newTags);
										}}
									>
										<X size={12} />
									</button>
								</span>
							))}
							{localFilters.uploadedBy && (
								<span
									className="badge badge-sm badge-success gap-2"
								>
									Uploader:{" "}
									{
										users?.find((u: any) => u.id === localFilters.uploadedBy)
											?.name
									}
									<button
										className="btn btn-xs btn-ghost p-0 min-h-0 h-4 w-4"
										onClick={() => handleFilterChange("uploadedBy", undefined)}
									>
										<X size={12} />
									</button>
								</span>
							)}
							{localFilters.dateRange && (
								<span
									className="badge badge-sm badge-warning gap-2"
								>
									{localFilters.dateRange.from.toLocaleDateString()} -{" "}
									{localFilters.dateRange.to.toLocaleDateString()}
									<button
										className="btn btn-xs btn-ghost p-0 min-h-0 h-4 w-4"
										onClick={() => handleFilterChange("dateRange", undefined)}
									>
										<X size={12} />
									</button>
								</span>
							)}
							{localFilters.sizeRange && (
								<span
									className="badge badge-sm badge-primary gap-2"
								>
									{formatBytes(localFilters.sizeRange.min)} -{" "}
									{formatBytes(localFilters.sizeRange.max)}
									<button
										className="btn btn-xs btn-ghost p-0 min-h-0 h-4 w-4"
										onClick={() => handleFilterChange("sizeRange", undefined)}
									>
										<X size={12} />
									</button>
								</span>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
