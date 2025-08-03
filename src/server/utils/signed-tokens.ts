import { createHmac, timingSafeEqual } from "crypto";
import { env } from "~/env";

const SECRET_KEY = env.AUTH_SECRET;
const TOKEN_EXPIRY = 3600; // 1 hour in seconds

export interface ThumbnailTokenPayload {
  assetId: string;
  organizationId: string;
  exp: number;
}

/**
 * Generate a signed token for thumbnail access
 */
export function generateThumbnailToken(
  assetId: string,
  organizationId: string,
): string {
  const payload: ThumbnailTokenPayload = {
    assetId,
    organizationId,
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY,
  };

  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr).toString("base64url");
  
  const signature = createHmac("sha256", SECRET_KEY)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Generate a signed thumbnail URL for server-side use
 */
export function generateSignedThumbnailUrl(
  assetId: string,
  organizationId: string,
): string {
  const token = generateThumbnailToken(assetId, organizationId);
  return `/api/assets/${assetId}/thumbnail?token=${encodeURIComponent(token)}`;
}

/**
 * Verify and decode a thumbnail token
 */
export function verifyThumbnailToken(token: string): ThumbnailTokenPayload | null {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) {
      return null;
    }

    // Verify signature
    const expectedSignature = createHmac("sha256", SECRET_KEY)
      .update(payloadB64)
      .digest("base64url");

    if (!timingSafeEqual(
      Buffer.from(signature, "base64url"),
      Buffer.from(expectedSignature, "base64url")
    )) {
      return null;
    }

    // Decode payload
    const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr) as ThumbnailTokenPayload;

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}