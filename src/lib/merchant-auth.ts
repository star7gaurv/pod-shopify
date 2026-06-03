import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Shop } from "@prisma/client";
import {
  readMerchantSession,
  mintMerchantCookie,
  MERCHANT_COOKIE_NAME,
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
  //
  // This branch only runs when the request lacked a valid cookie but
  // carried a verifiable Shopify session token (typically App Bridge's
  // `Authorization: Bearer …`). We mint a fresh cookie so that any
  // subsequent navigation/fetch that does send cookies can skip the
  // JWT verification round trip. App-Bridge-only callers will hit this
  // every request, but the cost is a single Set-Cookie header on the
  // response — negligible compared to the DB lookup we already need to
  // do, and the alternative (no cookie ever) would prevent direct
  // browser navigation (e.g. bookmarks, "Open app in new tab") from
  // working without going through Shopify's iframe.
  const headerStore = await headers();
  const verifiedShop = headerStore.get("x-ps-verified-shop");
  if (verifiedShop && isValidShopDomain(verifiedShop)) {
    const shop = await prisma.shop.findUnique({
      where: { shopDomain: verifiedShop, isActive: true },
    });
    if (!shop) return null;

    await mintMerchantCookie({
      shopId: shop.id,
      shopDomain: shop.shopDomain,
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
    // Clear any lingering ps_merchant cookie. Otherwise a merchant whose
    // shop was uninstalled (or deactivated server-side) would keep sending
    // a cryptographically-valid-but-orphaned cookie for up to 7 days and
    // see a permanent 401 loop. Set-Cookie with Max-Age=0 expires it now.
    const clear = `${MERCHANT_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None`;
    return new Response(JSON.stringify({ error: err.message }), {
      status: err.status,
      headers: {
        "content-type": "application/json",
        "set-cookie": clear,
      },
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
