import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const SHOPIFY_FRAME_ANCESTORS =
  "frame-ancestors https://*.myshopify.com https://admin.shopify.com;";

const MERCHANT_COOKIE_NAME = "ps_merchant";

function getMerchantSecret(): Uint8Array {
  const raw = process.env.MERCHANT_SESSION_SECRET ?? process.env.AUTH_SECRET;
  if (!raw) throw new Error("MERCHANT_SESSION_SECRET (or AUTH_SECRET) is required");
  return new TextEncoder().encode(raw);
}

function getShopifySecret(): Uint8Array {
  const raw = process.env.SHOPIFY_API_SECRET;
  if (!raw) throw new Error("SHOPIFY_API_SECRET is required");
  return new TextEncoder().encode(raw);
}

function getShopifyApiKey(): string | null {
  return process.env.SHOPIFY_API_KEY ?? null;
}

const VALID_SHOP_RE = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;

async function isMerchantCookieValid(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(MERCHANT_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getMerchantSecret(), {
      algorithms: ["HS256"],
    });
    return (
      typeof payload.shopId === "string" &&
      typeof payload.shopDomain === "string"
    );
  } catch {
    return false;
  }
}

/**
 * Extract and verify a Shopify session token from a request.
 * Returns the verified shop domain, or null on any failure.
 *
 * Sources tried (in order):
 *   1. `?id_token=…` query (initial iframe load)
 *   2. `Authorization: Bearer …` header (App Bridge fetches)
 */
async function verifyShopifyToken(req: NextRequest): Promise<string | null> {
  const url = req.nextUrl;
  const fromUrl = url.searchParams.get("id_token");
  const fromAuth = req.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  const token = fromUrl || fromAuth || null;
  if (!token) return null;

  try {
    const apiKey = getShopifyApiKey();
    const { payload } = await jwtVerify(token, getShopifySecret(), {
      algorithms: ["HS256"],
      clockTolerance: 5,
      // Defense-in-depth: pin the audience to our app's API key. A token
      // minted by a different Shopify app cannot sign with our secret, so
      // this is largely belt-and-braces — but cheap and matches Shopify's
      // own session-token verification guidance.
      ...(apiKey ? { audience: apiKey } : {}),
    });
    const dest = typeof payload.dest === "string" ? payload.dest : null;
    if (!dest) return null;
    let host: string;
    try {
      host = new URL(dest).host;
    } catch {
      return null;
    }
    if (!VALID_SHOP_RE.test(host)) return null;

    // `iss` must be the same shop as `dest`. Shopify documents this
    // invariant; we check it so a forged-iss / mismatched-dest token is
    // rejected even if the audience check is disabled in dev.
    const iss = typeof payload.iss === "string" ? payload.iss : null;
    if (iss) {
      try {
        if (new URL(iss).host !== host) return null;
      } catch {
        return null;
      }
    }
    return host;
  } catch {
    return null;
  }
}

function isMerchantPath(pathname: string): boolean {
  return pathname.startsWith("/merchant");
}

/**
 * Merchant pages that should NOT require a session.
 * `/merchant/welcome` is the fallback page shown when an unauthenticated
 * user lands on /merchant/** — it must render without redirecting.
 */
function isPublicMerchantPage(pathname: string): boolean {
  return pathname === "/merchant/welcome" || pathname.startsWith("/merchant/welcome/");
}

function isMerchantApi(pathname: string): boolean {
  return (
    pathname.startsWith("/api/merchant") ||
    pathname.startsWith("/api/billing")
  );
}

function isPublicMerchantApi(pathname: string): boolean {
  // Webhook endpoints and the OAuth flow must NOT require a merchant cookie.
  return (
    pathname.startsWith("/api/billing/webhook") ||
    pathname.startsWith("/api/shopify")
  );
}

function applyShopifyCsp(res: NextResponse): NextResponse {
  res.headers.delete("X-Frame-Options");
  res.headers.set("Content-Security-Policy", SHOPIFY_FRAME_ANCESTORS);
  return res;
}

/**
 * The external dashboard must NEVER be embeddable (it's the non-iframe,
 * password/token-authenticated surface). Pin it closed — the opposite of
 * the Shopify-iframe CSP applied to /merchant.
 */
function denyEmbedding(res: NextResponse): NextResponse {
  res.headers.set("Content-Security-Policy", "frame-ancestors 'none';");
  res.headers.set("X-Frame-Options", "DENY");
  return res;
}

