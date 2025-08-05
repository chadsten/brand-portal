import React from 'react';
import { Tag } from 'lucide-react';
import { AssetDetailData } from '~/types';
import { sanitizeTag } from '~/utils/sanitization';

export interface AssetTagsProps {
  asset: AssetDetailData;
  isEditing: boolean;
  editedTags: string[];
  newTag: string;
  onNewTagChange: (tag: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onTagKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const AssetTags = React.memo<AssetTagsProps>(({
  asset,
  isEditing,
  editedTags,
  newTag,
  onNewTagChange,
  onAddTag,
  onRemoveTag,
  onTagKeyDown,
}) => {
  const sanitizedAssetTags = Array.isArray(asset.tags) 
    ? asset.tags.map(tag => sanitizeTag(tag)).filter(tag => tag.length > 0)
    : [];

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-header p-4 border-b border-base-300">
        <h3 className="font-semibold text-lg">Tags</h3>
      </div>
      <div className="card-body">
        {isEditing ? (
          <div className="space-y-3">
            {/* Existing tags */}
            {editedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {editedTags.map((tag) => {
                  const sanitizedTag = sanitizeTag(tag);
                  if (!sanitizedTag) return null;
                  
                  return (
                    <span
                      key={sanitizedTag}
                      className="badge badge-sm badge-outline gap-2"
                    >
                      <Tag size={12} />
                      {sanitizedTag}
                      <button
                        type="button"
                        className="ml-1 hover:text-error"
                        onClick={() => onRemoveTag(tag)}
                        aria-label={`Remove ${sanitizedTag} tag`}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            {/* Add new tag input */}
            <div className="flex gap-2">
              <input
                type="text"
                className="input input-sm flex-1"
                value={newTag}
                onChange={(e) => onNewTagChange(e.target.value)}
                onKeyDown={onTagKeyDown}
                placeholder="Add a tag and press Enter"
                maxLength={50}
              />
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={onAddTag}
                disabled={!newTag.trim()}
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          <>
            {sanitizedAssetTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {sanitizedAssetTags.map((tag) => (
                  <span
                    key={tag}
                    className="badge badge-sm badge-outline gap-2"
                  >
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-base-content/60">No tags assigned</p>
            )}
          </>
        )}
      </div>
    </div>
  );
});

AssetTags.displayName = 'AssetTags';