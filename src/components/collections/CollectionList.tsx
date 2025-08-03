"use client";

// Import removed - using native HTML and DaisyUI classes
import { formatDistanceToNow } from "date-fns";
import {
	Calendar,
	Crown,
	ExternalLink,
	Eye,
	EyeOff,
	HardDrive,
	Image as ImageIcon,
	Lock,
	MoreHorizontal,
	Tag,
	Users,
} from "lucide-react";
import { formatBytes } from "~/lib/utils";

interface Collection {
	id: string;
	name: string;
	description?: string;
	slug: string;
	coverAssetId?: string;
	color?: string;
	icon?: string;
	isPublic: boolean;
	isTemplate: boolean;
	allowContributions: boolean;
	assetCount: number;
	totalSize: number;
	tags: string[];
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
	creator?: {
		id: string;
		name: string;
		email: string;
		image?: string;
	};
	coverAsset?: {
		id: string;
		fileName: string;
		thumbnailKey?: string;
		fileType: string;
	};
	_count?: {
		collectionAssets: number;
		permissions: number;
		shares: number;
	};
}

interface CollectionListProps {
	collections: Collection[];
	onCollectionSelect: (collectionId: string) => void;
	selectedCollections?: Set<string>;
	onCollectionToggle?: (collectionId: string) => void;
	showSelection?: boolean;
}

const columns = [
	{ key: "selection", label: "", width: 50 },
	{ key: "name", label: "Name" },
	{ key: "creator", label: "Creator" },
	{ key: "assets", label: "Assets" },
	{ key: "size", label: "Size" },
	{ key: "type", label: "Type" },
	{ key: "updated", label: "Updated" },
	{ key: "actions", label: "", width: 80 },
];

export function CollectionList({
	collections,
	onCollectionSelect,
	selectedCollections,
	onCollectionToggle,
	showSelection = false,
}: CollectionListProps) {
	const renderCell = (collection: Collection, columnKey: string) => {
		switch (columnKey) {
			case "selection":
				return showSelection ? (
					<input
						type="checkbox"
						className="checkbox"
						checked={selectedCollections?.has(collection.id)}
						onChange={() => onCollectionToggle?.(collection.id)}
					/>
				) : null;

			case "name":
				return (
					<div className="flex items-center gap-3">
						<div
							className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
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
						<div className="flex flex-col">
							<span className="font-medium">{collection.name}</span>
							{collection.description && (
								<span className="line-clamp-1 text-base-content/50 text-sm">
									{collection.description}
								</span>
							)}
						</div>
					</div>
				);

			case "creator":
				return (
					<div className="flex items-center gap-2">
						<div className="avatar">
							<div className="w-7 h-7 rounded-full">
								{collection.creator?.image ? (
									<img src={collection.creator.image} alt={collection.creator.name || "Unknown"} />
								) : (
									<div className="bg-base-300 flex items-center justify-center h-full w-full rounded-full">
										<span className="text-xs font-medium">
											{(collection.creator?.name || "U").charAt(0).toUpperCase()}
										</span>
									</div>
								)}
							</div>
						</div>
						<div className="flex flex-col">
							<span className="text-sm">
								{collection.creator?.name || "Unknown"}
							</span>
							<span className="text-base-content/40 text-xs">
								{collection.creator?.email}
							</span>
						</div>
					</div>
				);

			case "assets":
				return (
					<div className="flex items-center gap-1">
						<ImageIcon size={14} className="text-base-content/40" />
						<span className="text-sm">{collection.assetCount}</span>
					</div>
				);

			case "size":
				return (
					<div className="flex items-center gap-1">
						<HardDrive size={14} className="text-base-content/40" />
						<span className="text-sm">
							{formatBytes(collection.totalSize)}
						</span>
					</div>
				);

			case "type":
				return (
					<div className="flex flex-wrap gap-1">
						{collection.isTemplate && (
							<span className="badge badge-sm badge-secondary" title="Template collection">
								<Crown size={10} />
							</span>
						)}
						{collection.isPublic ? (
							<span className="badge badge-sm badge-success" title="Public collection">
								<Eye size={10} />
							</span>
						) : (
							<span className="badge badge-sm badge-neutral" title="Private collection">
								<Lock size={10} />
							</span>
						)}
						{collection.allowContributions && (
							<span className="badge badge-sm badge-primary" title="Allows contributions">
								<Users size={10} />
							</span>
						)}
					</div>
				);

			case "updated":
				return (
					<div 
						className="flex items-center gap-1 text-base-content/50 text-sm"
						title={new Date(collection.updatedAt).toLocaleString()}
					>
						<Calendar size={12} />
						<span>
							{formatDistanceToNow(new Date(collection.updatedAt))} ago
						</span>
					</div>
				);

			case "actions":
				return (
					<div className="flex items-center gap-1">
						<button
							className="btn btn-sm btn-ghost btn-square"
							title="View collection"
							onClick={() => onCollectionSelect(collection.id)}
						>
							<ExternalLink size={14} />
						</button>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<div className="overflow-x-auto border border-base-300 rounded-lg shadow-none">
			<table className="table w-full">
				<thead>
					<tr>
						{columns
							.filter((column) => showSelection || column.key !== "selection")
							.map((column) => (
								<th
									key={column.key}
									style={column.width ? { width: column.width } : undefined}
									className={column.key === "actions" ? "text-center" : ""}
								>
									{column.label}
								</th>
							))}
					</tr>
				</thead>
				<tbody>
					{collections.map((collection) => (
						<tr
							key={collection.id}
							className="cursor-pointer hover:bg-base-200"
							onClick={() => onCollectionSelect(collection.id)}
						>
							{columns
								.filter((column) => showSelection || column.key !== "selection")
								.map((column) => (
									<td
										key={column.key}
										onClick={
											column.key === "selection" || column.key === "actions"
												? (e) => e.stopPropagation()
												: undefined
										}
									>
										{renderCell(collection, column.key)}
									</td>
								))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
