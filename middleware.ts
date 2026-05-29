import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const SHOPIFY_FRAME_ANCESTORS =
  "frame-ancestors https://*.myshopify.com https://admin.shopify.com;";

export default auth((request) => {
  const { pathname, search } = request.nextUrl;

  // ── Shopify embedded app paths: allow iframing from Shopify admin ─────────
  if (pathname.startsWith("/merchant") || pathname.startsWith("/studio")) {
    const res = NextResponse.next();
    // Remove X-Frame-Options so Shopify Admin can embed the page
    res.headers.delete("X-Frame-Options");
    res.headers.set("Content-Security-Policy", SHOPIFY_FRAME_ANCESTORS);
    return res;
  }

  // ── Shopify API routes: skip auth ─────────────────────────────────────────
  if (pathname.startsWith("/api/shopify") || pathname.startsWith("/api/billing")) {
    return NextResponse.next();
  }

  // ── Admin routes: protect with NextAuth session ───────────────────────────
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
  matcher: ["/admin/:path*", "/merchant/:path*", "/studio/:path*"],
};
