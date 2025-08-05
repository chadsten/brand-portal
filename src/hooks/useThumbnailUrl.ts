import { api } from "~/trpc/react";

interface UseThumbnailUrlOptions {
  enabled?: boolean;
}

/**
 * Hook to get a signed thumbnail URL for an asset
 */
export function useThumbnailUrl(
  assetId: string | null,
  options: UseThumbnailUrlOptions = {}
) {
  const { enabled = true } = options;
  const isEnabled = enabled && !!assetId;

  return api.asset.getThumbnailUrl.useQuery(
    { assetId: assetId as string },
    {
      enabled: isEnabled,
      staleTime: 30 * 60 * 1000, // 30 minutes
      retry: false, // Don't retry failed thumbnail requests
    }
  );
}