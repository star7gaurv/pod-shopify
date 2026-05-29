import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";

type RazorpayWebhookPayload = {
  event: string;
  payload: {
    subscription?: {
      entity?: {
        id: string;
        status: string;
        plan_id: string;
        current_end?: number;
      };
    };
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as RazorpayWebhookPayload;
  const subEntity = event.payload?.subscription?.entity;

  if (!subEntity) {
    return NextResponse.json({ received: true });
  }

  try {
    const subscription = await prisma.subscription.findFirst({
      where: { razorpaySubId: subEntity.id },
    });

    if (!subscription) {
      console.warn("Razorpay webhook: subscription not found", subEntity.id);
      return NextResponse.json({ received: true });
    }

    switch (event.event) {
      case "subscription.activated":
      case "subscription.charged":
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: "active",
            currentPeriodEnd: subEntity.current_end
              ? new Date(subEntity.current_end * 1000)
              : undefined,
          },
        });
        break;

      case "subscription.halted":
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "halted" },
        });
        // Downgrade shop to free plan
        await prisma.shop.update({
          where: { id: subscription.shopId },
          data: { plan: "free" },
        });
        break;

      case "subscription.cancelled":
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "cancelled" },
        });
        await prisma.shop.update({
          where: { id: subscription.shopId },
          data: { plan: "free" },
        });
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
