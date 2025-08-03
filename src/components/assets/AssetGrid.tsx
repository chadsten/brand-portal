"use client";

// Import removed - using native HTML and DaisyUI classes
import { useDropdown } from "~/hooks/useDropdown";
import type { LucideIcon } from "lucide-react";
import {
	Clock,
	Download,
	Edit,
	Eye,
	HardDrive,
	MoreVertical,
	Share,
	Trash2,
	User,
} from "lucide-react";
import { useState } from "react";
import { formatBytes, formatDistanceToNow } from "~/lib/utils";
import { ThumbnailImage } from "./ThumbnailImage";

export interface Asset {
	id: string;
	fileName: string;
	originalFileName: string;
	title: string;
	description?: string;
	fileType: string;
	mimeType: string;
	fileSize: number;
	storageKey: string;
	thumbnailKey?: string;
	tags: string[];
	metadata: Record<string, any>;
	processingStatus: string;
	createdAt: Date;
	updatedAt: Date;
	uploader: {
		id: string;
		name: string;
		image?: string;
	};
}

export interface AssetGridProps {
	assets: Asset[];
	selectedAssets: Set<string>;
	onAssetClick: (assetId: string) => void;
	onAssetSelect?: (assetId: string, selected: boolean) => void;
	getFileTypeIcon: (mimeType: string) => LucideIcon;
}

export function AssetGrid({
	assets,
	selectedAssets,
	onAssetClick,
	onAssetSelect,
	getFileTypeIcon,
}: AssetGridProps) {
	const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);

	const getProcessingStatusColor = (status: string) => {
		switch (status) {
			case "completed":
				return "success";
			case "processing":
				return "warning";
			case "failed":
				return "danger";
			default:
				return "default";
		}
	};

	const renderAssetPreview = (asset: Asset) => {
		return (
			<ThumbnailImage
				assetId={asset.id}
				assetTitle={asset.title}
				mimeType={asset.mimeType}
				thumbnailKey={asset.thumbnailKey}
				className="h-48 w-full object-cover"
				getFileTypeIcon={getFileTypeIcon}
			/>
		);
	};

	const renderAssetActions = (asset: Asset) => (
		<div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
			<div className="flex items-center gap-1">
				{onAssetSelect && (
					<input
						type="checkbox"
						className="checkbox checkbox-primary bg-base-100/80 backdrop-blur-sm rounded"
						checked={selectedAssets.has(asset.id)}
						onChange={(e) => onAssetSelect(asset.id, e.target.checked)}
					/>
				)}
				<div className="dropdown dropdown-end">
					<label tabIndex={0} className="btn btn-sm btn-square btn-outline bg-base-100/80 backdrop-blur-sm">
						<MoreVertical size={16} />
					</label>
					<ul className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
						<li>
							<a onClick={() => onAssetClick(asset.id)}>
								<Eye size={16} />
								View Details
							</a>
						</li>
						<li>
							<a 
								href={`/api/assets/${asset.id}/download`}
								download={asset.originalFileName}
								onClick={(e) => e.stopPropagation()}
							>
								<Download size={16} />
								Download
							</a>
						</li>
						<li>
							<a>
								<Share size={16} />
								Share
							</a>
						</li>
						<li>
							<a>
								<Edit size={16} />
								Edit
							</a>
						</li>
						<li>
							<a className="text-error">
								<Trash2 size={16} />
								Delete
							</a>
						</li>
					</ul>
				</div>
			</div>
		</div>
	);

	const renderAssetInfo = (asset: Asset) => (
		<div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
			<div className="space-y-1 text-sm text-white">
				<div className="flex items-center gap-2">
					<User size={12} />
					<span className="truncate">{asset.uploader.name}</span>
				</div>
				<div className="flex items-center gap-2">
					<Clock size={12} />
					<span>
						{formatDistanceToNow(new Date(asset.createdAt), {
							addSuffix: true,
						})}
					</span>
				</div>
				<div className="flex items-center gap-2">
					<HardDrive size={12} />
					<span>{formatBytes(asset.fileSize)}</span>
				</div>
			</div>
		</div>
	);

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
			{assets.map((asset) => (
				<div
					key={asset.id}
					className={`card bg-base-100 shadow group cursor-pointer transition-all duration-200 hover:scale-105 ${
						selectedAssets.has(asset.id) ? "ring-2 ring-primary" : ""
					}`}
					onClick={() => onAssetClick(asset.id)}
					onMouseEnter={() => setHoveredAsset(asset.id)}
					onMouseLeave={() => setHoveredAsset(null)}
				>
					<div className="relative overflow-hidden p-0">
						{renderAssetPreview(asset)}
						{renderAssetActions(asset)}
						{renderAssetInfo(asset)}

						{/* Processing Status */}
						{asset.processingStatus !== "completed" && (
							<div className="absolute top-2 left-2">
								<span
									className={`badge badge-sm ${
										getProcessingStatusColor(asset.processingStatus) === "success"
											? "badge-success"
											: getProcessingStatusColor(asset.processingStatus) === "warning"
												? "badge-warning"
												: getProcessingStatusColor(asset.processingStatus) === "danger"
													? "badge-error"
													: "badge-outline"
									}`}
								>
									{asset.processingStatus}
								</span>
							</div>
						)}

						{/* Processing Progress for processing status */}
						{asset.processingStatus === "processing" && (
							<div className="absolute right-0 bottom-0 left-0">
								<progress 
									className="progress progress-warning progress-sm opacity-80 w-full" 
									value={75} 
									max={100}
								></progress>
							</div>
						)}
					</div>

					<div className="card-body flex-col items-start p-3 pt-2">
						<div className="w-full">
							<h4
								className="w-full truncate font-medium text-sm"
								title={asset.title}
							>
								{asset.title}
							</h4>
							<p
								className="w-full truncate text-base-content/70 text-xs"
								title={asset.fileName}
							>
								{asset.fileName}
							</p>
						</div>

						{/* Tags */}
						{asset.tags.length > 0 && (
							<div className="mt-2 flex w-full flex-wrap gap-1">
								{asset.tags.slice(0, 2).map((tag) => (
									<span key={tag} className="badge badge-outline badge-sm text-xs">
										{tag}
									</span>
								))}
								{asset.tags.length > 2 && (
									<span className="badge badge-outline badge-sm text-xs">
										+{asset.tags.length - 2}
									</span>
								)}
							</div>
						)}

						{/* File Info */}
						<div className="mt-2 flex w-full items-center justify-between text-base-content/70 text-xs">
							<span className="truncate">{asset.fileType.toUpperCase()}</span>
							<span>{formatBytes(asset.fileSize)}</span>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
