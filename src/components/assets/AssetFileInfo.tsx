import React from 'react';
import { AssetDetailData, AssetMetadata } from '~/types';
import { formatBytes } from '~/lib/utils';

export interface AssetFileInfoProps {
  asset: AssetDetailData;
  metadata?: AssetMetadata;
  compact?: boolean;
}

export const AssetFileInfo = React.memo<AssetFileInfoProps>(({ asset, metadata, compact = false }) => {
  if (compact) {
    return (
      <div className="card bg-base-100 shadow">
        <div className="card-body space-y-3 p-4">
          <h4 className="font-semibold">File Details</h4>
          <div className="space-y-2 text-sm">
            <div>
              <label className="font-medium text-base-content/60 text-xs">File Name</label>
              <p className="font-mono text-base-content text-sm">{asset.fileName}</p>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content/60">Type:</span>
              <span className="badge badge-sm badge-outline">
                {asset.mimeType}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content/60">Size:</span>
              <span>{formatBytes(asset.fileSize)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-header p-4 border-b border-base-300">
        <h3 className="font-semibold text-lg">File Details</h3>
      </div>
      <div className="card-body space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-medium text-base-content/60 text-sm">Type</label>
            <div className="flex items-center gap-2">
              <span className="badge badge-sm badge-outline">
                {asset.fileType.toUpperCase()}
              </span>
              <span className="text-base-content/60 text-sm">{asset.mimeType}</span>
            </div>
          </div>
          <div>
            <label className="font-medium text-base-content/60 text-sm">Size</label>
            <p className="text-base-content">{formatBytes(asset.fileSize)}</p>
          </div>
          <div>
            <label className="font-medium text-base-content/60 text-sm">
              Status
            </label>
            <span
              className={`badge badge-sm ${
                asset.processingStatus === 'completed' ? 'badge-success' : 'badge-warning'
              }`}
            >
              {asset.processingStatus}
            </span>
          </div>
        </div>

        {/* Extended metadata */}
        {metadata && (
          <>
            <div className="divider"></div>
            <div className="space-y-3">
              <h4 className="font-medium">Technical Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {metadata.metadata.width && metadata.metadata.height && (
                  <div>
                    <label className="text-base-content/60">Dimensions</label>
                    <p>
                      {metadata.metadata.width} × {metadata.metadata.height}
                    </p>
                  </div>
                )}
                {metadata.metadata.duration && (
                  <div>
                    <label className="text-base-content/60">Duration</label>
                    <p>
                      {Math.round(metadata.metadata.duration)} seconds
                    </p>
                  </div>
                )}
                {metadata.metadata.codec && (
                  <div>
                    <label className="text-base-content/60">Codec</label>
                    <p>{metadata.metadata.codec}</p>
                  </div>
                )}
                {metadata.metadata.bitrate && (
                  <div>
                    <label className="text-base-content/60">Bitrate</label>
                    <p>{metadata.metadata.bitrate} kbps</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

AssetFileInfo.displayName = 'AssetFileInfo';