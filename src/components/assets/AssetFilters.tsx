"use client";

import {
	Calendar,
	ChevronDown,
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

// Helper functions for safe date handling
const formatDateForInput = (date: Date | undefined | null): string => {
	if (!date) return "";
	try {
		return date instanceof Date && !isNaN(date.getTime()) 
			? date.toISOString().split("T")[0]
			: "";
	} catch {
		return "";
	}
};

const formatDateForDisplay = (date: Date | undefined | null): string => {
	if (!date) return "";
	try {
		return date instanceof Date && !isNaN(date.getTime())
			? date.toLocaleDateString()
			: "";
	} catch {
		return "";
	}
};

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
	const [collectionsDropdownOpen, setCollectionsDropdownOpen] = useState(false);
	const [collectionsSearchTerm, setCollectionsSearchTerm] = useState("");

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
		setCollectionsDropdownOpen(false);
		setCollectionsSearchTerm("");
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
			<div className="flex items-center justify-end">
				<button
					className="btn btn-sm btn-ghost gap-2"
					onClick={handleClearAll}
				>
					<RotateCcw size={16} />
					Clear All
				</button>
			</div>


			{/* File Types */}
			<div className="card bg-base-100 shadow">
				<div className="card-body">
					<h4 className="card-title">File Types</h4>
					<div className="grid grid-cols-2 gap-2">
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

			{/* File Size - Commented out for potential future use
			<div className="card bg-base-100 shadow">
				<div className="card-body">
					<h4 className="card-title">File Size</h4>
					<div className="space-y-4">
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

						<div className="space-y-2">
							<div className="flex justify-between text-base-content/60 text-sm">
								<span>{formatBytes(sizeRange[0] || 0)}</span>
								<span>{formatBytes(sizeRange[1] || 0)}</span>
							</div>
							<input
								type="range"
								className="range range-sm w-full"
								min={0}
								max={1000 * 1024 * 1024}
								step={1024 * 1024}
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
			*/}

			{/* Upload Date */}
			<div className="card bg-base-100 shadow">
				<div className="card-body">
					<h4 className="card-title">Upload Date</h4>
					<div className="grid grid-cols-2 gap-4">
						<div className="form-control">
							<label className="label">
								<span className="label-text">From Date</span>
							</label>
							<input
								type="date"
								className="input input-bordered w-full"
								value={formatDateForInput(localFilters.dateRange?.from)}
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
								value={formatDateForInput(localFilters.dateRange?.to)}
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
						<div className="dropdown w-full" data-open={collectionsDropdownOpen || undefined}>
							<div
								tabIndex={0}
								role="button"
								className="btn btn-outline w-full justify-between"
								onClick={() => setCollectionsDropdownOpen(!collectionsDropdownOpen)}
								onBlur={(e) => {
									// Only close if the click is outside the dropdown
									if (!e.currentTarget.contains(e.relatedTarget as Node)) {
										setCollectionsDropdownOpen(false);
										setCollectionsSearchTerm("");
									}
								}}
							>
								<span>
									{localFilters.collections?.length
										? `${localFilters.collections.length} collection${localFilters.collections.length > 1 ? 's' : ''} selected`
										: "Select collections"}
								</span>
								<ChevronDown size={16} className={`transition-transform ${collectionsDropdownOpen ? 'rotate-180' : ''}`} />
							</div>
							{collectionsDropdownOpen && (
								<div className="dropdown-content menu bg-base-100 rounded-box z-10 w-full p-2 shadow-lg border border-base-300 max-h-64 overflow-hidden flex flex-col">
									{/* Search Input */}
									<div className="relative mb-2 flex-shrink-0">
										<Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" />
										<input
											type="text"
											className="input input-sm w-full pl-10"
											placeholder="Search collections..."
											value={collectionsSearchTerm}
											onChange={(e) => setCollectionsSearchTerm(e.target.value)}
											onClick={(e) => e.stopPropagation()}
										/>
									</div>
									
									{/* Collection Options */}
									<div className="overflow-y-auto flex-1">
										{collections.collections
											.filter((collection) =>
												collection.name.toLowerCase().includes(collectionsSearchTerm.toLowerCase())
											)
											.map((collection) => {
												const isChecked = (localFilters.collections || []).includes(collection.id);
												return (
													<li key={collection.id} className="w-full">
														<label className="cursor-pointer flex items-center gap-3 px-3 py-2 hover:bg-base-200 rounded-lg w-full">
															<input
																type="checkbox"
																className="checkbox checkbox-sm"
																checked={isChecked}
																onChange={(e) => {
																	e.stopPropagation();
																	const currentCollections = localFilters.collections || [];
																	const newCollections = e.target.checked
																		? [...currentCollections, collection.id]
																		: currentCollections.filter(c => c !== collection.id);
																	handleFilterChange("collections", newCollections);
																}}
															/>
															<div className="flex items-center gap-2 flex-1">
																<span className="text-sm">{collection.name}</span>
																<span className="badge badge-xs badge-neutral">
																	{collection.assetCount}
																</span>
															</div>
														</label>
													</li>
												);
											})}
										{collections.collections
											.filter((collection) =>
												collection.name.toLowerCase().includes(collectionsSearchTerm.toLowerCase())
											)
											.length === 0 && (
											<li className="px-3 py-2 text-base-content/60 text-sm">
												No collections found
											</li>
										)}
									</div>
								</div>
							)}
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
						<h4 className="font-medium">Automatic Sub-Filters</h4>
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
							{localFilters.collections?.map((collectionId) => {
								const collection = collections?.collections?.find(c => c.id === collectionId);
								return (
									<span
										key={collectionId}
										className="badge badge-sm badge-info gap-2"
									>
										{collection?.name || collectionId}
										<button
											className="btn btn-xs btn-ghost p-0 min-h-0 h-4 w-4"
											onClick={() => {
												const newCollections = localFilters.collections?.filter((c) => c !== collectionId);
												handleFilterChange("collections", newCollections);
											}}
										>
											<X size={12} />
										</button>
									</span>
								);
							})}
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
									{formatDateForDisplay(localFilters.dateRange.from)} -{" "}
									{formatDateForDisplay(localFilters.dateRange.to)}
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
