import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeToken,
  isValidShopDomain,
  registerAllWebhooks,
  verifyHmac,
  getAppUrl,
} from "@/lib/shopify";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const shop = searchParams.get("shop");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!shop || !isValidShopDomain(shop) || !code || !state) {
    return NextResponse.json({ error: "Invalid callback parameters" }, { status: 400 });
  }

  // Verify HMAC
  if (!verifyHmac(searchParams)) {
    return NextResponse.json({ error: "HMAC verification failed" }, { status: 403 });
  }

  // Verify state (CSRF protection)
  const cookieStore = await cookies();
  const storedState = cookieStore.get("shopify_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.json({ error: "State mismatch — possible CSRF" }, { status: 403 });
  }
  cookieStore.delete("shopify_oauth_state");

  try {
    const accessToken = await exchangeToken(shop, code);

    // Upsert the shop record (handles reinstalls)
    const shopRecord = await prisma.shop.upsert({
      where: { shopDomain: shop },
      update: { accessToken, isActive: true },
      create: {
        shopDomain: shop,
        accessToken,
        plan: "free",
        isActive: true,
      },
    });

    // Register webhooks asynchronously (don't block the redirect)
    registerAllWebhooks(shop, accessToken).catch((err) =>
      console.error("Webhook registration failed for", shop, err),
    );

    // Check if merchant has an active subscription
    const subscription = await prisma.subscription.findUnique({
      where: { shopId: shopRecord.id },
    });

    const appUrl = getAppUrl();

    // If no subscription yet, redirect to billing page; otherwise go to dashboard
    if (!subscription || subscription.status === "cancelled") {
      return NextResponse.redirect(`${appUrl}/merchant/subscribe?shop=${shop}`);
    }

    return NextResponse.redirect(`${appUrl}/merchant/dashboard?shop=${shop}`);
  } catch (error) {
    console.error("Shopify OAuth callback error:", error);
    return NextResponse.json({ error: "Installation failed. Please try again." }, { status: 500 });
  }
}
