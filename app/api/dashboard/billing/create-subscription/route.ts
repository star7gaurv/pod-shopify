import { NextResponse } from "next/server";
import type { PlanKey } from "@/lib/razorpay";
import { createSubscriptionForShop } from "@/lib/billing";
import { getDashboardShop } from "@/lib/dashboard-auth";

const VALID_PLANS: PlanKey[] = ["starter", "pro"];

/**
 * Razorpay subscription creation for the external merchant dashboard.
 *
 * Authenticates via the dashboard's NextAuth merchant session instead of
 * the embedded `ps_merchant` cookie. Delegates to the shared
 * `createSubscriptionForShop` helper so the trial duration and upsert
 * logic stay in sync with the embedded-app version.
 */
export async function POST(request: Request) {
  const shop = await getDashboardShop();
  if (!shop) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { plan?: string };
  const plan = body.plan;
  if (!plan || !VALID_PLANS.includes(plan as PlanKey)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const result = await createSubscriptionForShop(shop, plan as PlanKey);
  return NextResponse.json(result);
}
