import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Shop } from "@prisma/client";
import {
  readMerchantSession,
  mintMerchantCookie,
} from "@/lib/merchant-session";
import { isValidShopDomain } from "@/lib/shopify";

/**
 * Merchant authentication helpers.
 *
 * The canonical way to identify a merchant in an API route is through the
 * `ps_merchant` cookie (signed JWT). If the cookie is missing but the
 * request carries a middleware-verified `x-ps-verified-shop` header
 * (Shopify session token confirmed before the request reached the
 * handler), we load the shop and mint a cookie inline so subsequent
 * requests are cookie-authenticated.
 *
 * NEVER read `?shop=` from the URL to identify a merchant — that param
 * is user-controlled and unauthenticated.
 */

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = "Unauthorized") {
    super(message);
  }
}

/**
 * Resolve the current merchant's Shop record from session.
 * Returns null if there is no valid session — use {@link requireMerchantShop}
 * when you want an automatic 401.
 */
export async function getMerchantShop(): Promise<Shop | null> {
  const session = await readMerchantSession();
  if (session) {
    return prisma.shop.findUnique({
      where: { id: session.shopId, isActive: true },
    });
  }

  // Middleware-verified Shopify session token path.
  const headerStore = await headers();
  const verifiedShop = headerStore.get("x-ps-verified-shop");
  if (verifiedShop && isValidShopDomain(verifiedShop)) {
    const shop = await prisma.shop.findUnique({
      where: { shopDomain: verifiedShop, isActive: true },
    });
    if (!shop) return null;

    // Mint a cookie so subsequent requests don't need the token round-trip.
    await mintMerchantCookie({
      shopId: shop.id,
      shopDomain: shop.shopDomain,
      plan: shop.plan,
    });
    return shop;
  }

  return null;
}

/**
 * Same as {@link getMerchantShop} but throws an `UnauthorizedError` when
 * there is no session. Route handlers should catch this and return a 401.
 */
export async function requireMerchantShop(): Promise<Shop> {
  const shop = await getMerchantShop();
  if (!shop) {
    throw new UnauthorizedError("No active merchant session");
  }
  return shop;
}

/** Translate any thrown error into a JSON response with the right status. */
export function merchantErrorResponse(err: unknown): Response {
  if (err instanceof UnauthorizedError) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: err.status,
      headers: { "content-type": "application/json" },
    });
  }
  const message = err instanceof Error ? err.message : "Internal error";
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { "content-type": "application/json" },
  });
}

export function isPlanActive(shop: Shop): boolean {
  return shop.plan !== "free";
}

// ─── Legacy helpers (kept for any callers we haven't migrated yet) ──────────
// These read the shop from a query param — DO NOT use in new code. The
// session-based helpers above are correct.

/** @deprecated Use {@link getMerchantShop}/{@link requireMerchantShop}. */
export async function getShopFromParam(
  searchParams: URLSearchParams | Record<string, string>,
): Promise<Shop | null> {
  const shopDomain =
    searchParams instanceof URLSearchParams
      ? searchParams.get("shop")
      : searchParams["shop"];

  if (!shopDomain) return null;

  return prisma.shop.findUnique({
    where: { shopDomain, isActive: true },
  });
}

/** @deprecated Use {@link requireMerchantShop}. */
export async function requireShop(shopDomain: string | null): Promise<Shop> {
  if (!shopDomain) throw new UnauthorizedError("Missing shop parameter");
  const shop = await prisma.shop.findUnique({
    where: { shopDomain, isActive: true },
  });
  if (!shop) throw new UnauthorizedError("Shop not found or not installed");
  return shop;
}
