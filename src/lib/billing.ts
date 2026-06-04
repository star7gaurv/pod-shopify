import { prisma } from "@/lib/prisma";
import { createSubscription, type PlanKey } from "@/lib/razorpay";
import type { Shop } from "@prisma/client";

/**
 * Shared subscription-creation logic used by both the embedded-app API
 * (`/api/billing/create-subscription`) and the external dashboard API
 * (`/api/dashboard/billing/create-subscription`). Keeping a single
 * implementation ensures the trial duration, upsert fields, and response
 * shape stay in sync regardless of which surface the merchant uses.
 *
 * NOTE: does NOT flip `shop.plan` — that happens only when the Razorpay
 * webhook fires `subscription.activated`.
 */
export async function createSubscriptionForShop(
  shop: Shop,
  planKey: PlanKey,
): Promise<{ subscriptionId: string; razorpayKey: string }> {
  const rzSubscription = await createSubscription(planKey, shop.shopDomain);

  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

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

  return {
    subscriptionId: rzSubscription.id,
    razorpayKey: process.env.RAZORPAY_KEY_ID ?? "",
  };
}
