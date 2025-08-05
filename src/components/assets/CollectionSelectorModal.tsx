"use client";

import { FolderPlus, Plus, Search } from "lucide-react";
import { useState } from "react";
import { api } from "~/trpc/react";
import { BaseModal } from "../ui/BaseModal";

export interface CollectionSelectorModalProps {
	isOpen: boolean;
	onClose: () => void;
	assetId: string;
	onSuccess?: () => void;
}

export function CollectionSelectorModal({
	isOpen,
	onClose,
	assetId,
	onSuccess,
}: CollectionSelectorModalProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());

	// API queries
	const {
		data: collectionsData,
		isLoading,
		refetch,
	} = api.assetApi.searchCollections.useQuery({
		limit: 100,
		query: searchQuery,
	});

	// Real mutation for adding asset to collections
	const addToCollectionsMutation = api.assetApi.addAssetsToCollection.useMutation({
		onError: (error) => {
			console.error("Failed to add asset to collections:", error);
			// TODO: Show error toast/notification
		},
	});

	const collections = collectionsData?.collections || [];

	const handleCollectionToggle = (collectionId: string) => {
		const newSelected = new Set(selectedCollections);
		if (newSelected.has(collectionId)) {
			newSelected.delete(collectionId);
		} else {
			newSelected.add(collectionId);
		}
		setSelectedCollections(newSelected);
	};

	const handleSubmit = async () => {
		if (selectedCollections.size === 0) return;

		// Add asset to each selected collection
		const collectionIds = Array.from(selectedCollections);
		
		try {
			for (const collectionId of collectionIds) {
				await addToCollectionsMutation.mutateAsync({
					collectionId,
					assetIds: [assetId],
				});
			}
			
			// All collections added successfully
			setSelectedCollections(new Set());
			onSuccess?.();
			onClose();
		} catch (error) {
			// Error already handled by onError callback
		}
	};

	const handleClose = () => {
		setSelectedCollections(new Set());
		setSearchQuery("");
		onClose();
	};

	return (
		<BaseModal
			isOpen={isOpen}
			onClose={handleClose}
			title="Add to Collections"
			size="md"
		>
			<div className="space-y-4">
				{/* Search */}
				<div className="relative">
					<Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" />
					<input
						type="text"
						className="input w-full pl-10"
						placeholder="Search collections..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>

				{/* Collections List */}
				<div className="space-y-2 max-h-96 overflow-y-auto">
					{isLoading ? (
						<div className="flex justify-center py-8">
							<span className="loading loading-spinner loading-md"></span>
						</div>
					) : collections.length === 0 ? (
						<div className="text-center py-8">
							<FolderPlus size={48} className="mx-auto mb-4 text-base-content/40" />
							<p className="text-base-content/60">
								{searchQuery ? "No collections found" : "No collections available"}
							</p>
						</div>
					) : (
						collections.map((collection: any) => (
							<div
								key={collection.id}
								className={`card card-sm bg-base-100 border cursor-pointer transition-all hover:shadow-md ${
									selectedCollections.has(collection.id)
										? "border-primary bg-primary/5"
										: "border-base-300"
								}`}
								onClick={() => handleCollectionToggle(collection.id)}
							>
								<div className="card-body flex-row items-center gap-3">
									<input
										type="checkbox"
										className="checkbox checkbox-primary"
										checked={selectedCollections.has(collection.id)}
										readOnly
									/>
									<div
										className="flex h-10 w-10 items-center justify-center rounded-lg text-sm flex-shrink-0"
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
										<div className="flex items-center gap-2 mt-1">
											<span className="text-base-content/40 text-xs">
												{collection.assetCount || 0} assets
											</span>
											{collection.isPublic && (
												<span className="badge badge-xs badge-success">Public</span>
											)}
										</div>
									</div>
								</div>
							</div>
						))
					)}
				</div>

				{/* Actions */}
				<div className="flex justify-between items-center pt-4 border-t border-base-300">
					<div className="text-sm text-base-content/60">
						{selectedCollections.size > 0 && (
							<span>{selectedCollections.size} collection{selectedCollections.size === 1 ? "" : "s"} selected</span>
						)}
					</div>
					<div className="flex gap-2">
						<button
							className="btn btn-outline"
							onClick={handleClose}
							disabled={addToCollectionsMutation.isPending}
						>
							Cancel
						</button>
						<button
							className={`btn btn-primary gap-2 ${
								selectedCollections.size === 0 ? "btn-disabled" : ""
							}`}
							onClick={handleSubmit}
							disabled={selectedCollections.size === 0 || addToCollectionsMutation.isPending}
						>
							{addToCollectionsMutation.isPending ? (
								<span className="loading loading-spinner loading-sm"></span>
							) : (
								<>
									<Plus size={16} />
									Add to Collection{selectedCollections.size > 1 ? "s" : ""}
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</BaseModal>
	);
}