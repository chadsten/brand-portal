"use client";

import {
	Archive,
	Calendar,
	Clock,
	Copy,
	Download,
	Edit,
	ExternalLink,
	Eye,
	FileText,
	FolderPlus,
	HardDrive,
	History,
	Image as ImageIcon,
	Info,
	Music,
	Palette,
	Settings,
	Share,
	Tag,
	Trash2,
	User as UserIcon,
	Video,
} from "lucide-react";
import { useState } from "react";
import { formatBytes, formatDistanceToNow } from "~/lib/utils";
import { api } from "~/trpc/react";
import { BaseModal } from "../ui/BaseModal";
import { ThumbnailImage } from "./ThumbnailImage";
import { clientThumbnailService } from "~/services/clientThumbnailService";

export interface AssetDetailModalProps {
	assetId: string;
	isOpen: boolean;
	onClose: () => void;
	onEdit: () => void;
	onDelete: () => void;
	onAddToCollection?: () => void;
}

export function AssetDetailModal({
	assetId,
	isOpen,
	onClose,
	onEdit,
	onDelete,
	onAddToCollection,
}: AssetDetailModalProps) {
	const [activeTab, setActiveTab] = useState("details");
	const [isEditing, setIsEditing] = useState(false);
	const [editedTitle, setEditedTitle] = useState("");
	const [editedDescription, setEditedDescription] = useState("");
	const [editedTags, setEditedTags] = useState<string[]>([]);
	const [newTag, setNewTag] = useState("");
	
	// Thumbnail generation state
	const [thumbnailGenerating, setThumbnailGenerating] = useState(false);
	const [thumbnailProgress, setThumbnailProgress] = useState(0);
	const [thumbnailMessage, setThumbnailMessage] = useState("");

	// API queries
	const {
		data: asset,
		isLoading,
		refetch,
	} = api.asset.getById.useQuery({
		id: assetId,
	});

	const { data: metadata } = api.metadata.getAssetMetadata.useQuery({
		assetId,
	});

	const { data: versions } = api.asset.getVersions.useQuery({
		assetId,
	});

	const { data: assetCollections } = api.assetApi.getAssetCollections.useQuery({
		assetId,
	});

	// TODO: Implement activity endpoint
	const activity: any[] = [];

	// Mutations
	const updateAssetMutation = api.asset.update.useMutation({
		onSuccess: () => {
			refetch();
			setIsEditing(false);
		},
	});

	if (isLoading || !asset) {
		return (
			<BaseModal
				isOpen={isOpen}
				onClose={onClose}
				title="Loading..."
				size="xl"
			>
				<div className="flex justify-center py-8">
					<progress className="progress w-48"></progress>
				</div>
			</BaseModal>
		);
	}

	const getFileTypeIcon = (mimeType: string) => {
		if (mimeType.startsWith("image/")) return ImageIcon;
		if (mimeType.startsWith("video/")) return Video;
		if (mimeType.startsWith("audio/")) return Music;
		if (mimeType.includes("pdf") || mimeType.includes("document"))
			return FileText;
		if (mimeType.includes("zip") || mimeType.includes("archive"))
			return Archive;
		return FileText;
	};

	const handleSave = () => {
		updateAssetMutation.mutate({
			id: assetId,
			title: editedTitle,
			description: editedDescription,
			tags: editedTags,
		});
	};

	const handleStartEdit = () => {
		setEditedTitle(asset.title);
		setEditedDescription(asset.description || "");
		setEditedTags(Array.isArray(asset.tags) ? asset.tags as string[] : []);
		setIsEditing(true);
	};

	const handleCancelEdit = () => {
		setIsEditing(false);
		setEditedTitle("");
		setEditedDescription("");
		setEditedTags([]);
		setNewTag("");
	};

	const handleAddTag = () => {
		const trimmedTag = newTag.trim();
		if (trimmedTag && !editedTags.includes(trimmedTag)) {
			setEditedTags([...editedTags, trimmedTag]);
			setNewTag("");
		}
	};

	const handleRemoveTag = (tagToRemove: string) => {
		setEditedTags(editedTags.filter(tag => tag !== tagToRemove));
	};

	const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleAddTag();
		}
	};

	const handleGenerateThumbnail = async () => {
		if (!asset) return;
		
		setThumbnailGenerating(true);
		setThumbnailProgress(0);
		setThumbnailMessage("Starting thumbnail generation...");
		
		try {
			// Download the original file
			setThumbnailProgress(10);
			setThumbnailMessage("Downloading original file...");
			
			const response = await fetch(`/api/assets/${asset.id}/download?original=true`);
			if (!response.ok) {
				throw new Error(`Failed to download file: ${response.statusText}`);
			}
			
			const fileBlob = await response.blob();
			setThumbnailProgress(30);
			
			// Generate thumbnail using client service
			const result = await clientThumbnailService.generateThumbnail(
				asset.id,
				fileBlob,
				asset.fileName,
				asset.mimeType,
				{
					organizationId: asset.organizationId,
					width: 800,
					height: 600,
					quality: 0.85,
					onProgress: (progress, message) => {
						setThumbnailProgress(progress);
						if (message) setThumbnailMessage(message);
					}
				}
			);
			
			if (result.success) {
				// Refresh asset data to show new thumbnail
				await refetch();
				setThumbnailMessage("Thumbnail generated successfully!");
				
				// Show success for a moment, then reset
				setTimeout(() => {
					setThumbnailGenerating(false);
					setThumbnailProgress(0);
					setThumbnailMessage("");
				}, 2000);
			} else {
				throw new Error(result.error || "Thumbnail generation failed");
			}
		} catch (error) {
			console.error('Thumbnail generation failed:', error);
			setThumbnailMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
			
			// Show error for a moment, then reset
			setTimeout(() => {
				setThumbnailGenerating(false);
				setThumbnailProgress(0);
				setThumbnailMessage("");
			}, 3000);
		}
	};

	const canGenerateThumbnail = () => {
		if (!asset) return false;
		return clientThumbnailService.isFileTypeSupported(asset.mimeType);
	};

	const renderPreview = () => {
		return (
			<div className="mx-auto w-full max-w-md">
				<ThumbnailImage
					assetId={asset.id}
					assetTitle={asset.title}
					mimeType={asset.mimeType}
					thumbnailKey={asset.thumbnailKey}
					className="w-full rounded-lg object-contain max-h-96"
					getFileTypeIcon={getFileTypeIcon}
				/>
			</div>
		);
	};

	const renderBasicInfo = () => (
		<div className="card bg-base-100 shadow">
			<div className="card-header p-4 border-b border-base-300">
				<h3 className="font-semibold text-lg">{asset.title}</h3>
			</div>
			<div className="card-body space-y-4">
				{isEditing ? (
					<>
						<div>
							<label className="label">
								<span className="label-text">Title</span>
							</label>
							<input
								type="text"
								className="input input-bordered w-full"
								value={editedTitle}
								onChange={(e) => setEditedTitle(e.target.value)}
								placeholder="Enter asset title"
							/>
						</div>
						<div>
							<label className="label">
								<span className="label-text">Description</span>
							</label>
							<textarea
								className="textarea textarea-bordered w-full"
								value={editedDescription}
								onChange={(e) => setEditedDescription(e.target.value)}
								placeholder="Enter asset description"
								rows={3}
							></textarea>
						</div>
						<div className="flex gap-2">
							<button
								className={`btn btn-primary ${
									updateAssetMutation.isPending ? 'loading' : ''
								}`}
								onClick={handleSave}
								disabled={updateAssetMutation.isPending}
							>
								Save
							</button>
							<button className="btn btn-ghost" onClick={handleCancelEdit}>
								Cancel
							</button>
						</div>
					</>
				) : (
					<>
						{asset.description && (
							<div>
								<label className="font-medium text-base-content/60 text-sm">
									Description
								</label>
								<p className="text-base-content">{asset.description}</p>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);

	const renderFileInfo = () => (
		<div className="card bg-base-100 shadow">
			<div className="card-header p-4 border-b border-base-300">
				<h3 className="font-semibold text-lg">File Details</h3>
			</div>
			<div className="card-body space-y-3">
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="font-medium text-base-content/60 text-sm">Type</label>
						<div className="flex items-center gap-2">
							<span className="badge badge-sm badge-outline">
								{asset.fileType.toUpperCase()}
							</span>
							<span className="text-base-content/60 text-sm">{asset.mimeType}</span>
						</div>
					</div>
					<div>
						<label className="font-medium text-base-content/60 text-sm">Size</label>
						<p className="text-base-content">{formatBytes(asset.fileSize)}</p>
					</div>
					<div>
						<label className="font-medium text-base-content/60 text-sm">
							Status
						</label>
						<span
							className={`badge badge-sm ${
								asset.processingStatus === "completed" ? "badge-success" : "badge-warning"
							}`}
						>
							{asset.processingStatus}
						</span>
					</div>
				</div>

				{/* Extended metadata */}
				{metadata && (
					<>
						<div className="divider"></div>
						<div className="space-y-3">
							<h4 className="font-medium">Technical Details</h4>
							<div className="grid grid-cols-2 gap-4 text-sm">
								{(metadata as any)?.metadata?.width &&
									(metadata as any)?.metadata?.height && (
										<div>
											<label className="text-base-content/60">Dimensions</label>
											<p>
												{(metadata as any).metadata.width} ×{" "}
												{(metadata as any).metadata.height}
											</p>
										</div>
									)}
								{(metadata as any)?.metadata?.duration && (
									<div>
										<label className="text-base-content/60">Duration</label>
										<p>
											{Math.round((metadata as any).metadata.duration)} seconds
										</p>
									</div>
								)}
								{(metadata as any)?.metadata?.codec && (
									<div>
										<label className="text-base-content/60">Codec</label>
										<p>{(metadata as any).metadata.codec}</p>
									</div>
								)}
								{(metadata as any)?.metadata?.bitrate && (
									<div>
										<label className="text-base-content/60">Bitrate</label>
										<p>{(metadata as any).metadata.bitrate} kbps</p>
									</div>
								)}
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);

	const renderCompactFileDetails = () => (
		<div className="card bg-base-100 shadow">
			<div className="card-body space-y-3 p-4">
				<h4 className="font-semibold">File Details</h4>
				<div className="space-y-2 text-sm">
					<div>
						<label className="font-medium text-base-content/60 text-xs">File Name</label>
						<p className="font-mono text-base-content text-sm">{asset.fileName}</p>
					</div>
					<div className="flex justify-between">
						<span className="text-base-content/60">Type:</span>
						<span className="badge badge-sm badge-outline">
							{asset.mimeType}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-base-content/60">Size:</span>
						<span>{formatBytes(asset.fileSize)}</span>
					</div>
				</div>
			</div>
		</div>
	);

	const renderUploadInfo = () => (
		<div className="card bg-base-100 shadow">
			<div className="card-header p-4 border-b border-base-300">
				<h3 className="font-semibold text-lg">Upload Information</h3>
			</div>
			<div className="card-body space-y-3">
				<div className="flex items-center gap-3">
					<div className="avatar">
						<div className="w-12 rounded-full">
							{asset.uploader.image ? (
								<img src={asset.uploader.image} alt={asset.uploader.name} />
							) : (
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-base-300">
									<span className="text-base-content text-lg font-medium">
										{asset.uploader.name?.charAt(0)?.toUpperCase() || 'U'}
									</span>
								</div>
							)}
						</div>
					</div>
					<div>
						<p className="font-medium">{asset.uploader.name}</p>
						<p className="text-base-content/60 text-sm">Uploader</p>
					</div>
				</div>
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div>
						<label className="text-base-content/60">Uploaded</label>
						<p>
							{asset.createdAt
								? new Date(asset.createdAt).toLocaleString()
								: "Unknown"}
						</p>
						<p className="text-base-content/60">
							{asset.createdAt
								? formatDistanceToNow(new Date(asset.createdAt), {
										addSuffix: true,
									})
								: ""}
						</p>
					</div>
					<div>
						<label className="text-base-content/60">Last Modified</label>
						<p>
							{asset.updatedAt
								? new Date(asset.updatedAt).toLocaleString()
								: "Unknown"}
						</p>
						<p className="text-base-content/60">
							{asset.updatedAt
								? formatDistanceToNow(new Date(asset.updatedAt), {
										addSuffix: true,
									})
								: ""}
						</p>
					</div>
				</div>
			</div>
		</div>
	);

	const renderTags = () => (
		<div className="card bg-base-100 shadow">
			<div className="card-header p-4 border-b border-base-300">
				<h3 className="font-semibold text-lg">Tags</h3>
			</div>
			<div className="card-body">
				{isEditing ? (
					<div className="space-y-3">
						{/* Existing tags */}
						{editedTags.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{editedTags.map((tag) => (
									<span
										key={tag}
										className="badge badge-sm badge-outline gap-2"
									>
										<Tag size={12} />
										{tag}
										<button
											type="button"
											className="ml-1 hover:text-error"
											onClick={() => handleRemoveTag(tag)}
											aria-label={`Remove ${tag} tag`}
										>
											×
										</button>
									</span>
								))}
							</div>
						)}
						{/* Add new tag input */}
						<div className="flex gap-2">
							<input
								type="text"
								className="input input-bordered input-sm flex-1"
								value={newTag}
								onChange={(e) => setNewTag(e.target.value)}
								onKeyDown={handleTagKeyDown}
								placeholder="Add a tag and press Enter"
							/>
							<button
								type="button"
								className="btn btn-sm btn-outline"
								onClick={handleAddTag}
								disabled={!newTag.trim()}
							>
								Add
							</button>
						</div>
					</div>
				) : (
					<>
						{asset.tags && Array.isArray(asset.tags) && asset.tags.length > 0 ? (
							<div className="flex flex-wrap gap-2">
								{(asset.tags as string[]).map((tag) => (
									<span
										key={tag}
										className="badge badge-sm badge-outline gap-2"
									>
										<Tag size={12} />
										{tag}
									</span>
								))}
							</div>
						) : (
							<p className="text-base-content/60">No tags assigned</p>
						)}
					</>
				)}
			</div>
		</div>
	);

	const renderCollections = () => (
		<div className="card bg-base-100 shadow">
			<div className="card-header p-4 border-b border-base-300">
				<h3 className="font-semibold text-lg">Collections</h3>
			</div>
			<div className="card-body">
				{assetCollections?.collections && assetCollections.collections.length > 0 ? (
					<div className="space-y-2">
						{assetCollections.collections.map((collection) => (
							<div
								key={collection.id}
								className="flex items-center gap-3 p-2 rounded-lg border border-base-300 hover:border-primary transition-colors"
							>
								<div
									className="flex h-8 w-8 items-center justify-center rounded text-sm flex-shrink-0"
									style={{
										background: `linear-gradient(135deg, ${collection.color || "#6366f1"}20, ${collection.color || "#6366f1"}40)`,
									}}
								>
									<span>{collection.icon || "📁"}</span>
								</div>
								<div className="flex-1 min-w-0">
									<h4 className="font-medium truncate">{collection.name}</h4>
									{collection.description && (
										<p className="text-base-content/60 text-sm truncate">
											{collection.description}
										</p>
									)}
								</div>
								<div className="flex items-center gap-2">
									{collection.isPublic && (
										<span className="badge badge-xs badge-success">Public</span>
									)}
									<span className="text-base-content/40 text-xs">
										{new Date(collection.createdAt).toLocaleDateString()}
									</span>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-4">
						<FolderPlus size={32} className="mx-auto mb-2 text-base-content/40" />
						<p className="text-base-content/60">Not in any collections</p>
						{onAddToCollection && (
							<button
								className="btn btn-sm btn-primary mt-2 gap-2"
								onClick={onAddToCollection}
							>
								<FolderPlus size={16} />
								Add to Collection
							</button>
						)}
					</div>
				)}
			</div>
		</div>
	);

	const renderVersions = () => (
		<div className="card bg-base-100 shadow">
			<div className="card-header p-4 border-b border-base-300">
				<h3 className="font-semibold text-lg">Version History</h3>
			</div>
			<div className="card-body">
				{versions && versions.length > 0 ? (
					<div className="space-y-3">
						{versions.map((version: any) => (
							<div
								key={version.id}
								className="flex items-center justify-between rounded-lg border p-3"
							>
								<div>
									<p className="font-medium">Version {version.versionNumber}</p>
									<p className="text-base-content/60 text-sm">
										{formatBytes(version.fileSize)} •{" "}
										{new Date(version.createdAt).toLocaleString()}
									</p>
									{version.changeLog && (
										<p className="mt-1 text-sm">{version.changeLog}</p>
									)}
								</div>
								<button className="btn btn-sm btn-ghost">
									<Download size={16} />
								</button>
							</div>
						))}
					</div>
				) : (
					<p className="text-base-content/60">No version history available</p>
				)}
			</div>
		</div>
	);

	const renderActivity = () => (
		<div className="card bg-base-100 shadow">
			<div className="card-header p-4 border-b border-base-300">
				<h3 className="font-semibold text-lg">Recent Activity</h3>
			</div>
			<div className="card-body">
				{activity && activity.length > 0 ? (
					<div className="space-y-3">
						{activity.map((item: any, index: number) => (
							<div key={index} className="flex items-start gap-3">
								<div className="avatar">
									<div className="w-8 rounded-full">
										{item.user?.image ? (
											<img src={item.user.image} alt={item.user.name} />
										) : (
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-base-300">
												<span className="text-base-content text-sm font-medium">
													{item.user?.name?.charAt(0)?.toUpperCase() || 'U'}
												</span>
											</div>
										)}
									</div>
								</div>
								<div className="flex-1">
									<p className="text-sm">
										<span className="font-medium">{item.user?.name}</span>{" "}
										{item.action}
									</p>
									<p className="text-base-content/60 text-xs">
										{formatDistanceToNow(new Date(item.createdAt), {
											addSuffix: true,
										})}
									</p>
								</div>
							</div>
						))}
					</div>
				) : (
					<p className="text-base-content/60">No activity recorded</p>
				)}
			</div>
		</div>
	);

	return (
		<BaseModal
			isOpen={isOpen}
			onClose={onClose}
			title={asset.title}
			size="xl"
			contentClassName="overflow-y-auto"
		>
			<div className="space-y-4">

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					{/* Preview */}
					<div className="lg:col-span-1">
						{renderPreview()}
						
						{/* File Details */}
						<div className="mt-4">
							{renderCompactFileDetails()}
						</div>
						
						{/* Asset Controls */}
						<div className="mt-4 space-y-3">
							<div className="grid grid-cols-2 gap-2">
								<div className="tooltip" data-tip="Download">
									<button 
										className="btn btn-sm btn-outline w-full gap-2"
										onClick={() => window.open(`/api/assets/${asset.id}/download?original=true`, "_blank")}
									>
										<Download size={16} />
										Download
									</button>
								</div>
								<div className="tooltip" data-tip="Share">
									<button className="btn btn-sm btn-outline w-full gap-2">
										<Share size={16} />
										Share
									</button>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<div className="tooltip" data-tip="Edit">
									<button
										className="btn btn-sm btn-outline w-full gap-2"
										onClick={handleStartEdit}
									>
										<Edit size={16} />
										Edit
									</button>
								</div>
								<div className="tooltip" data-tip="Delete">
									<button
										className="btn btn-sm btn-outline btn-error w-full gap-2"
										onClick={onDelete}
									>
										<Trash2 size={16} />
										Delete
									</button>
								</div>
							</div>
							{onAddToCollection && (
								<button
									className="btn btn-sm btn-primary w-full gap-2"
									onClick={onAddToCollection}
								>
									<FolderPlus size={16} />
									Add to Collection
								</button>
							)}
							
							{/* Thumbnail Generation */}
							{canGenerateThumbnail() && (
								<div className="w-full">
									<button
										className={`btn btn-sm btn-outline w-full gap-2 ${
											thumbnailGenerating ? 'loading' : ''
										}`}
										onClick={handleGenerateThumbnail}
										disabled={thumbnailGenerating}
									>
										{thumbnailGenerating ? (
											<>
												<div className="loading loading-spinner loading-xs"></div>
												Generating...
											</>
										) : (
											<>
												<ImageIcon size={16} />
												Generate Thumbnail
											</>
										)}
									</button>
									
									{/* Progress indicator */}
									{thumbnailGenerating && (
										<div className="mt-2 space-y-1">
											<div className="flex justify-between text-xs">
												<span>{thumbnailMessage}</span>
												<span>{thumbnailProgress}%</span>
											</div>
											<progress 
												className="progress progress-primary w-full" 
												value={thumbnailProgress} 
												max="100"
											></progress>
										</div>
									)}
								</div>
							)}
						</div>
					</div>

					{/* Content */}
					<div className="lg:col-span-2">
						<div role="tablist" className="tabs tabs-lifted w-full">
							<input
								type="radio"
								name="asset_detail_tabs"
								role="tab"
								className="tab"
								aria-label="Details"
								checked={activeTab === "details"}
								onChange={() => setActiveTab("details")}
							/>
							<div role="tabpanel" className="tab-content space-y-4 p-6">
								<div className="space-y-4">
									{renderBasicInfo()}
									{renderTags()}
									{renderCollections()}
								</div>
							</div>

							<input
								type="radio"
								name="asset_detail_tabs"
								role="tab"
								className="tab"
								aria-label="Versions"
								checked={activeTab === "versions"}
								onChange={() => setActiveTab("versions")}
							/>
							<div role="tabpanel" className="tab-content space-y-4 p-6">
								{renderUploadInfo()}
								{renderVersions()}
							</div>

							<input
								type="radio"
								name="asset_detail_tabs"
								role="tab"
								className="tab"
								aria-label="Activity"
								checked={activeTab === "activity"}
								onChange={() => setActiveTab("activity")}
							/>
							<div role="tabpanel" className="tab-content p-6">
								{renderActivity()}
							</div>
						</div>
					</div>
				</div>
			</div>
		</BaseModal>
	);
}
