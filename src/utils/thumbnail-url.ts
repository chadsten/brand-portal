/**
 * Client-side utility for generating thumbnail URLs
 * For client components, use the tRPC endpoint to get signed URLs
 * For server components, this can be used directly with server-side token generation
 */
export function createThumbnailUrl(assetId: string, token: string): string {
  return `/api/assets/${assetId}/thumbnail?token=${encodeURIComponent(token)}`;
}

/**
 * Fallback thumbnail URL without token (will require session auth)
 */
export function getBaseThumbnailUrl(assetId: string): string {
  return `/api/assets/${assetId}/thumbnail`;
}