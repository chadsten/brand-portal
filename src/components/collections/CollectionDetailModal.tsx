"use client";

import { formatDistanceToNow } from "date-fns";
import {
	Activity,
	Calendar,
	Copy,
	Crown,
	Download,
	Edit,
	ExternalLink,
	Eye,
	Grid,
	HardDrive,
	Image as ImageIcon,
	List,
	Lock,
	Minus,
	Palette,
	Plus,
	Search,
	Settings,
	Share2,
	Tag,
	Trash2,
	Users,
} from "lucide-react";
import { useState } from "react";
import { formatBytes } from "~/lib/utils";
import { api } from "~/trpc/react";
import { AssetGrid } from "../assets/AssetGrid";
import { BaseModal } from "../ui/BaseModal";

interface CollectionDetailModalProps {
	collectionId: string;
	isOpen: boolean;
	onClose: () => void;
	onUpdate: () => void;
}

export function CollectionDetailModal({
	collectionId,
	isOpen,
	onClose,
	onUpdate,
}: CollectionDetailModalProps) {
	const [activeTab, setActiveTab] = useState("assets");
	const [isEditing, setIsEditing] = useState(false);
	const [editForm, setEditForm] = useState({
		name: "",
		description: "",
		color: "",
		icon: "",
		isPublic: false,
		allowContributions: false,
	});
	const [assetSearchQuery, setAssetSearchQuery] = useState("");
	const [assetViewMode, setAssetViewMode] = useState<"grid" | "list">("grid");

	// API queries
	const {
		data: collection,
		isLoading: collectionLoading,
		refetch: refetchCollection,
	} = api.assetApi.getCollection?.useQuery(
		{ id: collectionId },
		{ enabled: isOpen && !!collectionId },
	) || { data: null, isLoading: false, refetch: () => {} };

	// TODO: Implement getCollectionAssets endpoint
	const collectionAssets = { assets: [], total: 0 };
	const assetsLoading = false;
	const refetchAssets = () => {};

	// TODO: Implement getCollectionActivity endpoint
	const collectionActivity: any[] = [];
	const activityLoading = false;

	// Mutations
	const updateCollectionMutation = {
		mutate: (params: any) => {
			console.log("Update collection:", params);
			setIsEditing(false);
		},
		isPending: false,
	};

	const deleteCollectionMutation = {
		mutate: (params: any) => {
			console.log("Delete collection:", params);
			onClose();
		},
		isPending: false,
	};

	const addAssetMutation = {
		mutate: (params: any) => {
			console.log("Add asset to collection:", params);
			refetchAssets();
		},
		isPending: false,
	};

	const removeAssetMutation = {
		mutate: (params: any) => {
			console.log("Remove asset from collection:", params);
			refetchAssets();
		},
		isPending: false,
	};

	const createShareMutation = {
		mutate: (params: any) => {
			console.log("Create collection share:", params);
		},
		isPending: false,
	};

	// Initialize edit form when collection loads
	if (collection && !isEditing && editForm.name !== collection.name) {
		setEditForm({
			name: collection.name,
			description: collection.description || "",
			color: collection.color || "#6366f1",
			icon: collection.icon || "📁",
			isPublic: collection.isPublic,
			allowContributions: collection.allowContributions,
		});
	}

	const handleSaveEdit = () => {
		updateCollectionMutation.mutate({
			id: collectionId,
			...editForm,
		});
	};

	const handleDeleteCollection = () => {
		if (confirm("Are you sure you want to delete this collection?")) {
			deleteCollectionMutation.mutate({ id: collectionId });
		}
	};

	const handleAddAssets = () => {
		// TODO: Open asset selector modal
		console.log("Open asset selector");
	};

	const handleRemoveAsset = (assetId: string) => {
		removeAssetMutation.mutate({
			collectionId,
			assetId,
		});
	};

	const handleCreateShare = () => {
		createShareMutation.mutate({
			collectionId,
			shareType: "view",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
		});
	};

	const handleDuplicateCollection = () => {
		// TODO: Implement collection duplication
		console.log("Duplicate collection");
	};

	if (collectionLoading) {
		return (
			<BaseModal
				isOpen={isOpen}
				onClose={onClose}
				title="Loading..."
				size="xl"
			>
				<div className="flex items-center justify-center py-12">
					<span className="loading loading-spinner loading-lg"></span>
				</div>
			</BaseModal>
		);
	}

	if (!collection) {
		return (
			<BaseModal
				isOpen={isOpen}
				onClose={onClose}
				title="Collection Not Found"
				size="md"
			>
				<div className="py-12 text-center">
					<p>Collection not found</p>
				</div>
			</BaseModal>
		);
	}

	const assets = collectionAssets?.assets || [];
	const totalAssets = collectionAssets?.total || 0;
	const activity = collectionActivity || [];

	return (
		<BaseModal
			isOpen={isOpen}
			onClose={onClose}
			size="xl"
			contentClassName="h-5/6 overflow-y-auto"
		>
			<div className="space-y-4">
				{/* Collection Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div
							className="flex h-12 w-12 items-center justify-center rounded-lg text-xl"
							style={{
								background: collection.coverAsset?.thumbnailKey
									? `url(/api/assets/serve/${collection.coverAsset.thumbnailKey}) center/cover`
									: `linear-gradient(135deg, ${collection.color || "#6366f1"}20, ${collection.color || "#6366f1"}40)`,
							}}
						>
							{!collection.coverAsset?.thumbnailKey && (
								<span>{collection.icon || "📁"}</span>
							)}
						</div>
						<div>
							<h2 className="font-bold text-xl">{collection.name}</h2>
							<div className="flex items-center gap-2">
								{collection.isTemplate && (
									<span className="badge badge-sm badge-secondary">
										<Crown size={12} />
										Template
									</span>
								)}
								{collection.isPublic ? (
									<span className="badge badge-sm badge-success">
										<Eye size={12} />
										Public
									</span>
								) : (
									<span className="badge badge-sm badge-neutral">
										<Lock size={12} />
										Private
									</span>
								)}
								{collection.allowContributions && (
									<span className="badge badge-sm badge-primary">
										<Users size={12} />
										Collaborative
									</span>
								)}
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<button
							className="btn btn-sm btn-square btn-ghost"
							onClick={() => setIsEditing(!isEditing)}
						>
							<Edit size={16} />
						</button>
						<button
							className="btn btn-sm btn-square btn-ghost"
							onClick={handleCreateShare}
						>
							<Share2 size={16} />
						</button>
						<button
							className="btn btn-sm btn-square btn-error"
							onClick={handleDeleteCollection}
						>
							<Trash2 size={16} />
						</button>
					</div>
				</div>

				<div className="px-0">
					<div className="tabs tabs-boxed w-full px-6 mb-6">
						<input
							type="radio"
							name="detail_tabs"
							className="tab"
							aria-label="Assets"
							checked={activeTab === "assets"}
							onChange={() => setActiveTab("assets")}
						/>
						<input
							type="radio"
							name="detail_tabs"
							className="tab"
							aria-label="Information"
							checked={activeTab === "info"}
							onChange={() => setActiveTab("info")}
						/>
						<input
							type="radio"
							name="detail_tabs"
							className="tab"
							aria-label="Activity"
							checked={activeTab === "activity"}
							onChange={() => setActiveTab("activity")}
						/>
					</div>
					
					<div className="tab-content">
						{activeTab === "assets" && (
							<div className="space-y-4">
								{/* Assets Header */}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<div className="form-control">
											<div className="relative">
												<Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
												<input
													className="input input-bordered input-sm w-64 pl-10"
													placeholder="Search assets..."
													value={assetSearchQuery}
													onChange={(e) => setAssetSearchQuery(e.target.value)}
												/>
											</div>
										</div>
										<div className="btn-group">
											<button
												className={`btn btn-sm ${assetViewMode === "grid" ? "btn-active" : ""}`}
												onClick={() => setAssetViewMode("grid")}
											>
												<Grid size={16} />
											</button>
											<button
												className={`btn btn-sm ${assetViewMode === "list" ? "btn-active" : ""}`}
												onClick={() => setAssetViewMode("list")}
											>
												<List size={16} />
											</button>
										</div>
									</div>
									<button
										className="btn btn-primary btn-sm gap-2"
										onClick={handleAddAssets}
									>
										<Plus size={16} />
										Add Assets
									</button>
								</div>

								{/* Assets Count */}
								<div className="text-base-content/50 text-sm">
									{totalAssets} asset{totalAssets === 1 ? "" : "s"} in this
									collection
								</div>

								{/* Assets Grid/List */}
								{assetsLoading ? (
									<div className="flex justify-center py-8">
										<span className="loading loading-spinner loading-lg"></span>
									</div>
								) : assets.length === 0 ? (
									<div className="card bg-base-100 shadow">
										<div className="card-body py-12 text-center">
											<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-base-200">
												<ImageIcon size={24} className="text-base-content/40" />
											</div>
											<h3 className="mb-2 font-semibold text-lg">
												No assets yet
											</h3>
											<p className="mb-4 text-base-content/50 text-sm">
												Add some assets to get started with this collection
											</p>
											<button className="btn btn-primary" onClick={handleAddAssets}>
												Add Assets
											</button>
										</div>
									</div>
								) : (
									<div className="py-8 text-center">
										<p className="text-base-content/50">
											Asset grid component needs props adjustment
										</p>
										<p className="text-base-content/40 text-sm">
											{assets.length} assets in this collection
										</p>
									</div>
								)}
							</div>
						)}

						{activeTab === "info" && (
							<div className="space-y-6">
								{isEditing ? (
									<div className="space-y-4">
										<div className="form-control">
											<label className="label">
												<span className="label-text">Collection Name</span>
											</label>
											<input
												className="input input-bordered"
												value={editForm.name}
												onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
											/>
										</div>
										<div className="form-control">
											<label className="label">
												<span className="label-text">Description</span>
											</label>
											<textarea
												className="textarea textarea-bordered"
												value={editForm.description}
												onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
												rows={3}
											/>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div className="form-control">
												<label className="label">
													<span className="label-text">Color</span>
												</label>
												<input
													className="input input-bordered"
													type="color"
													value={editForm.color}
													onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
												/>
											</div>
											<div className="form-control">
												<label className="label">
													<span className="label-text">Icon (emoji)</span>
												</label>
												<input
													className="input input-bordered"
													value={editForm.icon}
													onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
												/>
											</div>
										</div>
										<div className="space-y-2">
											<div className="form-control">
												<label className="label cursor-pointer">
													<span className="label-text">Public Collection</span>
													<input
														type="checkbox"
														className="toggle toggle-primary"
														checked={editForm.isPublic}
														onChange={(e) => setEditForm({ ...editForm, isPublic: e.target.checked })}
													/>
												</label>
											</div>
											<div className="form-control">
												<label className="label cursor-pointer">
													<span className="label-text">Allow Contributions</span>
													<input
														type="checkbox"
														className="toggle toggle-primary"
														checked={editForm.allowContributions}
														onChange={(e) => setEditForm({ ...editForm, allowContributions: e.target.checked })}
													/>
												</label>
											</div>
										</div>
										<div className="flex gap-2">
											<button className="btn btn-primary" onClick={handleSaveEdit}>
												Save Changes
											</button>
											<button
												className="btn btn-outline"
												onClick={() => setIsEditing(false)}
											>
												Cancel
											</button>
										</div>
									</div>
								) : (
									<div className="space-y-4">
										<div className="card bg-base-100 shadow">
											<div className="card-body space-y-3">
												<div className="flex items-center justify-between">
													<span className="font-medium">Description</span>
												</div>
												<p className="text-base-content/60">
													{collection.description || "No description provided"}
												</p>
											</div>
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div className="card bg-base-100 shadow">
												<div className="card-body space-y-2">
													<div className="flex items-center gap-2">
														<ImageIcon size={16} className="text-base-content/40" />
														<span className="font-medium">Assets</span>
													</div>
													<p className="font-bold text-2xl">
														{collection.assetCount}
													</p>
												</div>
											</div>
											<div className="card bg-base-100 shadow">
												<div className="card-body space-y-2">
													<div className="flex items-center gap-2">
														<HardDrive size={16} className="text-base-content/40" />
														<span className="font-medium">Total Size</span>
													</div>
													<p className="font-bold text-2xl">
														{formatBytes(collection.totalSize)}
													</p>
												</div>
											</div>
										</div>

										<div className="card bg-base-100 shadow">
											<div className="card-body space-y-3">
												<div className="flex items-center gap-2">
													<Users size={16} className="text-base-content/40" />
													<span className="font-medium">Creator</span>
												</div>
												<div className="flex items-center gap-3">
													<div className="avatar">
														<div className="w-12 rounded-full">
															<img 
																src={collection.creator?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(collection.creator?.name || "Unknown")}`}
																alt={collection.creator?.name || "Unknown"}
															/>
														</div>
													</div>
													<div>
														<p className="font-medium">
															{collection.creator?.name || "Unknown"}
														</p>
														<p className="text-base-content/50 text-sm">
															{collection.creator?.email}
														</p>
													</div>
												</div>
											</div>
										</div>

										<div className="card bg-base-100 shadow">
											<div className="card-body space-y-3">
												<div className="flex items-center gap-2">
													<Calendar size={16} className="text-base-content/40" />
													<span className="font-medium">Timeline</span>
												</div>
												<div className="space-y-2 text-sm">
													<div className="flex justify-between">
														<span className="text-base-content/50">Created:</span>
														<span>
															{new Date(collection.createdAt).toLocaleString()}
														</span>
													</div>
													<div className="flex justify-between">
														<span className="text-base-content/50">Updated:</span>
														<span>
															{new Date(collection.updatedAt).toLocaleString()}
														</span>
													</div>
												</div>
											</div>
										</div>
									</div>
								)}
							</div>
						)}

						{activeTab === "activity" && (
							<div className="space-y-4">
								{activityLoading ? (
									<div className="flex justify-center py-8">
										<span className="loading loading-spinner loading-lg"></span>
									</div>
								) : activity.length === 0 ? (
									<div className="card bg-base-100 shadow">
										<div className="card-body py-12 text-center">
											<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-base-200">
												<Activity size={24} className="text-base-content/40" />
											</div>
											<h3 className="mb-2 font-semibold text-lg">
												No activity yet
											</h3>
											<p className="text-base-content/50 text-sm">
												Activity will appear here as users interact with this
												collection
											</p>
										</div>
									</div>
								) : (
									<div className="max-h-96 overflow-y-auto">
										<div className="space-y-3">
											{activity.map((item: any, index: number) => (
												<div key={index} className="card bg-base-100 shadow">
													<div className="card-body py-3">
														<div className="flex items-start gap-3">
															<div className="avatar">
																<div className="w-8 rounded-full">
																	<img 
																		src={item.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user?.name || "System")}`}
																		alt={item.user?.name || "System"}
																	/>
																</div>
															</div>
															<div className="flex-1">
																<div className="flex items-center gap-2">
																	<span className="font-medium">
																		{item.user?.name || "System"}
																	</span>
																	<span className="text-base-content/50 text-sm">
																		{item.action}
																	</span>
																</div>
																{item.details && (
																	<p className="text-base-content/60 text-sm">
																		{JSON.stringify(item.details)}
																	</p>
																)}
																<p className="text-base-content/40 text-xs">
																	{formatDistanceToNow(
																		new Date(item.createdAt),
																	)}{" "}
																	ago
																</p>
															</div>
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</div>

				<div className="flex justify-end gap-2 pt-4">
					<button className="btn btn-outline" onClick={onClose}>
						Close
					</button>
					<button className="btn btn-primary gap-2" onClick={handleDuplicateCollection}>
						<Copy size={16} />
						Duplicate
					</button>
				</div>
			</div>
		</BaseModal>
	);
}