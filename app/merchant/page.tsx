import { redirect } from "next/navigation";
import { readMerchantSession } from "@/lib/merchant-session";
import { HomeClient } from "./_home-client";

/**
 * Home — the embedded app's landing surface.
 *
 * This is intentionally a focused plugin tool, NOT a business dashboard:
 * a setup checklist, the free-designs counter, a read-only recent-orders
 * peek, and a link out to the full external dashboard for analytics/billing.
 *
 * Auth is enforced by middleware; we guard again so a missing session lands
 * on the friendly welcome page rather than rendering an empty shell.
 */
export default async function MerchantHome() {
  const session = await readMerchantSession();
  if (!session) {
    redirect("/merchant/welcome");
  }
  return <HomeClient />;
}
