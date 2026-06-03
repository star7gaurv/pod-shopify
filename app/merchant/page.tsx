import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readMerchantSession } from "@/lib/merchant-session";

/**
 * Smart entry point for the merchant app.
 *
 * Shopify's "Open app" button (and any direct visit to /merchant) lands
 * here. We look at the merchant's subscription state and route them to
 * the right place — never leaving them stranded on a blank page or
 * dropping them on the public homepage.
 *
 * Auth is handled by middleware: by the time this runs, either we have a
 * valid merchant cookie, or middleware has already rewritten/redirected.
 */
export default async function MerchantEntry() {
  const session = await readMerchantSession();

  // Middleware should have ensured we have a session, but guard anyway.
  if (!session) {
    redirect("/merchant/welcome");
  }

  const subscription = await prisma.subscription.findUnique({
    where: { shopId: session.shopId },
    select: { status: true },
  });

  if (!subscription) {
    // Brand-new install — guided setup.
    redirect("/merchant/onboarding");
  }
  if (subscription.status === "cancelled" || subscription.status === "halted") {
    // Re-engage with the pricing page.
    redirect("/merchant/subscribe");
  }

  redirect("/merchant/dashboard");
}
