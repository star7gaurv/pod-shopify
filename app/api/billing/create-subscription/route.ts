import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSubscription, type PlanKey } from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const { shop, plan } = (await request.json()) as { shop?: string; plan?: string };

    if (!shop || !plan || !["starter", "pro"].includes(plan)) {
      return NextResponse.json({ error: "Invalid shop or plan" }, { status: 400 });
    }

    const shopRecord = await prisma.shop.findUnique({ where: { shopDomain: shop } });
    if (!shopRecord || !shopRecord.isActive) {
      return NextResponse.json({ error: "Shop not found or not installed" }, { status: 404 });
    }

    const rzSubscription = await createSubscription(plan as PlanKey, shop);

    // Upsert subscription record
    await prisma.subscription.upsert({
      where: { shopId: shopRecord.id },
      update: {
        razorpayPlanId: rzSubscription.plan_id,
        razorpaySubId: rzSubscription.id,
        status: rzSubscription.status,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      create: {
        shopId: shopRecord.id,
        razorpayPlanId: rzSubscription.plan_id,
        razorpaySubId: rzSubscription.id,
        status: rzSubscription.status,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    // Update shop plan
    await prisma.shop.update({
      where: { id: shopRecord.id },
      data: { plan },
    });

    return NextResponse.json({
      subscriptionId: rzSubscription.id,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("create-subscription error:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
