"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	Building,
	Calendar,
	FileText,
	Filter,
	Image,
	Music,
	Palette,
	RotateCcw,
	Star,
	Tag,
	TrendingUp,
	User,
	Video,
	X,
} from "lucide-react";
import { useState } from "react";

interface FilterOption {
	value: string;
	label: string;
	count?: number;
	icon?: React.ReactNode;
}

interface FilterGroup {
	id: string;
	label: string;
	type: "checkbox" | "radio" | "range" | "date" | "select";
	options?: FilterOption[];
	value?: any;
	min?: number;
	max?: number;
	step?: number;
	unit?: string;
}

interface SearchFiltersProps {
	filterGroups: FilterGroup[];
	activeFilters: Record<string, any>;
	onFilterChange: (filterId: string, value: any) => void;
	onClearAll: () => void;
	showCounts?: boolean;
	collapsible?: boolean;
}

const FILE_TYPE_ICONS = {
	image: <Image size={16} />,
	video: <Video size={16} />,
	audio: <Music size={16} />,
	document: <FileText size={16} />,
};

export function SearchFilters({
	filterGroups,
	activeFilters,
	onFilterChange,
	onClearAll,
	showCounts = true,
	collapsible = true,
}: SearchFiltersProps) {
	const [expandedSections, setExpandedSections] = useState<string[]>(
		filterGroups.map((g) => g.id),
	);

	const activeFilterCount = Object.keys(activeFilters).filter(
		(key) =>
			activeFilters[key] !== null &&
			activeFilters[key] !== undefined &&
			(Array.isArray(activeFilters[key])
				? activeFilters[key].length > 0
				: true),
	).length;

	const handleToggleSection = (sectionId: string) => {
		setExpandedSections((prev) =>
			prev.includes(sectionId)
				? prev.filter((id) => id !== sectionId)
				: [...prev, sectionId],
		);
	};

	const renderFilterControl = (group: FilterGroup) => {
		const currentValue = activeFilters[group.id];

		switch (group.type) {
			case "checkbox":
				return (
					<div className="space-y-2">
						{group.options?.map((option) => (
							<div
								key={option.value}
								className="flex items-center justify-between"
							>
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										className="checkbox checkbox-sm checkbox-primary"
										checked={(currentValue || []).includes(option.value)}
										onChange={(e) => {
											const current = currentValue || [];
											const updated = e.target.checked 
												? [...current, option.value]
												: current.filter(v => v !== option.value);
											onFilterChange(group.id, updated);
										}}
									/>
									<div className="flex items-center gap-2">
										{option.icon}
										<span>{option.label}</span>
									</div>
								</label>
								{showCounts && option.count !== undefined && (
									<span className="text-base-content/60 text-sm">
										{option.count.toLocaleString()}
									</span>
								)}
							</div>
						))}
					</div>
				);

			case "radio":
				return (
					<div className="space-y-2">
						{group.options?.map((option) => (
							<div
								key={option.value}
								className="flex items-center justify-between"
							>
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name={group.id}
										className="radio radio-sm radio-primary"
										checked={currentValue === option.value}
										onChange={() => onFilterChange(group.id, option.value)}
									/>
									<div className="flex items-center gap-2">
										{option.icon}
										<span>{option.label}</span>
									</div>
								</label>
								{showCounts && option.count !== undefined && (
									<span className="text-base-content/60 text-sm">
										{option.count.toLocaleString()}
									</span>
								)}
							</div>
						))}
					</div>
				);

			case "range": {
				const rangeValue = currentValue || [group.min || 0, group.max || 100];
				return (
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<input
								type="range"
								className="range range-primary range-sm flex-1"
								step={group.step || 1}
								min={group.min || 0}
								max={group.max || 100}
								value={rangeValue[0]}
								onChange={(e) => onFilterChange(group.id, [Number(e.target.value), rangeValue[1]])}
							/>
							<span className="text-xs">to</span>
							<input
								type="range"
								className="range range-primary range-sm flex-1"
								step={group.step || 1}
								min={group.min || 0}
								max={group.max || 100}
								value={rangeValue[1]}
								onChange={(e) => onFilterChange(group.id, [rangeValue[0], Number(e.target.value)])}
							/>
						</div>
						<div className="flex items-center justify-between text-base-content/60 text-sm">
							<span>
								{rangeValue[0]} {group.unit}
							</span>
							<span>
								{rangeValue[1]} {group.unit}
							</span>
						</div>
					</div>
				);
			}

			case "date":
				return (
					<div className="space-y-2">
						<div className="grid grid-cols-2 gap-2">
							<div className="form-control">
								<label className="label">
									<span className="label-text">From</span>
								</label>
								<input
									type="date"
									className="input input-bordered input-sm"
									value={currentValue?.start || ""}
									onChange={(e) =>
										onFilterChange(group.id, {
											...currentValue,
											start: e.target.value,
										})
									}
								/>
							</div>
							<div className="form-control">
								<label className="label">
									<span className="label-text">To</span>
								</label>
								<input
									type="date"
									className="input input-bordered input-sm"
									value={currentValue?.end || ""}
									onChange={(e) =>
										onFilterChange(group.id, {
											...currentValue,
											end: e.target.value,
										})
									}
								/>
							</div>
						</div>
						<div className="flex flex-wrap gap-1">
							<button
								className="btn btn-sm btn-outline"
								onClick={() => {
									const today = new Date();
									const lastWeek = new Date(
										today.getTime() - 7 * 24 * 60 * 60 * 1000,
									);
									onFilterChange(group.id, {
										start: lastWeek.toISOString().split("T")[0],
										end: today.toISOString().split("T")[0],
									});
								}}
							>
								Last 7 days
							</button>
							<button
								className="btn btn-sm btn-outline"
								onClick={() => {
									const today = new Date();
									const lastMonth = new Date(
										today.getTime() - 30 * 24 * 60 * 60 * 1000,
									);
									onFilterChange(group.id, {
										start: lastMonth.toISOString().split("T")[0],
										end: today.toISOString().split("T")[0],
									});
								}}
							>
								Last 30 days
							</button>
						</div>
					</div>
				);

			case "select":
				return (
					<select
						className="select select-bordered select-sm w-full"
						value={currentValue || ""}
						onChange={(e) => onFilterChange(group.id, e.target.value)}
					>
						<option value="">
							Select {group.label.toLowerCase()}
						</option>
						{group.options?.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						)) || []}
					</select>
				);

			default:
				return null;
		}
	};

	const getActiveFilterSummary = (groupId: string, value: any): string => {
		const group = filterGroups.find((g) => g.id === groupId);
		if (!group) return "";

		switch (group.type) {
			case "checkbox": {
				const selectedOptions = group.options?.filter((opt) =>
					value.includes(opt.value),
				);
				return selectedOptions?.map((opt) => opt.label).join(", ") || "";
			}

			case "radio":
				return group.options?.find((opt) => opt.value === value)?.label || "";

			case "range":
				return `${value[0]}${group.unit || ""} - ${value[1]}${group.unit || ""}`;

			case "date":
				if (value?.start && value?.end) {
					return `${value.start} to ${value.end}`;
				}
				return "";

			case "select":
				return group.options?.find((opt) => opt.value === value)?.label || "";

			default:
				return String(value);
		}
	};

	return (
		<div className="card bg-base-100 shadow">
			<div className="card-header p-4 flex justify-between items-center border-b border-base-300">
				<div className="flex items-center gap-2">
					<Filter size={20} />
					<h3 className="font-semibold">Filters</h3>
					{activeFilterCount > 0 && (
						<span className="badge badge-primary badge-sm">
							{activeFilterCount}
						</span>
					)}
				</div>
				{activeFilterCount > 0 && (
					<button
						className="btn btn-sm btn-outline gap-2"
						onClick={onClearAll}
					>
						<RotateCcw size={14} />
						Clear All
					</button>
				)}
			</div>
			<div className="card-body p-0">
				{/* Automatic Sub-Filters Summary */}
				{activeFilterCount > 0 && (
					<div className="border-base-300 border-b p-4">
						<p className="mb-2 font-medium text-sm">Automatic Sub-Filters:</p>
						<div className="flex flex-wrap gap-2">
							{Object.entries(activeFilters).map(([groupId, value]) => {
								if (!value || (Array.isArray(value) && value.length === 0))
									return null;
								const summary = getActiveFilterSummary(groupId, value);
								if (!summary) return null;

								return (
									<span
										key={groupId}
										className="badge badge-outline badge-sm gap-2"
									>
										{summary}
										<button 
											className="btn btn-xs btn-ghost"
											onClick={() => onFilterChange(groupId, null)}
										>
											×
										</button>
									</span>
								);
							})}
						</div>
					</div>
				)}

				{/* Filter Groups */}
				{collapsible ? (
					<div className="px-0">
						{filterGroups.map((group) => (
							<div key={group.id} className="collapse collapse-arrow">
								<input 
									type="checkbox" 
									checked={expandedSections.includes(group.id)}
									onChange={() => handleToggleSection(group.id)}
								/>
								<div className="collapse-title text-lg font-medium px-4">
									<div className="flex items-center justify-between">
										<span>{group.label}</span>
										{activeFilters[group.id] && (
											<span className="badge badge-primary badge-sm">
												{Array.isArray(activeFilters[group.id])
													? activeFilters[group.id].length
													: 1}
											</span>
										)}
									</div>
								</div>
								<div className="collapse-content px-4">
									<div className="pb-4">{renderFilterControl(group)}</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="divide-y divide-base-300">
						{filterGroups.map((group) => (
							<div key={group.id} className="space-y-3 p-4">
								<div className="flex items-center justify-between">
									<h4 className="font-medium">{group.label}</h4>
									{activeFilters[group.id] && (
										<span className="badge badge-primary badge-sm">
											{Array.isArray(activeFilters[group.id])
												? activeFilters[group.id].length
												: 1}
										</span>
									)}
								</div>
								{renderFilterControl(group)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
