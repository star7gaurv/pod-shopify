import { NextResponse } from "next/server";
import { verifyWebhookSignature, PLANS, type PlanKey } from "@/lib/razorpay";
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

/** Map a Razorpay plan_id back to our internal plan key. */
function planKeyFromRazorpayPlanId(planId: string): PlanKey | null {
  for (const [key, id] of Object.entries(PLANS) as Array<[PlanKey, string]>) {
    if (id && id === planId) return key;
  }
  return null;
}

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
      case "subscription.activated": {
        // Activation is the only event where we flip the merchant's plan.
        // create-subscription INTENTIONALLY does not, so a user who bails
        // out of the Razorpay modal isn't left on a paid plan they never
        // paid for.
        const planKey = planKeyFromRazorpayPlanId(subEntity.plan_id);

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: "active",
            currentPeriodEnd: subEntity.current_end
              ? new Date(subEntity.current_end * 1000)
              : undefined,
          },
        });

        if (planKey) {
          await prisma.shop.update({
            where: { id: subscription.shopId },
            data: { plan: planKey },
          });
        } else {
          console.warn(
            "Razorpay webhook: unrecognised plan_id, leaving shop.plan unchanged",
            subEntity.plan_id,
          );
        }
        break;
      }

      case "subscription.charged": {
        // Every billing cycle. Refresh status + period end only. We do
        // NOT touch shop.plan here — if a future code path lets a
        // merchant upgrade/downgrade through Razorpay's API directly,
        // rewriting plan on every charge would silently revert the
        // change. Warn if the looked-up sub's plan_id ever drifts from
        // what Razorpay reports so we notice.
        if (
          subscription.razorpayPlanId &&
          subscription.razorpayPlanId !== subEntity.plan_id
        ) {
          console.warn(
            "Razorpay subscription.charged: plan_id drift",
            { stored: subscription.razorpayPlanId, fromRazorpay: subEntity.plan_id },
          );
        }
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
      }

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
