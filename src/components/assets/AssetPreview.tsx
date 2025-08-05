import React from 'react';
import { ThumbnailImage } from './ThumbnailImage';
import { AssetDetailData } from '~/types';
import { ImageIcon, Video, Music, FileText, Archive } from 'lucide-react';

export interface AssetPreviewProps {
  asset: AssetDetailData;
  className?: string;
}

const getFileTypeIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.includes('pdf') || mimeType.includes('document')) return FileText;
  if (mimeType.includes('zip') || mimeType.includes('archive')) return Archive;
  return FileText;
};

export const AssetPreview = React.memo<AssetPreviewProps>(({ asset, className = '' }) => {
  return (
    <div className={`mx-auto w-full max-w-md ${className}`}>
      <ThumbnailImage
        assetId={asset.id}
        assetTitle={asset.title}
        mimeType={asset.mimeType}
        thumbnailKey={asset.thumbnailKey}
        className="w-full rounded-lg object-contain max-h-96"
        getFileTypeIcon={getFileTypeIcon}
      />
    </div>
  );
});

AssetPreview.displayName = 'AssetPreview';