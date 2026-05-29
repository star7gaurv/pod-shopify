import { NextResponse } from "next/server";
import { verifyWebhookHmac } from "@/lib/shopify";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256") ?? "";
  const shopDomain = request.headers.get("x-shopify-shop-domain") ?? "";

  if (!verifyWebhookHmac(rawBody, hmacHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.shop.updateMany({
      where: { shopDomain },
      data: { isActive: false, accessToken: "" },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("app/uninstalled webhook error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
