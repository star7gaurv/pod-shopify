import { prisma } from "@/lib/prisma";
import { requireDashboardShop } from "@/lib/dashboard-auth";
import { BillingClient } from "./_billing-client";

export default async function DashboardBilling() {
  const shop = await requireDashboardShop();
  const subscription = await prisma.subscription.findUnique({
    where: { shopId: shop.id },
    select: { status: true, trialEndsAt: true, currentPeriodEnd: true },
  });

  return (
    <BillingClient
      plan={shop.plan}
      status={subscription?.status ?? null}
      trialEndsAt={subscription?.trialEndsAt?.toISOString() ?? null}
      currentPeriodEnd={subscription?.currentPeriodEnd?.toISOString() ?? null}
    />
  );
}
