import React from 'react';
import { AssetDetailData } from '~/types';
import { sanitizeAssetTitle, sanitizeAssetDescription } from '~/utils/sanitization';

export interface AssetBasicInfoProps {
  asset: AssetDetailData;
  isEditing: boolean;
  editedTitle: string;
  editedDescription: string;
  isLoading: boolean;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const AssetBasicInfo = React.memo<AssetBasicInfoProps>(({
  asset,
  isEditing,
  editedTitle,
  editedDescription,
  isLoading,
  onTitleChange,
  onDescriptionChange,
  onSave,
  onCancel,
}) => {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-header p-4 border-b border-base-300">
        <h3 className="font-semibold text-lg">{sanitizeAssetTitle(asset.title)}</h3>
      </div>
      <div className="card-body space-y-4">
        {isEditing ? (
          <>
            <div>
              <label className="label">Title</label>
              <input
                type="text"
                className="input w-full"
                value={editedTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Enter asset title"
                maxLength={255}
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="textarea w-full"
                value={editedDescription}
                onChange={(e) => onDescriptionChange(e.target.value)}
                placeholder="Enter asset description"
                rows={3}
                maxLength={1000}
              />
            </div>
            <div className="flex gap-2">
              <button
                className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
                onClick={onSave}
                disabled={isLoading || !editedTitle.trim()}
              >
                Save
              </button>
              <button className="btn btn-ghost" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="font-medium text-base-content/60 text-sm">
                Title
              </label>
              <p className="text-base-content font-medium">
                {sanitizeAssetTitle(asset.title) || 'Untitled Asset'}
              </p>
            </div>
            
            <div>
              <label className="font-medium text-base-content/60 text-sm">
                Description
              </label>
              <p className="text-base-content">
                {sanitizeAssetDescription(asset.description) || 'No description provided'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

AssetBasicInfo.displayName = 'AssetBasicInfo';