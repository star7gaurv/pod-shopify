import { NextResponse } from "next/server";
import { verifyWebhookHmac } from "@/lib/shopify";

// GDPR webhooks are mandatory for Shopify public apps.
// These must respond 200 OK. Actual data deletion should be
// implemented according to your data retention policy.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256") ?? "";
  const topic = request.headers.get("x-shopify-topic") ?? "";

  if (!verifyWebhookHmac(rawBody, hmacHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Log for compliance audit trail
  console.info(`GDPR webhook received: ${topic}`);

  return NextResponse.json({ received: true });
}
