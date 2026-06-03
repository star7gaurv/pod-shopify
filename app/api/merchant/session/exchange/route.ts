import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mintMerchantCookie } from "@/lib/merchant-session";
import { isValidShopDomain } from "@/lib/shopify";

/**
 * Session-exchange endpoint.
 *
 * Two call paths:
 *
 * 1. Middleware-initiated redirect for `/merchant/**` pages when a
 *    Shopify session token was verified but no merchant cookie exists yet.
 *    Middleware redirects here with `?shop=<verified>&next=<orig>`.
 *
 * 2. Direct fetch from client code after an iframe handshake. Same shape.
 *
 * IMPORTANT: this route trusts the `shop` query parameter ONLY because
 * the middleware has already cryptographically verified the Shopify
 * session token before redirecting here. Do not call this route directly
 * without that verification — and we double-check by requiring the
 * matching middleware-set header, OR by re-verifying via `x-ps-verified-shop`.
 */

function safeNextPath(input: string | null): string {
  if (!input) return "/merchant/dashboard";
  // only allow internal merchant paths — never a full URL
  if (!input.startsWith("/merchant")) return "/merchant/dashboard";
  return input;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const shopParam = url.searchParams.get("shop");
  const next = safeNextPath(url.searchParams.get("next"));

  // Cross-check: middleware sets this header after verifying the token.
  // If both are present they must match. If the header is absent (direct
  // request bypassing middleware) we reject — we will not trust the URL.
  const verifiedHeader = request.headers.get("x-ps-verified-shop");

  if (!shopParam || !isValidShopDomain(shopParam)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (!verifiedHeader || verifiedHeader !== shopParam) {
    // No middleware-verified header — refuse to mint a cookie.
    return NextResponse.redirect(new URL("/", request.url));
  }

  const shop = await prisma.shop.findUnique({
    where: { shopDomain: shopParam, isActive: true },
  });

  if (!shop) {
    // Shop never finished OAuth — kick them through the install flow.
    const install = new URL("/api/shopify/install", request.url);
    install.searchParams.set("shop", shopParam);
    return NextResponse.redirect(install);
  }

  await mintMerchantCookie({
    shopId: shop.id,
    shopDomain: shop.shopDomain,
    plan: shop.plan,
  });

  return NextResponse.redirect(new URL(next, request.url));
}
