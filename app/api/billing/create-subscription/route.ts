import { NextResponse } from "next/server";
import type { PlanKey } from "@/lib/razorpay";
import { createSubscriptionForShop } from "@/lib/billing";
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

    const result = await createSubscriptionForShop(shop, plan as PlanKey);
    return NextResponse.json(result);
  } catch (err) {
    return merchantErrorResponse(err);
  }
}
