"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { BaseModal } from '../ui/BaseModal';
import { AssetDetailErrorBoundary } from './AssetDetailErrorBoundary';
import { AssetPreview } from './AssetPreview';
import { AssetBasicInfo } from './AssetBasicInfo';
import { AssetFileInfo } from './AssetFileInfo';
import { AssetTags } from './AssetTags';
import { AssetCollections } from './AssetCollections';
import { AssetVersions } from './AssetVersions';
import { AssetActivity } from './AssetActivity';
import { AssetUploadInfo } from './AssetUploadInfo';
import { AssetControls } from './AssetControls';
import { useAssetData } from '~/hooks/useAssetData';
import { useAssetEdit } from '~/hooks/useAssetEdit';
import { useThumbnailGeneration } from '~/hooks/useThumbnailGeneration';

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
	const [activeTab, setActiveTab] = useState<'details' | 'versions' | 'activity'>('details');

	// Data fetching
	const {
		asset,
		metadata,
		versions,
		assetCollections,
		activity,
		isLoading,
		error,
		refetchAsset,
	} = useAssetData({ assetId });

	// Asset editing functionality
	const assetEditProps = useAssetEdit({
		assetId,
		initialTitle: asset?.title || '',
		initialDescription: asset?.description,
		initialTags: asset?.tags,
		onSuccess: refetchAsset,
	});

	// Thumbnail generation functionality
	const thumbnailProps = useThumbnailGeneration({
		assetId,
		mimeType: asset?.mimeType || '',
		onSuccess: refetchAsset,
	});

	const handleGenerateThumbnail = useCallback(async () => {
		if (!asset) return;
		
		try {
			await thumbnailProps.downloadAndGenerate(
				`/api/assets/${asset.id}/download?original=true`,
				asset.fileName,
				{
					organizationId: asset.organizationId,
					width: 800,
					height: 600,
					quality: 0.85,
				}
			);
		} catch (error) {
			console.error('Thumbnail generation failed:', error);
		}
	}, [asset, thumbnailProps]);

	// Memoized components for performance
	const tabContent = useMemo(() => {
		if (!asset) return null;

		switch (activeTab) {
			case 'details':
				return (
					<div className="space-y-4">
						<AssetBasicInfo
							asset={asset}
							isEditing={assetEditProps.isEditing}
							editedTitle={assetEditProps.editedTitle}
							editedDescription={assetEditProps.editedDescription}
							isLoading={assetEditProps.isLoading}
							onTitleChange={assetEditProps.setEditedTitle}
							onDescriptionChange={assetEditProps.setEditedDescription}
							onSave={assetEditProps.handleSave}
							onCancel={assetEditProps.handleCancelEdit}
						/>
						<AssetTags
							asset={asset}
							isEditing={assetEditProps.isEditing}
							editedTags={assetEditProps.editedTags}
							newTag={assetEditProps.newTag}
							onNewTagChange={assetEditProps.setNewTag}
							onAddTag={assetEditProps.handleAddTag}
							onRemoveTag={assetEditProps.handleRemoveTag}
							onTagKeyDown={assetEditProps.handleTagKeyDown}
						/>
						<AssetCollections
							assetCollections={assetCollections}
							onAddToCollection={onAddToCollection}
						/>
					</div>
				);
			case 'versions':
				return (
					<div className="space-y-4">
						<AssetUploadInfo asset={asset} />
						<AssetVersions versions={versions} />
					</div>
				);
			case 'activity':
				return (
					<div>
						<AssetActivity activity={activity} />
					</div>
				);
			default:
				return null;
		}
	}, [activeTab, asset, assetEditProps, assetCollections, versions, activity, onAddToCollection]);

	if (isLoading || !asset) {
		return (
			<BaseModal
				isOpen={isOpen}
				onClose={onClose}
				title={error ? 'Error' : 'Loading...'}
				size="xl"
			>
				<div className="flex justify-center py-8">
					{error ? (
						<div className="text-center">
							<div className="text-error text-lg mb-2">Failed to load asset</div>
							<div className="text-base-content/60 mb-4">{error.message}</div>
							<button className="btn btn-primary" onClick={() => refetchAsset()}>
								Try Again
							</button>
						</div>
					) : (
						<progress className="progress w-48" aria-label="Loading asset details"></progress>
					)}
				</div>
			</BaseModal>
		);
	}










	return (
		<AssetDetailErrorBoundary onRetry={refetchAsset}>
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
							<AssetPreview asset={asset} />
							
							{/* File Details */}
							<div className="mt-4">
								<AssetFileInfo asset={asset} metadata={metadata} compact />
							</div>
							
							{/* Asset Controls */}
							<div className="mt-4">
								<AssetControls
									asset={asset}
									canGenerateThumbnail={thumbnailProps.canGenerate()}
									isGeneratingThumbnail={thumbnailProps.isGenerating}
									thumbnailProgress={thumbnailProps.progress}
									thumbnailMessage={thumbnailProps.message}
									onEdit={assetEditProps.handleStartEdit}
									onDelete={onDelete}
									onAddToCollection={onAddToCollection}
									onGenerateThumbnail={handleGenerateThumbnail}
								/>
							</div>
						</div>

						{/* Content */}
						<div className="lg:col-span-2">
							{/* Tab Navigation */}
							<div role="tablist" className="tabs tabs-lifted w-full">
								<button
									role="tab"
									type="button"
									className={`tab ${activeTab === 'details' ? 'tab-active' : ''}`}
									onClick={() => setActiveTab('details')}
									aria-selected={activeTab === 'details'}
								>
									Details
								</button>
								<button
									role="tab"
									type="button"
									className={`tab ${activeTab === 'versions' ? 'tab-active' : ''}`}
									onClick={() => setActiveTab('versions')}
									aria-selected={activeTab === 'versions'}
								>
									Versions
								</button>
								<button
									role="tab"
									type="button"
									className={`tab ${activeTab === 'activity' ? 'tab-active' : ''}`}
									onClick={() => setActiveTab('activity')}
									aria-selected={activeTab === 'activity'}
								>
									Activity
								</button>
							</div>

							{/* Tab Content */}
							<div 
								className="bg-base-100 border-base-300 rounded-b-box border-2 border-t-0 p-6"
								role="tabpanel"
								aria-labelledby={`${activeTab}-tab`}
							>
								{tabContent}
							</div>
						</div>
					</div>
				</div>
			</BaseModal>
		</AssetDetailErrorBoundary>
	);
}
