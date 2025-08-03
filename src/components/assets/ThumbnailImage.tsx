"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { useThumbnailUrl } from "~/hooks/useThumbnailUrl";

interface ThumbnailImageProps {
  assetId: string;
  assetTitle: string;
  mimeType: string;
  thumbnailKey?: string;
  className?: string;
  getFileTypeIcon: (mimeType: string) => LucideIcon;
}

export function ThumbnailImage({
  assetId,
  assetTitle,
  mimeType,
  thumbnailKey,
  className = "h-48 w-full object-cover",
  getFileTypeIcon,
}: ThumbnailImageProps) {
  const [imageError, setImageError] = useState(false);
  
  // Only fetch signed URL if we have a thumbnail or it's an image
  const shouldFetchSignedUrl = thumbnailKey || mimeType.startsWith("image/");
  
  const { data: thumbnailData, isLoading, error } = useThumbnailUrl(
    shouldFetchSignedUrl ? assetId : null,
    { enabled: shouldFetchSignedUrl }
  );

  // Handle loading state
  if (isLoading && shouldFetchSignedUrl) {
    return (
      <div className={`${className} animate-pulse bg-base-200`}>
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  // Show image if we have a valid URL and no error
  if (thumbnailData?.url && !imageError && !error) {
    return (
      <img
        src={thumbnailData.url}
        alt={assetTitle}
        className={className}
        loading="lazy"
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback to file type icon
  const FileIcon = getFileTypeIcon(mimeType);
  return (
    <div className={`flex items-center justify-center bg-base-200 ${className}`}>
      <FileIcon size={48} className="text-base-content/60" />
    </div>
  );
}