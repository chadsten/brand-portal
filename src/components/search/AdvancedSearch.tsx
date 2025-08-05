"use client";

// Import removed - using native HTML and DaisyUI classes
import { useModal } from "~/hooks/useModal";
import {
	AlertCircle,
	Building,
	Calendar,
	ChevronDown,
	ChevronUp,
	Clock,
	FileText,
	Filter,
	Image,
	Palette,
	Plus,
	Save,
	Search,
	Star,
	Tag,
	Type,
	User,
	X,
} from "lucide-react";
import { useState } from "react";

interface SearchFilter {
	id: string;
	type: "text" | "select" | "date" | "range" | "boolean" | "tags";
	field: string;
	label: string;
	value: any;
	operator:
		| "equals"
		| "contains"
		| "starts_with"
		| "ends_with"
		| "greater_than"
		| "less_than"
		| "between"
		| "in";
}

interface SearchPreset {
	id: string;
	name: string;
	description?: string;
	filters: SearchFilter[];
	createdAt: Date;
	isShared: boolean;
	icon?: string;
}

interface SearchHistory {
	id: string;
	query: string;
	filters: SearchFilter[];
	timestamp: Date;
	resultCount: number;
}

interface AdvancedSearchProps {
	onSearch: (query: string, filters: SearchFilter[]) => void;
	searchableFields: {
		field: string;
		label: string;
		type: SearchFilter["type"];
		options?: { value: string; label: string }[];
	}[];
	presets?: SearchPreset[];
	onSavePreset?: (preset: SearchPreset) => void;
	showHistory?: boolean;
}

const OPERATORS = {
	text: [
		{ value: "contains", label: "Contains" },
		{ value: "equals", label: "Equals" },
		{ value: "starts_with", label: "Starts with" },
		{ value: "ends_with", label: "Ends with" },
	],
	select: [
		{ value: "equals", label: "Is" },
		{ value: "in", label: "Is one of" },
	],
	date: [
		{ value: "equals", label: "Is" },
		{ value: "greater_than", label: "After" },
		{ value: "less_than", label: "Before" },
		{ value: "between", label: "Between" },
	],
	range: [
		{ value: "equals", label: "Equals" },
		{ value: "greater_than", label: "Greater than" },
		{ value: "less_than", label: "Less than" },
		{ value: "between", label: "Between" },
	],
	boolean: [{ value: "equals", label: "Is" }],
	tags: [
		{ value: "contains", label: "Contains" },
		{ value: "equals", label: "Exactly matches" },
	],
};

