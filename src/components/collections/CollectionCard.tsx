"use client";

// Import removed - using native HTML and DaisyUI classes
import { formatDistanceToNow } from "date-fns";
import {
	Calendar,
	Crown,
	Eye,
	EyeOff,
	HardDrive,
	Image as ImageIcon,
	Lock,
	Palette,
	Settings,
	Tag,
	Users,
} from "lucide-react";
import { formatBytes, getRandomColor } from "~/lib/utils";

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

interface CollectionCardProps {
	collection: Collection;
	onSelect: () => void;
	isSelected?: boolean;
	onToggle?: () => void;
	showSelection?: boolean;
}

export function CollectionCard({
	collection,
	onSelect,
	isSelected = false,
	onToggle,
	showSelection = false,
}: CollectionCardProps) {
	const cardColor = collection.color || getRandomColor();
	const permissionCount = collection._count?.permissions || 0;
	const shareCount = collection._count?.shares || 0;

	const getCoverImage = () => {
		if (collection.coverAsset?.id) {
			return `/api/assets/${collection.coverAsset.id}/thumbnail`;
		}
		return null;
	};

	const getCollectionIcon = () => {
		if (collection.icon) {
			// Handle different icon types (emoji, lucide icon name, etc.)
			return collection.icon;
		}
		return "📁"; // Default folder emoji
	};

	return (
		<div
			className={`card bg-base-100 shadow group transition-all duration-200 hover:shadow-lg cursor-pointer ${
				isSelected ? "ring-2 ring-primary" : ""
			}`}
			onClick={onSelect}
		>
			{showSelection && (
				<div className="absolute top-3 left-3 z-10">
					<input
						type="checkbox"
						className="checkbox checkbox-primary"
						checked={isSelected}
						onChange={onToggle}
						onClick={(e) => e.stopPropagation()}
					/>
				</div>
			)}

			<div className="relative overflow-hidden p-0">
				<div
					className="flex h-32 w-full items-center justify-center"
					style={{
						background: getCoverImage()
							? `url(${getCoverImage()}) center/cover`
							: `linear-gradient(135deg, ${cardColor}20, ${cardColor}40)`,
					}}
				>
					{!getCoverImage() && (
						<div className="text-4xl">{getCollectionIcon()}</div>
					)}
				</div>

				{/* Status indicators */}
				<div className="absolute top-2 right-2 flex gap-1">
					{!collection.isPublic && (
						<div className="tooltip tooltip-left" data-tip="Private collection">
							<span className="badge badge-sm opacity-90">
								<Lock size={10} />
							</span>
						</div>
					)}
					{collection.isTemplate && (
						<div className="tooltip tooltip-left" data-tip="Template collection">
							<span className="badge badge-secondary badge-sm opacity-90">
								<Crown size={10} />
							</span>
						</div>
					)}
					{shareCount > 0 && (
						<div 
							className="tooltip tooltip-left" 
							data-tip={`${shareCount} share${shareCount === 1 ? "" : "s"}`}
						>
							<span className="badge badge-success badge-sm opacity-90">
								<Users size={10} />
							</span>
						</div>
					)}
				</div>
			</div>

			<div className="card-body space-y-3 p-4">
				{/* Collection name and description */}
				<div>
					<h3 className="line-clamp-1 font-semibold text-foreground">
						{collection.name}
					</h3>
					{collection.description && (
						<p className="line-clamp-2 text-base-content/70 text-sm">
							{collection.description}
						</p>
					)}
				</div>

				{/* Stats */}
				<div className="flex items-center justify-between text-base-content/70 text-sm">
					<div className="flex items-center gap-1">
						<ImageIcon size={12} />
						<span>{collection.assetCount} assets</span>
					</div>
					<div className="flex items-center gap-1">
						<HardDrive size={12} />
						<span>{formatBytes(collection.totalSize)}</span>
					</div>
				</div>

				{/* Tags */}
				{Array.isArray(collection.tags) && collection.tags.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{collection.tags.slice(0, 3).map((tag, index) => (
							<span key={index} className="badge badge-primary badge-outline badge-sm">
								{tag}
							</span>
						))}
						{collection.tags.length > 3 && (
							<span className="badge badge-outline badge-sm">
								+{collection.tags.length - 3}
							</span>
						)}
					</div>
				)}

				{/* Creator and timestamp */}
				<div className="flex items-center justify-between pt-2">
					<div className="flex items-center gap-2">
						<div className="avatar">
							<div className="w-6 h-6 rounded-full">
								<img 
									src={collection.creator?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(collection.creator?.name || "Unknown")}&background=random`} 
									alt={collection.creator?.name || "Unknown"}
								/>
							</div>
						</div>
						<span className="text-base-content/70 text-xs">
							{collection.creator?.name || "Unknown"}
						</span>
					</div>
					<div 
						className="tooltip tooltip-top" 
						data-tip={new Date(collection.updatedAt).toLocaleString()}
					>
						<div className="flex items-center gap-1 text-base-content/60 text-xs">
							<Calendar size={10} />
							<span>
								{formatDistanceToNow(new Date(collection.updatedAt))} ago
							</span>
						</div>
					</div>
				</div>

				{/* Collection settings indicator */}
				<div className="flex items-center justify-between text-base-content/60 text-xs">
					<div className="flex items-center gap-2">
						{collection.isPublic ? (
							<div className="tooltip tooltip-top" data-tip="Public collection">
								<div className="flex items-center gap-1">
									<Eye size={10} />
									<span>Public</span>
								</div>
							</div>
						) : (
							<div className="tooltip tooltip-top" data-tip="Private collection">
								<div className="flex items-center gap-1">
									<EyeOff size={10} />
									<span>Private</span>
								</div>
							</div>
						)}
						{collection.allowContributions && (
							<div className="tooltip tooltip-top" data-tip="Allows contributions">
								<div className="flex items-center gap-1">
									<Users size={10} />
									<span>Collaborative</span>
								</div>
							</div>
						)}
					</div>
					{permissionCount > 0 && (
						<div 
							className="tooltip tooltip-top" 
							data-tip={`${permissionCount} permission${permissionCount === 1 ? "" : "s"}`}
						>
							<div className="flex items-center gap-1">
								<Settings size={10} />
								<span>{permissionCount}</span>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
