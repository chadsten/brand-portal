import React from 'react';
import { AssetDetailData } from '~/types';
import { formatDistanceToNow } from '~/lib/utils';
import { sanitizeUserName, sanitizeImageUrl } from '~/utils/sanitization';

export interface AssetUploadInfoProps {
  asset: AssetDetailData;
}

export const AssetUploadInfo = React.memo<AssetUploadInfoProps>(({ asset }) => {
  const sanitizedUploaderName = sanitizeUserName(asset.uploader.name);
  const sanitizedUploaderImage = sanitizeImageUrl(asset.uploader.image);

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-header p-4 border-b border-base-300">
        <h3 className="font-semibold text-lg">Upload Information</h3>
      </div>
      <div className="card-body space-y-3">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-12 rounded-full">
              {sanitizedUploaderImage ? (
                <img 
                  src={sanitizedUploaderImage} 
                  alt={sanitizedUploaderName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-base-300">
                  <span className="text-base-content text-lg font-medium">
                    {sanitizedUploaderName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="font-medium">{sanitizedUploaderName}</p>
            <p className="text-base-content/60 text-sm">Uploader</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-base-content/60">Uploaded</label>
            <p>
              {asset.createdAt
                ? new Date(asset.createdAt).toLocaleString()
                : 'Unknown'}
            </p>
            <p className="text-base-content/60">
              {asset.createdAt
                ? formatDistanceToNow(new Date(asset.createdAt), {
                    addSuffix: true,
                  })
                : ''}
            </p>
          </div>
          <div>
            <label className="text-base-content/60">Last Modified</label>
            <p>
              {asset.updatedAt
                ? new Date(asset.updatedAt).toLocaleString()
                : 'Unknown'}
            </p>
            <p className="text-base-content/60">
              {asset.updatedAt
                ? formatDistanceToNow(new Date(asset.updatedAt), {
                    addSuffix: true,
                  })
                : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

AssetUploadInfo.displayName = 'AssetUploadInfo';