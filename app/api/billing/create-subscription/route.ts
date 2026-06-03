import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSubscription, type PlanKey } from "@/lib/razorpay";
import { requireMerchantShop, merchantErrorResponse } from "@/lib/merchant-auth";

const VALID_PLANS: PlanKey[] = ["starter", "pro"];

export async function POST(request: Request) {
  try {
    // Identity comes from the merchant session — NOT the request body.
    // This is what prevents an attacker from upgrading someone else's shop.
    const shop = await requireMerchantShop();

    const body = (await request.json()) as { plan?: string };
    const plan = body.plan;
    if (!plan || !VALID_PLANS.includes(plan as PlanKey)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const rzSubscription = await createSubscription(plan as PlanKey, shop.shopDomain);

    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Upsert the Subscription row. NOTE: we DO NOT touch `shop.plan` here
    // — that flips only when the Razorpay webhook fires
    // `subscription.activated`. Otherwise a user who bails out of the
    // Razorpay modal would be left on a paid plan they never paid for.
    await prisma.subscription.upsert({
      where: { shopId: shop.id },
      update: {
        razorpayPlanId: rzSubscription.plan_id,
        razorpaySubId: rzSubscription.id,
        status: rzSubscription.status,
        trialEndsAt,
      },
      create: {
        shopId: shop.id,
        razorpayPlanId: rzSubscription.plan_id,
        razorpaySubId: rzSubscription.id,
        status: rzSubscription.status,
        trialEndsAt,
      },
    });

    return NextResponse.json({
      subscriptionId: rzSubscription.id,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    return merchantErrorResponse(err);
  }
}
