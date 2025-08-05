import { api } from '~/trpc/react';
import { AssetDetailData, AssetMetadata, AssetVersion, AssetActivity, AssetCollectionsResponse } from '~/types';

export interface UseAssetDataProps {
  assetId: string;
}

export function useAssetData({ assetId }: UseAssetDataProps) {
  const {
    data: asset,
    isLoading: isAssetLoading,
    error: assetError,
    refetch: refetchAsset,
  } = api.asset.getById.useQuery({
    id: assetId,
  }) as {
    data: AssetDetailData | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<any>;
  };

  const {
    data: metadata,
    isLoading: isMetadataLoading,
    error: metadataError,
  } = api.metadata.getAssetMetadata.useQuery({
    assetId,
  }) as {
    data: AssetMetadata | undefined;
    isLoading: boolean;
    error: Error | null;
  };

  const {
    data: versions,
    isLoading: isVersionsLoading,
    error: versionsError,
  } = api.asset.getVersions.useQuery({
    assetId,
  }) as {
    data: AssetVersion[] | undefined;
    isLoading: boolean;
    error: Error | null;
  };

  const {
    data: assetCollections,
    isLoading: isCollectionsLoading,
    error: collectionsError,
  } = api.assetApi.getAssetCollections.useQuery({
    assetId,
  }) as {
    data: AssetCollectionsResponse | undefined;
    isLoading: boolean;
    error: Error | null;
  };

  // Activity endpoint not yet implemented - using empty array for now
  const activity: AssetActivity[] = [];

  const isLoading = isAssetLoading || isMetadataLoading || isVersionsLoading || isCollectionsLoading;
  const error = assetError || metadataError || versionsError || collectionsError;

  return {
    asset,
    metadata,
    versions,
    assetCollections,
    activity,
    isLoading,
    error,
    refetchAsset,
    isAssetLoading,
    isMetadataLoading,
    isVersionsLoading,
    isCollectionsLoading,
  };
}