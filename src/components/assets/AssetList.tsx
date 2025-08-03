"use client";

// Import removed - using native HTML and DaisyUI classes
import type { LucideIcon } from "lucide-react";
import {
	ChevronDown,
	ChevronUp,
	Download,
	Edit,
	Eye,
	MoreVertical,
	Share,
	Trash2,
} from "lucide-react";
import { formatBytes, formatDistanceToNow } from "~/lib/utils";
import type { Asset } from "./AssetGrid";
import { ThumbnailImage } from "./ThumbnailImage";

export interface AssetListProps {
	assets: Asset[];
	selectedAssets: Set<string>;
	onAssetClick: (assetId: string) => void;
	onAssetSelect?: (assetId: string, selected: boolean) => void;
	onSort: (field: string) => void;
	sortField: string;
	sortOrder: "asc" | "desc";
	getFileTypeIcon: (mimeType: string) => LucideIcon;
}

export function AssetList({
	assets,
	selectedAssets,
	onAssetClick,
	onAssetSelect,
	onSort,
	sortField,
	sortOrder,
	getFileTypeIcon,
}: AssetListProps) {
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

	const renderSortHeader = (label: string, field: string) => (
		<div
			className="flex cursor-pointer items-center gap-1 hover:text-primary"
			onClick={() => onSort(field)}
		>
			<span>{label}</span>
			{sortField === field &&
				(sortOrder === "asc" ? (
					<ChevronUp size={14} />
				) : (
					<ChevronDown size={14} />
				))}
		</div>
	);

	const renderAssetPreview = (asset: Asset) => {
		return (
			<ThumbnailImage
				assetId={asset.id}
				assetTitle={asset.title}
				mimeType={asset.mimeType}
				thumbnailKey={asset.thumbnailKey}
				className="h-12 w-12 rounded-lg object-cover"
				getFileTypeIcon={getFileTypeIcon}
			/>
		);
	};

	const renderAssetActions = (asset: Asset) => (
		<div className="dropdown dropdown-end">
			<label tabIndex={0} className="btn btn-sm btn-ghost btn-square">
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
					<a>
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
	);

	const columns = [
		{ key: "select", label: "" },
		{ key: "preview", label: "" },
		{ key: "name", label: "Name", sortable: true },
		{ key: "type", label: "Type", sortable: true },
		{ key: "size", label: "Size", sortable: true },
		{ key: "uploader", label: "Uploaded By" },
		{ key: "created", label: "Created", sortable: true },
		{ key: "status", label: "Status" },
		{ key: "actions", label: "" },
	];

	return (
		<div className="w-full">
			<div className="overflow-x-auto">
				<table className="table table-zebra w-full border border-base-300">
					<thead className="bg-base-200">
						<tr>
							{columns.map((column) => (
								<th
									key={column.key}
									className={
										column.key === "select" ||
										column.key === "preview" ||
										column.key === "actions"
											? "w-fit"
											: undefined
									}
								>
									{column.sortable
										? renderSortHeader(column.label, column.key)
										: column.label}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
					{assets.map((asset) => (
						<tr
							key={asset.id}
							className={`cursor-pointer hover:bg-base-200 ${
								selectedAssets.has(asset.id) ? "bg-primary/10" : ""
							}`}
							onClick={() => onAssetClick(asset.id)}
						>
							<td>
								{onAssetSelect && (
									<input
										type="checkbox"
										className="checkbox checkbox-primary"
										checked={selectedAssets.has(asset.id)}
										onChange={(e) =>
											onAssetSelect(asset.id, e.target.checked)
										}
										onClick={(e) => e.stopPropagation()}
									/>
								)}
							</td>

							<td>{renderAssetPreview(asset)}</td>

							<td>
								<div className="flex flex-col">
									<span className="font-medium text-sm">{asset.title}</span>
									<span className="text-base-content/70 text-xs">
										{asset.fileName}
									</span>
								</div>
							</td>

							<td>
								<div className="flex items-center gap-2">
									<span className="badge badge-outline badge-sm">
										{asset.fileType.toUpperCase()}
									</span>
								</div>
							</td>

							<td>
								<span className="text-sm">{formatBytes(asset.fileSize)}</span>
							</td>

							<td>
								<div className="flex items-center gap-2">
									<div className="avatar">
										<div className="w-8 h-8 rounded-full">
											<img 
												src={asset.uploader.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(asset.uploader.name)}&background=random`} 
												alt={asset.uploader.name}
											/>
										</div>
									</div>
									<span className="text-sm">{asset.uploader.name}</span>
								</div>
							</td>

							<td>
								<div className="flex flex-col">
									<span className="text-sm">
										{new Date(asset.createdAt).toLocaleDateString()}
									</span>
									<span className="text-base-content/70 text-xs">
										{formatDistanceToNow(new Date(asset.createdAt), {
											addSuffix: true,
										})}
									</span>
								</div>
							</td>

							<td>
								<div className="flex flex-col gap-1">
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
									{asset.processingStatus === "processing" && (
										<progress 
											className="progress progress-warning progress-sm w-16" 
											value={75} 
											max={100}
										></progress>
									)}
								</div>
							</td>

							<td>
								<div onClick={(e) => e.stopPropagation()}>
									{renderAssetActions(asset)}
								</div>
							</td>
						</tr>
					))}
					</tbody>
				</table>
			</div>

			{/* Tags Row - shown when asset has tags */}
			{assets.some((asset) => asset.tags.length > 0) && (
				<div className="mt-4 space-y-2">
					{assets
						.filter((asset) => asset.tags.length > 0)
						.map((asset) => (
							<div
								key={`${asset.id}-tags`}
								className="flex items-center gap-2 text-sm"
							>
								<span className="min-w-0 truncate font-medium">
									{asset.title}:
								</span>
								<div className="flex flex-wrap gap-1">
									{asset.tags.map((tag) => (
										<span
											key={tag}
											className="badge badge-outline badge-sm text-xs"
										>
											{tag}
										</span>
									))}
								</div>
							</div>
						))}
				</div>
			)}
		</div>
	);
}
