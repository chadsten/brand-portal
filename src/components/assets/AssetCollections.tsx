import React from 'react';
import { FolderPlus } from 'lucide-react';
import { AssetCollectionsResponse } from '~/types';
import { sanitizeText } from '~/utils/sanitization';

export interface AssetCollectionsProps {
  assetCollections?: AssetCollectionsResponse;
  onAddToCollection?: () => void;
}

export const AssetCollections = React.memo<AssetCollectionsProps>(({
  assetCollections,
  onAddToCollection,
}) => {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-header p-4 border-b border-base-300">
        <h3 className="font-semibold text-lg">Collections</h3>
      </div>
      <div className="card-body">
        {assetCollections?.collections && assetCollections.collections.length > 0 ? (
          <div className="space-y-2">
            {assetCollections.collections.map((collection) => (
              <div
                key={collection.id}
                className="flex items-center gap-3 p-2 rounded-lg border border-base-300 hover:border-primary transition-colors"
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded text-sm flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${collection.color || '#6366f1'}20, ${collection.color || '#6366f1'}40)`,
                  }}
                >
                  <span>{collection.icon || '📁'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{sanitizeText(collection.name)}</h4>
                  {collection.description && (
                    <p className="text-base-content/60 text-sm truncate">
                      {sanitizeText(collection.description)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {collection.isPublic && (
                    <span className="badge badge-xs badge-success">Public</span>
                  )}
                  <span className="text-base-content/40 text-xs">
                    {new Date(collection.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <FolderPlus size={32} className="mx-auto mb-2 text-base-content/40" />
            <p className="text-base-content/60">Not in any collections</p>
            {onAddToCollection && (
              <button
                className="btn btn-sm btn-primary mt-2 gap-2"
                onClick={onAddToCollection}
              >
                <FolderPlus size={16} />
                Add to Collection
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

AssetCollections.displayName = 'AssetCollections';