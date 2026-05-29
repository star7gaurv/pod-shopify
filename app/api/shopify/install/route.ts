import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { buildInstallUrl, isValidShopDomain, verifyHmac } from "@/lib/shopify";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");

  if (!shop || !isValidShopDomain(shop)) {
    return NextResponse.json({ error: "Missing or invalid shop parameter" }, { status: 400 });
  }

  // If request comes with HMAC it's a reinstall from Shopify — verify it
  if (searchParams.get("hmac") && !verifyHmac(searchParams)) {
    return NextResponse.json({ error: "HMAC verification failed" }, { status: 403 });
  }

  // Generate a nonce to prevent CSRF during OAuth
  const state = crypto.randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("shopify_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 min
    path: "/",
  });

  return NextResponse.redirect(buildInstallUrl(shop, state));
}
