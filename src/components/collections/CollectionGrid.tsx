"use client";

// Import removed - using CollectionCard component which has been converted to DaisyUI
import { formatDistanceToNow } from "date-fns";
import {
	Calendar,
	Crown,
	Eye,
	EyeOff,
	HardDrive,
	Image as ImageIcon,
	Lock,
	Tag,
	Users,
} from "lucide-react";
import { formatBytes } from "~/lib/utils";
import { CollectionCard } from "./CollectionCard";

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

interface CollectionGridProps {
	collections: Collection[];
	onCollectionSelect: (collectionId: string) => void;
	selectedCollections?: Set<string>;
	onCollectionToggle?: (collectionId: string) => void;
	showSelection?: boolean;
}

export function CollectionGrid({
	collections,
	onCollectionSelect,
	selectedCollections,
	onCollectionToggle,
	showSelection = false,
}: CollectionGridProps) {
	return (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{collections.map((collection) => (
				<CollectionCard
					key={collection.id}
					collection={collection}
					onSelect={() => onCollectionSelect(collection.id)}
					isSelected={selectedCollections?.has(collection.id)}
					onToggle={
						onCollectionToggle
							? () => onCollectionToggle(collection.id)
							: undefined
					}
					showSelection={showSelection}
				/>
			))}
		</div>
	);
}
