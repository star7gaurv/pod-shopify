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
    const { payload } = await jwtVerify(token, getShopifySecret(), {
      algorithms: ["HS256"],
      clockTolerance: 5,
    });
    const dest = typeof payload.dest === "string" ? payload.dest : null;
    if (!dest) return null;
    const host = new URL(dest).host;
    if (!VALID_SHOP_RE.test(host)) return null;
    return host;
  } catch {
    return null;
  }
}

function isMerchantPath(pathname: string): boolean {
  return pathname.startsWith("/merchant");
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
      const url = request.nextUrl.clone();
      url.pathname = "/api/merchant/session/exchange";
      url.search = "";
      url.searchParams.set("shop", shopFromToken);
      url.searchParams.set("next", pathname);
      return NextResponse.rewrite(url, { request: { headers: reqHeaders } });
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

  // Page request without auth — send to public home (which then routes
  // through the install flow if shop is present).
  const home = request.nextUrl.clone();
  home.pathname = "/";
  home.search = "";
  return NextResponse.redirect(home);
}

export default auth(async (request) => {
  const { pathname, search } = request.nextUrl;

  // ── Studio: public, just needs iframe CSP ─────────────────────────────────
  if (pathname.startsWith("/studio")) {
    return applyShopifyCsp(NextResponse.next());
  }

  // ── Merchant pages + APIs: require merchant session ───────────────────────
  if (isMerchantPath(pathname) || isMerchantApi(pathname)) {
    if (isPublicMerchantApi(pathname)) {
      // /api/shopify and /api/billing/webhook are signature-verified by
      // their own handlers — don't gate them with the merchant cookie.
      return NextResponse.next();
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
    "/studio/:path*",
    "/api/merchant/:path*",
    "/api/billing/:path*",
  ],
};