export function AdvancedSearch({
	onSearch,
	searchableFields,
	presets = [],
	onSavePreset,
	showHistory = true,
}: AdvancedSearchProps) {
	const [query, setQuery] = useState("");
	const [filters, setFilters] = useState<SearchFilter[]>([]);
	const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
	const [isExpanded, setIsExpanded] = useState(false);
	const [selectedTab, setSelectedTab] = useState("filters");

	const {
		isOpen: isSavePresetOpen,
		onOpen: onSavePresetOpen,
		onClose: onSavePresetClose,
	} = useModal();

	const [presetName, setPresetName] = useState("");
	const [presetDescription, setPresetDescription] = useState("");
	const [presetShared, setPresetShared] = useState(false);

	// Mock search history
	const mockHistory: SearchHistory[] = [
		{
			id: "1",
			query: "brand logo",
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
			timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
			resultCount: 45,
		},
		{
			id: "2",
			query: "marketing campaign",
			filters: [
				{
					id: "1",
					type: "date",
					field: "createdAt",
					label: "Created",
					value: new Date("2024-01-01"),
					operator: "greater_than",
				},
				{
					id: "2",
					type: "tags",
					field: "tags",
					label: "Tags",
					value: ["social", "campaign"],
					operator: "contains",
				},
			],
			timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
			resultCount: 128,
		},
	];

	const handleAddFilter = () => {
		const newFilter: SearchFilter = {
			id: crypto.randomUUID(),
			type: "text",
			field: searchableFields[0]?.field || "",
			label: searchableFields[0]?.label || "",
			value: "",
			operator: "contains",
		};
		setFilters([...filters, newFilter]);
	};

	const handleUpdateFilter = (
		filterId: string,
		updates: Partial<SearchFilter>,
	) => {
		setFilters(
			filters.map((f) => (f.id === filterId ? { ...f, ...updates } : f)),
		);
	};

	const handleRemoveFilter = (filterId: string) => {
		setFilters(filters.filter((f) => f.id !== filterId));
	};

	const handleFieldChange = (filterId: string, field: string) => {
		const fieldConfig = searchableFields.find((f) => f.field === field);
		if (!fieldConfig) return;

		handleUpdateFilter(filterId, {
			field,
			label: fieldConfig.label,
			type: fieldConfig.type,
			value: fieldConfig.type === "boolean" ? false : "",
			operator: OPERATORS[fieldConfig.type][0]?.value as any,
		});
	};

	const handleSearch = () => {
		onSearch(query, filters);
	};

	const handleApplyPreset = (presetId: string) => {
		const preset = presets.find((p) => p.id === presetId);
		if (!preset) return;

		setFilters(preset.filters);
		setSelectedPreset(presetId);
	};

	const handleSavePreset = () => {
		if (!presetName.trim()) return;

		const newPreset: SearchPreset = {
			id: crypto.randomUUID(),
			name: presetName,
			description: presetDescription,
			filters: [...filters],
			createdAt: new Date(),
			isShared: presetShared,
		};

		onSavePreset?.(newPreset);
		setPresetName("");
		setPresetDescription("");
		setPresetShared(false);
		onSavePresetClose();
	};

	const handleApplyHistory = (history: SearchHistory) => {
		setQuery(history.query);
		setFilters(history.filters);
		handleSearch();
	};

	const getPresetIcon = (iconName?: string) => {
		switch (iconName) {
			case "image":
				return <Image size={16} />;
			case "palette":
				return <Palette size={16} />;
			case "type":
				return <Type size={16} />;
			case "tag":
				return <Tag size={16} />;
			default:
				return <FileText size={16} />;
		}
	};

	const renderFilterValue = (filter: SearchFilter) => {
		const field = searchableFields.find((f) => f.field === filter.field);

		switch (filter.type) {
			case "text":
				return (
					<input
						className="input input-sm"
						placeholder="Enter value..."
						value={filter.value || ""}
						onChange={(e) => handleUpdateFilter(filter.id, { value: e.target.value })}
					/>
				);

			case "select":
				return (
					<select
						className="select select-sm w-full"
						value={filter.value || ""}
						onChange={(e) => handleUpdateFilter(filter.id, { value: e.target.value })}
					>
						<option value="">Select value...</option>
						{field?.options?.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						)) || []}
					</select>
				);

			case "date":
				return (
					<input
						className="input input-sm"
						type="date"
						value={filter.value || ""}
						onChange={(e) =>
							handleUpdateFilter(filter.id, { value: e.target.value })
						}
					/>
				);

			case "range":
				return (
					<div className="flex items-center gap-2">
						<input
							className="input input-sm"
							type="number"
							placeholder="Min"
							value={filter.value?.min || ""}
							onChange={(e) =>
								handleUpdateFilter(filter.id, {
									value: { ...filter.value, min: e.target.value },
								})
							}
						/>
						<span className="text-sm">to</span>
						<input
							className="input input-sm"
							type="number"
							placeholder="Max"
							value={filter.value?.max || ""}
							onChange={(e) =>
								handleUpdateFilter(filter.id, {
									value: { ...filter.value, max: e.target.value },
								})
							}
						/>
					</div>
				);

			case "boolean":
				return (
					<label className="label cursor-pointer justify-start gap-2">
						<input
							type="checkbox"
							className="toggle toggle-primary toggle-sm"
							checked={filter.value || false}
							onChange={(e) => handleUpdateFilter(filter.id, { value: e.target.checked })}
						/>
						<span className="label-text">
							{filter.value ? "Yes" : "No"}
						</span>
					</label>
				);

			case "tags":
				return (
					<input
						className="input input-sm"
						placeholder="Enter tags, comma separated..."
						value={Array.isArray(filter.value) ? filter.value.join(", ") : ""}
						onChange={(e) =>
							handleUpdateFilter(filter.id, {
								value: e.target.value
									.split(",")
									.map((t) => t.trim())
									.filter(Boolean),
							})
						}
					/>
				);

			default:
				return null;
		}
	};

	const activeFilterCount = filters.filter(
		(f) => f.value !== "" && f.value !== false,
	).length;

	return (
		<div className="space-y-4">
			{/* Main Search Bar */}
			<div className="card bg-base-100 shadow">
				<div className="card-body">
					<div className="flex flex-col gap-4">
						<div className="flex gap-2">
							<div className="relative flex-1">
								<Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" />
								<input
									className="input input-lg w-full pl-10 pr-16"
									placeholder="Search assets, collections, and more..."
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleSearch()}
								/>
								{activeFilterCount > 0 && (
									<span className="badge badge-primary badge-sm absolute right-3 top-1/2 transform -translate-y-1/2">
										{activeFilterCount}
									</span>
								)}
							</div>
							<button
								className="btn btn-primary btn-lg gap-2"
								onClick={handleSearch}
							>
								<Search size={20} />
								Search
							</button>
							<button
								className="btn btn-outline btn-lg gap-2"
								onClick={() => setIsExpanded(!isExpanded)}
							>
								<Filter size={20} />
								Filters
								{isExpanded ? (
									<ChevronUp size={16} />
								) : (
									<ChevronDown size={16} />
								)}
							</button>
						</div>

						{/* Quick Presets */}
						{presets.length > 0 && (
							<div className="flex items-center gap-2">
								<span className="text-base-content/60 text-sm">
									Quick filters:
								</span>
								{presets.slice(0, 4).map((preset) => (
									<button
										key={preset.id}
										onClick={() => handleApplyPreset(preset.id)}
										className="cursor-pointer"
									>
										<span
											className={`badge badge-sm gap-2 ${
												selectedPreset === preset.id ? "badge-primary" : "badge-outline"
											}`}
										>
											{getPresetIcon(preset.icon)}
											{preset.name}
										</span>
									</button>
								))}
								{presets.length > 4 && (
									<button
										className="btn btn-sm btn-outline"
										onClick={() => setSelectedTab("presets")}
									>
										+{presets.length - 4} more
									</button>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Advanced Filters */}
			{isExpanded && (
				<div className="card bg-base-100 shadow">
					<div className="card-body">
						<div role="tablist" className="tabs tabs-lifted w-full">
							<input
								type="radio"
								name="advanced_search_tabs"
								role="tab"
								className="tab"
								aria-label="Filters"
								checked={selectedTab === "filters"}
								onChange={() => setSelectedTab("filters")}
							/>
							<div role="tabpanel" className="tab-content">{selectedTab === "filters" && (
								<div className="space-y-4 pt-4">
									{/* Automatic Sub-Filters */}
									{filters.map((filter) => (
										<div key={filter.id} className="flex items-start gap-2">
											<div className="w-48">
												<label className="label">
													<span className="label-text text-sm">Field</span>
												</label>
												<select
													className="select select-sm w-full"
													value={filter.field}
													onChange={(e) => handleFieldChange(filter.id, e.target.value)}
												>
													{searchableFields.map((field) => (
														<option key={field.field} value={field.field}>
															{field.label}
														</option>
													))}
												</select>
											</div>

											<div className="w-36">
												<label className="label">
													<span className="label-text text-sm">Operator</span>
												</label>
												<select
													className="select select-sm w-full"
													value={filter.operator}
													onChange={(e) => handleUpdateFilter(filter.id, {
														operator: e.target.value as any,
													})}
												>
													{OPERATORS[filter.type].map((op) => (
														<option key={op.value} value={op.value}>
															{op.label}
														</option>
													))}
												</select>
											</div>

											<div className="flex-1">{renderFilterValue(filter)}</div>

											<button
												className="btn btn-sm btn-ghost text-error"
												onClick={() => handleRemoveFilter(filter.id)}
											>
												<X size={16} />
											</button>
										</div>
									))}

									{/* Add Filter Button */}
									<div className="flex items-center justify-between">
										<button
											className="btn btn-sm btn-outline gap-2"
											onClick={handleAddFilter}
										>
											<Plus size={16} />
											Add Filter
										</button>

										{filters.length > 0 && (
											<div className="flex gap-2">
												<button
													className="btn btn-sm btn-outline"
													onClick={() => setFilters([])}
												>
													Clear All
												</button>
												{onSavePreset && (
													<button
														className="btn btn-sm btn-primary gap-2"
														onClick={onSavePresetOpen}
													>
														<Save size={16} />
														Save as Preset
													</button>
												)}
											</div>
										)}
									</div>
								</div>
							)}</div>

							<input
								type="radio"
								name="advanced_search_tabs"
								role="tab"
								className="tab"
								aria-label={`Presets (${presets.length})`}
								checked={selectedTab === "presets"}
								onChange={() => setSelectedTab("presets")}
							/>
							<div role="tabpanel" className="tab-content">{selectedTab === "presets" && (
								<div className="space-y-3 pt-4">
									{presets.map((preset) => (
										<div key={preset.id} className="card bg-base-100 border border-base-300 shadow">
											<div className="card-body p-4">
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<div className="mb-1 flex items-center gap-2">
															{getPresetIcon(preset.icon)}
															<h4 className="font-medium">{preset.name}</h4>
															{preset.isShared && (
																<span className="badge badge-sm badge-primary">
																	Shared
																</span>
															)}
														</div>
														{preset.description && (
															<p className="mb-2 text-base-content/60 text-sm">
																{preset.description}
															</p>
														)}
														<div className="flex flex-wrap gap-1">
															{preset.filters.map((filter, idx) => (
																<span key={idx} className="badge badge-sm badge-outline">
																	{filter.label} {filter.operator}{" "}
																	{JSON.stringify(filter.value)}
																</span>
															))}
														</div>
													</div>
													<button
														className="btn btn-sm btn-primary"
														onClick={() => handleApplyPreset(preset.id)}
													>
														Apply
													</button>
												</div>
											</div>
										</div>
									))}
								</div>
							)}</div>

							{showHistory && (
								<>
									<input
										type="radio"
										name="advanced_search_tabs"
										role="tab"
										className="tab"
										aria-label="Recent Searches"
										checked={selectedTab === "history"}
										onChange={() => setSelectedTab("history")}
									/>
									<div role="tabpanel" className="tab-content">{selectedTab === "history" && (
										<div className="space-y-3 pt-4">
										{mockHistory.map((history) => (
											<div
												key={history.id}
												className="card bg-base-100 border border-base-300 shadow cursor-pointer transition-shadow hover:shadow-md"
											>
												<div className="card-body p-4">
													<button
														onClick={() => handleApplyHistory(history)}
														className="w-full text-left"
													>
														<div className="flex items-start justify-between">
															<div className="flex-1">
																<div className="mb-1 flex items-center gap-2">
																	<Clock
																		size={16}
																		className="text-base-content/60"
																	/>
																	<span className="font-medium">
																		{history.query}
																	</span>
																	<span className="text-base-content/60 text-sm">
																		• {history.resultCount} results
																	</span>
																</div>
																{history.filters.length > 0 && (
																	<div className="mt-2 flex flex-wrap gap-1">
																		{history.filters.map((filter, idx) => (
																			<span key={idx} className="badge badge-sm badge-outline">
																				{filter.label}
																			</span>
																		))}
																	</div>
																)}
															</div>
															<span className="text-base-content/60 text-sm">
																{history.timestamp.toLocaleTimeString()}
															</span>
														</div>
													</button>
												</div>
											</div>
										))}
										</div>
									)}</div>
								</>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Save Preset Modal */}
			<dialog className="modal" open={isSavePresetOpen}>
				<div className="modal-box">
					<h3 className="font-bold text-lg">Save Search Preset</h3>
					<div className="py-4 space-y-4">
						<div>
							<label className="label">
								<span className="label-text">Preset Name *</span>
							</label>
							<input
								className="input w-full"
								placeholder="e.g., Brand Images Only"
								value={presetName}
								onChange={(e) => setPresetName(e.target.value)}
								required
							/>
						</div>
						<div>
							<label className="label">
								<span className="label-text">Description</span>
							</label>
							<textarea
								className="textarea w-full"
								placeholder="Describe what this preset searches for..."
								value={presetDescription}
								onChange={(e) => setPresetDescription(e.target.value)}
								rows={3}
							></textarea>
						</div>
						<label className="label cursor-pointer justify-start gap-2">
							<input
								type="checkbox"
								className="toggle toggle-primary"
								checked={presetShared}
								onChange={(e) => setPresetShared(e.target.checked)}
							/>
							<span className="label-text">Share with team</span>
						</label>
					</div>
					<div className="modal-action">
						<button className="btn btn-ghost" onClick={onSavePresetClose}>
							Cancel
						</button>
						<button
							className="btn btn-primary"
							onClick={handleSavePreset}
							disabled={!presetName.trim()}
						>
							Save Preset
						</button>
					</div>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button onClick={onSavePresetClose}>close</button>
				</form>
			</dialog>
		</div>
	);
}