async function handleMerchantRequest(
  request: NextRequest,
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // 1. Already have a valid cookie — proceed.
  if (await isMerchantCookieValid(request)) {
    const res = NextResponse.next();
    if (isMerchantPath(pathname)) applyShopifyCsp(res);
    return res;
  }

  // 2. No cookie — try Shopify session token (embedded app first load).
  const shopFromToken = await verifyShopifyToken(request);
  if (shopFromToken) {
    // We've verified the shop cryptographically, but can't look up the
    // Shop row in middleware (Edge runtime, no Prisma). Hand off to the
    // session-exchange route, which does the DB lookup and mints the
    // cookie. We use REWRITE (not redirect) so the verified-shop header
    // we set below travels with the request — a 302 would drop it.
    const reqHeaders = new Headers(request.headers);
    reqHeaders.set("x-ps-verified-shop", shopFromToken);

    if (isMerchantPath(pathname)) {
      // Preserve the merchant's original query string in `next`, minus the
      // id_token (which we've already consumed and is single-use). Without
      // this, a deep link like /merchant/orders?page=3 would land them on
      // /merchant/orders after the cookie mint.
      const originalSearch = new URLSearchParams(request.nextUrl.search);
      originalSearch.delete("id_token");
      const tail = originalSearch.toString();
      const nextValue = tail ? `${pathname}?${tail}` : pathname;

      const url = request.nextUrl.clone();
      url.pathname = "/api/merchant/session/exchange";
      url.search = "";
      url.searchParams.set("shop", shopFromToken);
      url.searchParams.set("next", nextValue);
      // Apply CSP on the rewritten response too. The exchange handler
      // returns a 302 (so nothing is rendered in the iframe), but if
      // Shopify ever changes how it sniffs response headers across
      // redirects we don't want a missing CSP on the intermediate hop
      // to fail the embed.
      return applyShopifyCsp(
        NextResponse.rewrite(url, { request: { headers: reqHeaders } }),
      );
    }

    // API: forward the verified shop. The route handler mints the cookie.
    return NextResponse.next({ request: { headers: reqHeaders } });
  }

  // 3. No auth at all.
  if (isMerchantApi(pathname)) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  // Page request without auth — show the friendly fallback page that
  // explains how to open the app from Shopify (or install it). Better
  // than silently dropping them on the public marketing homepage.
  const welcome = request.nextUrl.clone();
  welcome.pathname = "/merchant/welcome";
  welcome.search = "";
  return NextResponse.redirect(welcome);
}

export default auth(async (request) => {
  const { pathname, search } = request.nextUrl;

  // ── Studio: public, just needs iframe CSP ─────────────────────────────────
  if (pathname.startsWith("/studio")) {
    return applyShopifyCsp(NextResponse.next());
  }

  // ── External merchant dashboard: own NextAuth realm, never embeddable ─────
  if (pathname.startsWith("/dashboard")) {
    // The login page must stay open so the one-time-token exchange can run.
    if (pathname === "/dashboard/login" || pathname.startsWith("/dashboard/login/")) {
      return denyEmbedding(NextResponse.next());
    }
    const user = request.auth?.user;
    if (user && user.kind === "merchant") {
      return denyEmbedding(NextResponse.next());
    }
    const login = request.nextUrl.clone();
    login.pathname = "/dashboard/login";
    login.search = pathname.startsWith("/dashboard")
      ? `?next=${encodeURIComponent(pathname)}`
      : "";
    return NextResponse.redirect(login);
  }

  // ── Merchant pages + APIs: require merchant session ───────────────────────
  if (isMerchantPath(pathname) || isMerchantApi(pathname)) {
    if (isPublicMerchantApi(pathname)) {
      // /api/shopify and /api/billing/webhook are signature-verified by
      // their own handlers — don't gate them with the merchant cookie.
      return NextResponse.next();
    }
    if (isPublicMerchantPage(pathname)) {
      // The unauthenticated fallback page — render it as-is, but still
      // apply the iframe CSP so it works whether opened standalone or
      // bounced into from inside Shopify.
      return applyShopifyCsp(NextResponse.next());
    }
    return handleMerchantRequest(request);
  }

  // ── Shopify OAuth surface stays open (HMAC-validated by handlers) ─────────
  if (pathname.startsWith("/api/shopify")) {
    return NextResponse.next();
  }

  // ── Admin: NextAuth session required ──────────────────────────────────────
  const isAdminLogin = pathname === "/admin/login";
  const hasSession = Boolean(request.auth?.user);

  if (isAdminLogin) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  const callbackUrl = `${pathname}${search}`;
  loginUrl.searchParams.set("callbackUrl", callbackUrl || "/admin/dashboard");
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/merchant/:path*",
    "/dashboard/:path*",
    "/studio/:path*",
    "/api/merchant/:path*",
    "/api/billing/:path*",
  ],
};
