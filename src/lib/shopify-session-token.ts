import { jwtVerify } from "jose";
import { getShopifyApiSecret, isValidShopDomain } from "@/lib/shopify";

/**
 * Shopify session token verification.
 *
 * When a merchant opens an embedded app, Shopify's App Bridge attaches an
 * `id_token` JWT (HS256, signed with the app's API secret) to either:
 *   • the query string (`?id_token=…`) on the initial frame load, or
 *   • the `Authorization: Bearer …` header on fetches from App Bridge.
 *
 * Verifying this token tells us, with cryptographic certainty, which shop
 * is making the request — without trusting any URL parameter the user
 * could modify.
 *
 * Spec: https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens
 */

export type ShopifyTokenClaims = {
  /** Shop domain, e.g. "acme.myshopify.com" */
  shopDomain: string;
  /** Subject — Shopify user ID inside the shop */
  userId: string | null;
  /** Expiration epoch (seconds) */
  exp: number;
};

function getSecret(): Uint8Array {
  return new TextEncoder().encode(getShopifyApiSecret());
}

/**
 * Verify a Shopify-issued session token. Returns the claims on success
 * or `null` on any failure (bad signature, expired, malformed, wrong shop).
 */
export async function verifyShopifySessionToken(
  token: string,
): Promise<ShopifyTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
      // Shopify session tokens are short-lived (≤ 1 min). `jose` checks
      // `exp` automatically, but we leave a small leeway for clock skew.
      clockTolerance: 5,
    });

    const dest = typeof payload.dest === "string" ? payload.dest : null;
    if (!dest) return null;

    let shopDomain: string;
    try {
      shopDomain = new URL(dest).host;
    } catch {
      return null;
    }

    if (!isValidShopDomain(shopDomain)) return null;

    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const exp = typeof payload.exp === "number" ? payload.exp : 0;

    return { shopDomain, userId: sub, exp };
  } catch {
    return null;
  }
}

/**
 * Extract a Shopify session token from a request:
 *   1. `?id_token=…` query param (initial iframe load)
 *   2. `Authorization: Bearer …` header (App Bridge fetches)
 */
export function extractShopifyTokenFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  const fromUrl = url.searchParams.get("id_token");
  if (fromUrl) return fromUrl;

  const auth = request.headers.get("authorization") ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim() || null;
  }

  return null;
}
