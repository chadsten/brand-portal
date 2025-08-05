"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	AlertTriangle,
	CheckCircle,
	Clock,
	Download,
	Eye,
	Filter,
	MoreVertical,
	Pause,
	Play,
	Trash2,
	Upload,
	XCircle,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { api } from "~/trpc/react";

export interface BulkUploadItem {
	id: string;
	file: File;
	name: string;
	size: number;
	type: string;
	status:
		| "pending"
		| "uploading"
		| "processing"
		| "completed"
		| "failed"
		| "paused";
	progress: number;
	error?: string;
	assetId?: string;
	thumbnailUrl?: string;
	tags?: string[];
	category?: string;
	metadata?: Record<string, any>;
}

interface BulkUploadManagerProps {
	items: BulkUploadItem[];
	onItemsChange?: (items: BulkUploadItem[]) => void;
	onStartUpload?: (items: BulkUploadItem[]) => void;
	onPauseUpload?: (items: BulkUploadItem[]) => void;
	onCancelUpload?: (items: BulkUploadItem[]) => void;
	onRetryUpload?: (items: BulkUploadItem[]) => void;
	onRemoveItems?: (itemIds: string[]) => void;
	className?: string;
}

export default function BulkUploadManager({
	items,
	onItemsChange,
	onStartUpload,
	onPauseUpload,
	onCancelUpload,
	onRetryUpload,
	onRemoveItems,
	className = "",
}: BulkUploadManagerProps) {
	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
	const [filterStatus, setFilterStatus] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<string>("name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const onDetailsOpen = () => setIsDetailsOpen(true);
	const onDetailsClose = () => setIsDetailsOpen(false);
	const [selectedItemForDetails, setSelectedItemForDetails] =
		useState<BulkUploadItem | null>(null);

	// tRPC mutations
	const validateBulkUpload = api.upload.validateBulkUpload.useMutation();

	// Filter and sort items
	const filteredItems = useMemo(() => {
		let filtered = items;

		// Apply status filter
		if (filterStatus !== "all") {
			filtered = filtered.filter((item) => item.status === filterStatus);
		}

		// Apply search filter
		if (searchQuery) {
			filtered = filtered.filter(
				(item) =>
					item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.tags?.some((tag) =>
						tag.toLowerCase().includes(searchQuery.toLowerCase()),
					),
			);
		}

		// Apply sorting
		filtered.sort((a, b) => {
			let aValue: any = a[sortBy as keyof BulkUploadItem];
			let bValue: any = b[sortBy as keyof BulkUploadItem];

			if (sortBy === "size") {
				aValue = a.size;
				bValue = b.size;
			} else if (typeof aValue === "string" && typeof bValue === "string") {
				aValue = aValue.toLowerCase();
				bValue = bValue.toLowerCase();
			}

			if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
			if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
			return 0;
		});

		return filtered;
	}, [items, filterStatus, searchQuery, sortBy, sortOrder]);

	// Calculate statistics
	const stats = useMemo(() => {
		const total = items.length;
		const pending = items.filter((i) => i.status === "pending").length;
		const uploading = items.filter((i) => i.status === "uploading").length;
		const processing = items.filter((i) => i.status === "processing").length;
		const completed = items.filter((i) => i.status === "completed").length;
		const failed = items.filter((i) => i.status === "failed").length;
		const paused = items.filter((i) => i.status === "paused").length;

		const totalSize = items.reduce((sum, item) => sum + item.size, 0);
		const uploadedSize = items.reduce((sum, item) => {
			if (item.status === "completed") return sum + item.size;
			if (item.status === "uploading" || item.status === "processing") {
				return sum + item.size * (item.progress / 100);
			}
			return sum;
		}, 0);

		const overallProgress =
			totalSize > 0 ? (uploadedSize / totalSize) * 100 : 0;

		return {
			total,
			pending,
			uploading,
			processing,
			completed,
			failed,
			paused,
			totalSize,
			uploadedSize,
			overallProgress,
		};
	}, [items]);

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / k ** i).toFixed(2)) + " " + sizes[i];
	};

	const getStatusIcon = (status: BulkUploadItem["status"]) => {
		switch (status) {
			case "pending":
				return <Clock className="h-4 w-4" />;
			case "uploading":
			case "processing":
				return (
					<div className="h-4 w-4 animate-spin rounded-full border-primary border-b-2" />
				);
			case "completed":
				return <CheckCircle className="h-4 w-4" />;
			case "failed":
				return <XCircle className="h-4 w-4" />;
			case "paused":
				return <Pause className="h-4 w-4" />;
		}
	};

	const getStatusColor = (status: BulkUploadItem["status"]) => {
		switch (status) {
			case "pending":
				return "default";
			case "uploading":
			case "processing":
				return "primary";
			case "completed":
				return "success";
			case "failed":
				return "danger";
			case "paused":
				return "warning";
		}
	};

	const handleSelectAll = useCallback(
		(isSelected: boolean) => {
			if (isSelected) {
				setSelectedItems(new Set(filteredItems.map((item) => item.id)));
			} else {
				setSelectedItems(new Set());
			}
		},
		[filteredItems],
	);

	const handleSelectItem = useCallback(
		(itemId: string, isSelected: boolean) => {
			setSelectedItems((prev) => {
				const newSet = new Set(prev);
				if (isSelected) {
					newSet.add(itemId);
				} else {
					newSet.delete(itemId);
				}
				return newSet;
			});
		},
		[],
	);

	const handleBulkAction = useCallback(
		(action: string) => {
			const selectedItemsList = items.filter((item) =>
				selectedItems.has(item.id),
			);

			switch (action) {
				case "start":
					onStartUpload?.(selectedItemsList);
					break;
				case "pause":
					onPauseUpload?.(selectedItemsList);
					break;
				case "cancel":
					onCancelUpload?.(selectedItemsList);
					break;
				case "retry":
					onRetryUpload?.(selectedItemsList);
					break;
				case "remove":
					onRemoveItems?.(Array.from(selectedItems));
					setSelectedItems(new Set());
					break;
			}
		},
		[
			selectedItems,
			items,
			onStartUpload,
			onPauseUpload,
			onCancelUpload,
			onRetryUpload,
			onRemoveItems,
		],
	);

	const handleStartAllUploads = async () => {
		const pendingItems = items.filter((item) => item.status === "pending");
		if (pendingItems.length > 0) {
			try {
				await validateBulkUpload.mutateAsync({
					files: pendingItems.map((item) => ({
						name: item.name,
						size: item.size,
						type: item.type,
					})),
				});
				onStartUpload?.(pendingItems);
			} catch (error) {
				console.error("Bulk upload validation failed:", error);
			}
		}
	};

	const openItemDetails = (item: BulkUploadItem) => {
		setSelectedItemForDetails(item);
		onDetailsOpen();
	};

	const canStartUpload =
		selectedItems.size > 0 &&
		Array.from(selectedItems).some((id) => {
			const item = items.find((i) => i.id === id);
			return (
				item?.status === "pending" ||
				item?.status === "paused" ||
				item?.status === "failed"
			);
		});

	const canPauseUpload =
		selectedItems.size > 0 &&
		Array.from(selectedItems).some((id) => {
			const item = items.find((i) => i.id === id);
			return item?.status === "uploading" || item?.status === "processing";
		});

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Statistics Summary */}
			<div className="card bg-base-100 shadow">
				<div className="card-header p-6 pb-0">
					<div className="flex w-full items-center justify-between">
						<h3 className="font-semibold text-lg">Bulk Upload Manager</h3>
						<div className="flex items-center gap-2">
							<button
								className="btn btn-primary"
								onClick={handleStartAllUploads}
								disabled={stats.pending === 0 || validateBulkUpload.isPending}
							>
								<Upload className="h-4 w-4" />
								{validateBulkUpload.isPending ? (
									<span className="loading loading-spinner loading-sm"></span>
								) : null}
								Start All Uploads
							</button>
						</div>
					</div>
				</div>
				<div className="card-body">
					<div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
						<div className="text-center">
							<p className="font-bold text-2xl text-primary">{stats.total}</p>
							<p className="text-base-content/50 text-sm">Total Files</p>
						</div>
						<div className="text-center">
							<p className="font-bold text-2xl text-success">
								{stats.completed}
							</p>
							<p className="text-base-content/50 text-sm">Completed</p>
						</div>
						<div className="text-center">
							<p className="font-bold text-2xl text-warning">
								{stats.uploading + stats.processing}
							</p>
							<p className="text-base-content/50 text-sm">In Progress</p>
						</div>
						<div className="text-center">
							<p className="font-bold text-2xl text-error">{stats.failed}</p>
							<p className="text-base-content/50 text-sm">Failed</p>
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex justify-between text-base-content/60 text-sm">
							<span>Overall Progress</span>
							<span>
								{Math.round(stats.overallProgress)}% •{" "}
								{formatFileSize(stats.uploadedSize)} /{" "}
								{formatFileSize(stats.totalSize)}
							</span>
						</div>
						<progress 
							className="progress progress-primary" 
							value={stats.overallProgress} 
							max={100}
						></progress>
					</div>
				</div>
			</div>

			{/* Controls */}
			<div className="card bg-base-100 shadow">
				<div className="card-body">
					<div className="flex flex-col gap-4 md:flex-row">
						{/* Search */}
						<div className="md:w-64">
							<div className="relative">
								<input
									type="text"
									placeholder="Search files..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="input pl-10"
								/>
								<Filter className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
							</div>
						</div>

						{/* Status Filter */}
						<div className="md:w-48">
							<select
								className="select"
								value={filterStatus}
								onChange={(e) => setFilterStatus(e.target.value)}
							>
								<option value="all">All Files</option>
								<option value="pending">Pending</option>
								<option value="uploading">Uploading</option>
								<option value="processing">Processing</option>
								<option value="completed">Completed</option>
								<option value="failed">Failed</option>
								<option value="paused">Paused</option>
							</select>
						</div>

						{/* Sort */}
						<div className="md:w-48">
							<select
								className="select"
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value)}
							>
								<option value="name">Name</option>
								<option value="size">Size</option>
								<option value="type">Type</option>
								<option value="status">Status</option>
							</select>
						</div>

						{/* Bulk Actions */}
						{selectedItems.size > 0 && (
							<div className="flex gap-2 md:ml-auto">
								<button
									className="btn btn-sm btn-primary"
									onClick={() => handleBulkAction("start")}
									disabled={!canStartUpload}
								>
									<Play className="h-4 w-4" />
									Start ({selectedItems.size})
								</button>
								<button
									className="btn btn-sm btn-warning"
									onClick={() => handleBulkAction("pause")}
									disabled={!canPauseUpload}
								>
									<Pause className="h-4 w-4" />
									Pause
								</button>
								<button
									className="btn btn-sm btn-error btn-outline"
									onClick={() => handleBulkAction("remove")}
								>
									<Trash2 className="h-4 w-4" />
									Remove
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* File Table */}
			<div className="overflow-x-auto border border-base-300 rounded-lg shadow-none min-h-[400px]">
				<table className="table w-full">
					<thead>
						<tr>
							<th>
								<input
									type="checkbox"
									className="checkbox"
									checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
									onChange={(e) => handleSelectAll(e.target.checked)}
								/>
							</th>
							<th>File</th>
							<th>Size</th>
							<th>Type</th>
							<th>Status</th>
							<th>Progress</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{filteredItems.map((item) => (
							<tr key={item.id} className="cursor-pointer hover:bg-base-200">
								<td>
									<input
										type="checkbox"
										className="checkbox"
										checked={selectedItems.has(item.id)}
										onChange={(e) => handleSelectItem(item.id, e.target.checked)}
									/>
								</td>
								<td>
								<div className="flex items-center gap-3">
									{item.thumbnailUrl ? (
										<div className="avatar">
											<div className="w-8 h-8 rounded">
												<img
													src={item.thumbnailUrl}
													alt={item.name}
												/>
											</div>
										</div>
									) : (
										<div className="flex h-8 w-8 items-center justify-center rounded bg-base-200">
											📄
										</div>
									)}
									<div>
										<p className="font-medium">{item.name}</p>
										{item.tags && item.tags.length > 0 && (
											<div className="mt-1 flex gap-1">
												{item.tags.slice(0, 2).map((tag) => (
													<span key={tag} className="badge badge-sm badge-outline">
														{tag}
													</span>
												))}
												{item.tags.length > 2 && (
													<span className="badge badge-sm badge-outline">
														+{item.tags.length - 2}
													</span>
												)}
											</div>
										)}
									</div>
								</div>
							</td>
							<td>{formatFileSize(item.size)}</td>
							<td>{item.type}</td>
							<td>
								<div className="flex items-center gap-2">
									{getStatusIcon(item.status)}
									<span className={`badge badge-sm ${
										getStatusColor(item.status) === "success" ? "badge-success" :
										getStatusColor(item.status) === "warning" ? "badge-warning" :
										getStatusColor(item.status) === "danger" ? "badge-error" :
										getStatusColor(item.status) === "primary" ? "badge-primary" :
										"badge-neutral"
									}`}>
										{item.status}
									</span>
								</div>
							</td>
							<td>
								<div className="w-full max-w-[200px]">
									{item.status === "uploading" ||
									item.status === "processing" ? (
										<progress 
											className="progress progress-primary progress-sm" 
											value={item.progress} 
											max={100}
										></progress>
									) : item.status === "completed" ? (
										<progress 
											className="progress progress-success progress-sm" 
											value={100} 
											max={100}
										></progress>
									) : (
										<div className="text-base-content/50 text-sm">
											{item.status === "failed" ? "Failed" : "—"}
										</div>
									)}
								</div>
							</td>
							<td>
								<div className="dropdown dropdown-end">
									<button className="btn btn-sm btn-ghost btn-square" tabIndex={0}>
										<MoreVertical className="h-4 w-4" />
									</button>
									<ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52" tabIndex={0}>
										<li>
											<button onClick={() => openItemDetails(item)} className="flex items-center gap-2">
												<Eye className="h-4 w-4" />
												View Details
											</button>
										</li>
										{item.status === "completed" && item.assetId ? (
											<li>
												<button className="flex items-center gap-2">
													<Download className="h-4 w-4" />
													Download
												</button>
											</li>
										) : null}
										{item.status === "pending" ||
										item.status === "failed" ||
										item.status === "paused" ? (
											<li>
												<button onClick={() => onStartUpload?.([item])} className="flex items-center gap-2">
													<Play className="h-4 w-4" />
													Start Upload
												</button>
											</li>
										) : null}
										{item.status === "uploading" ||
										item.status === "processing" ? (
											<li>
												<button onClick={() => onPauseUpload?.([item])} className="flex items-center gap-2">
													<Pause className="h-4 w-4" />
													Pause Upload
												</button>
											</li>
										) : null}
										<li>
											<button onClick={() => onRemoveItems?.([item.id])} className="flex items-center gap-2 text-error">
												<Trash2 className="h-4 w-4" />
												Remove
											</button>
										</li>
									</ul>
								</div>
							</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Item Details Modal */}
			<dialog className="modal" open={isDetailsOpen}>
				<div className="modal-box w-11/12 max-w-2xl">
					<div className="flex justify-between items-center mb-4">
						<h3 className="font-bold text-xl">File Details</h3>
						<button className="btn btn-sm btn-circle btn-ghost" onClick={onDetailsClose}>✕</button>
					</div>
					<div className="py-4">
								{selectedItemForDetails && (
									<div className="space-y-4">
										<div className="flex items-center gap-4">
											{selectedItemForDetails.thumbnailUrl ? (
												<div className="avatar">
													<div className="w-16 h-16 rounded-lg">
														<img
															src={selectedItemForDetails.thumbnailUrl}
															alt={selectedItemForDetails.name}
														/>
													</div>
												</div>
											) : (
												<div className="flex h-16 w-16 items-center justify-center rounded-lg bg-base-200">
													📄
												</div>
											)}
											<div>
												<h4 className="font-semibold text-lg">
													{selectedItemForDetails.name}
												</h4>
												<p className="text-base-content/50">
													{selectedItemForDetails.type}
												</p>
											</div>
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div>
												<p className="font-medium text-base-content/60 text-sm">
													File Size
												</p>
												<p>{formatFileSize(selectedItemForDetails.size)}</p>
											</div>
											<div>
												<p className="font-medium text-base-content/60 text-sm">
													Status
												</p>
												<div className="flex items-center gap-2">
													{getStatusIcon(selectedItemForDetails.status)}
													<span className={`badge badge-sm ${
														getStatusColor(selectedItemForDetails.status) === "success" ? "badge-success" :
														getStatusColor(selectedItemForDetails.status) === "warning" ? "badge-warning" :
														getStatusColor(selectedItemForDetails.status) === "danger" ? "badge-error" :
														getStatusColor(selectedItemForDetails.status) === "primary" ? "badge-primary" :
														"badge-neutral"
													}`}>
														{selectedItemForDetails.status}
													</span>
												</div>
											</div>
											<div>
												<p className="font-medium text-base-content/60 text-sm">
													Progress
												</p>
												<p>{selectedItemForDetails.progress}%</p>
											</div>
											<div>
												<p className="font-medium text-base-content/60 text-sm">
													Category
												</p>
												<p>
													{selectedItemForDetails.category || "Uncategorized"}
												</p>
											</div>
										</div>

										{selectedItemForDetails.tags &&
											selectedItemForDetails.tags.length > 0 && (
												<div>
													<p className="mb-2 font-medium text-base-content/60 text-sm">
														Tags
													</p>
													<div className="flex flex-wrap gap-2">
														{selectedItemForDetails.tags.map((tag) => (
															<span key={tag} className="badge badge-sm badge-outline">
																{tag}
															</span>
														))}
													</div>
												</div>
											)}

										{selectedItemForDetails.error && (
											<div>
												<p className="mb-2 font-medium text-error text-sm">
													Error
												</p>
												<div className="alert alert-error">
													<p className="text-sm">
														{selectedItemForDetails.error}
													</p>
												</div>
											</div>
										)}

										{selectedItemForDetails.metadata && (
											<div>
												<p className="mb-2 font-medium text-base-content/60 text-sm">
													Metadata
												</p>
												<div className="mockup-code">
													<pre className="whitespace-pre-wrap text-xs">
														{JSON.stringify(
															selectedItemForDetails.metadata,
															null,
															2,
														)}
													</pre>
												</div>
											</div>
										)}
									</div>
								)}
					</div>
					<div className="modal-action">
						<button className="btn" onClick={onDetailsClose}>
							Close
						</button>
					</div>
				</div>
				<div className="modal-backdrop" onClick={onDetailsClose}></div>
			</dialog>
		</div>
	);
}
