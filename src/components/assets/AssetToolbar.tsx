"use client";

// Import removed - using native HTML and DaisyUI classes
import {
	Archive,
	CheckSquare,
	Copy,
	Download,
	Edit,
	Eye,
	EyeOff,
	FolderPlus,
	MoreVertical,
	Move,
	RefreshCw,
	Share,
	Square,
	Tag,
	Trash2,
	Upload,
} from "lucide-react";
import { useState } from "react";

// Custom hook to replace useDisclosure
function useModal() {
	const [isOpen, setIsOpen] = useState(false);
	return {
		isOpen,
		onOpen: () => setIsOpen(true),
		onClose: () => setIsOpen(false),
	};
}
import { api } from "~/trpc/react";
import { UploadManager } from "../upload";
import { CollectionCreateModal } from "../collections/CollectionCreateModal";

export interface AssetToolbarProps {
	selectedAssets: Set<string>;
	onSelectAll: () => void;
	onClearSelection: () => void;
	onRefresh: () => void;
	showUpload?: boolean;
}

export function AssetToolbar({
	selectedAssets,
	onSelectAll,
	onClearSelection,
	onRefresh,
	showUpload = true,
}: AssetToolbarProps) {
	const [isProcessing, setIsProcessing] = useState(false);
	const [processingAction, setProcessingAction] = useState<string>("");

	// Modal controls
	const {
		isOpen: isBulkEditOpen,
		onOpen: onBulkEditOpen,
		onClose: onBulkEditClose,
	} = useModal();
	const {
		isOpen: isMoveOpen,
		onOpen: onMoveOpen,
		onClose: onMoveClose,
	} = useModal();
	const {
		isOpen: isDeleteOpen,
		onOpen: onDeleteOpen,
		onClose: onDeleteClose,
	} = useModal();
	const {
		isOpen: isTagOpen,
		onOpen: onTagOpen,
		onClose: onTagClose,
	} = useModal();
	const {
		isOpen: isUploadOpen,
		onOpen: onUploadOpen,
		onClose: onUploadClose,
	} = useModal();
	const {
		isOpen: isCreateCollectionOpen,
		onOpen: onCreateCollectionOpen,
		onClose: onCreateCollectionClose,
	} = useModal();

	// API queries and mutations
	const { data: collections } = api.assetApi.searchCollections.useQuery({
		limit: 100,
	});

	// TODO: Implement getTags endpoint
	const tags: any[] = [];

	// TODO: Implement bulkDelete mutation
	const bulkDeleteMutation = {
		mutate: (params: any) => {
			console.log("Bulk delete:", params);
			setIsProcessing(false);
		},
		isPending: false,
	};

	// TODO: Implement bulkUpdate mutation
	const bulkUpdateMutation = {
		mutate: (params: any) => {
			console.log("Bulk update:", params);
			setIsProcessing(false);
		},
		isPending: false,
	};

	const moveToCollectionMutation =
		api.assetApi.addAssetsToCollection.useMutation({
			onSuccess: () => {
				onClearSelection();
				onRefresh();
				onMoveClose();
				setIsProcessing(false);
			},
			onError: () => {
				setIsProcessing(false);
			},
		});

	// TODO: Implement applyTags mutation
	const applyTagsMutation = {
		mutate: (params: any) => {
			console.log("Apply tags:", params);
			setIsProcessing(false);
		},
		isPending: false,
	};

	const selectedCount = selectedAssets.size;
	const hasSelection = selectedCount > 0;

	const handleBulkDelete = async () => {
		setIsProcessing(true);
		setProcessingAction("Deleting assets...");

		if (bulkDeleteMutation) {
			bulkDeleteMutation.mutate({
				assetIds: Array.from(selectedAssets),
			});
		} else {
			// Fallback: individual delete calls
			console.log(
				"Bulk delete not available, would delete:",
				Array.from(selectedAssets),
			);
			setIsProcessing(false);
		}
	};

	const handleBulkDownload = async () => {
		setIsProcessing(true);
		setProcessingAction("Preparing download...");

		try {
			// Create download request
			const downloadUrl = `/api/assets/bulk-download?ids=${Array.from(selectedAssets).join(",")}`;
			window.open(downloadUrl, "_blank");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleBulkShare = async () => {
		// TODO: Implement bulk sharing functionality
		console.log("Bulk share:", Array.from(selectedAssets));
	};

	const handleMoveToCollection = async (collectionId: string) => {
		setIsProcessing(true);
		setProcessingAction("Moving assets...");

		moveToCollectionMutation.mutate({
			collectionId,
			assetIds: Array.from(selectedAssets),
		});
	};

	const handleApplyTags = async (tagIds: string[]) => {
		setIsProcessing(true);
		setProcessingAction("Applying tags...");

		applyTagsMutation.mutate({
			assetIds: Array.from(selectedAssets),
			tagIds,
		});
	};

	const renderBulkActions = () => {
		if (!hasSelection) return null;

		return (
			<div className="flex items-center gap-2">
				<span className="badge badge-primary">
					{selectedCount} selected
				</span>

				<div className="tooltip" data-tip="Download Selected">
					<button
						className="btn btn-sm btn-ghost"
						onClick={handleBulkDownload}
						disabled={isProcessing}
					>
						<Download size={16} />
					</button>
				</div>

				<div className="tooltip" data-tip="Share Selected">
					<button
						className="btn btn-sm btn-ghost"
						onClick={handleBulkShare}
						disabled={isProcessing}
					>
						<Share size={16} />
					</button>
				</div>

				<div className="tooltip" data-tip="Move to Collection">
					<button
						className="btn btn-sm btn-ghost"
						onClick={onMoveOpen}
						disabled={isProcessing}
					>
						<Move size={16} />
					</button>
				</div>

				<div className="tooltip" data-tip="Apply Tags">
					<button
						className="btn btn-sm btn-ghost"
						onClick={onTagOpen}
						disabled={isProcessing}
					>
						<Tag size={16} />
					</button>
				</div>

				<div className="dropdown dropdown-end">
					<div tabIndex={0} role="button" className="btn btn-sm btn-ghost" disabled={isProcessing}>
						<MoreVertical size={16} />
					</div>
					<ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
						<li>
							<button onClick={onBulkEditOpen} className="flex items-center gap-2">
								<Edit size={16} />
								Bulk Edit
							</button>
						</li>
						<li>
							<button className="flex items-center gap-2">
								<Copy size={16} />
								Duplicate
							</button>
						</li>
						<li>
							<button className="flex items-center gap-2">
								<Archive size={16} />
								Archive
							</button>
						</li>
						<li>
							<button onClick={onDeleteOpen} className="flex items-center gap-2 text-error">
								<Trash2 size={16} />
								Delete
							</button>
						</li>
					</ul>
				</div>

				<button
					className="btn btn-sm btn-ghost"
					onClick={onClearSelection}
					disabled={isProcessing}
				>
					Clear Selection
				</button>
			</div>
		);
	};

	return (
		<div className="flex w-full items-center justify-between rounded-lg border border-base-300 bg-base-100 p-4">
			{/* Left side - Selection controls */}
			<div className="flex items-center gap-3">
				{hasSelection ? (
					renderBulkActions()
				) : (
					<div className="flex items-center gap-2">
						<button
							className="btn btn-sm btn-ghost"
							onClick={onSelectAll}
						>
							<CheckSquare size={16} />
							Select All
						</button>

						<button
							className="btn btn-sm btn-ghost"
							onClick={onRefresh}
							disabled={isProcessing}
						>
							<RefreshCw size={16} />
						</button>
					</div>
				)}
			</div>

			{/* Right side - Upload and view controls */}
			<div className="flex items-center gap-2">
				{showUpload && (
					<button
						className="btn btn-primary"
						disabled={isProcessing}
						onClick={onUploadOpen}
					>
						<Upload size={16} />
						Upload Assets
					</button>
				)}

				<button
					className="btn btn-sm btn-outline"
					disabled={isProcessing}
					onClick={onCreateCollectionOpen}
				>
					<FolderPlus size={16} />
					New Collection
				</button>
			</div>

			{/* Processing indicator */}
			{isProcessing && (
				<div className="absolute inset-0 flex items-center justify-center rounded-lg bg-base-100/80 backdrop-blur-sm">
					<div className="space-y-2 text-center">
						<progress className="progress w-48"></progress>
						<p className="text-base-content/60 text-sm">{processingAction}</p>
					</div>
				</div>
			)}

			{/* Move to Collection Modal */}
			<dialog className="modal" open={isMoveOpen}>
				<div className="modal-box">
					<h3 className="font-bold text-lg">Move to Collection</h3>
					<div className="py-4">
						<p className="mb-4 text-base-content/60 text-sm">
							Move {selectedCount} asset{selectedCount !== 1 ? "s" : ""} to
							collection:
						</p>
						<select
							className="select w-full"
							onChange={(e) => {
								const collectionId = e.target.value;
								if (collectionId) {
									handleMoveToCollection(collectionId);
								}
							}}
						>
							<option value="">Select a collection</option>
							{collections?.collections?.map((collection) => (
								<option key={collection.id} value={collection.id}>{collection.name}</option>
							)) || []}
						</select>
					</div>
					<div className="modal-action">
						<button className="btn btn-ghost" onClick={onMoveClose}>
							Cancel
						</button>
					</div>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button onClick={onMoveClose}>close</button>
				</form>
			</dialog>

			{/* Apply Tags Modal */}
			<dialog className="modal" open={isTagOpen}>
				<div className="modal-box">
					<h3 className="font-bold text-lg">Apply Tags</h3>
					<div className="py-4">
						<p className="mb-4 text-base-content/60 text-sm">
							Apply tags to {selectedCount} asset
							{selectedCount !== 1 ? "s" : ""}:
						</p>
						<select
							className="select w-full"
							multiple
							onChange={(e) => {
								const tagIds = Array.from(e.target.selectedOptions).map(option => option.value);
								if (tagIds.length > 0) {
									handleApplyTags(tagIds);
								}
							}}
						>
							{tags?.map((tag: any) => (
								<option key={tag.id} value={tag.id}>{tag.name}</option>
							)) || []}
						</select>
					</div>
					<div className="modal-action">
						<button className="btn btn-ghost" onClick={onTagClose}>
							Cancel
						</button>
					</div>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button onClick={onTagClose}>close</button>
				</form>
			</dialog>

			{/* Bulk Edit Modal */}
			<dialog className="modal modal-bottom sm:modal-middle" open={isBulkEditOpen}>
				<div className="modal-box max-w-2xl">
					<h3 className="font-bold text-lg">Bulk Edit Assets</h3>
					<div className="py-4">
						<p className="mb-4 text-base-content/60 text-sm">
							Edit properties for {selectedCount} asset
							{selectedCount !== 1 ? "s" : ""}:
						</p>
						<div className="space-y-4">
							<div>
								<label className="label">Title Prefix</label>
								<input
									type="text"
									placeholder="Add prefix to all titles"
									className="input w-full"
								/>
							</div>
							<div>
								<label className="label">Description</label>
								<textarea
									placeholder="Set description for all assets"
									className="textarea w-full"
									rows={3}
								></textarea>
							</div>
							<div>
								<label className="label">Tags to Add</label>
								<select
									className="select w-full"
									multiple
								>
									{tags?.map((tag: any) => (
										<option key={tag.id} value={tag.id}>{tag.name}</option>
									)) || []}
								</select>
							</div>
						</div>
					</div>
					<div className="modal-action">
						<button className="btn btn-ghost" onClick={onBulkEditClose}>
							Cancel
						</button>
						<button
							className="btn btn-primary"
							onClick={() => {
								// TODO: Implement bulk edit logic
								onBulkEditClose();
							}}
						>
							Apply Changes
						</button>
					</div>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button onClick={onBulkEditClose}>close</button>
				</form>
			</dialog>

			{/* Delete Confirmation Modal */}
			<dialog className="modal" open={isDeleteOpen}>
				<div className="modal-box">
					<h3 className="font-bold text-lg">Confirm Delete</h3>
					<div className="py-4">
						<p>
							Are you sure you want to delete {selectedCount} asset
							{selectedCount !== 1 ? "s" : ""}? This action cannot be undone.
						</p>
					</div>
					<div className="modal-action">
						<button className="btn btn-ghost" onClick={onDeleteClose}>
							Cancel
						</button>
						<button
							className={`btn btn-error ${bulkDeleteMutation.isPending ? 'loading' : ''}`}
							onClick={handleBulkDelete}
							disabled={bulkDeleteMutation.isPending}
						>
							Delete
						</button>
					</div>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button onClick={onDeleteClose}>close</button>
				</form>
			</dialog>

			{/* Upload Manager Modal */}
			<dialog className="modal modal-bottom sm:modal-middle" open={isUploadOpen}>
				<div className="modal-box max-w-4xl w-full">
					<UploadManager
						onUploadComplete={(files) => {
							console.log('Upload completed:', files);
							onRefresh();
							onUploadClose();
						}}
						maxFiles={50}
						maxSize={100 * 1024 * 1024}
					/>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button onClick={onUploadClose}>close</button>
				</form>
			</dialog>

			{/* Collection Create Modal */}
			<CollectionCreateModal
				isOpen={isCreateCollectionOpen}
				onClose={onCreateCollectionClose}
				onSuccess={() => {
					console.log('Collection created successfully');
					onRefresh();
					onCreateCollectionClose();
				}}
			/>
		</div>
	);
}
