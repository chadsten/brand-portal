"use client";

// Import removed - using native HTML and DaisyUI classes
import { useModal } from "~/hooks/useModal";
import {
	Bell,
	BellOff,
	Calendar,
	Clock,
	Copy,
	Edit,
	Mail,
	Play,
	Save,
	Search,
	Share2,
	Star,
	StarOff,
	Trash2,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "~/lib/utils";

interface SavedSearch {
	id: string;
	name: string;
	description?: string;
	query: string;
	filters: any[];
	createdAt: Date;
	lastRun?: Date;
	runCount: number;
	isFavorite: boolean;
	isShared: boolean;
	alerts: {
		enabled: boolean;
		frequency: "daily" | "weekly" | "monthly" | "realtime";
		lastAlert?: Date;
		conditions: {
			newResults: boolean;
			thresholdCount?: number;
			specificTags?: string[];
		};
	};
	owner: {
		id: string;
		name: string;
		avatar?: string;
	};
}

interface SavedSearchesProps {
	searches: SavedSearch[];
	onRunSearch: (search: SavedSearch) => void;
	onUpdateSearch: (search: SavedSearch) => void;
	onDeleteSearch: (searchId: string) => void;
	onCreateSearch?: (
		search: Omit<SavedSearch, "id" | "createdAt" | "lastRun" | "runCount">,
	) => void;
}

const ALERT_FREQUENCIES = [
	{
		value: "realtime",
		label: "Real-time",
		description: "Get notified immediately",
	},
	{ value: "daily", label: "Daily", description: "Daily digest at 9 AM" },
	{
		value: "weekly",
		label: "Weekly",
		description: "Weekly summary on Mondays",
	},
	{
		value: "monthly",
		label: "Monthly",
		description: "Monthly report on the 1st",
	},
];

export function SavedSearches({
	searches,
	onRunSearch,
	onUpdateSearch,
	onDeleteSearch,
	onCreateSearch,
}: SavedSearchesProps) {
	const [selectedTab, setSelectedTab] = useState("all");
	const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);

	const {
		isOpen: isEditModalOpen,
		onOpen: onEditModalOpen,
		onClose: onEditModalClose,
	} = useModal();

	const {
		isOpen: isAlertModalOpen,
		onOpen: onAlertModalOpen,
		onClose: onAlertModalClose,
	} = useModal();

	const favoriteSearches = searches.filter((s) => s.isFavorite);
	const sharedSearches = searches.filter((s) => s.isShared);
	const alertSearches = searches.filter((s) => s.alerts.enabled);

	const handleEditSearch = (search: SavedSearch) => {
		setEditingSearch(search);
		onEditModalOpen();
	};

	const handleSaveEdit = () => {
		if (!editingSearch) return;
		onUpdateSearch(editingSearch);
		onEditModalClose();
		setEditingSearch(null);
	};

	const handleToggleFavorite = (search: SavedSearch) => {
		onUpdateSearch({
			...search,
			isFavorite: !search.isFavorite,
		});
	};

	const handleToggleAlert = (search: SavedSearch) => {
		if (search.alerts.enabled) {
			// Disable alerts
			onUpdateSearch({
				...search,
				alerts: {
					...search.alerts,
					enabled: false,
				},
			});
		} else {
			// Open alert configuration
			setEditingSearch(search);
			onAlertModalOpen();
		}
	};

	const handleSaveAlerts = () => {
		if (!editingSearch) return;
		onUpdateSearch({
			...editingSearch,
			alerts: {
				...editingSearch.alerts,
				enabled: true,
			},
		});
		onAlertModalClose();
		setEditingSearch(null);
	};

	const handleDuplicateSearch = (search: SavedSearch) => {
		if (!onCreateSearch) return;

		const duplicatedSearch = {
			...search,
			name: `${search.name} (Copy)`,
			isFavorite: false,
			isShared: false,
		};

		const { id, createdAt, lastRun, runCount, ...newSearch } = duplicatedSearch;
		onCreateSearch(newSearch);
	};

	const getSearchesByTab = () => {
		switch (selectedTab) {
			case "favorites":
				return favoriteSearches;
			case "shared":
				return sharedSearches;
			case "alerts":
				return alertSearches;
			default:
				return searches;
		}
	};

	const renderSearchCard = (search: SavedSearch) => (
		<div key={search.id} className="card bg-base-100 shadow transition-shadow hover:shadow-md">
			<div className="card-body space-y-4">
				{/* Header */}
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<div className="mb-1 flex items-center gap-2">
							<h4 className="font-semibold">{search.name}</h4>
							{search.isFavorite && (
								<Star size={16} className="fill-current text-warning" />
							)}
							{search.isShared && (
								<span className="badge badge-sm badge-primary">
									Shared
								</span>
							)}
							{search.alerts.enabled && (
								<span className="badge badge-sm badge-success gap-1">
									<Bell size={12} />
									Alerts
								</span>
							)}
						</div>
						{search.description && (
							<p className="text-base-content/50 text-sm">
								{search.description}
							</p>
						)}
					</div>
					<div className="flex gap-1">
						<div
							className="tooltip"
							data-tip={search.isFavorite ? "Remove from favorites" : "Add to favorites"}
						>
							<button
								className="btn btn-sm btn-square btn-ghost"
								onClick={() => handleToggleFavorite(search)}
							>
								{search.isFavorite ? (
									<Star size={14} className="fill-current" />
								) : (
									<StarOff size={14} />
								)}
							</button>
						</div>
						<div className="tooltip" data-tip="Edit">
							<button
								className="btn btn-sm btn-square btn-ghost"
								onClick={() => handleEditSearch(search)}
							>
								<Edit size={14} />
							</button>
						</div>
					</div>
				</div>

				{/* Query Info */}
				<div className="space-y-2">
					<div className="flex items-center gap-2 text-sm">
						<Search size={14} className="text-base-content/40" />
						<span className="rounded bg-base-200 px-2 py-0.5 font-mono">
							{search.query || "All results"}
						</span>
					</div>
					{search.filters.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{search.filters.map((filter, idx) => (
								<span key={idx} className="badge badge-sm badge-outline">
									{filter.label || filter.field}
								</span>
							))}
						</div>
					)}
				</div>

				{/* Stats */}
				<div className="flex items-center gap-4 text-base-content/50 text-sm">
					<span>Created {formatDistanceToNow(search.createdAt)} ago</span>
					{search.lastRun && (
						<span>Last run {formatDistanceToNow(search.lastRun)} ago</span>
					)}
					<span>{search.runCount} runs</span>
				</div>

				{/* Alert Status */}
				{search.alerts.enabled && (
					<div className="flex items-center gap-2 rounded-lg bg-success/10 p-2">
						<Bell size={16} className="text-success" />
						<div className="flex-1">
							<p className="font-medium text-sm">Alerts enabled</p>
							<p className="text-base-content/60 text-xs">
								{
									ALERT_FREQUENCIES.find(
										(f) => f.value === search.alerts.frequency,
									)?.label
								}{" "}
								notifications
							</p>
						</div>
					</div>
				)}

				{/* Actions */}
				<div className="flex gap-2">
					<button
						className="btn btn-sm btn-primary gap-2"
						onClick={() => onRunSearch(search)}
					>
						<Play size={14} />
						Run Search
					</button>
					<button
						className="btn btn-sm btn-outline gap-2"
						onClick={() => handleToggleAlert(search)}
					>
						{search.alerts.enabled ? <BellOff size={14} /> : <Bell size={14} />}
						{search.alerts.enabled ? "Disable Alerts" : "Enable Alerts"}
					</button>
					<button
						className="btn btn-sm btn-outline gap-2"
						onClick={() => handleDuplicateSearch(search)}
					>
						<Copy size={14} />
						Duplicate
					</button>
					<button
						className="btn btn-sm btn-outline btn-error gap-2"
						onClick={() => {
							if (
								confirm("Are you sure you want to delete this saved search?")
							) {
								onDeleteSearch(search.id);
							}
						}}
					>
						<Trash2 size={14} />
						Delete
					</button>
				</div>
			</div>
		</div>
	);

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="card bg-base-100 shadow">
				<div className="card-header p-4 flex justify-between items-center">
					<div className="flex items-center gap-2">
						<Save size={20} />
						<h3 className="font-semibold text-lg">Saved Searches</h3>
						<span className="badge badge-primary badge-sm">
							{searches.length}
						</span>
					</div>
					<button className="btn btn-sm btn-primary gap-2">
						<Zap size={16} />
						Quick Actions
					</button>
				</div>
			</div>

			{/* Tabs */}
			<div role="tablist" className="tabs tabs-bordered">
				<input
					type="radio"
					name="saved_search_tabs"
					role="tab"
					className="tab"
					aria-label="All Searches"
					checked={selectedTab === "all"}
					onChange={() => setSelectedTab("all")}
				/>
				<div role="tabpanel" className="tab-content p-4">
					{selectedTab === "all" && (
						<>
							<div className="space-y-4">
								{searches.length === 0 ? (
									<div className="card bg-base-100 shadow">
										<div className="card-body py-12 text-center">
											<Search size={48} className="mx-auto mb-4 text-base-content/30" />
											<h3 className="mb-2 font-semibold text-lg">
												No saved searches yet
											</h3>
											<p className="text-base-content/60">
												Save your searches to quickly access them later
											</p>
										</div>
									</div>
								) : (
									searches.map(renderSearchCard)
								)}
							</div>
						</>
					)}
				</div>


				<input
					type="radio"
					name="saved_search_tabs"
					role="tab"
					className="tab"
					aria-label="Favorites"
					checked={selectedTab === "favorites"}
					onChange={() => setSelectedTab("favorites")}
				/>
				<div role="tabpanel" className="tab-content p-4">
					{selectedTab === "favorites" && (
						<>
							<div className="space-y-4">
								{favoriteSearches.length === 0 ? (
									<div className="card bg-base-100 shadow">
										<div className="card-body py-8 text-center">
											<StarOff
												size={32}
												className="mx-auto mb-2 text-base-content/30"
											/>
											<p className="text-base-content/60">No favorite searches yet</p>
										</div>
									</div>
								) : (
									favoriteSearches.map(renderSearchCard)
								)}
							</div>
						</>
					)}
				</div>


				<input
					type="radio"
					name="saved_search_tabs"
					role="tab"
					className="tab"
					aria-label="Shared"
					checked={selectedTab === "shared"}
					onChange={() => setSelectedTab("shared")}
				/>
				<div role="tabpanel" className="tab-content p-4">
					{selectedTab === "shared" && (
						<>
							<div className="space-y-4">
								{sharedSearches.length === 0 ? (
									<div className="card bg-base-100 shadow">
										<div className="card-body py-8 text-center">
											<Share2 size={32} className="mx-auto mb-2 text-base-content/30" />
											<p className="text-base-content/60">No shared searches</p>
										</div>
									</div>
								) : (
									sharedSearches.map(renderSearchCard)
								)}
							</div>
						</>
					)}
				</div>


				<input
					type="radio"
					name="saved_search_tabs"
					role="tab"
					className="tab"
					aria-label="With Alerts"
					checked={selectedTab === "alerts"}
					onChange={() => setSelectedTab("alerts")}
				/>
				<div role="tabpanel" className="tab-content p-4">
					{selectedTab === "alerts" && (
						<>
							<div className="space-y-4">
								{alertSearches.length === 0 ? (
									<div className="card bg-base-100 shadow">
										<div className="card-body py-8 text-center">
											<BellOff
												size={32}
												className="mx-auto mb-2 text-base-content/30"
											/>
											<p className="text-base-content/60">
												No searches with alerts enabled
											</p>
										</div>
									</div>
								) : (
									alertSearches.map(renderSearchCard)
								)}
							</div>
						</>
					)}
				</div>
			</div>

			{/* Edit Search Modal */}
			<dialog className="modal" open={isEditModalOpen}>
				<div className="modal-box w-11/12 max-w-2xl">
					{editingSearch && (
						<>
							<h3 className="font-bold text-lg">Edit Saved Search</h3>
							<div className="py-4 space-y-4">
								<div>
									<label className="label">
										<span className="label-text">Search Name</span>
									</label>
									<input
										className="input w-full"
										value={editingSearch.name}
										onChange={(e) =>
											setEditingSearch({ ...editingSearch, name: e.target.value })
										}
									/>
								</div>
								<div>
									<label className="label">
										<span className="label-text">Description</span>
									</label>
									<textarea
										className="textarea w-full"
										placeholder="Describe what this search is for..."
										value={editingSearch.description || ""}
										onChange={(e) =>
											setEditingSearch({ ...editingSearch, description: e.target.value })
										}
										rows={3}
									></textarea>
								</div>
								<div className="flex gap-4">
									<label className="label cursor-pointer justify-start gap-2">
										<input
											type="checkbox"
											className="toggle toggle-primary"
											checked={editingSearch.isShared}
											onChange={(e) =>
												setEditingSearch({ ...editingSearch, isShared: e.target.checked })
											}
										/>
										<span className="label-text">Share with team</span>
									</label>
									<label className="label cursor-pointer justify-start gap-2">
										<input
											type="checkbox"
											className="toggle toggle-primary"
											checked={editingSearch.isFavorite}
											onChange={(e) =>
												setEditingSearch({ ...editingSearch, isFavorite: e.target.checked })
											}
										/>
										<span className="label-text">Mark as favorite</span>
									</label>
								</div>
							</div>
							<div className="modal-action">
								<button className="btn btn-ghost" onClick={onEditModalClose}>
									Cancel
								</button>
								<button className="btn btn-primary" onClick={handleSaveEdit}>
									Save Changes
								</button>
							</div>
						</>
					)}
				</div>
				<form method="dialog" className="modal-backdrop">
					<button onClick={onEditModalClose}>close</button>
				</form>
			</dialog>

			{/* Alert Configuration Modal */}
			<dialog className="modal" open={isAlertModalOpen}>
				<div className="modal-box w-11/12 max-w-lg">
					{editingSearch && (
						<>
							<h3 className="font-bold text-lg">Configure Search Alerts</h3>
							<div className="py-4 space-y-4">
								<div>
									<h4 className="mb-2 font-medium">Alert Frequency</h4>
									<div>
										<label className="label">
											<span className="label-text">How often to check</span>
										</label>
										<select
											className="select w-full"
											value={editingSearch.alerts.frequency}
											onChange={(e) =>
												setEditingSearch({
													...editingSearch,
													alerts: {
														...editingSearch.alerts,
														frequency: e.target.value as any,
													},
												})
											}
										>
											{ALERT_FREQUENCIES.map((freq) => (
												<option key={freq.value} value={freq.value}>
													{freq.label} - {freq.description}
												</option>
											))}
										</select>
									</div>
								</div>

								<div>
									<h4 className="mb-2 font-medium">Alert Conditions</h4>
									<div className="space-y-2">
										<label className="label cursor-pointer justify-start gap-2">
											<input
												type="checkbox"
												className="toggle toggle-primary"
												checked={editingSearch.alerts.conditions.newResults}
												onChange={(e) =>
													setEditingSearch({
														...editingSearch,
														alerts: {
															...editingSearch.alerts,
															conditions: {
																...editingSearch.alerts.conditions,
																newResults: e.target.checked,
															},
														},
													})
												}
											/>
											<span className="label-text">Alert on any new results</span>
										</label>

										<div className="flex items-center gap-2">
											<span className="text-sm">
												Alert when results exceed
											</span>
											<input
												type="number"
												className="input input-sm w-20"
												value={String(
													editingSearch.alerts.conditions.thresholdCount || "",
												)}
												onChange={(e) =>
													setEditingSearch({
														...editingSearch,
														alerts: {
															...editingSearch.alerts,
															conditions: {
																...editingSearch.alerts.conditions,
																thresholdCount:
																	parseInt(e.target.value) || undefined,
															},
														},
													})
												}
											/>
											<span className="text-sm">items</span>
										</div>
									</div>
								</div>

								<div className="rounded-lg bg-primary/10 p-3">
									<div className="flex items-start gap-2">
										<Mail size={16} className="mt-0.5 text-primary" />
										<div>
											<p className="font-medium text-sm">
												Email Notifications
											</p>
											<p className="text-base-content/60 text-xs">
												Alerts will be sent to your registered email address
											</p>
										</div>
									</div>
								</div>
							</div>
							<div className="modal-action">
								<button className="btn btn-ghost" onClick={onAlertModalClose}>
									Cancel
								</button>
								<button className="btn btn-primary" onClick={handleSaveAlerts}>
									Enable Alerts
								</button>
							</div>
						</>
					)}
				</div>
				<form method="dialog" className="modal-backdrop">
					<button onClick={onAlertModalClose}>close</button>
				</form>
			</dialog>
		</div>
	);
}
