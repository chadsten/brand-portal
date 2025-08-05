import React from 'react';
import { Download, Share, Edit, Trash2, FolderPlus, ImageIcon } from 'lucide-react';
import { AssetDetailData } from '~/types';

export interface AssetControlsProps {
  asset: AssetDetailData;
  canGenerateThumbnail: boolean;
  isGeneratingThumbnail: boolean;
  thumbnailProgress: number;
  thumbnailMessage: string;
  onEdit: () => void;
  onDelete: () => void;
  onAddToCollection?: () => void;
  onGenerateThumbnail: () => void;
}

export const AssetControls = React.memo<AssetControlsProps>(({
  asset,
  canGenerateThumbnail,
  isGeneratingThumbnail,
  thumbnailProgress,
  thumbnailMessage,
  onEdit,
  onDelete,
  onAddToCollection,
  onGenerateThumbnail,
}) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="tooltip" data-tip="Download">
          <button 
            className="btn btn-sm btn-outline w-full gap-2"
            onClick={() => window.open(`/api/assets/${asset.id}/download?original=true`, '_blank')}
            aria-label="Download asset"
          >
            <Download size={16} />
            Download
          </button>
        </div>
        <div className="tooltip" data-tip="Share">
          <button className="btn btn-sm btn-outline w-full gap-2" aria-label="Share asset">
            <Share size={16} />
            Share
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="tooltip" data-tip="Edit">
          <button
            className="btn btn-sm btn-outline w-full gap-2"
            onClick={onEdit}
            aria-label="Edit asset"
          >
            <Edit size={16} />
            Edit
          </button>
        </div>
        <div className="tooltip" data-tip="Delete">
          <button
            className="btn btn-sm btn-outline btn-error w-full gap-2"
            onClick={onDelete}
            aria-label="Delete asset"
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
          aria-label="Add to collection"
        >
          <FolderPlus size={16} />
          Add to Collection
        </button>
      )}
      
      {/* Thumbnail Generation */}
      {canGenerateThumbnail && (
        <div className="w-full">
          <button
            className={`btn btn-sm btn-outline w-full gap-2 ${
              isGeneratingThumbnail ? 'loading' : ''
            }`}
            onClick={onGenerateThumbnail}
            disabled={isGeneratingThumbnail}
            aria-label="Generate thumbnail"
          >
            {isGeneratingThumbnail ? (
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
          {isGeneratingThumbnail && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>{thumbnailMessage}</span>
                <span>{thumbnailProgress}%</span>
              </div>
              <progress 
                className="progress progress-primary w-full" 
                value={thumbnailProgress} 
                max="100"
                aria-label={`Thumbnail generation progress: ${thumbnailProgress}%`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

AssetControls.displayName = 'AssetControls';